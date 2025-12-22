"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { ApiClient } from '@/lib/api';

interface CreateVisaGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateVisaGroupModal({ isOpen, onClose, onSuccess }: CreateVisaGroupModalProps) {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

    const onSubmit = async (data: any) => {
        // Manual check for NaNs if hook form misses it
        const numericFields = ['processing_time_days', 'visa_validity_days', 'stay_duration_days', 'total_visas', 'price_per_visa'];
        for (const field of numericFields) {
            if (isNaN(data[field])) {
                alert(`Please enter a valid number for ${field.replace(/_/g, ' ')}`);
                return;
            }
        }

        try {
            console.log("Submitting Visa Group:", data);
            await ApiClient.postInternal('/visa-groups', data);
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error(error);
            alert(error.message || "Failed to create visa group");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-bold">Add Visa Group</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 font-bold text-xl">&times;</button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Title */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-1">Visa Title *</label>
                            <input
                                {...register("visa_title", { required: "Title is required" })}
                                className={`w-full border p-2 rounded ${errors.visa_title ? 'border-red-500' : ''}`}
                                placeholder="e.g. UAE 30 Days Tourist"
                            />
                            {errors.visa_title && <span className="text-red-500 text-xs">{(errors.visa_title as any).message}</span>}
                        </div>

                        {/* Country */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Country *</label>
                            <input
                                {...register("country", { required: "Country is required" })}
                                className={`w-full border p-2 rounded ${errors.country ? 'border-red-500' : ''}`}
                                placeholder="e.g. UAE"
                            />
                            {errors.country && <span className="text-red-500 text-xs">{(errors.country as any).message}</span>}
                        </div>

                        {/* Type */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Visa Type *</label>
                            <select {...register("visa_type", { required: "Type is required" })} className="w-full border p-2 rounded">
                                <option value="Visit">Visit</option>
                                <option value="Work">Work</option>
                                <option value="Umrah">Umrah</option>
                                <option value="Business">Business</option>
                                <option value="Family">Family</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        {/* Entry Type */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Entry Type *</label>
                            <select {...register("entry_type", { required: "Entry Type is required" })} className="w-full border p-2 rounded">
                                <option value="Single">Single Entry</option>
                                <option value="Multiple">Multiple Entry</option>
                            </select>
                        </div>

                        {/* Days Info */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Processing Days *</label>
                            <input
                                type="number"
                                {...register("processing_time_days", { valueAsNumber: true, required: "Required", min: 0 })}
                                className={`w-full border p-2 rounded ${errors.processing_time_days ? 'border-red-500' : ''}`}
                            />
                            {errors.processing_time_days && <span className="text-red-500 text-xs">Required</span>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Visa Validity (Days) *</label>
                            <input
                                type="number"
                                {...register("visa_validity_days", { valueAsNumber: true, required: "Required", min: 0 })}
                                className={`w-full border p-2 rounded ${errors.visa_validity_days ? 'border-red-500' : ''}`}
                            />
                            {errors.visa_validity_days && <span className="text-red-500 text-xs">Required</span>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Stay Duration (Days) *</label>
                            <input
                                type="number"
                                {...register("stay_duration_days", { valueAsNumber: true, required: "Required", min: 0 })}
                                className={`w-full border p-2 rounded ${errors.stay_duration_days ? 'border-red-500' : ''}`}
                            />
                            {errors.stay_duration_days && <span className="text-red-500 text-xs">Required</span>}
                        </div>

                        {/* Inventory */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Total Quantity *</label>
                            <input
                                type="number"
                                {...register("total_visas", { valueAsNumber: true, required: "Required", min: 1 })}
                                className={`w-full border p-2 rounded ${errors.total_visas ? 'border-red-500' : ''}`}
                            />
                            {errors.total_visas && <span className="text-red-500 text-xs">Required (Min 1)</span>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Price Per Visa *</label>
                            <input
                                type="number"
                                {...register("price_per_visa", { valueAsNumber: true, required: "Required", min: 1 })}
                                className={`w-full border p-2 rounded ${errors.price_per_visa ? 'border-red-500' : ''}`}
                            />
                            {errors.price_per_visa && <span className="text-red-500 text-xs">Required</span>}
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <label className="block text-sm font-medium mb-2">Requirements</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {/* ... checkboxes (kept as is, they are optional) ... */}
                            <label className="flex items-center space-x-2">
                                <input type="checkbox" {...register("passport_required")} /> <span>Passport Scan</span>
                            </label>
                            <label className="flex items-center space-x-2">
                                <input type="checkbox" {...register("photo_required")} /> <span>Photo</span>
                            </label>
                            <label className="flex items-center space-x-2">
                                <input type="checkbox" {...register("cnic_required")} /> <span>CNIC</span>
                            </label>
                            <label className="flex items-center space-x-2">
                                <input type="checkbox" {...register("medical_required")} /> <span>Medical</span>
                            </label>
                            <label className="flex items-center space-x-2">
                                <input type="checkbox" {...register("police_certificate_required")} /> <span>Police Cert</span>
                            </label>
                            <label className="flex items-center space-x-2">
                                <input type="checkbox" {...register("vaccine_required")} /> <span>Vaccine</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                            {isSubmitting ? 'Creating...' : 'Create Group'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
