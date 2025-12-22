"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiClient } from "@/lib/api";
import { Facility } from "@/types/facility";

export default function FacilitiesPage() {
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchFacilities = async () => {
        setLoading(true);
        try {
            const data = await ApiClient.get<Facility[]>('/facilities');
            setFacilities(data);
        } catch (error) {
            console.error("Failed to fetch facilities:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFacilities();
    }, []);

    const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const safeId = (facility: any) => {
        if (!facility._id) return "";
        return typeof facility._id === 'object' && facility._id.$oid ? facility._id.$oid : facility._id;
    };

    const confirmDelete = (id: string) => {
        setDeleteId(id);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await ApiClient.del(`/facilities/${deleteId}`);
            setDeleteId(null);
            fetchFacilities();
        } catch (e: any) {
            alert(e.message || "Failed to delete facility");
        }
    };

    return (
        <div className="space-y-6">
            <div className="md:flex md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                        Facilities
                    </h2>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4">
                    <Link
                        href="/facilities/new"
                        className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                    >
                        Add Facility Record
                    </Link>
                </div>
            </div>

            <div className="bg-white shadow overflow-x-auto sm:rounded-md border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active Services</th>
                            <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan={3} className="px-6 py-10 text-center text-gray-500">Loading facilities...</td>
                            </tr>
                        ) : facilities.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-6 py-10 text-center text-gray-500">No facilities records found.</td>
                            </tr>
                        ) : (
                            facilities.map((facility) => {
                                const id = safeId(facility);
                                const activeServices = [
                                    facility.hotel === 'Yes' ? 'Hotel' : null,
                                    facility.transport?.status === 'Yes' ? 'Transport' : null,
                                    facility.visa === 'Yes' ? 'Visa' : null,
                                    facility.ticket?.status === 'Yes' ? 'Ticket' : null,
                                    facility.food === 'Yes' ? 'Food' : null,
                                    facility.ziarat?.status === 'Yes' ? 'Ziarat' : null,
                                    facility.moaleem?.status === 'Yes' ? 'Moaleem' : null,
                                    facility.medical === 'Yes' ? 'Medical' : null,
                                    facility.umrahs?.status === 'Yes' ? 'Umrahs' : null,
                                ].filter(Boolean).join(', ');

                                return (
                                    <tr key={id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {facility.createdAt ? new Date(facility.createdAt).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {activeServices || 'None'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => setSelectedFacility(facility)}
                                                    className="text-blue-600 hover:text-blue-900 border border-blue-200 px-2 py-1 rounded bg-blue-50"
                                                >
                                                    View
                                                </button>
                                                <Link href={`/facilities/edit/${id}`} className="text-indigo-600 hover:text-indigo-900 border border-indigo-200 px-2 py-1 rounded bg-indigo-50">Edit</Link>
                                                <button onClick={() => confirmDelete(id)} className="text-red-600 hover:text-red-900 border border-red-200 px-2 py-1 rounded bg-red-50">Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* View Details Modal */}
            {selectedFacility && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setSelectedFacility(null)}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="relative z-50 inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                            <div>
                                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4" id="modal-title">
                                    Facility Details
                                </h3>
                                <div className="space-y-3 text-sm">
                                    <DetailRow label="Hotel" value={selectedFacility.hotel} />

                                    <DetailSection title="Transport" status={selectedFacility.transport?.status}>
                                        {selectedFacility.transport?.routes?.map((r, i) => (
                                            <div key={i} className="ml-2 text-gray-600">
                                                • {r.transport_from} → {r.transport_to}
                                            </div>
                                        ))}
                                    </DetailSection>

                                    <DetailRow label="Visa" value={selectedFacility.visa} />

                                    <DetailSection title="Ticket" status={selectedFacility.ticket?.status}>
                                        <div className="ml-2 text-gray-600">Type: {selectedFacility.ticket?.ticket_type}</div>
                                    </DetailSection>

                                    <DetailRow label="Food" value={selectedFacility.food} />

                                    <DetailSection title="Ziarat" status={selectedFacility.ziarat?.status}>
                                        <div className="ml-2 text-gray-600">Count: {selectedFacility.ziarat?.ziarat_count}</div>
                                        <div className="ml-2 text-gray-600">Places: {selectedFacility.ziarat?.major_ziarat?.join(', ')}</div>
                                    </DetailSection>

                                    <DetailSection title="Moaleem" status={selectedFacility.moaleem?.status}>
                                        <div className="ml-2 text-gray-600">Name: {selectedFacility.moaleem?.moaleem_name}</div>
                                        <div className="ml-2 text-gray-600">Contact: {selectedFacility.moaleem?.moaleem_contact}</div>
                                    </DetailSection>

                                    <DetailRow label="Medical" value={selectedFacility.medical} />

                                    <DetailSection title="Umrahs" status={selectedFacility.umrahs?.status}>
                                        <div className="ml-2 text-gray-600">Count: {selectedFacility.umrahs?.umrahs_count}</div>
                                    </DetailSection>
                                </div>
                            </div>
                            <div className="mt-5 sm:mt-6">
                                <button
                                    type="button"
                                    className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none sm:text-sm"
                                    onClick={() => setSelectedFacility(null)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                                        Delete Facility
                                    </h3>
                                    <div className="mt-2">
                                        <p className="text-sm text-gray-500">
                                            Are you sure you want to delete this facility record? This action cannot be undone.
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

const DetailRow = ({ label, value }: { label: string, value: string }) => (
    <div className="flex justify-between border-b border-gray-100 py-2">
        <span className="font-medium text-gray-700">{label}</span>
        <span className={`${value === 'Yes' ? 'text-green-600 font-bold' : 'text-gray-500'}`}>{value}</span>
    </div>
);

const DetailSection = ({ title, status, children }: { title: string, status?: string, children: React.ReactNode }) => (
    <div className="border-b border-gray-100 py-2">
        <div className="flex justify-between">
            <span className="font-medium text-gray-700">{title}</span>
            <span className={`${status === 'Yes' ? 'text-green-600 font-bold' : 'text-gray-500'}`}>{status || 'No'}</span>
        </div>
        {status === 'Yes' && (
            <div className="mt-1 bg-gray-50 p-2 rounded">
                {children}
            </div>
        )}
    </div>
);
