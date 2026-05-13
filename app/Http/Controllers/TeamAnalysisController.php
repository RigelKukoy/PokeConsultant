<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use App\Helpers\TypeHelper;

class TeamAnalysisController extends Controller
{
    public function analyze(Request $request)
    {
        $names = $request->input('pokemon_names', []);
        $resultsMap = [];
        $pendingNames = [];

        foreach ($names as $name) {
            $cached = Cache::get("pokemon_{$name}");
            if ($cached) {
                $resultsMap[$name] = $cached;
            } else {
                $pendingNames[] = $name;
            }
        }

        if (!empty($pendingNames)) {
            $responses = Http::pool(function ($pool) use ($pendingNames) {
                return collect($pendingNames)->map(fn($name) => $pool->get("https://pokeapi.co/api/v2/pokemon/{$name}"));
            });

            foreach ($responses as $idx => $response) {
                $name = $pendingNames[$idx];
                if ($response->ok()) {
                    $data = $response->json();
                    Cache::put("pokemon_{$name}", $data, 86400);
                    $resultsMap[$name] = $data;
                }
            }
        }

        $results = [];
        foreach ($names as $name) {
            if (isset($resultsMap[$name])) {
                $results[] = $resultsMap[$name];
            }
        }

        $teamTypes = [];
        $detailedTeamData = [];

        foreach ($results as $data) {
            $types = collect($data['types'])->map(fn($t) => $t['type']['name'])->toArray();
            $teamTypes[] = $types;
            $detailedTeamData[] = [
                'id' => $data['id'] ?? null,
                'name' => $data['name'] ?? null,
                'types' => $types,
                'weaknesses' => TypeHelper::getWeaknesses($types),
                'resistances' => TypeHelper::getResistances($types)
            ];
        }

        $typeStats = [];
        foreach (TypeHelper::TYPES as $type) {
            $typeStats[$type] = [
                'name' => $type,
                'net_score' => 0.0,
                'weak_count' => 0,
                'resist_count' => 0,
                'immune_count' => 0,
            ];
        }

        foreach ($teamTypes as $types) {
            $scores = TypeHelper::calculateDefensiveScore($types);
            foreach ($scores as $type => $multiplier) {
                $typeStats[$type]['net_score'] += $multiplier;
                if ($multiplier > 1) $typeStats[$type]['weak_count']++;
                if ($multiplier < 1 && $multiplier > 0) $typeStats[$type]['resist_count']++;
                if ($multiplier == 0) $typeStats[$type]['immune_count']++;
            }
        }

        // Sort by net score descending
        usort($typeStats, fn($a, $b) => $b['net_score'] <=> $a['net_score']);
        
        $topThreats = collect($typeStats)->take(3)->values()->toArray();

        return response()->json([
            'strategy_object' => [
                'threats' => $topThreats,
                'team_data' => $detailedTeamData
            ]
        ]);
    }
}
