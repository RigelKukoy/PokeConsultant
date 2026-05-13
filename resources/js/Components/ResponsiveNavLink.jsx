import { Link } from '@inertiajs/react';

export default function ResponsiveNavLink({
    active = false,
    className = '',
    children,
    ...props
}) {
    return (
        <Link
            {...props}
            className={`flex w-full items-start border-l-4 py-2 pe-4 ps-3 ${
                active
                    ? 'border-indigo-500 bg-indigo-900/30 text-indigo-300 focus:border-indigo-400 focus:bg-indigo-900/40 focus:text-indigo-200'
                    : 'border-transparent text-gray-400 hover:border-gray-600 hover:bg-gray-800 hover:text-gray-200 focus:border-gray-600 focus:bg-gray-800 focus:text-gray-200'
            } text-base font-medium transition duration-150 ease-in-out focus:outline-none ${className}`}
        >
            {children}
        </Link>
    );
}
