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
            . "Current team ({$emptySlots} empty slots): {$teamSummary}\n\n"
            . "Biggest defensive gaps (types with unresisted weaknesses): {$gapSummary}\n\n"
            . "Suggest exactly ONE Pokémon (from generations 1-9) to add to this team to best cover the defensive gaps. "
            . "The Pokémon must exist in the official Pokédex. "
            . "Respond in this exact JSON format only, with no extra text:\n"
            . "{\"name\": \"pokemon-name-in-lowercase\", \"reason\": \"Brief 1-2 sentence explanation\"}\n\n"
            . "Important: Use the exact lowercase Pokémon name as it appears in PokéAPI (e.g., 'garchomp', 'rotom-wash', 'mr-mime').";

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
                'temperature' => 0.7,
                'max_tokens' => 200,
            ]);

            if ($response->ok()) {
                $content = $response->json('choices.0.message.content', '');
                
                // Extract JSON from the response (handle markdown code blocks)
                $content = trim($content);
                if (str_starts_with($content, '```')) {
                    $content = preg_replace('/^```(?:json)?\s*/i', '', $content);
                    $content = preg_replace('/\s*```$/', '', $content);
                }
                
                $suggestion = json_decode($content, true);

                if ($suggestion && isset($suggestion['name'])) {
                    return response()->json([
                        'suggestion' => [
                            'name' => strtolower(trim($suggestion['name'])),
                            'reason' => $suggestion['reason'] ?? 'Great coverage addition for your team.',
                        ],
                    ]);
                }
            }

            // Fallback if AI response is unparseable
            return response()->json([
                'suggestion' => [
                    'name' => $this->getFallbackSuggestion($allWeaknesses, $allResistances),
                    'reason' => 'AI response could not be parsed. This is a rule-based suggestion to cover your biggest weakness.',
                ],
            ]);

        } catch (\Exception $e) {
            \Log::error('AI Consultant error: ' . $e->getMessage());

            return response()->json([
                'suggestion' => [
                    'name' => $this->getFallbackSuggestion($allWeaknesses, $allResistances),
                    'reason' => 'AI service unavailable. This is a rule-based fallback suggestion.',
                ],
            ]);
        }
    }

    /**
     * Rule-based fallback: suggest a Pokémon that resists the team's biggest weakness.
     */
    private function getFallbackSuggestion(array $weaknesses, array $resistances): string
    {
        // Find the most common unresisted weakness
        arsort($weaknesses);
        $biggestWeakness = array_key_first($weaknesses);

        // Map weakness type to a good defensive Pokémon
        $suggestions = [
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
            'ghost' => 'tyranitar',
            'dragon' => 'clefable',
            'dark' => 'lucario',
            'steel' => 'volcarona',
            'fairy' => 'excadrill',
            'normal' => 'gengar',
        ];

        return $suggestions[$biggestWeakness] ?? 'garchomp';
    }
}
