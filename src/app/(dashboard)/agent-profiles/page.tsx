"use client";

import { useState, useEffect } from "react";
import { ApiClient } from "@/lib/api";

interface AgentProfile {
    _id: string; // Serialized as dict, so _id might be object with $oid or string
    id?: string;
    name: string;
    source_name?: string;
    mobile_number: string;
    cnic?: string;
}

export default function AgentProfilesPage() {
    const [profiles, setProfiles] = useState<AgentProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProfile, setEditingProfile] = useState<AgentProfile | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        source_name: "",
        mobile_number: "",
        cnic: ""
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadProfiles();
    }, []);

    const loadProfiles = async () => {
        try {
            const data = await ApiClient.get<AgentProfile[]>("/agent-profiles");
            // Normalize IDs
            const normalized = data.map(p => ({
                ...p,
                id: (p._id as any).$oid || p._id
            }));
            setProfiles(normalized);
        } catch (e) {
            console.error("Failed to load profiles", e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingProfile && editingProfile.id) {
                await ApiClient.put(`/agent-profiles/${editingProfile.id}`, formData);
            } else {
                await ApiClient.post("/agent-profiles", formData);
            }
            setIsModalOpen(false);
            setEditingProfile(null);
            setFormData({ name: "", source_name: "", mobile_number: "", cnic: "" });
            loadProfiles();
        } catch (e: any) {
            alert(e.message || "Failed to save profile");
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (profile: AgentProfile) => {
        setEditingProfile(profile);
        setFormData({
            name: profile.name,
            source_name: profile.source_name || "",
            mobile_number: profile.mobile_number,
            cnic: profile.cnic || ""
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This will delete the profile info, but won't delete ledger history.")) return;
        try {
            await ApiClient.del(`/agent-profiles/${id}`);
            loadProfiles();
        } catch (e) {
            alert("Failed to delete profile");
        }
    };

    const filteredProfiles = profiles.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.mobile_number.includes(searchTerm)
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Agent Information</h2>
                    <p className="mt-1 text-sm text-gray-500">Manage master list of agents (Name, Mobile, CNIC)</p>
                </div>
                <div className="w-full md:w-auto">
                    <button
                        onClick={() => {
                            setEditingProfile(null);
                            setFormData({ name: "", source_name: "", mobile_number: "", cnic: "" });
                            setIsModalOpen(true);
                        }}
                        className="w-full md:w-auto bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-center"
                    >
                        + Add Agent Info
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="flex gap-2 w-full md:w-auto">
                <input
                    type="text"
                    placeholder="Search by Name or Mobile..."
                    className="w-full md:w-64 border border-gray-300 rounded px-3 py-2"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Table */}
            <div className="bg-white shadow rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mobile</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CNIC</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan={5} className="text-center py-4">Loading...</td></tr>
                        ) : filteredProfiles.length === 0 ? (
                            <tr><td colSpan={5} className="text-center py-4 text-gray-500">No profiles found.</td></tr>
                        ) : (
                            filteredProfiles.map(profile => (
                                <tr key={profile.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{profile.name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{profile.source_name || '-'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{profile.mobile_number}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{profile.cnic || '-'}</td>
                                    <td className="px-6 py-4 text-right text-sm">
                                        <button onClick={() => handleEdit(profile)} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                                        <button onClick={() => handleDelete(profile.id!)} className="text-red-600 hover:text-red-900">Delete</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setIsModalOpen(false)}></div>
                        <div className="relative bg-white rounded-lg max-w-md w-full p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                {editingProfile ? 'Edit Agent Info' : 'Add New Agent Info'}
                            </h3>
                            <form onSubmit={handleSave} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Agent Name *</label>
                                    <input
                                        required
                                        type="text"
                                        className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Source Name</label>
                                    <input
                                        type="text"
                                        className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
                                        value={formData.source_name}
                                        onChange={e => setFormData({ ...formData, source_name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Mobile Number *</label>
                                    <input
                                        required
                                        type="text"
                                        className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
                                        value={formData.mobile_number}
                                        onChange={e => setFormData({ ...formData, mobile_number: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">CNIC</label>
                                    <input
                                        type="text"
                                        className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
                                        value={formData.cnic}
                                        onChange={e => setFormData({ ...formData, cnic: e.target.value })}
                                    />
                                </div>
                                <div className="mt-6 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        {saving ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
