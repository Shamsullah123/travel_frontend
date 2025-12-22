"use client";

import { ApiClient } from "@/lib/api";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function QuoteBuilder() {
    const [customers, setCustomers] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        customerId: "",
        lineItems: [{ description: "Visa Fee", type: "Visa", costPrice: 0, sellPrice: 0, quantity: 1 }],
    });

    useEffect(() => {
        // Fetch customers for dropdown
        ApiClient.get("/customers").then((res: any) => setCustomers(res));
    }, []);

    const addLineItem = () => {
        setFormData({
            ...formData,
            lineItems: [...formData.lineItems, { description: "", type: "Other", costPrice: 0, sellPrice: 0, quantity: 1 }]
        });
    };

    const updateLineItem = (index: number, field: string, value: any) => {
        const newItems: any = [...formData.lineItems];
        newItems[index][field] = value;
        setFormData({ ...formData, lineItems: newItems });
    };

    const getTotal = () => {
        return formData.lineItems.reduce((acc, item) => acc + (item.sellPrice * item.quantity), 0);
    };

    const handleSubmit = async () => {
        try {
            await ApiClient.post("/quotations", formData);
            alert("Quotation saved!");
        } catch (e) {
            alert("Error saving quote");
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-2xl font-bold">New Quotation</h2>

            <div className="bg-white p-6 shadow rounded-lg space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Customer</label>
                    <select
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        value={formData.customerId}
                        onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                    >
                        <option value="">Select Customer...</option>
                        {customers.map(c => <option key={c._id.$oid} value={c._id.$oid}>{c.fullName}</option>)}
                    </select>
                </div>

                <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Line Items</h3>
                    <div className="space-y-4">
                        {formData.lineItems.map((item, index) => (
                            <div key={index} className="flex gap-4 items-end">
                                <div className="flex-1">
                                    <label className="text-xs text-gray-500">Description</label>
                                    <input
                                        type="text"
                                        className="w-full border rounded p-1 text-sm"
                                        value={item.description}
                                        onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                                    />
                                </div>
                                <div className="w-24">
                                    <label className="text-xs text-gray-500">Type</label>
                                    <select
                                        className="w-full border rounded p-1 text-sm"
                                        value={item.type}
                                        onChange={(e) => updateLineItem(index, 'type', e.target.value)}
                                    >
                                        <option>Visa</option>
                                        <option>Ticket</option>
                                        <option>Hotel</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                                <div className="w-24">
                                    <label className="text-xs text-gray-500">Sell Price</label>
                                    <input
                                        type="number"
                                        className="w-full border rounded p-1 text-sm"
                                        value={item.sellPrice}
                                        onChange={(e) => updateLineItem(index, 'sellPrice', parseFloat(e.target.value))}
                                    />
                                </div>
                                <div className="w-16">
                                    <label className="text-xs text-gray-500">Qty</label>
                                    <input
                                        type="number"
                                        className="w-full border rounded p-1 text-sm"
                                        value={item.quantity}
                                        onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value))}
                                    />
                                </div>
                                <div className="p-2 font-bold text-sm">
                                    {(item.sellPrice * item.quantity).toFixed(0)}
                                </div>
                            </div>
                        ))}
                    </div>
                    <button onClick={addLineItem} className="mt-4 text-sm text-indigo-600 font-medium">+ Add Item</button>
                </div>

                <div className="border-t pt-4 flex justify-between items-center">
                    <div className="text-xl font-bold">Total: Rs. {getTotal().toLocaleString()}</div>
                    <div className="flex gap-4">
                        <button className="text-gray-600 px-4 py-2">Preview PDF</button>
                        <button
                            onClick={handleSubmit}
                            className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
                        >
                            Save Quote
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
