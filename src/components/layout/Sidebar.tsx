"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { ApiClient } from "@/lib/api";
import {
    LayoutDashboard,
    ShieldCheck,
    Rss,
    Users,
    FileText,
    Calendar,
    DollarSign,
    Plane,
    Globe,
    UserCog,
    BarChart3,
    Package,
    Building2,
    UserCircle,
    Settings,

    LogOut,
    Menu,
    X
} from "lucide-react";

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Customers", href: "/customers", icon: Users },
    { name: "Facilities", href: "/facilities", icon: Building2 },
    { name: "Packages", href: "/packages", icon: Package },
    { name: "Bookings", href: "/bookings", icon: Calendar },
    { name: "Accounting", href: "/accounting", icon: DollarSign },
    { name: "Agent Info", href: "/agent-profiles", icon: UserCog },
    { name: "Ticket Marketplace", href: "/inventory", icon: Plane },
    { name: "Visa Marketplace", href: "/visa-marketplace", icon: Globe },
    { name: "Social Networks", href: "/feed", icon: Rss },
    { name: "Reports", href: "/reports", icon: BarChart3 },
    { name: "Profile", href: "/profile", icon: UserCircle },
    // Admin only items
    { name: 'Moderation', href: '/admin/moderation', icon: ShieldCheck },
    {
        name: "System Config",
        href: "/admin/system-config",
        icon: Settings,
        superAdminOnly: true
    },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const isSuperAdmin = session?.user?.role === 'SuperAdmin';
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (!session) return;

        const fetchCount = async () => {
            try {
                const res = await ApiClient.get<{ count: number }>('/notifications/unread-count');
                setUnreadCount(res.count || 0);
            } catch (error) {
                console.error("Failed to fetch notification count", error);
                setUnreadCount(0);
            }
        };

        fetchCount();
        const interval = setInterval(fetchCount, 60000); // Poll every 60s
        return () => clearInterval(interval);
    }, [session]);

    // Close mobile menu when route changes
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    const renderNavItems = () => (
        <nav className="flex-1 px-2 py-4 space-y-1">
            {navigation.map((item: any) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));

                // Hide Moderation link if not SuperAdmin
                if (item.name === 'Moderation' && !isSuperAdmin) return null;

                // Hide superAdminOnly items if not SuperAdmin
                if (item.superAdminOnly && !isSuperAdmin) return null;

                return (
                    <Link
                        key={item.name}
                        href={item.href}
                        className={`
                            group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors relative
                            ${isActive
                                ? "bg-gray-800 text-white"
                                : "text-gray-300 hover:bg-gray-700 hover:text-white"
                            }
                        `}
                    >
                        <item.icon
                            className={`mr-3 flex-shrink-0 h-6 w-6 ${isActive ? "text-white" : "text-gray-400 group-hover:text-gray-300"
                                }`}
                            aria-hidden="true"
                        />
                        {item.name}
                        {item.name === "Social Networks" && unreadCount > 0 && (
                            <span className="absolute right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </Link>
                );
            })}
        </nav>
    );

    return (
        <>
            {/* Mobile Header (Visible only on small screens) */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-gray-900 border-b border-gray-800 h-16 flex items-center px-4 justify-between">
                <div className="flex items-center">
                    <button
                        onClick={() => setIsOpen(true)}
                        className="text-gray-300 hover:text-white focus:outline-none"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    <span className="ml-3 text-lg font-bold text-white tracking-wider truncate">
                        {session?.user?.agencyName ? session.user.agencyName.toUpperCase() : 'AGENCY MANAGER'}
                    </span>
                </div>
            </div>

            {/* Mobile Drawer */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex md:hidden">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity"
                        onClick={() => setIsOpen(false)}
                    ></div>

                    {/* Drawer Content */}
                    <div className="relative flex-1 flex flex-col max-w-xs w-full bg-gray-900">
                        <div className="absolute top-0 right-0 -mr-12 pt-2">
                            <button
                                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                                onClick={() => setIsOpen(false)}
                            >
                                <X className="h-6 w-6 text-white" />
                            </button>
                        </div>

                        <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                            <div className="flex-shrink-0 flex items-center px-4">
                                <h1 className="text-xl font-bold text-white tracking-wider">
                                    MENU
                                </h1>
                            </div>
                            {renderNavItems()}
                        </div>

                        {/* Logout Button Mobile */}
                        <div className="flex-shrink-0 flex border-t border-gray-800 p-4">
                            <button
                                onClick={() => signOut()}
                                className="flex-shrink-0 w-full group block"
                            >
                                <div className="flex items-center">
                                    <div>
                                        <LogOut className="inline-block h-9 w-9 rounded-full text-gray-400 p-1 bg-gray-800" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-white">Sign Out</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="flex-shrink-0 w-14">
                        {/* Force sidebar to shrink to fit close icon */}
                    </div>
                </div>
            )}

            {/* Desktop Sidebar (Hidden on mobile) */}
            <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
                <div className="flex-1 flex flex-col min-h-0 bg-gray-900">
                    <div className="flex items-center min-h-[4rem] flex-shrink-0 px-4 bg-gray-900 border-b border-gray-800 py-4">
                        <h1 className="text-base font-bold text-white tracking-wide break-words leading-tight">
                            {session?.user?.agencyName ? session.user.agencyName.toUpperCase() : 'AGENCY MANAGER'}
                        </h1>
                    </div>
                    <div className="flex-1 flex flex-col overflow-y-auto">
                        {renderNavItems()}
                    </div>
                    {/* Logout Button Desktop */}
                    <div className="flex-shrink-0 flex border-t border-gray-800 p-4">
                        <button
                            onClick={() => signOut()}
                            className="flex-shrink-0 w-full group block"
                        >
                            <div className="flex items-center">
                                <div>
                                    <LogOut className="inline-block h-9 w-9 rounded-full text-gray-400 p-1 bg-gray-800" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-white group-hover:text-gray-300">Sign Out</p>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
