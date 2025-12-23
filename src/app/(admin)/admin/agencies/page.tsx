"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function AgenciesPage() {
    const { data: session } = useSession();
    const [agencies, setAgencies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("");

    const fetchAgencies = () => {
        if (!session?.user?.accessToken) return;

        const BACKEND_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000';
        let url = `${BACKEND_URL}/api/admin/agencies`;
        if (filter) url += `?status=${filter}`;

        fetch(url, {
            headers: { Authorization: `Bearer ${session.user.accessToken}` },
        })
            .then((res) => res.json())
            .then((data) => {
                setAgencies(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Failed to fetch agencies:", err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchAgencies();
    }, [session, filter]);

    const updateStatus = async (id: string, status: string) => {
        console.log("=== UPDATE STATUS CALLED ===");
        console.log("ID received:", id);
        console.log("ID type:", typeof id);
        console.log("Status:", status);
        console.log("Session token:", session?.user?.accessToken ? "Present" : "Missing");

        if (!id || id === 'undefined') {
            alert("Error: Agency ID is missing or undefined!");
            console.error("Invalid ID:", id);
            return;
        }

        if (!confirm(`Are you sure you want to set status to ${status}?`)) {
            console.log("User cancelled confirmation");
            return;
        }

        try {
            const BACKEND_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000';
            const url = `${BACKEND_URL}/api/admin/agencies/${id}/status`;
            console.log("Request URL:", url);

            const res = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.user?.accessToken}`
                },
                body: JSON.stringify({ status })
            });

            console.log("Response status:", res.status);

            if (res.ok) {
                console.log("Status update success");
                alert("Status updated successfully!");
                fetchAgencies(); // Refresh
            } else {
                const err = await res.json();
                console.error("Failed to update status:", err);
                alert(`Error: ${err.error || 'Failed to update status'}`);
            }
        } catch (err) {
            console.error("Failed to update status exception:", err);
            alert("Network error or server unreachable");
        }
    };

    const resetPassword = async (id: string) => {
        console.log("=== RESET PASSWORD CALLED ===");
        console.log("ID received:", id);
        console.log("ID type:", typeof id);

        if (!id || id === 'undefined') {
            alert("Error: Agency ID is missing or undefined!");
            console.error("Invalid ID:", id);
            return;
        }
        const newPass = prompt("Enter new password for agency admin:");
        if (!newPass) return;

        try {
            const BACKEND_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000';
            console.log(`Resetting password for agency ${id}`);
            const res = await fetch(`${BACKEND_URL}/api/admin/agencies/${id}/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.user?.accessToken}`
                },
                body: JSON.stringify({ password: newPass })
            });

            if (res.ok) {
                alert("Password reset successfully");
            } else {
                const err = await res.json();
                console.error("Reset password failed:", err);
                alert(`Error: ${err.error || 'Failed to reset password'}`);
            }
        } catch (err) {
            console.error("Reset password exception:", err);
            alert("Network error or server unreachable");
        }
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">Agency Management</h2>
                <select
                    className="border rounded-lg px-3 py-2 bg-white shadow-sm"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                >
                    <option value="">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Rejected">Rejected</option>
                </select>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agency Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr>
                        ) : agencies.length === 0 ? (
                            <tr><td colSpan={5} className="p-4 text-center text-gray-500">No agencies found</td></tr>
                        ) : (
                            agencies.map((agency) => {
                                console.log('Agency Row:', agency); // Debug: Check for id vs _id
                                return (
                                    <tr key={agency.id || agency._id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{agency.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{agency.adminEmail}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${agency.status === 'Active' ? 'bg-green-100 text-green-800' :
                                                    agency.status === 'Pending' ? 'bg-orange-100 text-orange-800' :
                                                        agency.status === 'Suspended' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {agency.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{agency.subscriptionPlan}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                            {agency.status === 'Pending' && (
                                                <>
                                                    <button type="button" onClick={() => updateStatus(agency.id || agency._id, 'Active')} className="text-green-600 hover:text-green-900">Approve</button>
                                                    <button type="button" onClick={() => updateStatus(agency.id || agency._id, 'Rejected')} className="text-red-600 hover:text-red-900">Reject</button>
                                                </>
                                            )}
                                            {agency.status === 'Active' && (
                                                <button type="button" onClick={() => updateStatus(agency.id || agency._id, 'Suspended')} className="text-orange-600 hover:text-orange-900">Suspend</button>
                                            )}
                                            {agency.status === 'Suspended' && (
                                                <button type="button" onClick={() => updateStatus(agency.id || agency._id, 'Active')} className="text-blue-600 hover:text-blue-900">Activate</button>
                                            )}
                                            <button type="button" onClick={() => resetPassword(agency.id || agency._id)} className="text-gray-400 hover:text-gray-600 text-xs ml-2">Reset Pwd</button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
