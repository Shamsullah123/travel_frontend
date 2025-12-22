"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiClient } from "@/lib/api";

interface FinancialSummary {
    total_credit: number;
    total_debit: number;
    net_balance: number;
    status: 'positive' | 'negative';
}

type DateRange = 'month' | 'year' | 'all';

export default function FinancialSummaryWidget() {
    const router = useRouter();
    const [summary, setSummary] = useState<FinancialSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<DateRange>('month');

    useEffect(() => {
        fetchSummary();
    }, [dateRange]);

    const getDateRangeParams = () => {
        const now = new Date();
        let start_date: string | undefined;
        let end_date: string | undefined;

        if (dateRange === 'month') {
            // First day of current month
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            start_date = firstDay.toISOString();
            end_date = now.toISOString();
        } else if (dateRange === 'year') {
            // First day of current year
            const firstDay = new Date(now.getFullYear(), 0, 1);
            start_date = firstDay.toISOString();
            end_date = now.toISOString();
        }
        // For 'all', don't set any date filters

        return { start_date, end_date };
    };

    const fetchSummary = async () => {
        try {
            setLoading(true);
            setError(null);
            const { start_date, end_date } = getDateRangeParams();

            const params = new URLSearchParams();
            if (start_date) params.append('start_date', start_date);
            if (end_date) params.append('end_date', end_date);

            const queryString = params.toString();
            const url = `/agency/financial-summary${queryString ? `?${queryString}` : ''}`;

            const data = await ApiClient.get<FinancialSummary>(url);
            setSummary(data);
        } catch (err: any) {
            console.error('Failed to fetch financial summary:', err);
            setError(err.message || 'Failed to load financial data');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount).replace('PKR', 'Rs.');
    };

    const handleClick = () => {
        router.push('/accounting');
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-24 bg-gray-100 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={fetchSummary}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!summary) return null;

    const getDateRangeLabel = () => {
        if (dateRange === 'month') return 'This Month';
        if (dateRange === 'year') return 'This Year';
        return 'All Time';
    };

    return (
        <div
            className="bg-gradient-to-br from-white to-gray-50 rounded-lg shadow-md p-6 border border-gray-200"
        >
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Financial Summary</h2>
                    <p className="text-sm text-gray-500 mt-1">{getDateRangeLabel()}</p>
                </div>
                <div className="flex items-center space-x-3">
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value as DateRange)}
                        className="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="month">This Month</option>
                        <option value="year">This Year</option>
                        <option value="all">All Time</option>
                    </select>
                    <button
                        onClick={() => router.push('/accounting')}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="View detailed accounting"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Total Credit */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-green-800">Total Credit</span>
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </div>
                    <p className="text-2xl font-bold text-green-900">
                        {formatCurrency(summary.total_credit)}
                    </p>
                    <p className="text-xs text-green-700 mt-1">Customer Payments</p>
                </div>

                {/* Total Debit */}
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-red-800">Total Debit</span>
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                    </div>
                    <p className="text-2xl font-bold text-red-900">
                        {formatCurrency(summary.total_debit)}
                    </p>
                    <p className="text-xs text-red-700 mt-1">Payments & Expenses</p>
                </div>

                {/* Net Balance */}
                <div className={`bg-gradient-to-br ${summary.status === 'positive'
                    ? 'from-blue-50 to-blue-100 border-blue-200'
                    : 'from-orange-50 to-orange-100 border-orange-200'
                    } rounded-lg p-4 border`}>
                    <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium ${summary.status === 'positive' ? 'text-blue-800' : 'text-orange-800'
                            }`}>
                            Net Balance
                        </span>
                        {summary.status === 'positive' ? (
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                        )}
                    </div>
                    <p className={`text-2xl font-bold ${summary.status === 'positive' ? 'text-blue-900' : 'text-orange-900'
                        }`}>
                        {formatCurrency(summary.net_balance)}
                    </p>
                    <p className={`text-xs mt-1 ${summary.status === 'positive' ? 'text-blue-700' : 'text-orange-700'
                        }`}>
                        {summary.status === 'positive' ? 'Surplus' : 'Deficit'}
                    </p>
                </div>
            </div>
        </div>
    );
}
