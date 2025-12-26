"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Menu, X } from "lucide-react";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const { data: session } = useSession();

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navigation = [
        { name: "Dashboard", href: "/admin/dashboard" },
        { name: "Agencies", href: "/admin/agencies" },
        { name: "System Config", href: "/admin/system-config" },
        { name: "Moderation", href: "/admin/moderation" },
        { name: "Settings & Messages", href: "/admin/settings" },
    ];

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
            {/* Mobile Header */}
            <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center shadow-md z-20 sticky top-0">
                <div>
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                        Super Admin
                    </h1>
                    <p className="text-xs text-gray-400">Bannu Pilot</p>
                </div>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 rounded-md hover:bg-slate-800"
                >
                    {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex-col transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:flex md:h-screen md:sticky md:top-0
                ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
            `}>
                <div className="p-6">
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                        Super Admin
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">Bannu Pilot</p>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-150 ${isActive
                                    ? "bg-blue-600 text-white shadow-lg"
                                    : "text-gray-300 hover:bg-slate-800 hover:text-white"
                                    }`}
                            >
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-700">
                    <div className="mb-4 text-xs text-gray-500 truncate">
                        {session?.user?.email}
                    </div>
                    <button
                        onClick={() => signOut({ callbackUrl: "/auth/login" })}
                        className="w-full flex items-center justify-center px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
                    >
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto h-[calc(100vh-64px)] md:h-screen">
                {children}
            </main>
        </div>
    );
}
