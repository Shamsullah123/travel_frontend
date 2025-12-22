import Link from 'next/link';
import Header from '@/components/layout/Header';

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col min-h-screen">
            {/* Navbar */}
            <Header />

            {/* Main Content */}
            <main className="flex-grow bg-white">
                {children}
            </main>

            {/* Footer */}
            <footer className="bg-gray-50 border-t border-gray-200">
                <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 tracking-wider uppercase">
                                AgencyManager
                            </h3>
                            <p className="mt-4 text-base text-gray-500">
                                Simplifying travel agency operations one booking at a time.
                            </p>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 tracking-wider uppercase">
                                Product
                            </h3>
                            <ul className="mt-4 space-y-4">
                                <li><Link href="#" className="text-base text-gray-500 hover:text-gray-900">Features</Link></li>
                                <li><Link href="#" className="text-base text-gray-500 hover:text-gray-900">Pricing</Link></li>
                                <li><Link href="#" className="text-base text-gray-500 hover:text-gray-900">Support</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 tracking-wider uppercase">
                                Contact
                            </h3>
                            <ul className="mt-4 space-y-4">
                                <li className="text-base text-gray-500">support@agencymanager.com</li>
                                <li className="text-base text-gray-500">+92 300 1234567</li>
                            </ul>
                        </div>
                    </div>
                    <div className="mt-8 border-t border-gray-200 pt-8 text-center">
                        <p className="text-base text-gray-400">
                            &copy; {new Date().getFullYear()} AgencyManager. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
