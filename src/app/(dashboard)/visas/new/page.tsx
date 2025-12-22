"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ApiClient } from "@/lib/api";
import Link from "next/link";

export default function NewVisaCasePage() {
    const router = useRouter();
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        customerId: "",
        country: "",
        visaType: "Visit"
    });

    useEffect(() => {
        // Fetch customers for dropdown
        ApiClient.get<any[]>('/customers').then(setCustomers).catch(console.error);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            await ApiClient.post('/visa-cases', formData);
            router.refresh(); // Ensure list updates
            router.push('/visas');
        } catch (e: any) {
            setError(e.message || "Failed to create visa case");
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white shadow rounded-lg">
            <h2 className="text-2xl font-bold mb-6">Open New Visa Case</h2>

            {error && (
                <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Customer</label>
                    <select
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        value={formData.customerId}
                        onChange={e => setFormData({ ...formData, customerId: e.target.value })}
                    >
                        <option value="">Select Customer</option>
                        {customers.map(c => (
                            <option key={c._id} value={c._id}>{c.fullName} ({c.passportNumber || c.phone})</option>
                        ))}
                    </select>
                    <div className="mt-1 text-xs text-right">
                        <Link href="/customers/new" className="text-indigo-600 hover:underline">Or create new customer</Link>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Country</label>
                    <input
                        type="text"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        value={formData.country}
                        onChange={e => setFormData({ ...formData, country: e.target.value })}
                        placeholder="e.g. UAE, UK, USA"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Visa Type</label>
                    <select
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        value={formData.visaType}
                        onChange={e => setFormData({ ...formData, visaType: e.target.value })}
                    >
                        <option>Visit</option>
                        <option>Work</option>
                        <option>Student</option>
                        <option>Business</option>
                        <option>Immigration</option>
                    </select>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={() => router.push('/visas')}
                        className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {loading ? 'Creating...' : 'Create Case'}
                    </button>
                </div>
            </form>
        </div>
    );
}
