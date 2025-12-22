"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiClient } from "@/lib/api";
import { Package } from "@/types/package";

export default function PackagesPage() {
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editFormData, setEditFormData] = useState<Partial<Package>>({});

    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const fetchPackages = async () => {
        setLoading(true);
        try {
            const data = await ApiClient.get<Package[]>(`/packages?search=${search}`);
            setPackages(data);
        } catch (error) {
            console.error("Failed to fetch packages:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPackages();
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchPackages();
    };

    const confirmDelete = (id: string) => {
        setDeleteConfirmId(id);
    };

    const handleDelete = async () => {
        if (!deleteConfirmId) return;
        try {
            await ApiClient.delete(`/packages/${deleteConfirmId}`);
            fetchPackages();
        } catch (e: any) {
            alert(e.message || "Failed to delete package");
        } finally {
            setDeleteConfirmId(null);
        }
    };

    const startEditing = (pkg: Package) => {
        const id = typeof pkg._id === 'object' && (pkg._id as any).$oid ? (pkg._id as any).$oid : pkg._id;
        setEditingId(id);
        setEditFormData({
            ...pkg,
            startDate: pkg.startDate ? new Date(pkg.startDate).toISOString().split('T')[0] : "",
            endDate: pkg.endDate ? new Date(pkg.endDate).toISOString().split('T')[0] : ""
        });
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditFormData({});
    };

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({ ...prev, [name]: value }));
    };

    const saveEdit = async () => {
        if (!editingId) return;

        try {
            await ApiClient.put(`/packages/${editingId}`, editFormData);
            setEditingId(null);
            setEditFormData({});
            fetchPackages(); // Refresh to show updated data
        } catch (e: any) {
            alert(e.message || "Failed to update package");
        }
    };

    return (
        <div className="space-y-6">
            <div className="md:flex md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                        Packages
                    </h2>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4">
                    <Link
                        href="/packages/new"
                        className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                    >
                        Add Package
                    </Link>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <form onSubmit={handleSearch} className="flex gap-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Search packages..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="px-6 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors">
                        Search
                    </button>
                    {search && (
                        <button
                            type="button"
                            onClick={() => { setSearch(""); fetchPackages(); }}
                            className="px-6 py-2 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-colors"
                        >
                            Clear
                        </button>
                    )}
                </form>
            </div>

            {/* Table */}
            <div className="bg-white shadow overflow-x-auto sm:rounded-md border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sharing</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">4 Bed</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">3 Bed</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">2 Bed</th>
                            <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan={9} className="px-6 py-10 text-center text-gray-500">Loading packages...</td>
                            </tr>
                        ) : packages.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="px-6 py-10 text-center text-gray-500">No packages found. Add one to get started.</td>
                            </tr>
                        ) : (
                            packages.map((pkg) => {
                                const id = typeof pkg._id === 'object' && (pkg._id as any).$oid ? (pkg._id as any).$oid : pkg._id;
                                const isEditing = editingId === id;

                                return (
                                    <tr key={id} className={isEditing ? "bg-yellow-50" : "hover:bg-gray-50"}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={editFormData.name || ""}
                                                    onChange={handleEditChange}
                                                    className="border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border p-1"
                                                />
                                            ) : pkg.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    name="duration"
                                                    value={editFormData.duration || ""}
                                                    onChange={handleEditChange}
                                                    className="border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border p-1"
                                                />
                                            ) : pkg.duration}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {isEditing ? (
                                                <input
                                                    type="date"
                                                    name="startDate"
                                                    value={editFormData.startDate || ""}
                                                    onChange={handleEditChange}
                                                    className="border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border p-1"
                                                />
                                            ) : pkg.startDate ? new Date(pkg.startDate).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {isEditing ? (
                                                <input
                                                    type="date"
                                                    name="endDate"
                                                    value={editFormData.endDate || ""}
                                                    onChange={handleEditChange}
                                                    className="border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border p-1"
                                                />
                                            ) : pkg.endDate ? new Date(pkg.endDate).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {isEditing ? (
                                                <input
                                                    type="number"
                                                    name="sharingPrice"
                                                    value={editFormData.sharingPrice || ""}
                                                    onChange={handleEditChange}
                                                    className="border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-24 sm:text-sm border p-1"
                                                />
                                            ) : pkg.sharingPrice}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {isEditing ? (
                                                <input
                                                    type="number"
                                                    name="fourBedPrice"
                                                    value={editFormData.fourBedPrice || ""}
                                                    onChange={handleEditChange}
                                                    className="border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-24 sm:text-sm border p-1"
                                                />
                                            ) : pkg.fourBedPrice}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {isEditing ? (
                                                <input
                                                    type="number"
                                                    name="threeBedPrice"
                                                    value={editFormData.threeBedPrice || ""}
                                                    onChange={handleEditChange}
                                                    className="border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-24 sm:text-sm border p-1"
                                                />
                                            ) : pkg.threeBedPrice}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {isEditing ? (
                                                <input
                                                    type="number"
                                                    name="twoBedPrice"
                                                    value={editFormData.twoBedPrice || ""}
                                                    onChange={handleEditChange}
                                                    className="border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-24 sm:text-sm border p-1"
                                                />
                                            ) : pkg.twoBedPrice}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {isEditing ? (
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={saveEdit} className="text-green-600 hover:text-green-900 border border-green-200 px-2 py-1 rounded bg-green-50">Save</button>
                                                    <button onClick={cancelEditing} className="text-gray-600 hover:text-gray-900 border border-gray-200 px-2 py-1 rounded bg-gray-50">Cancel</button>
                                                </div>
                                            ) : (
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => startEditing(pkg)} className="text-indigo-600 hover:text-indigo-900 border border-indigo-200 px-2 py-1 rounded bg-indigo-50">Edit</button>
                                                    <button onClick={() => confirmDelete(id)} className="text-red-600 hover:text-red-900 border border-red-200 px-2 py-1 rounded bg-red-50">Delete</button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirmId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg p-6 shadow-xl max-w-sm w-full mx-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm Delete</h3>
                        <p className="text-gray-600 mb-6">Are you sure you want to delete this package? This action cannot be undone.</p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
