import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="flex min-h-screen flex-col items-center bg-gray-800 pt-6 sm:justify-center sm:pt-0">
            <div className="flex justify-center">
                <Link href="/">
                    <ApplicationLogo className="fill-current" />
                </Link>
            </div>

            <div className="mt-6 w-full overflow-hidden bg-gray-700 border border-gray-600/60 px-6 py-4 shadow-2xl sm:max-w-md sm:rounded-xl">
                {children}
            </div>
        </div>
    );
}
