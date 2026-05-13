import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

export default function SavedTeams({ auth, teams }) {
    const [deletingId, setDeletingId] = useState(null);

    const handleDelete = (teamId) => {
        if (!confirm('Are you sure you want to delete this team?')) return;
        setDeletingId(teamId);
        router.delete(`/teams/${teamId}`, {
            onFinish: () => setDeletingId(null),
        });
    };

    const handleLoad = (team) => {
        router.get('/dashboard', { loadTeamId: team.id }, {
            preserveState: false,
        });
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Saved Teams — PokeConsultant" />
            <div className="py-6 sm:py-12 bg-gray-900 min-h-screen">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-white">Saved Teams</h1>
                            <p className="text-gray-400 text-sm mt-1">Load a previous team or start fresh.</p>
                        </div>
                        <button
                            onClick={() => router.get('/dashboard')}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-5 rounded-lg shadow transition-all hover:shadow-indigo-500/20 flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            New Team
                        </button>
                    </div>

                    {teams.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="w-24 h-24 mb-6 rounded-full bg-gray-800 border-2 border-dashed border-gray-700 flex items-center justify-center">
                                <img src="/images/pokeball.png" alt="No teams" className="w-12 h-12 opacity-30" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-400 mb-2">No Saved Teams Yet</h2>
                            <p className="text-gray-500 text-sm max-w-md">
                                Build your first team on the Make Team page and save it to see it here.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {teams.map((team) => (
                                <div
                                    key={team.id}
                                    className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden group hover:border-indigo-500/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/5"
                                >
                                    {/* Top accent */}
                                    <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-60 group-hover:opacity-100 transition-opacity" />

                                    <div className="p-5">
                                        {/* Team Name */}
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-bold text-white truncate">{team.name}</h3>
                                            <span className="text-[10px] text-gray-500 font-mono">
                                                {team.pokemon_ids.length}/6
                                            </span>
                                        </div>

                                        {/* Pokemon Grid */}
                                        <div className="grid grid-cols-6 gap-1 mb-5">
                                            {Array(6).fill(null).map((_, idx) => {
                                                const pokemon = team.pokemon_ids[idx];
                                                return (
                                                    <div
                                                        key={idx}
                                                        className="aspect-square bg-gray-900 rounded-lg flex items-center justify-center border border-gray-700/50"
                                                    >
                                                        {pokemon ? (
                                                            <img
                                                                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`}
                                                                alt={pokemon.name}
                                                                className="w-full h-full object-contain p-0.5"
                                                                title={pokemon.name}
                                                            />
                                                        ) : (
                                                            <div className="w-3 h-3 rounded-full border border-dashed border-gray-700" />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Pokemon names list */}
                                        <div className="flex flex-wrap gap-1 mb-5">
                                            {team.pokemon_ids.map((p, idx) => (
                                                <span key={idx} className="text-[10px] text-gray-400 bg-gray-900 px-2 py-0.5 rounded-md capitalize font-medium">
                                                    {p.name}
                                                </span>
                                            ))}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleLoad(team)}
                                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                </svg>
                                                Load Team
                                            </button>
                                            <button
                                                onClick={() => handleDelete(team.id)}
                                                disabled={deletingId === team.id}
                                                className="px-4 py-2.5 bg-gray-900 hover:bg-red-900/30 text-gray-400 hover:text-red-400 rounded-lg border border-gray-700 hover:border-red-500/30 transition-all text-sm font-bold disabled:opacity-50"
                                            >
                                                {deletingId === team.id ? '...' : '✕'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="px-5 py-2 border-t border-gray-700/50 bg-gray-900/50">
                                        <span className="text-[10px] text-gray-600 font-mono">
                                            {new Date(team.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
