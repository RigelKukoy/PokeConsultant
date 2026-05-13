import { useState, useEffect, useRef, useCallback } from 'react';
import { TYPE_COLORS } from './TypeBadge';

const ALL_TYPES = [
    'all', 'normal', 'fire', 'water', 'grass', 'electric', 'ice',
    'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
    'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
];

/* ── Hex color map for richer visuals ── */
const TYPE_HEX = {
    all: '#6366f1',
    normal: '#9CA3AF', fire: '#EF4444', water: '#3B82F6', grass: '#22C55E',
    electric: '#FACC15', ice: '#67E8F9', fighting: '#B91C1C', poison: '#A855F7',
    ground: '#CA8A04', flying: '#818CF8', psychic: '#EC4899', bug: '#84CC16',
    rock: '#A16207', ghost: '#7E22CE', dragon: '#4338CA', dark: '#374151',
    steel: '#6B7280', fairy: '#F9A8D4',
};

const BATCH_SIZE = 60;

export default function PokemonSelectorModal({ isOpen, onClose, onSelect }) {
    const [allPokemon, setAllPokemon] = useState([]);
    const [filteredList, setFilteredList] = useState([]);
    const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
    const [activeType, setActiveType] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);

    const scrollRef = useRef(null);
    const sentinelRef = useRef(null);

    /* ── Fetch all pokemon on mount ── */
    useEffect(() => {
        if (!isOpen) return;
        fetchPokemonByType('all');
    }, [isOpen]);

    const fetchPokemonByType = async (type) => {
        setLoading(true);
        setActiveType(type);
        setSearchQuery('');
        setVisibleCount(BATCH_SIZE);

        try {
            if (type === 'all') {
                const res = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1025');
                const data = await res.json();
                const list = data.results.map((p, i) => ({
                    name: p.name,
                    id: extractId(p.url),
                }));
                setAllPokemon(list);
                setFilteredList(list);
            } else {
                const res = await fetch(`https://pokeapi.co/api/v2/type/${type}`);
                const data = await res.json();
                const list = data.pokemon.map(entry => ({
                    name: entry.pokemon.name,
                    id: extractId(entry.pokemon.url),
                })).filter(p => p.id <= 1025).sort((a, b) => a.id - b.id);
                setAllPokemon(list);
                setFilteredList(list);
            }
        } catch (err) {
            console.error('Failed to fetch pokemon:', err);
        }
        setLoading(false);
    };

    const extractId = (url) => {
        const parts = url.replace(/\/$/, '').split('/');
        return parseInt(parts[parts.length - 1], 10);
    };

    /* ── Search with debounce ── */
    const debounceTimer = useRef(null);
    const handleSearch = (query) => {
        setSearchQuery(query);
        clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            if (query.trim() === '') {
                setFilteredList(allPokemon);
            } else {
                const q = query.toLowerCase().trim();
                setFilteredList(allPokemon.filter(p =>
                    p.name.includes(q) || String(p.id) === q
                ));
            }
            setVisibleCount(BATCH_SIZE);
        }, 250);
    };

    /* ── IntersectionObserver for infinite scroll ── */
    useEffect(() => {
        if (!sentinelRef.current) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && visibleCount < filteredList.length) {
                    setVisibleCount(prev => Math.min(prev + BATCH_SIZE, filteredList.length));
                }
            },
            { root: scrollRef.current, threshold: 0.1 }
        );
        observer.observe(sentinelRef.current);
        return () => observer.disconnect();
    }, [filteredList, visibleCount, isOpen]);

    /* ── Reset scroll on filter change ── */
    useEffect(() => {
        scrollRef.current?.scrollTo({ top: 0 });
    }, [activeType, searchQuery]);

    const handleSelect = useCallback((pokemon) => {
        onSelect(pokemon);
        onClose();
    }, [onSelect, onClose]);

    if (!isOpen) return null;

    const visiblePokemon = filteredList.slice(0, visibleCount);
    const activeHex = TYPE_HEX[activeType] || TYPE_HEX.all;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div
                className="relative z-10 w-full h-full sm:w-[95vw] sm:max-w-5xl sm:h-[85vh] sm:rounded-2xl overflow-hidden flex flex-col"
                style={{
                    background: 'linear-gradient(145deg, rgba(15,23,42,0.97), rgba(30,41,59,0.95))',
                    border: `1px solid ${activeHex}33`,
                    boxShadow: `0 0 60px ${activeHex}15, 0 25px 50px rgba(0,0,0,0.5)`,
                }}
            >
                {/* ── Top accent bar ── */}
                <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${activeHex}, ${activeHex}66, transparent)` }} />

                {/* ── Header ── */}
                <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4 flex-shrink-0">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: activeHex }} />
                            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight uppercase" style={{ fontFamily: "'Courier New', monospace" }}>
                                Pokédex Database
                            </h2>
                            <span className="text-xs text-gray-500 font-mono">
                                {filteredList.length} entries
                            </span>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors text-3xl leading-none font-light w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg hover:bg-white/5"
                        >
                            ×
                        </button>
                    </div>

                    {/* ── Search Bar ── */}
                    <div className="relative mb-4">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder="Search by name or ID..."
                            className="w-full pl-10 pr-4 py-3.5 sm:py-3 bg-gray-800/80 border border-gray-700/80 text-white rounded-xl text-base sm:text-sm placeholder-gray-500 focus:outline-none focus:ring-2 transition-shadow"
                            style={{ focusRingColor: activeHex }}
                            autoFocus
                        />
                    </div>

                    {/* ── Type Filter Bar ── */}
                    <div className="flex gap-3 sm:gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                        {ALL_TYPES.map(type => {
                            const isActive = activeType === type;
                            const hex = TYPE_HEX[type];
                            return (
                                <button
                                    key={type}
                                    onClick={() => fetchPokemonByType(type)}
                                    className="flex-shrink-0 px-5 py-2 sm:px-4 sm:py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 border whitespace-nowrap"
                                    style={{
                                        backgroundColor: isActive ? hex : 'transparent',
                                        borderColor: isActive ? hex : 'rgba(255,255,255,0.1)',
                                        color: isActive
                                            ? (['ice', 'fairy', 'electric', 'normal'].includes(type) ? '#1e293b' : '#fff')
                                            : '#9ca3af',
                                        boxShadow: isActive ? `0 0 12px ${hex}44` : 'none',
                                    }}
                                >
                                    {type}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Pokemon Grid (Scrollable) ── */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4 sm:pb-6"
                    style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: `${activeHex}44 transparent`,
                    }}
                >
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="w-10 h-10 border-4 border-gray-700 rounded-full animate-spin" style={{ borderTopColor: activeHex }} />
                        </div>
                    ) : filteredList.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                            <svg className="w-16 h-16 mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                            </svg>
                            <p className="text-sm font-mono">No Pokémon found</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-3">
                                {visiblePokemon.map(pokemon => (
                                    <button
                                        key={pokemon.id}
                                        onClick={() => handleSelect(pokemon)}
                                        className="group relative bg-gray-800/60 rounded-xl p-2 sm:p-3 flex flex-col items-center justify-center border border-transparent hover:border-opacity-60 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900"
                                        style={{
                                            '--hover-border': activeHex,
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = activeHex + '66';
                                            e.currentTarget.style.boxShadow = `0 4px 20px ${activeHex}22`;
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = 'transparent';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    >
                                        <span className="absolute top-1.5 right-2 text-[10px] font-mono text-gray-600 group-hover:text-gray-400 transition-colors">
                                            #{String(pokemon.id).padStart(3, '0')}
                                        </span>
                                        <img
                                            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`}
                                            alt={pokemon.name}
                                            loading="lazy"
                                            className="w-16 h-16 object-contain transition-transform duration-200 group-hover:scale-110 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
                                            onError={(e) => { e.target.style.opacity = '0.2'; }}
                                        />
                                        <span className="text-[11px] text-gray-400 group-hover:text-white font-semibold capitalize mt-1 truncate w-full text-center transition-colors">
                                            {pokemon.name}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {/* Sentinel for infinite scroll */}
                            {visibleCount < filteredList.length && (
                                <div ref={sentinelRef} className="flex items-center justify-center py-8">
                                    <div className="flex items-center gap-3 text-gray-500 text-xs font-mono">
                                        <div className="w-4 h-4 border-2 border-gray-600 rounded-full animate-spin" style={{ borderTopColor: activeHex }} />
                                        Loading more...
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* ── Bottom status bar ── */}
                <div className="px-4 sm:px-6 py-2 border-t border-gray-800/80 flex items-center justify-between text-[10px] text-gray-600 font-mono flex-shrink-0" style={{ background: 'rgba(15,23,42,0.8)' }}>
                    <span>SHOWING {Math.min(visibleCount, filteredList.length)} / {filteredList.length}</span>
                    <span>TYPE: {activeType.toUpperCase()}</span>
                </div>
            </div>
        </div>
    );
}
