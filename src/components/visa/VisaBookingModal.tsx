"use client";

import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// --- Types (Mocking the Visa Interface based on previous step) ---
// In real usage, import from @/models/VisaGroup
export interface VisaGroupType {
    _id: string;
    visa_title: string;
    visa_type: string;
    country: string;
    entry_type: 'Single' | 'Multiple';
    processing_time_days: number;
    visa_validity_days: number;
    stay_duration_days: number;
    price_per_visa: number;
    total_visas: number;
    available_visas: number;
    passport_required: boolean;
    passport_validity_months?: number;
    cnic_required: boolean;
    photo_required: boolean;
    medical_required: boolean;
    police_certificate_required: boolean;
    vaccine_required: boolean;
    agency_id: string | {
        _id: string;
        name: string;
        contactInfo?: {
            phone: string;
        };
    };
}

interface VisaBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    visa: VisaGroupType | null;
    onSubmit: (data: BookingFormData) => Promise<boolean | void>;
}

// --- Zod Schema ---
const createVisaBookingSchema = (visa: VisaGroupType | null) => {
    const maxQty = visa?.available_visas || 1;
    const passportValidity = visa?.passport_validity_months || 0;

    return z.object({
        quantity: z.number()
            .min(1, "At least 1 visa required")
            .max(maxQty, `Only ${maxQty} visas available`),

        applicants: z.array(z.object({
            fullName: z.string().min(2, "Name required"),
            gender: z.enum(["Male", "Female"]),
            dob: z.string().refine((val) => new Date(val) < new Date(), "Invalid DOB"),
            passportNumber: z.string().min(5, "Passport required"),
            passportExpiry: z.string().refine((val) => {
                const expiry = new Date(val);
                const today = new Date();
                const minExpiry = new Date(today.setMonth(today.getMonth() + passportValidity));
                return expiry >= minExpiry;
            }, `Passport must be valid for at least ${passportValidity} months`),
            nationality: z.string().min(2, "Nationality required"),

            // Conditional Documents - Properly validate FileList from file inputs
            passportScan: visa?.passport_required
                ? z.any().refine(v => {
                    if (!v) return false;
                    if (v instanceof FileList) return v.length > 0;
                    return false;
                }, "Passport scan required")
                : z.any().optional(),
            cnicScan: visa?.cnic_required
                ? z.any().refine(v => {
                    if (!v) return false;
                    if (v instanceof FileList) return v.length > 0;
                    return false;
                }, "CNIC scan required")
                : z.any().optional(),
            photo: visa?.photo_required
                ? z.any().refine(v => {
                    if (!v) return false;
                    if (v instanceof FileList) return v.length > 0;
                    return false;
                }, "Photo required")
                : z.any().optional(),
            medical: visa?.medical_required
                ? z.any().refine(v => {
                    if (!v) return false;
                    if (v instanceof FileList) return v.length > 0;
                    return false;
                }, "Medical report required")
                : z.any().optional(),
            police: visa?.police_certificate_required
                ? z.any().refine(v => {
                    if (!v) return false;
                    if (v instanceof FileList) return v.length > 0;
                    return false;
                }, "Police certificate required")
                : z.any().optional(),
            vaccine: visa?.vaccine_required
                ? z.any().refine(v => {
                    if (!v) return false;
                    if (v instanceof FileList) return v.length > 0;
                    return false;
                }, "Vaccine cert required")
                : z.any().optional(),
        })),

        payment: z.object({
            discount: z.number().min(0).default(0),
            paymentMethod: z.enum(["Cash", "Bank Transfer"]),
            receipt: z.any().optional(), // Refine if Bank Transfer
        }).refine((data) => {
            if (data.paymentMethod === 'Bank Transfer' && (!data.receipt || data.receipt.length === 0)) {
                return false;
            }
            return true;
        }, { message: "Receipt required for Bank Transfer", path: ["receipt"] }),
    });
};

type BookingFormData = z.infer<ReturnType<typeof createVisaBookingSchema>>;

// --- Component ---
export default function VisaBookingModal({ isOpen, onClose, visa, onSubmit }: VisaBookingModalProps) {
    const [submitting, setSubmitting] = useState(false);

    // Form Hook
    const form = useForm<BookingFormData>({
        resolver: zodResolver(createVisaBookingSchema(visa)) as any,
        defaultValues: {
            quantity: 1,
            applicants: [{ fullName: '', gender: 'Male', dob: '', passportNumber: '', passportExpiry: '', nationality: '' }],
            payment: { discount: 0, paymentMethod: 'Cash' }
        },
        mode: 'onSubmit', // Changed to onSubmit so errors show when clicking Pay button
        reValidateMode: 'onChange' // Re-validate on change after first submit attempt
    });

    const { register, control, handleSubmit, watch, setValue, formState: { errors, isValid } } = form;
    const { fields, append, remove } = useFieldArray({ control, name: "applicants" });

    // Watchers for Calculations
    const quantity = watch("quantity");
    const discount = watch("payment.discount") || 0;

    const pricePerVisa = visa?.price_per_visa || 0;
    const totalAmount = (quantity || 0) * pricePerVisa;
    const finalAmount = Math.max(0, totalAmount - (discount || 0));

    // Effect: Sync Applicant Rows with Quantity
    useEffect(() => {
        const currentRows = fields.length;
        const targetQty = quantity || 1;

        if (targetQty > currentRows) {
            for (let i = currentRows; i < targetQty; i++) {
                append({
                    fullName: '',
                    gender: 'Male',
                    dob: '',
                    passportNumber: '',
                    passportExpiry: '',
                    nationality: '',
                    passportScan: undefined,
                    cnicScan: undefined,
                    photo: undefined,
                    medical: undefined,
                    police: undefined,
                    vaccine: undefined
                });
            }
        } else if (targetQty < currentRows) {
            for (let i = currentRows; i > targetQty; i--) {
                remove(i - 1);
            }
        }
    }, [quantity, fields.length, append, remove]);

    const handleFormSubmit = async (data: BookingFormData) => {
        console.log("Form Data Submitted:", data);
        setSubmitting(true);
        try {
            const success = await onSubmit({ ...data, totalAmount, finalAmount } as any);
            if (success) onClose();
        } catch (e) {
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen || !visa) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start overflow-y-auto pt-10">
            <div className="bg-white w-full max-w-4xl rounded-lg shadow-xl mb-10 mx-4">
                {/* Header */}
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">{visa.visa_title}</h2>
                        <span className="text-sm text-gray-500">{visa.country} • {visa.visa_type} Visa</span>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
                </div>

                <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-8">

                    {/* 1. Read Only Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-blue-50 p-4 rounded-md text-sm">
                        <div>
                            <span className="block text-gray-500 text-xs uppercase">Processing Time</span>
                            <span className="font-semibold">{visa.processing_time_days} Days</span>
                        </div>
                        <div>
                            <span className="block text-gray-500 text-xs uppercase">Available</span>
                            <span className="font-semibold text-green-600">{visa.available_visas} Visas</span>
                        </div>
                        <div>
                            <span className="block text-gray-500 text-xs uppercase">Price / Visa</span>
                            <span className="font-semibold">Rs. {visa.price_per_visa.toLocaleString()}</span>
                        </div>
                        <div>
                            <span className="block text-gray-500 text-xs uppercase">Expires</span>
                            <span className="font-semibold text-red-500">Active</span>
                        </div>
                    </div>

                    {/* 2. Quantity Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Number of Visas</label>
                        <input
                            type="number"
                            {...register("quantity", { valueAsNumber: true })}
                            className="w-32 border border-gray-300 rounded-md p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            min={1}
                            max={visa.available_visas}
                        />
                        {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity.message}</p>}
                    </div>

                    {/* 3. Dynamic Applicant Rows */}
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b">Applicant Information</h3>

                        <div className="space-y-6">
                            {fields.map((field, index) => (
                                <div key={field.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <h4 className="text-sm font-bold text-gray-700 mb-3">Applicant #{index + 1}</h4>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                        <div>
                                            <label className="text-xs text-gray-500">Full Name</label>
                                            <input {...register(`applicants.${index}.fullName` as const)} className="w-full border p-2 rounded text-sm" />
                                            {errors.applicants?.[index]?.fullName && <span className="text-red-500 text-xs">{errors.applicants[index]?.fullName?.message}</span>}
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500">Gender</label>
                                            <select {...register(`applicants.${index}.gender` as const)} className="w-full border p-2 rounded text-sm">
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500">Date of Birth</label>
                                            <input type="date" {...register(`applicants.${index}.dob` as const)} className="w-full border p-2 rounded text-sm" />
                                            {errors.applicants?.[index]?.dob && <span className="text-red-500 text-xs">{errors.applicants[index]?.dob?.message}</span>}
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500">Passport Number</label>
                                            <input {...register(`applicants.${index}.passportNumber` as const)} className="w-full border p-2 rounded text-sm" />
                                            {errors.applicants?.[index]?.passportNumber && <span className="text-red-500 text-xs">{errors.applicants[index]?.passportNumber?.message}</span>}
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500">Passport Expiry</label>
                                            <input type="date" {...register(`applicants.${index}.passportExpiry` as const)} className="w-full border p-2 rounded text-sm" />
                                            {errors.applicants?.[index]?.passportExpiry && <span className="text-red-500 text-xs">{errors.applicants[index]?.passportExpiry?.message}</span>}
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500">Nationality</label>
                                            <input {...register(`applicants.${index}.nationality` as const)} className="w-full border p-2 rounded text-sm" />
                                            {errors.applicants?.[index]?.nationality && <span className="text-red-500 text-xs">{errors.applicants[index]?.nationality?.message}</span>}
                                        </div>
                                    </div>

                                    {/* 4. Conditional Uploads */}
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-3 rounded border">
                                        {visa.passport_required && (
                                            <div>
                                                <label className="text-xs text-gray-500 block mb-1">Passport Scan <span className="text-red-500">*</span></label>
                                                <input type="file" {...register(`applicants.${index}.passportScan` as const)} className="text-xs" />
                                                {errors.applicants?.[index]?.passportScan && <span className="text-red-500 text-xs block">{errors.applicants[index]?.passportScan?.message as string}</span>}
                                            </div>
                                        )}
                                        {visa.photo_required && (
                                            <div>
                                                <label className="text-xs text-gray-500 block mb-1">Photo <span className="text-red-500">*</span></label>
                                                <input type="file" {...register(`applicants.${index}.photo` as const)} className="text-xs" />
                                            </div>
                                        )}
                                        {visa.cnic_required && (
                                            <div>
                                                <label className="text-xs text-gray-500 block mb-1">CNIC</label>
                                                <input type="file" {...register(`applicants.${index}.cnicScan` as const)} className="text-xs" />
                                            </div>
                                        )}
                                        {visa.medical_required && (
                                            <div>
                                                <label className="text-xs text-gray-500 block mb-1">Medical</label>
                                                <input type="file" {...register(`applicants.${index}.medical` as const)} className="text-xs" />
                                            </div>
                                        )}
                                        {/* Add other fields as needed */}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 5. Payment Section */}
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b">Payment Details</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">Total Amount</span>
                                    <span className="font-semibold text-lg">Rs. {totalAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">Discount</span>
                                    <input
                                        type="number"
                                        {...register("payment.discount", { valueAsNumber: true })}
                                        className="w-24 text-right border rounded p-1"
                                    />
                                </div>
                                <div className="flex justify-between items-center text-base pt-2 border-t font-bold">
                                    <span>Final Payable</span>
                                    <span className="text-blue-600">Rs. {finalAmount.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 border p-3 rounded cursor-pointer hover:bg-white transition-colors">
                                            <input type="radio" value="Cash" {...register("payment.paymentMethod")} />
                                            <span>Cash</span>
                                        </label>
                                        <label className="flex items-center gap-2 border p-3 rounded cursor-pointer hover:bg-white transition-colors">
                                            <input type="radio" value="Bank Transfer" {...register("payment.paymentMethod")} />
                                            <span>Bank Transfer</span>
                                        </label>
                                    </div>
                                </div>

                                {watch("payment.paymentMethod") === 'Bank Transfer' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Upload Receipt</label>
                                        <input type="file" {...register("payment.receipt")} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                                        {errors.payment?.receipt && <p className="text-red-500 text-xs mt-1">{errors.payment.receipt.message as string}</p>}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 6. Footer */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button type="button" onClick={onClose} className="px-6 py-2 border rounded-md text-gray-700 hover:bg-gray-50">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className={`px-6 py-2 rounded-md text-white font-medium ${submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            {submitting ? 'Processing...' : `Pay Rs. ${finalAmount.toLocaleString()}`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
