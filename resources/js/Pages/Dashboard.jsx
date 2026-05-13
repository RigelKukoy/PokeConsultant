import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import TypeBadge from '@/Components/TypeBadge';
import PokemonSelectorModal from '@/Components/PokemonSelectorModal';

export default function Dashboard({ auth, loadTeam }) {
    const [team, setTeam] = useState(Array(6).fill(null));
    const [reportCard, setReportCard] = useState(null);
    const [activeSlotIndex, setActiveSlotIndex] = useState(null);

    // Save Modal State
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [teamName, setTeamName] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // AI Autofill State
    const [aiLoading, setAiLoading] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState(null);

    // Load team from saved teams page
    useEffect(() => {
        if (loadTeam && Array.isArray(loadTeam)) {
            const loaded = Array(6).fill(null);
            loadTeam.forEach((p, i) => {
                if (i < 6 && p) loaded[i] = p;
            });
            setTeam(loaded);
        }
    }, []);

    // Analyze team whenever it changes
    useEffect(() => {
        const activeMembers = team.filter(p => p !== null);
        if (activeMembers.length > 0) {
            axios.post('/analyze-team', { pokemon_names: activeMembers.map(m => m.name) })
                .then(res => setReportCard(res.data.strategy_object))
                .catch(err => console.error(err));
        } else {
            setReportCard(null);
        }
    }, [team]);

    const handleSelectPokemon = (pokemon) => {
        if (activeSlotIndex === null) return;
        const newTeam = [...team];
        newTeam[activeSlotIndex] = pokemon;
        setTeam(newTeam);
        setActiveSlotIndex(null);
    };

    const handleRemovePokemon = (idx) => {
        const newTeam = [...team];
        newTeam[idx] = null;
        setTeam(newTeam);
    };

    // ── Save Team ──
    const handleSaveTeam = () => {
        const activeMembers = team.filter(p => p !== null);
        if (activeMembers.length === 0) return alert('Add at least one Pokémon to your team first!');
        setShowSaveModal(true);
        setTeamName('');
    };

    const confirmSave = () => {
        if (!teamName.trim()) return;
        setSaving(true);
        const pokemonIds = team.filter(p => p !== null).map(p => ({ id: p.id, name: p.name }));

        axios.post('/teams', { name: teamName.trim(), pokemon_ids: pokemonIds })
            .then(() => {
                setSaving(false);
                setShowSaveModal(false);
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 3000);
            })
            .catch(err => {
                console.error(err);
                setSaving(false);
                alert('Failed to save team. Please try again.');
            });
    };

    // ── AI Autofill ──
    const handleAiAutofill = () => {
        const activeMembers = team.filter(p => p !== null);
        if (activeMembers.length === 0) return alert('Add at least one Pokémon before consulting the AI!');
        
        const emptyIdx = team.findIndex(p => p === null);
        if (emptyIdx === -1) return alert('Your team is full! Remove a Pokémon to get a suggestion.');

        setAiLoading(true);
        setAiSuggestion(null);

        axios.post('/ai-suggest', { pokemon_names: activeMembers.map(m => m.name) })
            .then(async (res) => {
                const suggestion = res.data.suggestion;
                setAiSuggestion(suggestion);

                // Try to auto-add the suggestion to the first empty slot
                if (suggestion?.name) {
                    try {
                        const pokeRes = await fetch(`https://pokeapi.co/api/v2/pokemon/${suggestion.name.toLowerCase()}`);
                        if (pokeRes.ok) {
                            const pokeData = await pokeRes.json();
                            const newTeam = [...team];
                            const slotIdx = newTeam.findIndex(p => p === null);
                            if (slotIdx !== -1) {
                                newTeam[slotIdx] = { id: pokeData.id, name: pokeData.name };
                                setTeam(newTeam);
                            }
                        }
                    } catch (e) {
                        console.error('Could not auto-add suggestion:', e);
                    }
                }
                setAiLoading(false);
            })
            .catch(err => {
                console.error(err);
                setAiLoading(false);
                alert('AI suggestion failed. Please try again.');
            });
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Make Team — PokeConsultant" />
            <div className="py-6 sm:py-12 bg-gray-900 min-h-screen">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
                        <h1 className="text-2xl sm:text-3xl font-bold text-white text-center sm:text-left">Your PokéTeam</h1>
                        <div className="flex gap-3 justify-center sm:justify-end">
                            {/* AI Autofill Button */}
                            <button 
                                onClick={handleAiAutofill}
                                disabled={aiLoading}
                                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 px-5 rounded-lg shadow transition-all hover:shadow-purple-500/20 flex items-center gap-2"
                            >
                                {aiLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Thinking...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                        </svg>
                                        AI Autofill
                                    </>
                                )}
                            </button>

                            {/* Save Button */}
                            <button 
                                onClick={handleSaveTeam}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-5 rounded-lg shadow transition-all hover:shadow-indigo-500/20 flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                </svg>
                                Save Team
                            </button>
                        </div>
                    </div>

                    {/* Success Toast */}
                    {saveSuccess && (
                        <div className="mb-6 bg-green-900/30 border border-green-500/30 text-green-400 px-5 py-3 rounded-xl text-sm font-medium flex items-center gap-2 animate-pulse">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Team saved successfully! View it on the Saved Teams page.
                        </div>
                    )}

                    {/* ── AI Suggestion Card ── */}
                    {aiSuggestion && (
                        <div className="mb-6 bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/30 p-5 rounded-xl relative">
                            <button
                                onClick={() => setAiSuggestion(null)}
                                className="absolute top-3 right-3 text-gray-500 hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-sm mb-1">
                                        AI Consultant Suggestion: <span className="text-purple-400 capitalize">{aiSuggestion.name}</span>
                                    </h3>
                                    <p className="text-gray-400 text-xs leading-relaxed">{aiSuggestion.reason}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Team Grid ── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
                        {team.map((slot, idx) => {
                            const enrichedData = reportCard?.team_data?.find(d => d.name === slot?.name);
                            
                            return (
                                <div
                                    key={idx}
                                    className={`bg-gray-800 p-6 rounded-xl border shadow-2xl text-center min-h-[16rem] flex flex-col items-center justify-center relative overflow-hidden group transition-all duration-300 hover:-translate-y-1 ${
                                        slot
                                            ? 'border-gray-700 hover:border-gray-500'
                                            : 'border-gray-700/50 hover:border-indigo-500/60 cursor-pointer hover:bg-gray-800/80'
                                    }`}
                                    onClick={() => {
                                        if (!slot) setActiveSlotIndex(idx);
                                    }}
                                >
                                    {slot ? (
                                        <>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemovePokemon(idx);
                                                }}
                                                className="absolute top-3 right-3 sm:top-2 sm:right-2 text-gray-500 hover:text-red-500 font-bold opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 border border-gray-700 sm:border-none rounded-full w-9 h-9 sm:w-6 sm:h-6 flex items-center justify-center z-20"
                                            >
                                                ✕
                                            </button>
                                            
                                            <div className="flex w-full items-start gap-4 mb-2">
                                                <div className="flex-1 flex flex-col items-center">
                                                    <img
                                                        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${slot.id}.gif`}
                                                        className="h-20 mb-2 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
                                                        alt={slot.name}
                                                        onError={(e) => {
                                                            e.target.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${slot.id}.png`;
                                                        }}
                                                    />
                                                    <span className="text-white font-bold capitalize text-lg tracking-wide">{slot.name}</span>
                                                    <span className="text-gray-500 text-[10px] font-mono">#{String(slot.id).padStart(3, '0')}</span>
                                                </div>

                                                {enrichedData && (
                                                    <div className="flex flex-col gap-1 items-end pt-2">
                                                        <div className="flex gap-1 mb-2">
                                                            {enrichedData.types.map(t => <TypeBadge key={t} type={t} size="sm" />)}
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-[10px] text-red-400 font-bold uppercase block mb-0.5">Weaknesses</span>
                                                            <div className="flex flex-wrap justify-end gap-1 max-w-[120px]">
                                                                {enrichedData.weaknesses.slice(0, 5).map(w => (
                                                                    <TypeBadge key={w} type={w} size="sm" />
                                                                ))}
                                                                {enrichedData.weaknesses.length === 0 && <span className="text-[9px] text-gray-600 font-mono">STURDY DEFENSES</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <div className="w-20 h-20 mb-4 rounded-full border-2 border-dashed border-gray-700 group-hover:border-indigo-500/60 flex items-center justify-center transition-colors">
                                                <svg className="w-8 h-8 text-gray-600 group-hover:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                            </div>
                                            <span className="text-gray-500 text-sm group-hover:text-indigo-400 transition-colors font-medium">
                                                Choose Pokémon
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* ── Report Card ── */}
                    {reportCard && (
                        <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 shadow-[0_0_30px_rgba(239,68,68,0.1)] mt-8 text-white relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500"></div>
                            <h2 className="text-2xl font-black mb-2 text-white flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Team Vulnerability Audit
                            </h2>
                            <p className="text-gray-400 mb-6 text-xs sm:text-sm">We've scanned your team's combined defenses. These types pose the greatest threat.</p>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                {reportCard.threats.map((threat, idx) => (
                                    <div key={idx} className="bg-gray-900 border border-gray-700 px-6 py-4 sm:py-5 rounded-xl flex flex-col items-center justify-center shadow-inner relative group hover:border-red-500/30 transition-colors">
                                        <div className="mb-3 scale-110">
                                            <TypeBadge type={threat.name} />
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <span className="text-3xl font-black text-white mt-1 drop-shadow-md">
                                                {threat.weak_count}
                                            </span>
                                            <span className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider">Members Weak</span>
                                        </div>
                                        {threat.immune_count > 0 && (
                                            <div className="absolute top-2 right-2 bg-green-500/20 text-green-400 text-[9px] px-1.5 py-0.5 rounded font-bold border border-green-500/30">
                                                {threat.immune_count} Immune
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* ── Pokemon Selector Modal ── */}
            <PokemonSelectorModal
                isOpen={activeSlotIndex !== null}
                onClose={() => setActiveSlotIndex(null)}
                onSelect={handleSelectPokemon}
            />

            {/* ── Save Team Modal ── */}
            {showSaveModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowSaveModal(false)} />
                    <div className="relative z-10 bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4">Save Your Team</h3>
                        <p className="text-gray-400 text-sm mb-4">Give your team a name to save it for later.</p>
                        <input
                            type="text"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            placeholder="e.g., Rain Team, VGC Squad..."
                            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 text-white rounded-xl text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mb-4"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && confirmSave()}
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowSaveModal(false)}
                                className="flex-1 px-4 py-2.5 bg-gray-900 text-gray-400 hover:text-white rounded-xl border border-gray-700 hover:border-gray-600 transition-colors font-medium text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmSave}
                                disabled={saving || !teamName.trim()}
                                className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm transition-colors"
                            >
                                {saving ? 'Saving...' : 'Save Team'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
