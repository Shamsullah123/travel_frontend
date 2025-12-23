"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ApiClient } from "@/lib/api";
import { Agent } from "@/types/agent";
import Link from "next/link";

export default function AgentForm() {
    const router = useRouter();
    const params = useParams();
    const { data: session } = useSession();
    const id = params?.id as string;
    const isNew = id === 'new';

    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        agent_name: '',
        source_name: '',
        source_cnic_number: '',
        mobile_number: '',
        description: '',
        slip_number: '',
        amount_paid: ''
    });
    const [file, setFile] = useState<File | null>(null);
    const [slipFile, setSlipFile] = useState<File | null>(null);
    const [currentAttachment, setCurrentAttachment] = useState<string | null>(null);
    const [currentSlipAttachment, setCurrentSlipAttachment] = useState<string | null>(null);

    // Agent Profile Autocomplete
    const [agentProfiles, setAgentProfiles] = useState<any[]>([]);
    const [selectedProfileId, setSelectedProfileId] = useState("");

    useEffect(() => {
        loadAgentProfiles();
    }, []);

    const loadAgentProfiles = async () => {
        try {
            const data = await ApiClient.get<any[]>("/agent-profiles");
            setAgentProfiles(data);
        } catch (e) {
            console.error("Failed to load agent profiles");
        }
    };

    const handleProfileSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const profileId = e.target.value;
        setSelectedProfileId(profileId);

        if (profileId) {
            const profile = agentProfiles.find((p: any) =>
                (p._id.$oid === profileId || p.id === profileId || p._id === profileId)
            );
            if (profile) {
                setFormData(prev => ({
                    ...prev,
                    agent_name: profile.name,
                    source_name: profile.source_name || '',
                    mobile_number: profile.mobile_number,
                    source_cnic_number: profile.cnic || ''
                }));
            }
        }
    };

    useEffect(() => {
        if (!isNew && id) {
            loadAgent();
        }
    }, [isNew, id]);

    const loadAgent = async () => {
        try {
            const data = await ApiClient.get<Agent>(`/agents/${id}`);
            setFormData({
                agent_name: data.agent_name,
                source_name: data.source_name,
                source_cnic_number: data.source_cnic_number || '',
                mobile_number: data.mobile_number,
                description: data.description || '',
                slip_number: data.slip_number || '',
                amount_paid: data.amount_paid?.toString() || ''
            });
            setCurrentAttachment(data.source_cnic_attachment || null);
            setCurrentSlipAttachment(data.slip_attachment || null);
        } catch (e) {
            alert("Failed to load agent");
            router.push('/accounting');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSlipFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSlipFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            // Validation
            const mobileRegex = /^(\+92|0|92)[0-9]{10}$/; // Basic Pak number check
            if (!mobileRegex.test(formData.mobile_number.replace(/[\-\s]/g, ''))) {
                alert("Invalid Mobile Number Format. Use Pakistani format (e.g. 03001234567)");
                setSaving(false);
                return;
            }

            if (formData.source_cnic_number) {
                const cnicClean = formData.source_cnic_number.replace(/[\-\s]/g, '');
                if (cnicClean.length !== 13 || isNaN(Number(cnicClean))) {
                    alert("Invalid CNIC Format. Must be 13 digits.");
                    setSaving(false);
                    return;
                }
            }

            // Using FormData for file upload support
            const data = new FormData();
            data.append('agent_name', formData.agent_name);
            data.append('source_name', formData.source_name);
            data.append('source_cnic_number', formData.source_cnic_number);
            data.append('mobile_number', formData.mobile_number);
            data.append('description', formData.description);
            data.append('slip_number', formData.slip_number);
            data.append('amount_paid', formData.amount_paid);

            if (file) {
                data.append('source_cnic_attachment', file);
            }
            if (slipFile) {
                data.append('slip_attachment', slipFile);
            }

            // Get token from session
            // @ts-ignore
            const token = session?.user?.accessToken || session?.accessToken;

            const url = isNew
                ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/agents/`
                : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/agents/${id}`;
            const method = isNew ? 'POST' : 'PUT';

            console.log("Submitting to", url, "with token", token ? "PRESENT" : "MISSING");

            const res = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: data
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to save');
            }

            router.push('/accounting');
            router.refresh();

        } catch (e: any) {
            alert(e.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-6">{isNew ? 'Add New Agent' : 'Edit Agent'}</h2>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">

                {/* Autocomplete Dropdown */}
                {isNew && (
                    <div className="bg-blue-50 p-4 rounded-md mb-4 border border-blue-100">
                        <label className="block text-sm font-medium text-blue-900 mb-2">Auto-fill from Saved Agents</label>
                        <select
                            value={selectedProfileId}
                            onChange={handleProfileSelect}
                            className="w-full border border-blue-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            <option value="">-- Select Existing Agent --</option>
                            {agentProfiles.map((p: any) => {
                                const pid = p.id || (p._id && p._id.$oid) || p._id;
                                return (
                                    <option key={pid} value={pid}>
                                        {p.name} ({p.mobile_number})
                                    </option>
                                );
                            })}
                        </select>
                        <p className="text-xs text-blue-700 mt-1">Selecting an agent will fill Name, Mobile, Source, and CNIC.</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Agent Name *</label>
                        <input
                            required
                            type="text"
                            name="agent_name"
                            value={formData.agent_name}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Source Name *</label>
                        <input
                            required
                            type="text"
                            name="source_name"
                            value={formData.source_name}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number *</label>
                        <input
                            required
                            type="text"
                            name="mobile_number"
                            placeholder="03001234567"
                            value={formData.mobile_number}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">CNIC Number</label>
                        <input
                            type="text"
                            name="source_cnic_number"
                            placeholder="12345-1234567-1"
                            value={formData.source_cnic_number}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CNIC Attachment</label>
                    <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={handleFileChange}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                    {currentAttachment && (
                        <div className="mt-1 text-xs text-gray-500">
                            Current: <a href={ApiClient.getFileUrl(currentAttachment) || '#'} target="_blank" className="text-indigo-600 underline">View File</a>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Slip Number</label>
                        <input
                            type="text"
                            name="slip_number"
                            placeholder="Bank Slip No."
                            value={formData.slip_number}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Slip Attachment</label>
                        <input
                            type="file"
                            accept=".jpg,.jpeg,.png,.pdf"
                            onChange={handleSlipFileChange}
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                        {currentSlipAttachment && (
                            <div className="mt-1 text-xs text-gray-500">
                                Current: <a href={ApiClient.getFileUrl(currentSlipAttachment) || '#'} target="_blank" className="text-indigo-600 underline">View File</a>
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid</label>
                    <input
                        type="number"
                        name="amount_paid"
                        placeholder="0"
                        value={formData.amount_paid}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                        rows={3}
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <Link href="/accounting" className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save Agent'}
                    </button>
                </div>

            </form>
        </div>
    );
}
