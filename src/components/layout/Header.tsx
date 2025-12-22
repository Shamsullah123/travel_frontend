import Link from 'next/link';

export default function Header() {
    return (
        <header className="bg-white border-b border-gray-200">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <div className="flex items-center">
                    <Link href="/" className="text-2xl font-bold text-indigo-600">
                        AgencyManager
                    </Link>
                    <div className="hidden md:flex ml-10 space-x-8">
                        <Link href="/" className="text-gray-500 hover:text-gray-900 font-medium">
                            Home
                        </Link>
                        <Link href="/about" className="text-gray-500 hover:text-gray-900 font-medium">
                            About
                        </Link>
                        <Link href="/contact" className="text-gray-500 hover:text-gray-900 font-medium">
                            Contact
                        </Link>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    <Link href="/auth/login" className="text-gray-500 hover:text-gray-900 font-medium">
                        Log in
                    </Link>
                    <Link
                        href="/auth/register"
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md font-medium hover:bg-indigo-700"
                    >
                        Start Free Trial
                    </Link>
                </div>
            </nav>
        </header>
    );
}
