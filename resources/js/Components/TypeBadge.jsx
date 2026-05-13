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

export default function TypeBadge({ type, size = 'md' }) {
    const colorClass = TYPE_COLORS[type.toLowerCase()] || 'bg-gray-500';
    const sizeClasses = size === 'sm' 
        ? 'px-1.5 py-0.5 text-[10px]' 
        : 'px-3 py-1 text-xs';

    return (
        <span className={`${sizeClasses} font-bold uppercase rounded-md text-white shadow-sm inline-block ${colorClass}`}>
            {type}
        </span>
    );
}
