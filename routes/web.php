<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\TeamAnalysisController;
use App\Http\Controllers\TeamController;
use App\Http\Controllers\AiConsultantController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function (\Illuminate\Http\Request $request) {
    $loadTeam = null;
    if ($request->has('loadTeamId')) {
        $team = \App\Models\Team::where('id', $request->loadTeamId)
            ->where('user_id', $request->user()->id)
            ->first();
        if ($team) {
            $loadTeam = $team->pokemon_ids;
        }
    }
    return Inertia::render('Dashboard', [
        'loadTeam' => $loadTeam,
    ]);
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Team CRUD
    Route::get('/teams', [TeamController::class, 'index'])->name('teams.index');
    Route::post('/teams', [TeamController::class, 'store'])->name('teams.store');
    Route::delete('/teams/{team}', [TeamController::class, 'destroy'])->name('teams.destroy');

    // AI Consultant
    Route::post('/ai-suggest', [AiConsultantController::class, 'suggest'])->name('ai.suggest');
});

require __DIR__.'/auth.php';

Route::post('/analyze-team', [TeamAnalysisController::class, 'analyze']);
