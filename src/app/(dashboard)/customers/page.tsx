"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { ApiClient } from "@/lib/api";
import { Package } from "@/types/package";

interface Customer {
    _id: string | { $oid: string };
    fullName: string;
    phone: string;
    passportNumber?: string;
    passportExpiry?: string;
    cnic?: string;
    dob?: string;
    address?: string;
    gender?: string;
    notes?: string;
    customer_photo?: string;
    passport_attachment?: string;
    bookingStatus?: string; // 'Confirmed', etc. or null
    createdAt: string;
}



const getCustomerId = (c: Customer) => {
    if (typeof c._id === 'object' && c._id) {
        return (c._id as any).$oid;
    }
    return c._id as string;
};

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const data = await ApiClient.get<Customer[]>(`/customers?search=${search}`);
            setCustomers(data);
        } catch (error) {
            console.error("Failed to fetch customers:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const [deleteId, setDeleteId] = useState<string | null>(null);

    const confirmDelete = (id: string) => {
        setDeleteId(id);
    };

    const filteredCustomers = customers.filter(c =>
        c.fullName.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search) ||
        (c.passportNumber && c.passportNumber.includes(search)) ||
        (c.cnic && c.cnic.includes(search))
    );

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await ApiClient.delete(`/customers/${deleteId}`);
            setDeleteId(null);
            fetchCustomers();
        } catch (e: any) {
            alert(e.message || "Failed to delete customer");
        }
    };

    const renderAttachment = (path?: string, label: string = "View") => {
        if (!path) return null;
        return (
            <a
                href={ApiClient.getFileUrl(path) || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-900 ml-2"
                title={label}
            >
                📎
            </a>
        );
    };

    return (
        <div className="space-y-6">
            <div className="md:flex md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                        Customers
                    </h2>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4">
                    <Link
                        href="/customers/new"
                        className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Add Customer
                    </Link>
                </div>
            </div>

            {/* Search Bar */}
            <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder="Search customers..."
                        className="w-full sm:w-64 border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <span className="absolute right-3 top-2.5 text-gray-400">🔍</span>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CNIC</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Passport</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered On</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-10 text-center text-gray-500">Loading customers...</td>
                            </tr>
                        ) : filteredCustomers.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-10 text-center text-gray-500">No customers found.</td>
                            </tr>
                        ) : (
                            filteredCustomers.map((customer) => (
                                <tr key={getCustomerId(customer)} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {customer.fullName}
                                        {customer.notes && <div className="text-xs text-gray-400 truncate max-w-xs" title={customer.notes}>{customer.notes}</div>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {customer.phone}
                                        {customer.address && <div className="text-xs text-gray-400 truncate max-w-xs">{customer.address}</div>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="flex items-center">
                                            {customer.cnic || '-'}
                                            {renderAttachment(customer.customer_photo, "View Photo")}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="flex items-center">
                                            <div className="flex flex-col">
                                                <span>{customer.passportNumber || '-'}</span>
                                                {customer.passportExpiry && <span className="text-xs text-gray-400">Exp: {new Date(customer.passportExpiry).toLocaleDateString()}</span>}
                                            </div>
                                            {renderAttachment(customer.passport_attachment, "View Passport")}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(customer.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Link href={`/customers/edit/${getCustomerId(customer)}`} className="text-indigo-600 hover:text-indigo-900 mr-4">
                                            Edit
                                        </Link>
                                        <button
                                            onClick={() => confirmDelete(getCustomerId(customer))}
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

            {/* Delete Confirmation Modal */}
            {deleteId && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setDeleteId(null)}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="relative z-50 inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                            <div className="sm:flex sm:items-start">
                                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                        Delete Customer
                                    </h3>
                                    <div className="mt-2">
                                        <p className="text-sm text-gray-500">
                                            Are you sure you want to delete this customer? This action cannot be undone.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={handleDelete}
                                >
                                    Delete
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
                                    onClick={() => setDeleteId(null)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
