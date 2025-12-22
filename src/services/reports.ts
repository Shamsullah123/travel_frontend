import { ApiClient } from '@/lib/api';

export interface ReportSummary {
    totalCredit: number;
    totalDebit: number;
    netBalance: number;
    pendingAmount: number;
}

export interface CashFlowData {
    date: string;
    Credit: number;
    Debit: number;
}

export interface RevenueData {
    name: string;
    value: number;
    [key: string]: any;
}

export interface OutstandingPayment {
    id: string;
    customerName: string;
    bookingType: string;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    daysOverdue: number;
}

export interface TopCustomer {
    name: string;
    totalSpend: number;
    bookingCount: number;
    outstandingBalance: number;
}

export const ReportsService = {
    getSummary: async (filter: string = 'this_month', startDate?: string, endDate?: string) => {
        let qs = `filter=${filter}`;
        if (startDate && endDate) qs += `&startDate=${startDate}&endDate=${endDate}`;
        // ApiClient.get goes to Flask (port 5000) by default which is correct for /api/agency/reports
        return ApiClient.get<ReportSummary>(`/agency/reports/summary?${qs}`);
    },

    getCashFlow: async (filter: string = 'this_month', startDate?: string, endDate?: string) => {
        let qs = `filter=${filter}`;
        if (startDate && endDate) qs += `&startDate=${startDate}&endDate=${endDate}`;
        return ApiClient.get<CashFlowData[]>(`/agency/reports/cash-flow?${qs}`);
    },

    getRevenueByService: async (filter: string = 'this_month', startDate?: string, endDate?: string) => {
        let qs = `filter=${filter}`;
        if (startDate && endDate) qs += `&startDate=${startDate}&endDate=${endDate}`;
        return ApiClient.get<RevenueData[]>(`/agency/reports/revenue-by-service?${qs}`);
    },

    getOutstandingPayments: async () => {
        return ApiClient.get<OutstandingPayment[]>('/agency/reports/outstanding-payments');
    },

    getTopCustomers: async () => {
        return ApiClient.get<TopCustomer[]>('/agency/reports/top-customers');
    },

    getExpensesBreakdown: async (filter: string = 'this_month', startDate?: string, endDate?: string) => {
        let qs = `filter=${filter}`;
        if (startDate && endDate) qs += `&startDate=${startDate}&endDate=${endDate}`;
        return ApiClient.get<RevenueData[]>(`/agency/reports/expenses-breakdown?${qs}`); // Reuse RevenueData shape (name, value)
    }
};
