"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ApiClient } from "@/lib/api";

export default function EditCustomerPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        fullName: "",
        phone: "",
        gender: "Male",
        passportNumber: "",
        passportIssueDate: "",
        passportExpiry: "",
        cnic: "",
        finger_print: "No",
        enrollment_id: "",
        address: "",
        customer_photo: null as File | null,
        passport_attachment: null as File | null,
    });

    useEffect(() => {
        const fetchCustomer = async () => {
            if (!id) return;
            try {
                const data = await ApiClient.get<any>(`/customers/${id}`);
                setFormData({
                    fullName: data.fullName || "",
                    phone: data.phone || "",
                    gender: data.gender || "Male",
                    passportNumber: data.passportNumber || "",
                    passportIssueDate: data.passportIssueDate && !isNaN(Date.parse(data.passportIssueDate)) ? new Date(data.passportIssueDate).toISOString().split('T')[0] : "",
                    passportExpiry: data.passportExpiry && !isNaN(Date.parse(data.passportExpiry)) ? new Date(data.passportExpiry).toISOString().split('T')[0] : "",
                    cnic: data.cnic || "",
                    finger_print: data.finger_print || "No",
                    enrollment_id: data.enrollment_id || "",
                    address: data.address || "",
                    customer_photo: null,
                    passport_attachment: null,
                });
            } catch (e: any) {
                setError("Failed to load customer");
                console.error(e);
            } finally {
                setInitialLoading(false);
            }
        };
        fetchCustomer();
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFormData({ ...formData, [e.target.name]: e.target.files[0] });
        }
    };



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const data = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                if (value !== null && value !== "") {
                    data.append(key, value);
                }
            });

            await ApiClient.put(`/customers/${id}`, data);
            router.push("/customers");
            router.refresh();
        } catch (err: any) {
            setError(err.message || "Failed to update customer");
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) return <div className="p-6">Loading...</div>;

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate">
                    Edit Customer
                </h2>
                <Link
                    href="/customers"
                    className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                    &larr; Back to List
                </Link>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:p-6">
                    {error && (
                        <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                            <div className="sm:col-span-3">
                                <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                                <div className="mt-1">
                                    <input
                                        type="text"
                                        name="fullName"
                                        required
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2.5 border"
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-3">
                                <label className="block text-sm font-medium text-gray-700">Mobile Number *</label>
                                <div className="mt-1">
                                    <input
                                        type="text"
                                        name="phone"
                                        required
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2.5 border"
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-3">
                                <label className="block text-sm font-medium text-gray-700">Gender</label>
                                <div className="mt-1">
                                    <select
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2.5 border"
                                    >
                                        <option>Male</option>
                                        <option>Female</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className="sm:col-span-3">
                                <label className="block text-sm font-medium text-gray-700">CNIC</label>
                                <div className="mt-1">
                                    <input
                                        type="text"
                                        name="cnic"
                                        value={formData.cnic}
                                        onChange={handleChange}
                                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2.5 border"
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-3">
                                <label className="block text-sm font-medium text-gray-700">Finger Print</label>
                                <div className="mt-1">
                                    <select
                                        name="finger_print"
                                        value={formData.finger_print}
                                        onChange={handleChange}
                                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2.5 border"
                                    >
                                        <option>Yes</option>
                                        <option>No</option>
                                    </select>
                                </div>
                            </div>

                            {formData.finger_print === 'Yes' && (
                                <div className="sm:col-span-3">
                                    <label className="block text-sm font-medium text-gray-700">Enrollment ID</label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            name="enrollment_id"
                                            value={formData.enrollment_id}
                                            onChange={handleChange}
                                            required
                                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2.5 border"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="sm:col-span-3">
                                <label className="block text-sm font-medium text-gray-700">Customer Photo</label>
                                <div className="mt-1">
                                    <input
                                        type="file"
                                        name="customer_photo"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">Leave empty to keep existing.</p>
                                </div>
                            </div>

                            <div className="col-span-1 sm:col-span-6 border-t border-gray-200 pt-5 mt-2">
                                <h3 className="text-lg font-medium text-gray-900">Passport Details</h3>
                            </div>

                            <div className="sm:col-span-3">
                                <label className="block text-sm font-medium text-gray-700">Passport Number</label>
                                <div className="mt-1">
                                    <input
                                        type="text"
                                        name="passportNumber"
                                        value={formData.passportNumber}
                                        onChange={handleChange}
                                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2.5 border"
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-3">
                                <label className="block text-sm font-medium text-gray-700">Passport Issue Date</label>
                                <div className="mt-1">
                                    <input
                                        type="date"
                                        name="passportIssueDate"
                                        value={formData.passportIssueDate}
                                        onChange={handleChange}
                                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2.5 border"
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-3">
                                <label className="block text-sm font-medium text-gray-700">Passport Expiry</label>
                                <div className="mt-1">
                                    <input
                                        type="date"
                                        name="passportExpiry"
                                        value={formData.passportExpiry}
                                        onChange={handleChange}
                                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2.5 border"
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-3">
                                <label className="block text-sm font-medium text-gray-700">Passport Attachment</label>
                                <div className="mt-1">
                                    <input
                                        type="file"
                                        name="passport_attachment"
                                        accept="image/*,application/pdf"
                                        onChange={handleFileChange}
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">Leave empty to keep existing.</p>
                                </div>
                            </div>

                            <div className="col-span-1 sm:col-span-6">
                                <label className="block text-sm font-medium text-gray-700">Address</label>
                                <div className="mt-1">
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2.5 border"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:gap-0 mt-6 pt-4 border-t sm:border-t-0">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="w-full sm:w-auto bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full sm:w-auto sm:ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                {loading ? "Saving..." : "Update Customer"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
