"use client";

import Sidebar from "@/components/layout/Sidebar";
import { signOut } from "next-auth/react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="h-screen flex overflow-hidden bg-gray-100">
            <Sidebar />
            <div className="flex flex-col w-0 flex-1 overflow-hidden md:ml-64 pt-16 md:pt-0">
                <main className="flex-1 relative overflow-y-auto focus:outline-none">
                    <div className="py-6">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                            {/* Top Bar for Mobile could go here */}
                            <div className="flex justify-end mb-4 md:hidden">
                                <button onClick={() => signOut()} className="text-sm text-red-600">Sign out</button>
                            </div>
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
