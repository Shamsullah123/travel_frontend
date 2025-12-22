"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function AdminDashboardPage() {
    const { data: session } = useSession();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (session?.user?.accessToken) {
            fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/stats`, {
                headers: {
                    Authorization: `Bearer ${session.user.accessToken}`,
                },
            })
                .then((res) => res.json())
                .then((data) => {
                    setStats(data);
                    setLoading(false);
                })
                .catch((err) => {
                    console.error("Dashboard Stats Fetch Error:", err);
                    setLoading(false);
                });
        }
    }, [session]);

    if (loading) return <div className="text-center mt-10">Loading Stats...</div>;
    if (!stats && !loading) return <div className="text-center mt-10 text-red-500">Failed to load stats. Check console/logs.</div>;

    return (
        <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-8">Dashboard Overview</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Agencies */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
                    <p className="text-gray-500 text-sm font-medium">Total Agencies</p>
                    <p className="text-4xl font-bold text-blue-600 mt-2">{stats?.agencies?.total || 0}</p>
                </div>

                {/* Active Agencies */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
                    <p className="text-gray-500 text-sm font-medium">Active Agencies</p>
                    <p className="text-4xl font-bold text-green-600 mt-2">{stats?.agencies?.active || 0}</p>
                </div>

                {/* Pending Agencies */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
                    <p className="text-gray-500 text-sm font-medium">Pending Approval</p>
                    <p className="text-4xl font-bold text-orange-500 mt-2">{stats?.agencies?.pending || 0}</p>
                </div>

                {/* Total Bookings */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
                    <p className="text-gray-500 text-sm font-medium">Total Bookings</p>
                    <p className="text-4xl font-bold text-purple-600 mt-2">{stats?.bookings?.total || 0}</p>
                    <p className="text-xs text-gray-400 mt-1">+{stats?.bookings?.recent_30_days || 0} in last 30 days</p>
                </div>
            </div>
        </div>
    );
}
