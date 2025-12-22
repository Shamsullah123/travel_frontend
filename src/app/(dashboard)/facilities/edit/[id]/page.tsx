"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ApiClient } from "@/lib/api";
import { Facility, initialFacilityState, TransportRoute } from "@/types/facility";

export default function EditFacilityPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;
    const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);
    const [formData, setFormData] = useState<Facility>({ ...initialFacilityState } as Facility);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (id) {
            setResolvedParams({ id });
        }
    }, [id]);

    useEffect(() => {
        const fetchFacility = async (id: string) => {
            try {
                const data = await ApiClient.get<Facility>(`/facilities/${id}`);
                setFormData(prev => ({
                    ...prev,
                    ...data,
                    transport: {
                        ...data.transport,
                        routes: data.transport.routes || []
                    },
                    ziarat: {
                        ...data.ziarat,
                        major_ziarat: data.ziarat.major_ziarat || []
                    }
                }));
            } catch (err: any) {
                setError(err.message || "Failed to fetch facility details");
            } finally {
                setLoading(false);
            }
        };

        if (resolvedParams?.id) {
            fetchFacility(resolvedParams.id);
        }
    }, [resolvedParams]);

    const handleChange = (section: keyof Facility, field: string | null, value: any) => {
        setFormData(prev => {
            if (field === null) {
                return { ...prev, [section]: value };
            } else if (section === 'transport' && field === 'status') {
                if (value === 'Yes' && (!prev.transport.routes || prev.transport.routes.length === 0)) {
                    return {
                        ...prev,
                        transport: { status: 'Yes', routes: [{ transport_from: '', transport_to: '' }] }
                    };
                } else if (value === 'No') {
                    return {
                        ...prev,
                        transport: { status: 'No', routes: [] }
                    };
                }
                return { ...prev, transport: { ...prev.transport, status: value } };
            } else {
                return {
                    ...prev,
                    [section]: {
                        ...(prev[section] as any),
                        [field]: value
                    }
                };
            }
        });
    };

    const handleRouteChange = (index: number, field: keyof TransportRoute, value: string) => {
        setFormData(prev => {
            const newRoutes = [...prev.transport.routes];
            newRoutes[index] = { ...newRoutes[index], [field]: value };
            return {
                ...prev,
                transport: { ...prev.transport, routes: newRoutes }
            };
        });
    };

    const addRoute = () => {
        setFormData(prev => ({
            ...prev,
            transport: {
                ...prev.transport,
                routes: [...prev.transport.routes, { transport_from: '', transport_to: '' }]
            }
        }));
    };

    const removeRoute = (index: number) => {
        setFormData(prev => {
            const newRoutes = prev.transport.routes.filter((_, i) => i !== index);
            return {
                ...prev,
                transport: { ...prev.transport, routes: newRoutes }
            };
        });
    };

    const handleZiaratChange = (value: string, checked: boolean) => {
        setFormData(prev => {
            const currentZiarats = prev.ziarat.major_ziarat || [];
            const newZiarats = checked
                ? [...currentZiarats, value]
                : currentZiarats.filter(z => z !== value);

            return {
                ...prev,
                ziarat: { ...prev.ziarat, major_ziarat: newZiarats }
            };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");

        try {
            await ApiClient.put(`/facilities/${id}`, formData);
            router.push('/facilities');
        } catch (err: any) {
            setError(err.message || "Failed to update facility record");
        } finally {
            setSaving(false);
        }
    };

    const renderYesNo = (label: string, section: keyof Facility, nested: boolean = false) => (
        <div className="flex items-center justify-between py-4 border-b border-gray-100">
            <label className="text-sm font-medium text-gray-700">{label}</label>
            <div className="flex gap-4">
                <label className="inline-flex items-center">
                    <input
                        type="radio"
                        className="form-radio text-indigo-600"
                        name={section}
                        value="Yes"
                        checked={nested ? (formData[section] as any).status === 'Yes' : (formData as any)[section] === 'Yes'}
                        onChange={() => handleChange(section, nested ? 'status' : null, 'Yes')}
                    />
                    <span className="ml-2">Yes</span>
                </label>
                <label className="inline-flex items-center">
                    <input
                        type="radio"
                        className="form-radio text-gray-400"
                        name={section}
                        value="No"
                        checked={nested ? (formData[section] as any).status === 'No' : (formData as any)[section] === 'No'}
                        onChange={() => handleChange(section, nested ? 'status' : null, 'No')}
                    />
                    <span className="ml-2">No</span>
                </label>
            </div>
        </div>
    );

    if (loading) return <div className="p-6 text-center text-gray-500">Loading facility details...</div>;

    return (
        <div className="max-w-3xl mx-auto py-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Facility Record</h1>

            <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
                {error && (
                    <div className="p-4 bg-red-50 text-red-700 rounded-md">
                        {error}
                    </div>
                )}

                {/* Hotel */}
                {renderYesNo("Hotel", "hotel")}

                {/* Transport */}
                <div>
                    {renderYesNo("Transport", "transport", true)}
                    {formData.transport.status === 'Yes' && (
                        <div className="mt-4 bg-gray-50 p-4 rounded-md space-y-4">
                            {formData.transport.routes?.map((route, index) => (
                                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 relative pr-8">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">From</label>
                                        <input
                                            type="text"
                                            required
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                            value={route.transport_from || ''}
                                            onChange={(e) => handleRouteChange(index, 'transport_from', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">To</label>
                                        <input
                                            type="text"
                                            required
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                            value={route.transport_to || ''}
                                            onChange={(e) => handleRouteChange(index, 'transport_to', e.target.value)}
                                        />
                                    </div>
                                    {formData.transport.routes.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeRoute(index)}
                                            className="absolute right-0 top-8 text-red-500 hover:text-red-700 text-sm font-bold"
                                        >
                                            X
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={addRoute}
                                className="mt-2 text-indigo-600 text-sm font-medium hover:text-indigo-800"
                            >
                                + Add Route
                            </button>
                        </div>
                    )}
                </div>

                {/* Visa */}
                {renderYesNo("Visa", "visa")}

                {/* Ticket */}
                <div>
                    {renderYesNo("Ticket", "ticket", true)}
                    {formData.ticket.status === 'Yes' && (
                        <div className="mt-4 bg-gray-50 p-4 rounded-md">
                            <label className="block text-sm font-medium text-gray-700">Ticket Type</label>
                            <select
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                value={formData.ticket.ticket_type || 'Direct'}
                                onChange={(e) => handleChange('ticket', 'ticket_type', e.target.value)}
                            >
                                <option value="Direct">Direct</option>
                                <option value="Indirect">Indirect</option>
                            </select>
                        </div>
                    )}
                </div>

                {/* Food */}
                {renderYesNo("Food", "food")}

                {/* Ziarat */}
                <div>
                    {renderYesNo("Ziarat", "ziarat", true)}
                    {formData.ziarat.status === 'Yes' && (
                        <div className="mt-4 bg-gray-50 p-4 rounded-md space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Major Ziarat</label>
                                <div className="flex gap-4">
                                    {['Taif', 'Badar', 'Juranah'].map(place => (
                                        <label key={place} className="inline-flex items-center">
                                            <input
                                                type="checkbox"
                                                className="form-checkbox text-indigo-600"
                                                checked={formData.ziarat.major_ziarat?.includes(place)}
                                                onChange={(e) => handleZiaratChange(place, e.target.checked)}
                                            />
                                            <span className="ml-2">{place}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Ziarat Count</label>
                                <input
                                    type="number"
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={formData.ziarat.ziarat_count || ''}
                                    onChange={(e) => handleChange('ziarat', 'ziarat_count', parseInt(e.target.value) || 0)}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Moaleem */}
                <div>
                    {renderYesNo("Moaleem", "moaleem", true)}
                    {formData.moaleem.status === 'Yes' && (
                        <div className="mt-4 grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-md">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Name</label>
                                <input
                                    type="text"
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={formData.moaleem.moaleem_name || ''}
                                    onChange={(e) => handleChange('moaleem', 'moaleem_name', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Contact</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Pakistani Number Format"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    value={formData.moaleem.moaleem_contact || ''}
                                    onChange={(e) => handleChange('moaleem', 'moaleem_contact', e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Medical */}
                {renderYesNo("Medical", "medical")}

                {/* Umrahs */}
                <div>
                    {renderYesNo("Umrahs", "umrahs", true)}
                    {formData.umrahs.status === 'Yes' && (
                        <div className="mt-4 bg-gray-50 p-4 rounded-md">
                            <label className="block text-sm font-medium text-gray-700">Umrahs Count</label>
                            <input
                                type="number"
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                value={formData.umrahs.umrahs_count || 0}
                                onChange={(e) => handleChange('umrahs', 'umrahs_count', parseInt(e.target.value))}
                            />
                        </div>
                    )}
                </div>

                <div className="flex justify-end pt-6">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="mr-4 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Update Facility Record'}
                    </button>
                </div>
            </form>
        </div>
    );
}
