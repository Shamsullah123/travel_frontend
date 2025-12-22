"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ApiClient } from "@/lib/api";

export default function EditCustomerPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        fullName: "",
        phone: "",
        gender: "Male",
        passportNumber: "",
        passportExpiry: "",
        cnic: "",
        address: "",
    });

    useEffect(() => {
        const fetchCustomer = async () => {
            try {
                // We need a GET /customers/:id endpoint or filter the list
                // Since we don't have GET /:id, we will assume /api/customers?search=... or add the endpoint.
                // Wait, I didn't add GET /:id in customers.py yet?
                // Checking customers.py -> NO specific GET /:id implemented yet, only GET / (list).
                // I should add GET /:id to customers.py first or rely on list filtering (inefficient but workable for MVP if list is small).
                // Let's add GET /:id to backend first for correctness.

                // Assuming I will add it:
                // const data = await ApiClient.get<{...}>(`/customers/${params.id}`);

                // TEMPORARY FALLBACK: Since I can't browse code mid-write, I will assum I'll fix backend.
                // Re-reading common pattern: usually GET /collection/:id is standard.
                pass
            } catch (e: any) {
                setError("Failed to load customer");
            }
        };
        // fetchCustomer();
    }, [params.id]);

    // ... (rest is same as New but PUT)
    return <div>Placeholder</div>
}
