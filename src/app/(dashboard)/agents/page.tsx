"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ApiClient } from "@/lib/api";
import { Agent } from "@/types/agent";

export default function AgentsPage() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        loadAgents();
    }, []);

    const loadAgents = async () => {
        try {
            const data = await ApiClient.get<Agent[]>("/agents/");
            setAgents(data);
        } catch (e) {
            console.error("Failed to load agents", e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this agent?")) return;

        try {
            await ApiClient.delete(`/agents/${id}`);
            setAgents(agents.filter(a => a._id.$oid !== id));
        } catch (e) {
            alert("Failed to delete agent");
        }
    };

    const filteredAgents = agents.filter(agent => {
        const searchLower = searchTerm.toLowerCase();
        return (
            agent.agent_name.toLowerCase().includes(searchLower) ||
            agent.source_name.toLowerCase().includes(searchLower) ||
            agent.mobile_number.toLowerCase().includes(searchLower) ||
            (agent.source_cnic_number && agent.source_cnic_number.includes(searchLower))
        );
    });

    return (
        <div className="h-full flex flex-col space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl font-bold text-gray-900">Agents</h2>

                <div className="flex gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-initial">
                        <input
                            type="text"
                            placeholder="Search agents..."
                            className="w-full sm:w-64 border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <span className="absolute right-3 top-2.5 text-gray-400">🔍</span>
                    </div>
                    <Link href="/agents/new" className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 whitespace-nowrap">
                        + Add Agent
                    </Link>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            ) : (
                <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CNIC</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slip</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredAgents.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                                        No agents found.
                                    </td>
                                </tr>
                            ) : (
                                filteredAgents.map((agent) => (
                                    <tr key={agent._id.$oid} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{agent.agent_name}</div>
                                            {agent.description && <div className="text-xs text-gray-400">{agent.description}</div>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {agent.source_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {agent.mobile_number}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex items-center gap-2">
                                                {agent.source_cnic_number || '-'}
                                                {agent.source_cnic_attachment && (
                                                    <a
                                                        href={ApiClient.getFileUrl(agent.source_cnic_attachment) || '#'}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-indigo-600 hover:text-indigo-900"
                                                        title="View CNIC"
                                                    >
                                                        📎
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex items-center gap-2">
                                                {agent.slip_number || '-'}
                                                {agent.slip_attachment && (
                                                    <a
                                                        href={ApiClient.getFileUrl(agent.slip_attachment) || '#'}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-indigo-600 hover:text-indigo-900"
                                                        title="View Slip"
                                                    >
                                                        📎
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {agent.amount_paid ? `Rs ${agent.amount_paid}` : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Link href={`/agents/${agent._id.$oid}`} className="text-indigo-600 hover:text-indigo-900 mr-4">
                                                Edit
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(agent._id.$oid)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
