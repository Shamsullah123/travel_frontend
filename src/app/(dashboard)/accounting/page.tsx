"use client";

import { ApiClient } from "@/lib/api";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Agent } from "@/types/agent";

export default function AccountingPage() {
    const [activeTab, setActiveTab] = useState<'agents' | 'customers' | 'misc'>('agents');

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Accounting & Financials</h2>

            {/* Tabs Navigation */}
            <div className="border-b border-gray-200 overflow-x-auto">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('agents')}
                        className={`${activeTab === 'agents'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Agents Ledger
                    </button>
                    <button
                        onClick={() => setActiveTab('customers')}
                        className={`${activeTab === 'customers'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Customers Ledger
                    </button>
                    <button
                        onClick={() => setActiveTab('misc')}
                        className={`${activeTab === 'misc'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Miscellaneous
                    </button>
                </nav>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
                {activeTab === 'agents' && <AgentsView />}
                {activeTab === 'customers' && <CustomersView />}
                {activeTab === 'misc' && <MiscView />}
            </div>
        </div>
    );
}

// ------------------------------------------------------------------
// Sub-components
// ------------------------------------------------------------------

function AgentsView() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [agentProfiles, setAgentProfiles] = useState<any[]>([]);
    const [selectedProfileMobile, setSelectedProfileMobile] = useState("");

    // View State
    const [viewMode, setViewMode] = useState<'summary' | 'statement'>('summary');
    const [selectedAgentMobile, setSelectedAgentMobile] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    useEffect(() => {
        loadAgents();
    }, []);

    const loadAgents = async () => {
        try {
            const [agentsData, profilesData] = await Promise.all([
                ApiClient.get<Agent[]>("/agents/"),
                ApiClient.get<any[]>("/agent-profiles")
            ]);
            setAgents(agentsData);
            setAgentProfiles(profilesData);
        } catch (e) {
            console.error("Failed to load agents", e);
        } finally {
            setLoading(false);
        }
    };

    // Grouping Logic
    const groupedAgents = agents.reduce((acc, agent) => {
        const key = agent.mobile_number;
        if (!acc[key]) {
            acc[key] = {
                name: agent.agent_name,
                mobile: agent.mobile_number,
                source_name: agent.source_name,
                cnic: agent.source_cnic_number,
                totalPaid: 0,
                transactions: []
            };
        }
        acc[key].totalPaid += (agent.amount_paid || 0);
        acc[key].transactions.push(agent);
        return acc;
    }, {} as Record<string, { name: string, mobile: string, source_name: string, cnic?: string, totalPaid: number, transactions: Agent[] }>);

    const filteredGroups = Object.values(groupedAgents).filter(group => {
        // Profile Filter
        if (selectedProfileMobile && group.mobile !== selectedProfileMobile) {
            return false;
        }

        const searchLower = searchTerm.toLowerCase();
        return (
            group.name.toLowerCase().includes(searchLower) ||
            group.mobile.toLowerCase().includes(searchLower) ||
            group.source_name.toLowerCase().includes(searchLower)
        );
    });

    // Calculate total debit (total paid to all filtered agents)
    const totalAgentDebit = filteredGroups.reduce((sum: number, group: any) => {
        return sum + (group.totalPaid || 0);
    }, 0);

    // Delete Logic
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [agentToDelete, setAgentToDelete] = useState<string | null>(null);

    const confirmDelete = (id: string) => {
        setAgentToDelete(id);
        setShowDeleteModal(true);
    };

    const handleDelete = async () => {
        if (!agentToDelete) return;
        const id = agentToDelete;

        try {
            await ApiClient.delete(`/agents/${id}`);
            setAgents(currentAgents => currentAgents.filter(a => (a._id?.$oid || a._id) !== id));
            setShowDeleteModal(false);
            setAgentToDelete(null);
        } catch (e) {
            console.error("Delete failed", e);
            alert("Failed to delete agent");
        }
    };

    // Render Logic
    if (loading) return <div className="text-center py-10">Loading agents...</div>;

    if (viewMode === 'statement' && selectedAgentMobile) {
        const group = groupedAgents[selectedAgentMobile];
        if (!group) return <div>Agent not found</div>;

        const filteredTransactions = group.transactions.filter(t => {
            if (!dateRange.start && !dateRange.end) return true;
            const tDate = new Date((t.created_at as any)?.$date || t.created_at || Date.now());
            const start = dateRange.start ? new Date(dateRange.start) : new Date(0);
            const end = dateRange.end ? new Date(dateRange.end) : new Date(8640000000000000);
            // End of day adjustment
            end.setHours(23, 59, 59, 999);
            return tDate >= start && tDate <= end;
        });

        const statementTotal = filteredTransactions.reduce((sum, t) => sum + (t.amount_paid || 0), 0);

        return (
            <div className="space-y-6">
                {/* Delete Modal Reuse */}
                {showDeleteModal && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
                        <div className="relative p-5 border w-96 shadow-lg rounded-md bg-white">
                            <div className="mt-3 text-center">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">Delete Entry</h3>
                                <div className="mt-2 px-7 py-3">
                                    <p className="text-sm text-gray-500">Are you sure you want to delete this ledger entry?</p>
                                </div>
                                <div className="items-center px-4 py-3">
                                    <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-md w-full hover:bg-red-700">Delete</button>
                                    <button onClick={() => setShowDeleteModal(false)} className="mt-3 px-4 py-2 bg-white text-gray-700 rounded-md w-full border hover:bg-gray-50">Cancel</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                    <div>
                        <button onClick={() => setViewMode('summary')} className="text-sm text-indigo-600 hover:text-indigo-900 mb-2">&larr; Back to Agents List</button>
                        <h3 className="text-2xl font-bold text-gray-900">{group.name} <span className="text-gray-500 text-lg font-normal">({group.mobile})</span></h3>
                        <p className="text-gray-500">{group.source_name} | {group.cnic || 'No CNIC'}</p>
                    </div>
                    <div className="text-left md:text-right">
                        <div className="text-sm text-gray-500">Total Paid (Filtered)</div>
                        <div className="text-3xl font-bold text-green-600">Rs {statementTotal.toLocaleString()}</div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex gap-4 items-end bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                        <input type="date" value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} className="border rounded-md px-3 py-2 text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                        <input type="date" value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} className="border rounded-md px-3 py-2 text-sm" />
                    </div>
                    <button onClick={() => setDateRange({ start: '', end: '' })} className="text-sm text-gray-600 hover:text-gray-900 pb-2">Clear</button>
                    <div className="ml-auto">
                        <button onClick={() => window.print()} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50">
                            Print Statement
                        </button>
                    </div>
                </div>

                <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slip #</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attachments</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredTransactions.map(t => (
                                <tr key={(t._id as any)?.$oid || t._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        {new Date((t.created_at as any)?.$date || t.created_at || Date.now()).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{t.description || '-'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{t.slip_number || '-'}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Rs {t.amount_paid?.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        <div className="flex gap-2">
                                            {t.slip_attachment && <a href={ApiClient.getFileUrl(t.slip_attachment) || '#'} target="_blank" rel="noopener noreferrer">📄 Slip</a>}
                                            {t.source_cnic_attachment && <a href={ApiClient.getFileUrl(t.source_cnic_attachment) || '#'} target="_blank" rel="noopener noreferrer">🪪 CNIC</a>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm font-medium">
                                        <Link href={`/agents/${t._id?.$oid || t._id}`} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</Link>
                                        <button onClick={() => confirmDelete((t._id as any)?.$oid || t._id)} className="text-red-600 hover:text-red-900">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    // Summary View
    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Agents Ledger (Summary)</h3>

                {/* Summary Card */}
                <div className="mb-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="text-sm font-medium text-red-700">Total Debit (Paid to Agents)</div>
                        <div className="text-2xl font-bold text-red-600 mt-1">Rs. {totalAgentDebit.toLocaleString()}</div>
                    </div>
                </div>

                {/* Filters and Actions */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                        {/* Profile Filter Dropdown */}
                        <div className="relative w-full sm:w-auto">
                            <select
                                value={selectedProfileMobile}
                                onChange={(e) => setSelectedProfileMobile(e.target.value)}
                                className="w-full sm:w-64 border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                            >
                                <option value="">-- Filter by Agent Info --</option>
                                {agentProfiles.map((p: any) => (
                                    <option key={p.id || p._id?.$oid || p._id} value={p.mobile_number}>
                                        {p.name} ({p.mobile_number})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="relative w-full sm:w-auto">
                            <input
                                type="text"
                                placeholder="Search in Ledger..."
                                className="w-full sm:w-64 border border-gray-300 rounded-md py-2 px-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <span className="absolute right-3 top-2.5 text-gray-400">🔍</span>
                        </div>
                        <Link href="/agents/new" className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 whitespace-nowrap text-center sm:text-left">
                            + Add Payment
                        </Link>
                    </div>
                </div>
            </div>

            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-white">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Mobile</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Source Name</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Total Paid</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredGroups.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">No agents found.</td></tr>
                        ) : (
                            filteredGroups.map((group) => (
                                <tr key={group.mobile} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{group.name}</div>
                                        <div className="text-xs text-gray-500">{group.transactions.length} entries</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {group.mobile}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {group.source_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                                        Rs {group.totalPaid.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => {
                                                setSelectedAgentMobile(group.mobile);
                                                setViewMode('statement');
                                            }}
                                            className="text-indigo-600 hover:text-indigo-900 font-medium"
                                        >
                                            View Statement
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}


function CustomersView() {
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [payAmounts, setPayAmounts] = useState<Record<string, string>>({});
    const [payDates, setPayDates] = useState<Record<string, string>>({});
    const [paySlips, setPaySlips] = useState<Record<string, { number: string, file: File | null }>>({});
    const [bookings, setBookings] = useState<any[]>([]);
    const [ledger, setLedger] = useState<any[]>([]); // All ledger entries

    // View State
    const [viewMode, setViewMode] = useState<'summary' | 'statement'>('summary');
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    useEffect(() => {
        loadCustomers();
    }, []);

    const loadCustomers = async () => {
        try {
            setLoading(true);
            const [customersData, bookingsData, ledgerData] = await Promise.all([
                ApiClient.get<any[]>("/customers"),
                ApiClient.get<any[]>("/bookings"),
                ApiClient.get<any[]>("/accounting/ledger")
            ]);

            // Aggregate financials
            const financials = customersData.reduce((acc: any, customer: any) => {
                const cId = (customer._id && (customer._id as any).$oid) ? (customer._id as any).$oid : customer._id;
                if (!acc[cId]) {
                    acc[cId] = { total: 0, paid: 0, due: 0 };
                }
                return acc;
            }, {});

            bookingsData.forEach((b: any) => {
                const cId = (b.customerId && (b.customerId as any).$oid) ? (b.customerId as any).$oid : b.customerId;
                if (financials[cId]) {
                    financials[cId].total += parseFloat((b.totalAmount && (b.totalAmount as any).$numberDecimal) ? (b.totalAmount as any).$numberDecimal : (b.totalAmount || 0));
                    financials[cId].paid += parseFloat((b.paidAmount && (b.paidAmount as any).$numberDecimal) ? (b.paidAmount as any).$numberDecimal : (b.paidAmount || 0));
                    financials[cId].due += parseFloat((b.balanceDue && (b.balanceDue as any).$numberDecimal) ? (b.balanceDue as any).$numberDecimal : (b.balanceDue || 0));
                }
            });

            const enrichedCustomers = customersData.map((c: any) => ({
                ...c,
                financials: financials[(c._id && (c._id as any).$oid) ? (c._id as any).$oid : c._id] || { total: 0, paid: 0, due: 0 }
            }));

            setCustomers(enrichedCustomers);
            setBookings(bookingsData);
            setLedger(ledgerData);
        } catch (error) {
            console.error("Failed to load customers ledger", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePayNow = async (customerId: string) => {
        const amountStr = payAmounts[customerId];
        if (!amountStr || isNaN(parseFloat(amountStr))) {
            alert("Please enter a valid amount");
            return;
        }

        const amount = parseFloat(amountStr);
        if (amount <= 0) return;

        try {
            const formData = new FormData();
            formData.append('type', 'Credit');
            formData.append('amount', amount.toString());
            formData.append('description', 'Payment via Customer Ledger');
            formData.append('customerId', customerId);

            if (paySlips[customerId]?.number) {
                formData.append('slip_number', paySlips[customerId].number);
            }
            if (payDates[customerId]) {
                formData.append('date', payDates[customerId]);
            }
            if (paySlips[customerId]?.file) {
                const file = paySlips[customerId].file;
                if (file) formData.append('slip_attachment', file);
            }

            // Client handles multipart automatically when body is FormData
            await ApiClient.post("/accounting/ledger", formData);

            // Optimistic UI Update
            setCustomers(prevCustomers => prevCustomers.map(c => {
                const cId = (c._id && (c._id as any).$oid) ? (c._id as any).$oid : c._id;
                if (cId === customerId) {
                    const currentPaid = c.financials ? c.financials.paid : 0;
                    const currentDue = c.financials ? c.financials.due : 0;
                    return {
                        ...c,
                        financials: {
                            ...c.financials,
                            paid: currentPaid + amount,
                            due: currentDue - amount
                        }
                    };
                }
                return c;
            }));

            // Clear inputs
            setPayAmounts({ ...payAmounts, [customerId]: '' });
            setPayDates({ ...payDates, [customerId]: '' });
            setPaySlips({ ...paySlips, [customerId]: { number: '', file: null } });

            alert("Payment recorded successfully!");

            // Reload to ensure consistency (background)
            loadCustomers();
        } catch (e: any) {
            console.error(e);
            alert(e.message || "Payment failed");
        }
    };

    // ... helper for file change ...
    const handleFileChange = (customerId: string, file: File | null) => {
        setPaySlips(prev => ({
            ...prev,
            [customerId]: { ...(prev[customerId] || {}), file }
        }));
    };

    const handleSlipNumberChange = (customerId: string, number: string) => {
        setPaySlips(prev => ({
            ...prev,
            [customerId]: { ...(prev[customerId] || {}), number }
        }));
    };


    // Statement Mode Render
    if (viewMode === 'statement' && selectedCustomerId) {
        const customer = customers.find(c => {
            const cId = (c._id && (c._id as any).$oid) ? (c._id as any).$oid : c._id;
            return cId === selectedCustomerId;
        });

        if (!customer) return <div>Customer not found</div>;

        const customerLedgerEntries = ledger.filter(l => {
            const lCustomerId = (l.customerId && (l.customerId as any).$oid) ? (l.customerId as any).$oid : (l.customerId?._id?.$oid || l.customerId?._id || l.customerId);
            // Verify if l.customerId is object or ID string. Backend mongo_to_dict might populate it.
            // Usually get_ledger populates names, but let's check structure.
            // If populated: l.customerId._id.$oid
            return lCustomerId === selectedCustomerId;
        });

        const filteredTransactions = customerLedgerEntries.filter(t => {
            if (!dateRange.start && !dateRange.end) return true;
            const tDate = new Date((t.date as any)?.$date || t.date || Date.now());
            const start = dateRange.start ? new Date(dateRange.start) : new Date(0);
            const end = dateRange.end ? new Date(dateRange.end) : new Date(8640000000000000);
            end.setHours(23, 59, 59, 999);
            return tDate >= start && tDate <= end;
        });

        const statementTotal = filteredTransactions.reduce((sum, t) => {
            const amt = parseFloat((t.amount as any)?.$numberDecimal || t.amount || 0);
            return t.type === 'Credit' ? sum + amt : sum - amt; // simplistic balance view
        }, 0);

        return (
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <button onClick={() => setViewMode('summary')} className="text-sm text-indigo-600 hover:text-indigo-900 mb-2">&larr; Back to Customers List</button>
                        <h3 className="text-2xl font-bold text-gray-900">{customer.fullName} <span className="text-gray-500 text-lg font-normal">({customer.phone})</span></h3>
                        <p className="text-gray-500">CNIC: {customer.cnic || 'N/A'}</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex gap-4 items-end bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                        <input type="date" value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} className="border rounded-md px-3 py-2 text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                        <input type="date" value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} className="border rounded-md px-3 py-2 text-sm" />
                    </div>
                    <button onClick={() => setDateRange({ start: '', end: '' })} className="text-sm text-gray-600 hover:text-gray-900 pb-2">Clear</button>
                    <div className="ml-auto">
                        <button onClick={() => window.print()} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50">
                            Print Statement
                        </button>
                    </div>
                </div>

                <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ref/Slip #</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attachments</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredTransactions.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">No transactions found.</td></tr>
                            ) : (
                                filteredTransactions.map((t: any) => (
                                    <tr key={(t._id as any)?.$oid || t._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {new Date((t.date as any)?.$date || t.date || Date.now()).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{t.description || '-'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{t.slip_number || t.bookingNumber || '-'}</td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${t.type === 'Credit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {t.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                                            Rs {parseFloat((t.amount as any)?.$numberDecimal || t.amount).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            <div className="flex gap-2">
                                                {t.slip_attachment && <a href={`http://localhost:5000${t.slip_attachment}`} target="_blank" rel="noopener noreferrer">📄 Slip</a>}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    const filteredCustomers = customers.filter(c => {
        // Text search filter
        const matchesSearch = c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.cnic?.includes(searchTerm) ||
            c.phone.includes(searchTerm);

        // Date range filter (filter by customer creation date or booking dates)
        if (dateRange.start || dateRange.end) {
            // Check if customer has any bookings in the date range
            const customerBookings = bookings.filter((b: any) => {
                const bCustomerId = (b.customerId && (b.customerId as any).$oid) ? (b.customerId as any).$oid : b.customerId;
                const cId = (c._id && (c._id as any).$oid) ? (c._id as any).$oid : c._id;
                return bCustomerId === cId;
            });

            if (customerBookings.length === 0) return matchesSearch; // No bookings, include if matches search

            const hasBookingInRange = customerBookings.some((b: any) => {
                const bookingDate = new Date((b.createdAt as any)?.$date || b.createdAt || Date.now());
                const start = dateRange.start ? new Date(dateRange.start) : new Date(0);
                const end = dateRange.end ? new Date(dateRange.end) : new Date(8640000000000000);
                end.setHours(23, 59, 59, 999);
                return bookingDate >= start && bookingDate <= end;
            });

            return matchesSearch && hasBookingInRange;
        }

        return matchesSearch;
    });

    // Calculate totals for filtered customers
    const totalCredit = filteredCustomers.reduce((sum, c) => sum + (c.financials?.paid || 0), 0);
    const totalDebit = filteredCustomers.reduce((sum, c) => sum + (c.financials?.due || 0), 0);

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Customers Ledger</h3>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="text-sm font-medium text-green-700">Total Credit (Paid)</div>
                        <div className="text-2xl font-bold text-green-600 mt-1">Rs. {totalCredit.toLocaleString()}</div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="text-sm font-medium text-red-700">Total Debit (Due)</div>
                        <div className="text-2xl font-bold text-red-600 mt-1">Rs. {totalDebit.toLocaleString()}</div>
                    </div>
                </div>

                {/* Date Range Filters and Search */}
                <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
                    {/* Date Range Filters */}
                    <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center w-full md:w-auto">
                        <div className="w-full sm:w-auto">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                            <input
                                type="date"
                                value={dateRange.start}
                                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full"
                            />
                        </div>
                        <div className="w-full sm:w-auto">
                            <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                            <input
                                type="date"
                                value={dateRange.end}
                                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full"
                            />
                        </div>
                        {(dateRange.start || dateRange.end) && (
                            <button
                                onClick={() => setDateRange({ start: '', end: '' })}
                                className="text-sm text-gray-600 hover:text-gray-900 mt-0 sm:mt-5"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                    <div className="relative w-full md:w-auto">
                        <input
                            type="text"
                            placeholder="Search customers..."
                            className="w-full md:w-64 pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone / CNIC</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credit (Paid)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Debit (Due)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Details</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredCustomers.map((customer: any) => {
                            const cId = (customer._id && (customer._id as any).$oid) ? (customer._id as any).$oid : customer._id;
                            const fin = customer.financials || { total: 0, paid: 0, due: 0 };

                            return (
                                <tr key={cId} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{customer.fullName}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">{customer.phone}</div>
                                        <div className="text-xs text-gray-400">{customer.cnic}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                        Rs. {fin.total.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                                        Rs. {fin.paid.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600">
                                        Rs. {fin.due.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col gap-2">
                                            <input
                                                type="number"
                                                placeholder="Amount"
                                                className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-2 py-1 border"
                                                value={payAmounts[cId] || ''}
                                                onChange={(e) => setPayAmounts({ ...payAmounts, [cId]: e.target.value })}
                                            />
                                            <input
                                                type="date"
                                                className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-2 py-1 border"
                                                value={payDates[cId] || ''}
                                                onChange={(e) => setPayDates({ ...payDates, [cId]: e.target.value })}
                                                placeholder="Date"
                                            />
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Slip #"
                                                    className="block w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-2 py-1 border"
                                                    value={paySlips[cId]?.number || ''}
                                                    onChange={(e) => handleSlipNumberChange(cId, e.target.value)}
                                                />
                                                <div className="relative">
                                                    <input
                                                        type="file"
                                                        id={`file-${cId}`}
                                                        className="hidden"
                                                        onChange={(e) => handleFileChange(cId, e.target.files?.[0] || null)}
                                                    />
                                                    <label
                                                        htmlFor={`file-${cId}`}
                                                        className={`cursor-pointer inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 ${paySlips[cId]?.file ? 'text-green-600 border-green-500' : ''}`}
                                                        title={paySlips[cId]?.file ? paySlips[cId].file.name : "Attach Slip"}
                                                    >
                                                        {paySlips[cId]?.file ? '📎' : 'Attach'}
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex flex-col gap-2 items-end">
                                            <button
                                                onClick={() => handlePayNow(cId)}
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                            >
                                                Pay
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedCustomerId(cId);
                                                    setViewMode('statement');
                                                }}
                                                className="text-indigo-600 hover:text-indigo-900 text-xs font-medium"
                                            >
                                                View Statement
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function MiscView() {
    const [expenses, setExpenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editFormData, setEditFormData] = useState<any>({});
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
        description: ''
    });

    useEffect(() => {
        loadExpenses();
    }, []);

    const loadExpenses = async () => {
        try {
            setLoading(true);
            const data = await ApiClient.get<any[]>('/accounting/misc-expenses');
            setExpenses(data);
        } catch (error) {
            console.error('Failed to load misc expenses', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title || !formData.amount) {
            alert('Please fill in title and amount');
            return;
        }

        try {
            await ApiClient.post('/accounting/misc-expenses', formData);

            // Reset form
            setFormData({
                title: '',
                amount: '',
                expense_date: new Date().toISOString().split('T')[0],
                description: ''
            });

            setShowAddForm(false);
            loadExpenses();
            alert('Expense added successfully!');
        } catch (error: any) {
            console.error('Failed to add expense', error);
            alert(error.message || 'Failed to add expense');
        }
    };

    const startEdit = (expense: any) => {
        const expId = (expense._id as any)?.$oid || expense._id;
        const date = new Date((expense.expense_date as any)?.$date || expense.expense_date);

        setEditingId(expId);
        setEditFormData({
            title: expense.title,
            amount: parseFloat((expense.amount as any)?.$numberDecimal || expense.amount || 0),
            expense_date: date.toISOString().split('T')[0],
            description: expense.description || ''
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditFormData({});
    };

    const saveEdit = async (expId: string) => {
        try {
            await ApiClient.put(`/accounting/misc-expenses/${expId}`, editFormData);
            setEditingId(null);
            setEditFormData({});
            loadExpenses();
            alert('Expense updated successfully!');
        } catch (error: any) {
            console.error('Failed to update expense', error);
            alert(error.message || 'Failed to update expense');
        }
    };

    const confirmDelete = (expId: string) => {
        setExpenseToDelete(expId);
        setShowDeleteModal(true);
    };

    const handleDelete = async () => {
        if (!expenseToDelete) return;

        try {
            await ApiClient.delete(`/accounting/misc-expenses/${expenseToDelete}`);
            setShowDeleteModal(false);
            setExpenseToDelete(null);
            loadExpenses();
            alert('Expense deleted successfully!');
        } catch (error: any) {
            console.error('Failed to delete expense', error);
            alert(error.message || 'Failed to delete expense');
        }
    };

    const totalExpenses = expenses.reduce((sum, exp) => {
        const amount = parseFloat((exp.amount as any)?.$numberDecimal || exp.amount || 0);
        return sum + amount;
    }, 0);

    if (loading) return <div className="text-center py-10">Loading expenses...</div>;

    return (
        <div className="space-y-6">
            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
                    <div className="relative p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3 text-center">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">Delete Expense</h3>
                            <div className="mt-2 px-7 py-3">
                                <p className="text-sm text-gray-500">Are you sure you want to delete this expense? This action cannot be undone.</p>
                            </div>
                            <div className="items-center px-4 py-3">
                                <button
                                    onClick={handleDelete}
                                    className="px-4 py-2 bg-red-600 text-white rounded-md w-full hover:bg-red-700 mb-2"
                                >
                                    Delete
                                </button>
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="px-4 py-2 bg-white text-gray-700 rounded-md w-full border hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-lg shadow-sm gap-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-900">Miscellaneous Expenses</h3>
                    <p className="text-sm text-gray-500 mt-1">Track office supplies, utilities, and other expenses</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
                    <div className="text-left md:text-right flex justify-between sm:block">
                        <div className="text-sm text-gray-500">Total Expenses</div>
                        <div className="text-2xl font-bold text-red-600">Rs. {totalExpenses.toLocaleString()}</div>
                    </div>
                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 w-full sm:w-auto"
                    >
                        {showAddForm ? 'Cancel' : '+ Add Expense'}
                    </button>
                </div>
            </div>

            {/* Add Expense Form */}
            {showAddForm && (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Add New Expense</h4>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g., Office Supplies, Electricity Bill"
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Amount (Rs.) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Expense Date
                            </label>
                            <input
                                type="date"
                                value={formData.expense_date}
                                onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description (Optional)
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Additional details about this expense..."
                                rows={3}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div className="md:col-span-2 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setShowAddForm(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
                            >
                                Add Expense
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Expenses List */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {expenses.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                                    No expenses recorded yet. Click "Add Expense" to get started.
                                </td>
                            </tr>
                        ) : (
                            expenses.map((expense: any) => {
                                const expId = (expense._id as any)?.$oid || expense._id;
                                const amount = parseFloat((expense.amount as any)?.$numberDecimal || expense.amount || 0);
                                const date = new Date((expense.expense_date as any)?.$date || expense.expense_date);
                                const isEditing = editingId === expId;

                                return (
                                    <tr key={expId} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {isEditing ? (
                                                <input
                                                    type="date"
                                                    value={editFormData.expense_date}
                                                    onChange={(e) => setEditFormData({ ...editFormData, expense_date: e.target.value })}
                                                    className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
                                                />
                                            ) : (
                                                date.toLocaleDateString()
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={editFormData.title}
                                                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                                                    className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
                                                />
                                            ) : (
                                                expense.title
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={editFormData.description}
                                                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                                                    className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
                                                    placeholder="Description"
                                                />
                                            ) : (
                                                expense.description || '-'
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-red-600">
                                            {isEditing ? (
                                                <input
                                                    type="number"
                                                    value={editFormData.amount}
                                                    onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })}
                                                    className="border border-gray-300 rounded px-2 py-1 text-sm w-24 text-right"
                                                    step="0.01"
                                                    min="0"
                                                />
                                            ) : (
                                                `Rs. ${amount.toLocaleString()}`
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {isEditing ? (
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => saveEdit(expId)}
                                                        className="text-green-600 hover:text-green-900"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={cancelEdit}
                                                        className="text-gray-600 hover:text-gray-900"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex justify-end gap-3">
                                                    <button
                                                        onClick={() => startEdit(expense)}
                                                        className="text-indigo-600 hover:text-indigo-900"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => confirmDelete(expId)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
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
