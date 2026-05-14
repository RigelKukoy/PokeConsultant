<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use App\Helpers\TypeHelper;

class AiConsultantController extends Controller
{
    public function suggest(Request $request)
    {
        $names = $request->input('pokemon_names', []);

        if (empty($names)) {
            return response()->json(['error' => 'No Pokémon provided'], 422);
        }

        // Build context about the current team
        $teamContext = [];
        foreach ($names as $name) {
            $cached = Cache::get("pokemon_{$name}");
            if ($cached) {
                $types = collect($cached['types'])->map(fn($t) => $t['type']['name'])->toArray();
            } else {
                // Fetch if not cached
                $response = Http::get("https://pokeapi.co/api/v2/pokemon/{$name}");
                if ($response->ok()) {
                    $data = $response->json();
                    Cache::put("pokemon_{$name}", $data, 86400);
                    $types = collect($data['types'])->map(fn($t) => $t['type']['name'])->toArray();
                } else {
                    $types = ['unknown'];
                }
            }

            $weaknesses = TypeHelper::getWeaknesses($types);
            $resistances = TypeHelper::getResistances($types);

            $teamContext[] = [
                'name' => $name,
                'types' => $types,
                'weaknesses' => $weaknesses,
                'resistances' => $resistances,
            ];
        }

        // Calculate team-wide vulnerability gaps
        $allWeaknesses = [];
        $allResistances = [];
        foreach ($teamContext as $member) {
            foreach ($member['weaknesses'] as $w) {
                $allWeaknesses[$w] = ($allWeaknesses[$w] ?? 0) + 1;
            }
            foreach ($member['resistances'] as $r) {
                $allResistances[$r] = ($allResistances[$r] ?? 0) + 1;
            }
        }

        // Find unresisted weaknesses (weak but not resisted by any member)
        $gaps = [];
        foreach ($allWeaknesses as $type => $count) {
            if (!isset($allResistances[$type]) || $allResistances[$type] < $count) {
                $gaps[] = "{$type} ({$count} members weak)";
            }
        }

        $teamSummary = collect($teamContext)->map(function ($m) {
            return "{$m['name']} (" . implode('/', $m['types']) . ")";
        })->join(', ');

        $gapSummary = empty($gaps) ? 'No major gaps' : implode(', ', array_slice($gaps, 0, 5));

        $emptySlots = 6 - count($names);

        $prompt = "You are a Pokémon team building consultant. A trainer has the following team:\n\n"
            . "Current team: {$teamSummary}\n\n"
            . "Biggest defensive gaps (types with unresisted weaknesses): {$gapSummary}\n\n"
            . "The trainer needs exactly {$emptySlots} more Pokémon to complete their team of 6.\n"
            . "Suggest exactly {$emptySlots} DIFFERENT Pokémon (from generations 1-9) that best complement this team.\n"
            . "Each suggestion must cover different defensive gaps. Do not repeat any Pokémon already on the team.\n\n"
            . "Respond with ONLY this JSON object, no markdown, no extra text:\n"
            . "{\"suggestions\":[{\"name\":\"pokemon-name\",\"reason\":\"1-2 sentence explanation\"}]}\n\n"
            . "Use exact lowercase PokéAPI names (e.g. 'garchomp', 'rotom-wash', 'mr-mime').";

        try {
            $apiKey = config('services.aiml.key');
            $baseUrl = config('services.aiml.base_url');

            $response = Http::withHeaders([
                'Authorization' => "Bearer {$apiKey}",
                'Content-Type' => 'application/json',
            ])->timeout(30)->post("{$baseUrl}/v1/chat/completions", [
                'model' => 'gemini-2.0-flash',
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'You are a competitive Pokémon team building expert. You always respond in valid JSON only.',
                    ],
                    [
                        'role' => 'user',
                        'content' => $prompt,
                    ],
                ],
                'response_format' => ['type' => 'json_object'],
                'temperature' => 0.3,
                'max_tokens' => min(800, $emptySlots * 150 + 100),
            ]);

            if (!$response->ok()) {
                \Log::error('AI Consultant API error', [
                    'status' => $response->status(),
                    'body'   => $response->body(),
                ]);
            }

            if ($response->ok()) {
                $content = $response->json('choices.0.message.content', '');

                $content = trim($content);
                if (str_starts_with($content, '```')) {
                    $content = preg_replace('/^```(?:json)?\s*/i', '', $content);
                    $content = preg_replace('/\s*```$/', '', $content);
                }

                $data = json_decode($content, true);

                if ($data && isset($data['suggestions']) && is_array($data['suggestions'])) {
                    $suggestions = array_values(array_filter(
                        array_map(function ($s) {
                            if (!isset($s['name'])) return null;
                            return [
                                'name' => strtolower(trim($s['name'])),
                                'reason' => $s['reason'] ?? 'Great coverage addition for your team.',
                            ];
                        }, $data['suggestions'])
                    ));

                    if (!empty($suggestions)) {
                        return response()->json(['suggestions' => $suggestions]);
                    }
                }
            }

            // Fallback if AI response is unparseable
            return response()->json([
                'suggestions' => $this->getFallbackSuggestions($allWeaknesses, $allResistances, $emptySlots),
            ]);

        } catch (\Exception $e) {
            \Log::error('AI Consultant error: ' . $e->getMessage());

            return response()->json([
                'suggestions' => $this->getFallbackSuggestions($allWeaknesses, $allResistances, $emptySlots),
            ]);
        }
    }

    private function getFallbackSuggestions(array $weaknesses, array $resistances, int $count): array
    {
        arsort($weaknesses);

        $pool = [
            'fire' => 'vaporeon',
            'water' => 'ferrothorn',
            'grass' => 'heatran',
            'electric' => 'garchomp',
            'ice' => 'scizor',
            'fighting' => 'togekiss',
            'poison' => 'excadrill',
            'ground' => 'rotom-wash',
            'flying' => 'tyranitar',
            'psychic' => 'bisharp',
            'bug' => 'talonflame',
            'rock' => 'lucario',
            'ghost' => 'gengar',
            'dragon' => 'clefable',
            'dark' => 'umbreon',
            'steel' => 'volcarona',
            'fairy' => 'magnezone',
            'normal' => 'alakazam',
        ];

        $defaults = ['garchomp', 'ferrothorn', 'rotom-wash', 'togekiss', 'excadrill', 'heatran'];

        $chosen = [];
        foreach (array_keys($weaknesses) as $type) {
            if (count($chosen) >= $count) break;
            $name = $pool[$type] ?? null;
            if ($name && !in_array($name, $chosen)) {
                $chosen[] = $name;
            }
        }

        foreach ($defaults as $name) {
            if (count($chosen) >= $count) break;
            if (!in_array($name, $chosen)) {
                $chosen[] = $name;
            }
        }

        return array_map(fn($name) => [
            'name' => $name,
            'reason' => 'Rule-based suggestion to cover your team\'s biggest defensive gap.',
        ], array_slice($chosen, 0, $count));
    }
}
