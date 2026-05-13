export default function ApplicationLogo({ className = '' }) {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <img
                src="/images/pokeball.png"
                alt="PokeConsultant"
                className="h-8 w-8 drop-shadow-[0_0_6px_rgba(239,68,68,0.4)]"
            />
            <span className="text-white font-black text-lg tracking-tight">
                Poké<span className="text-red-500">Consultant</span>
            </span>
        </div>
    );
}
