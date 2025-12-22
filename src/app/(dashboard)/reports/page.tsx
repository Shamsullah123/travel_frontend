"use client";

import { useEffect, useState } from "react";
import { ReportsService, ReportSummary, CashFlowData, RevenueData, OutstandingPayment, TopCustomer } from "@/services/reports";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar,
    PieChart, Pie, Cell,
    AreaChart, Area
} from "recharts";
import { useSession } from "next-auth/react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function ReportsPage() {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(true);

    // Filters
    const [filter, setFilter] = useState('this_month');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Data States
    const [summary, setSummary] = useState<ReportSummary | null>(null);
    const [cashFlow, setCashFlow] = useState<CashFlowData[]>([]);
    const [revenue, setRevenue] = useState<RevenueData[]>([]);
    const [expenses, setExpenses] = useState<RevenueData[]>([]);
    const [outstanding, setOutstanding] = useState<OutstandingPayment[]>([]);
    const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const dateParams = filter === 'custom' ? [startDate, endDate] : [undefined, undefined];

            const [sum, flow, rev, exp, out, top] = await Promise.all([
                ReportsService.getSummary(filter, ...dateParams as [string, string]),
                ReportsService.getCashFlow(filter, ...dateParams as [string, string]),
                ReportsService.getRevenueByService(filter, ...dateParams as [string, string]),
                ReportsService.getExpensesBreakdown(filter, ...dateParams as [string, string]),
                ReportsService.getOutstandingPayments(),
                ReportsService.getTopCustomers()
            ]);

            setSummary(sum);
            setCashFlow(flow);
            setRevenue(rev);
            setExpenses(exp);
            setOutstanding(out);
            setTopCustomers(top);
        } catch (error) {
            console.error("Failed to load reports:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (session) {
            console.log("ReportsPage Session:", session);
            // Only fetch if not custom, or if custom has dates
            if (filter !== 'custom' || (startDate && endDate)) {
                fetchData();
            }
        }
    }, [session, filter, startDate, endDate]);

    if (!session) return <div>Access Denied</div>;

    return (
        <div className="space-y-8 p-4 md:p-8 bg-gray-50 min-h-screen">
            {/* Header & Filter */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Agency Reports</h1>
                    <p className="text-sm text-gray-500">Financial overview and performance metrics</p>
                </div>

                <div className="flex items-center gap-2 bg-white p-2 rounded-lg shadow-sm">
                    <select
                        className="border-none bg-transparent text-sm font-medium focus:ring-0"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="today">Today</option>
                        <option value="this_month">This Month</option>
                        <option value="last_30_days">Last 30 Days</option>
                        <option value="custom">Custom Range</option>
                    </select>

                    {filter === 'custom' && (
                        <div className="flex gap-2">
                            <input
                                type="date"
                                className="border rounded px-2 py-1 text-xs"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                            <span className="text-gray-400">-</span>
                            <input
                                type="date"
                                className="border rounded px-2 py-1 text-xs"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    )}

                    <button
                        onClick={fetchData}
                        className="p-1 hover:bg-gray-100 rounded-full"
                        title="Refresh"
                    >
                        🔄
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard title="Total Credit" value={summary?.totalCredit} color="green" />
                <KPICard title="Total Debit" value={summary?.totalDebit} color="red" />
                <KPICard title="Net Balance" value={summary?.netBalance} color="blue" />
                <KPICard title="Pending Amount" value={summary?.pendingAmount} color="orange" />
            </div>

            {/* Charts Section 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cash Flow Trend */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Cash Flow Trend</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={cashFlow}>
                                <defs>
                                    <linearGradient id="colorCredit" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorDebit" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} fontSize={12} tickMargin={10} />
                                <YAxis axisLine={false} tickLine={false} fontSize={12} />
                                <Tooltip />
                                <Legend />
                                <Area type="monotone" dataKey="Credit" stroke="#10B981" fillOpacity={1} fill="url(#colorCredit)" />
                                <Area type="monotone" dataKey="Debit" stroke="#EF4444" fillOpacity={1} fill="url(#colorDebit)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Revenue by Service */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Revenue by Service</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenue}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                                <YAxis axisLine={false} tickLine={false} fontSize={12} />
                                <Tooltip />
                                <Bar dataKey="value" fill="#6366F1" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Charts Section 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Expense Breakdown */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Expense Breakdown</h3>
                    <div className="h-[300px] flex justify-center">
                        {expenses.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={expenses}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {expenses.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center text-gray-400 h-full">No expense data</div>
                        )}
                    </div>
                </div>

                {/* Top Customers */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Top Customers</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b text-left text-gray-500">
                                    <th className="pb-2 font-medium">Customer</th>
                                    <th className="pb-2 font-medium text-right">Bookings</th>
                                    <th className="pb-2 font-medium text-right">Total Spend</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {topCustomers.map((cust, i) => (
                                    <tr key={i} className="hover:bg-gray-50">
                                        <td className="py-2 text-gray-900">{cust.name}</td>
                                        <td className="py-2 text-right text-gray-600">{cust.bookingCount}</td>
                                        <td className="py-2 text-right font-medium text-gray-900">
                                            Rs. {cust.totalSpend.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                                {topCustomers.length === 0 && (
                                    <tr><td colSpan={3} className="py-4 text-center text-gray-400">No data available</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Outstanding Payments Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-800">Outstanding Payments</h3>
                    <span className="text-xs text-gray-500">Latest 50 pending records</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Overdue</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 text-sm">
                            {outstanding.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{item.customerName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{item.bookingType}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900">Rs. {item.totalAmount.toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-red-600">Rs. {item.remainingAmount.toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-yellow-600 font-medium">{item.daysOverdue} Days</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <button className="text-indigo-600 hover:text-indigo-900 font-medium text-xs border border-indigo-200 px-2 py-1 rounded">
                                            Notify
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {outstanding.length === 0 && (
                                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">No outstanding payments found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// KPI Card Component
function KPICard({ title, value, color }: { title: string, value?: number, color: string }) {
    const formattedValue = value !== undefined ? `Rs. ${value.toLocaleString()}` : 'Loading...';

    // Color variants
    const colorClasses: { [key: string]: string } = {
        green: 'bg-green-50 text-green-700 border-green-100',
        red: 'bg-red-50 text-red-700 border-red-100',
        blue: 'bg-blue-50 text-blue-700 border-blue-100',
        orange: 'bg-orange-50 text-orange-700 border-orange-100',
    };

    const iconMap: { [key: string]: string } = {
        green: '💰',
        red: '💸',
        blue: '⚖️',
        orange: '⚠️',
    };

    return (
        <div className={`p-4 rounded-xl border shadow-sm flex items-start justify-between ${colorClasses[color] || 'bg-white'}`}>
            <div>
                <p className="text-sm font-medium opacity-80 mb-1">{title}</p>
                <h2 className="text-2xl font-bold tracking-tight">{formattedValue}</h2>
            </div>
            <div className="text-2xl opacity-50">
                {iconMap[color]}
            </div>
        </div>
    );
}
