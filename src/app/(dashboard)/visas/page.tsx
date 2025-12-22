"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ApiClient } from "@/lib/api";

interface VisaCase {
    _id: string;
    country: string;
    visaType: string;
    status: string;
    history: any[];
    createdAt: string;
    customerName?: string;
    customerPhone?: string;
}

const STATUS_COLUMNS = ["New", "DocsReceived", "Submitted", "Approved", "Rejected", "Completed"];

export default function VisaPage() {
    const [cases, setCases] = useState<VisaCase[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeFilter, setTimeFilter] = useState("all");

    useEffect(() => {
        loadCases();
    }, []);

    const loadCases = async () => {
        try {
            const data = await ApiClient.get<VisaCase[]>("/visa-cases");
            setCases(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: string, newStatus: string) => {
        // Optimistic update
        const originalCases = [...cases];
        setCases(cases.map(c => c._id === id ? { ...c, status: newStatus } : c));

        try {
            await ApiClient.post(`/visa-cases/${id}/status`, { status: newStatus });
            loadCases(); // Sync with server to get any other side effects
        } catch (e) {
            alert("Failed to update status");
            setCases(originalCases); // Rollback on error
        }
    };

    const getBadges = (status: string) => {
        const colors: any = {
            New: "bg-blue-100 text-blue-800",
            DocsReceived: "bg-yellow-100 text-yellow-800",
            Submitted: "bg-purple-100 text-purple-800",
            Approved: "bg-green-100 text-green-800",
            Rejected: "bg-red-100 text-red-800",
            Completed: "bg-gray-100 text-gray-800"
        };
        return colors[status] || "bg-gray-100";
    };

    const [searchTerm, setSearchTerm] = useState("");

    // calculate counts (before filtering or after? Usually counts should reflect ALL or FILTERED? 
    // User requested filtering facilities. Let's filter the view.

    // Filtered cases
    const filteredCases = cases.filter(c => {
        const matchesStatus = true; // status column filtering is handled in render
        const matchesTime = true; // implement later if needed, user focused on search
        const searchLower = searchTerm.toLowerCase();

        return (
            (c.customerName?.toLowerCase().includes(searchLower) ||
                c.country?.toLowerCase().includes(searchLower) ||
                c.visaType?.toLowerCase().includes(searchLower))
        );
    });

    // Counts based on FULL list usually? or filtered? Let's use FULL list for the top widget stats.
    const counts = {
        Pending: cases.filter(c => c.status === 'New').length,
        UnderProcess: cases.filter(c => c.status === 'DocsReceived').length,
        Submitted: cases.filter(c => c.status === 'Submitted').length,
        Approved: cases.filter(c => c.status === 'Approved').length,
        Rejected: cases.filter(c => c.status === 'Rejected').length
    };

    return (
        <div className="h-full flex flex-col space-y-6">

            {/* Visa Status Summary Widget */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Visa Status Summary</h3>
                    {/* Time filter placeholder - logic can be added later */}
                    <select
                        className="text-sm border-gray-300 rounded-md shadow-sm"
                        value={timeFilter}
                        onChange={(e) => setTimeFilter(e.target.value)}
                    >
                        <option value="all">All Time</option>
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                    </select>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-blue-50 p-3 rounded-md border-l-4 border-blue-500">
                        <div className="text-xs text-blue-600 font-medium">PENDING</div>
                        <div className="text-2xl font-bold text-blue-800">{counts.Pending}</div>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-md border-l-4 border-yellow-500">
                        <div className="text-xs text-yellow-600 font-medium">UNDER PROCESS</div>
                        <div className="text-2xl font-bold text-yellow-800">{counts.UnderProcess}</div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-md border-l-4 border-purple-500">
                        <div className="text-xs text-purple-600 font-medium">SUBMITTED</div>
                        <div className="text-2xl font-bold text-purple-800">{counts.Submitted}</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-md border-l-4 border-green-500">
                        <div className="text-xs text-green-600 font-medium">APPROVED</div>
                        <div className="text-2xl font-bold text-green-800">{counts.Approved}</div>
                    </div>
                    <div className="bg-red-50 p-3 rounded-md border-l-4 border-red-500">
                        <div className="text-xs text-red-600 font-medium">REJECTED</div>
                        <div className="text-2xl font-bold text-red-800">{counts.Rejected}</div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl font-bold text-gray-900">Case Board</h2>

                <div className="flex gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-initial">
                        <input
                            type="text"
                            placeholder="Search customer, country..."
                            className="w-full sm:w-64 border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <span className="absolute right-3 top-2.5 text-gray-400">🔍</span>
                    </div>
                    <Link href="/visas/new" className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 whitespace-nowrap">
                        + New Case
                    </Link>
                </div>
            </div>

            {loading ? (
                <p>Loading...</p>
            ) : (
                <div className="flex gap-4 overflow-x-auto pb-4 h-full">
                    {STATUS_COLUMNS.map(status => (
                        <div key={status} className="min-w-[300px] bg-gray-50 rounded-lg p-3 flex flex-col">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                {status}
                            </h3>
                            <div className="space-y-3 overflow-y-auto flex-1">
                                {filteredCases.filter(c => c.status === status).map(c => (
                                    <div key={c._id} className="bg-white p-4 rounded-md shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-medium text-gray-900">{c.customerName || 'Unknown Customer'}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${getBadges(c.status)}`}>
                                                {c.status}
                                            </span>
                                        </div>
                                        <div className="text-sm text-indigo-600 mb-1 font-medium">{c.country} - {c.visaType}</div>
                                        <div className="text-xs text-gray-500 mb-4">
                                            Case ID: {c._id.substring(0, 6)}...
                                        </div>

                                        {/* Actions */}
                                        <div className="flex justify-end gap-2">
                                            {status === 'New' && (
                                                <button onClick={() => updateStatus(c._id, 'DocsReceived')} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Move Next &rarr;</button>
                                            )}
                                            {status === 'DocsReceived' && (
                                                <button onClick={() => updateStatus(c._id, 'Submitted')} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Submit &rarr;</button>
                                            )}
                                            {status === 'Submitted' && (
                                                <>
                                                    <button onClick={() => updateStatus(c._id, 'Rejected')} className="text-xs text-red-600 hover:text-red-800 font-medium">Reject</button>
                                                    <button onClick={() => updateStatus(c._id, 'Approved')} className="text-xs text-green-600 hover:text-green-800 font-medium">Approve</button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
