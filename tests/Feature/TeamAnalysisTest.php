<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class TeamAnalysisTest extends TestCase
{
    public function test_analyze_team_endpoint_returns_strategy_object(): void
    {
        Http::fake([
            'pokeapi.co/api/v2/pokemon/*' => Http::response([
                'types' => [
                    ['type' => ['name' => 'fire']]
                ]
            ], 200)
        ]);

        $response = $this->postJson('/analyze-team', [
            'pokemon_names' => ['charizard', 'pikachu']
        ]);

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'strategy_object' => [
                         'threats',
                         'team_data'
                     ]
                 ]);
    }

    public function test_calculates_top_threats_accurately(): void
    {
        // Mock responses for Charizard (Fire/Flying)
        Http::fake([
            'pokeapi.co/api/v2/pokemon/charizard' => Http::response([
                'types' => [
                    ['type' => ['name' => 'fire']],
                    ['type' => ['name' => 'flying']]
                ]
            ], 200)
        ]);

        $response = $this->postJson('/analyze-team', [
            'pokemon_names' => ['charizard']
        ]);
        
        // Charizard is 4x weak to Rock
        $response->assertJsonFragment(['name' => 'rock', 'score' => 4.0]);
    }
}
