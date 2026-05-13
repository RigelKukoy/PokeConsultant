<?php

namespace App\Http\Controllers;

use App\Models\Team;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TeamController extends Controller
{
    /**
     * Display all saved teams for the authenticated user.
     */
    public function index(Request $request)
    {
        $teams = $request->user()->teams()->latest()->get();

        return Inertia::render('SavedTeams', [
            'teams' => $teams,
        ]);
    }

    /**
     * Store a new team.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:50',
            'pokemon_ids' => 'required|array|min:1|max:6',
            'pokemon_ids.*.id' => 'required|integer',
            'pokemon_ids.*.name' => 'required|string',
        ]);

        $request->user()->teams()->create($validated);

        return back()->with('success', 'Team saved successfully!');
    }

    /**
     * Delete a saved team.
     */
    public function destroy(Request $request, Team $team)
    {
        // Authorization: ensure the user owns this team
        if ($team->user_id !== $request->user()->id) {
            abort(403);
        }

        $team->delete();

        return back()->with('success', 'Team deleted.');
    }
}
