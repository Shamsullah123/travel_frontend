"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ApiClient } from "@/lib/api";
import Link from "next/link";
import FinancialSummaryWidget from "@/components/dashboard/FinancialSummaryWidget";

interface DashboardTasks {
    visaFollowUps: any[];
    duePayments: any[];
    expiringPassports: any[];
}

export default function DashboardHome() {
    const { data: session } = useSession();
    // @ts-ignore
    const agencyName = session?.user?.agencyName || "";

    const [tasks, setTasks] = useState<DashboardTasks>({
        visaFollowUps: [],
        duePayments: [],
        expiringPassports: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const data = await ApiClient.get<DashboardTasks>('/dashboard/tasks');
                console.log("Dashboard Data Received:", data);
                setTasks(data);
            } catch (e) {
                console.error("Failed to load dashboard tasks", e);
            } finally {
                setLoading(false);
            }
        };
        fetchTasks();
    }, []);

    if (loading) return <div className="p-8">Loading dashboard...</div>;

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900">
                {agencyName ? `${agencyName} Dashboard` : "Dashboard"}
            </h1>
            <p className="mt-2 text-sm text-gray-600">Overview of your agency performance today.</p>

            {/* Financial Summary Widget */}
            <div className="mt-8">
                <FinancialSummaryWidget />
            </div>

            {/* Top Stats Cards (Summary) */}
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Pending Visas</dt>
                                    <dd className="text-lg font-medium text-gray-900">{tasks.visaFollowUps.length}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Due Invoices</dt>
                                    <dd className="text-lg font-medium text-gray-900">{tasks.duePayments.length}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Today's Tasks Widgets */}
            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">



                {/* 2. Due Payments */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <span className="bg-red-100 text-red-800 p-1 rounded-md mr-2">💰</span>
                        Due Payments
                    </h3>
                    <ul className="space-y-3">
                        {tasks.duePayments.length === 0 ? (
                            <li className="text-sm text-gray-500">All caught up!</li>
                        ) : (
                            tasks.duePayments.map((booking: any) => (
                                <li key={booking._id} className="border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                                    <div className="flex justify-between">
                                        <div className="text-sm font-medium text-gray-900">{booking.bookingNumber}</div>
                                        <div className="text-sm font-bold text-red-600">Rs. {booking.balanceDue?.toLocaleString()}</div>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">Status: {booking.status}</div>
                                </li>
                            ))
                        )}
                    </ul>
                    <div className="mt-4">
                        <Link href="/accounting" className="text-sm text-indigo-600 hover:text-indigo-900 font-medium">View ledger &rarr;</Link>
                    </div>
                </div>

                {/* 3. Expiring Passports */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <span className="bg-orange-100 text-orange-800 p-1 rounded-md mr-2">🛂</span>
                        Expiring Passports
                    </h3>
                    <ul className="space-y-3">
                        {tasks.expiringPassports.length === 0 ? (
                            <li className="text-sm text-gray-500">No passports expiring soon.</li>
                        ) : (
                            tasks.expiringPassports.map((cust: any) => (
                                <li key={cust._id} className="border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                                    <div className="text-sm font-medium text-gray-900">{cust.fullName}</div>
                                    <div className="text-xs text-red-500 mt-1">
                                        Expires: {new Date(cust.passportExpiry).toLocaleDateString()}
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                    <div className="mt-4">
                        <Link href="/customers" className="text-sm text-indigo-600 hover:text-indigo-900 font-medium">View customers &rarr;</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
