"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ApiClient } from "@/lib/api";

export default function NewPackagePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [facilities, setFacilities] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        name: "",
        facilityId: "",
        description: "",
        startDate: "",
        endDate: "",
        duration: "",
        sharingPrice: "",
        fourBedPrice: "",
        threeBedPrice: "",
        twoBedPrice: "",
    });

    useEffect(() => {
        fetchFacilities();
    }, []);

    const fetchFacilities = async () => {
        try {
            const data = await ApiClient.get("/facilities");
            setFacilities(data);
        } catch (error) {
            console.error("Failed to fetch facilities:", error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await ApiClient.post("/packages", formData);
            router.push("/packages");
        } catch (error: any) {
            alert(error.message || "Failed to create package");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-6">
            <h1 className="text-2xl font-bold mb-6">Create New Package</h1>
            <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Package Name</label>
                        <input
                            type="text"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Facility (for Moaleem Info)</label>
                        <select
                            name="facilityId"
                            value={formData.facilityId}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                            <option value="">-- Select Facility (Optional) --</option>
                            {facilities.map((facility) => (
                                <option key={facility._id} value={facility._id}>
                                    {facility.moaleem?.moaleem_name || 'Unnamed Facility'} - {facility.moaleem?.moaleem_contact || 'No Contact'}
                                </option>
                            ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500">Select a facility to link Moaleem information to this package</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            name="description"
                            rows={3}
                            value={formData.description}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Duration (Days)</label>
                            <input
                                type="text" // Kept as text to allow "14 Days" etc, backend stores as String
                                name="duration"
                                value={formData.duration}
                                onChange={handleChange}
                                placeholder="e.g. 14 Days"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Start Date</label>
                            <input
                                type="date"
                                name="startDate"
                                value={formData.startDate}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">End Date</label>
                            <input
                                type="date"
                                name="endDate"
                                value={formData.endDate}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                    </div>

                    <div className="border-t border-gray-200 pt-6">
                        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Pricing</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Sharing Price</label>
                                <input
                                    type="number"
                                    name="sharingPrice"
                                    value={formData.sharingPrice}
                                    onChange={handleChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">4 Bed Price</label>
                                <input
                                    type="number"
                                    name="fourBedPrice"
                                    value={formData.fourBedPrice}
                                    onChange={handleChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">3 Bed Price</label>
                                <input
                                    type="number"
                                    name="threeBedPrice"
                                    value={formData.threeBedPrice}
                                    onChange={handleChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">2 Bed Price</label>
                                <input
                                    type="number"
                                    name="twoBedPrice"
                                    value={formData.twoBedPrice}
                                    onChange={handleChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-6">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:opacity-50"
                        >
                            {loading ? "Creating..." : "Create Package"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
