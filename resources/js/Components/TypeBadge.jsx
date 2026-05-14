export const TYPE_COLORS = {
    normal: 'bg-gray-400',
    fire: 'bg-red-500',
    water: 'bg-blue-500',
    grass: 'bg-green-500',
    electric: 'bg-yellow-400',
    ice: 'bg-cyan-300 text-gray-800',
    fighting: 'bg-red-700',
    poison: 'bg-purple-500',
    ground: 'bg-yellow-600',
    flying: 'bg-indigo-400',
    psychic: 'bg-pink-500',
    bug: 'bg-lime-500',
    rock: 'bg-yellow-700',
    ghost: 'bg-purple-800',
    dragon: 'bg-indigo-700',
    steel: 'bg-gray-500',
    fairy: 'bg-pink-300 text-gray-800',
    dark: 'bg-gray-800 border border-gray-600',
};

export const TYPE_HEX = {
    normal: '#9CA3AF',
    fire: '#EF4444',
    water: '#3B82F6',
    grass: '#22C55E',
    electric: '#FACC15',
    ice: '#67E8F9',
    fighting: '#B91C1C',
    poison: '#A855F7',
    ground: '#CA8A04',
    flying: '#818CF8',
    psychic: '#EC4899',
    bug: '#84CC16',
    rock: '#A16207',
    ghost: '#7E22CE',
    dragon: '#4338CA',
    dark: '#374151',
    steel: '#6B7280',
    fairy: '#F9A8D4',
};

export default function TypeBadge({ type, size = 'md' }) {
    const typeLower = type.toLowerCase();
    const colorClass = TYPE_COLORS[typeLower] || 'bg-gray-500';
    const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-3 py-1 text-xs';
    const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
    const iconUrl = `https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/${typeLower}.svg`;

    return (
        <span className={`${sizeClasses} font-bold uppercase rounded-md text-white shadow-sm inline-flex items-center gap-1 ${colorClass}`}>
            <img src={iconUrl} alt="" className={`${iconSize} flex-shrink-0`} />
            {type}
        </span>
    );
}
