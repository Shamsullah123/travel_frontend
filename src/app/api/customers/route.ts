import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import connectToDatabase from "@/lib/db";
import Customer from "@/models/Customer";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");

    let query: any = { agencyId: session.user.agencyId };

    if (search) {
        query.$text = { $search: search };
    }

    try {
        const customers = await Customer.find(query).sort({ createdAt: -1 }).limit(50);
        return NextResponse.json(customers);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const body = await req.json();

    // Validate required fields
    if (!body.fullName || !body.phone) {
        return NextResponse.json({ error: "Name and Phone are required" }, { status: 400 });
    }

    try {
        // Check duplicates (Phone in same agency)
        const existing = await Customer.findOne({
            agencyId: session.user.agencyId,
            phone: body.phone
        });

        if (existing) {
            return NextResponse.json({ error: "Customer with this phone already exists." }, { status: 409 });
        }

        const customer = await Customer.create({
            ...body,
            agencyId: session.user.agencyId, // Enforce agency isolation
        });

        return NextResponse.json(customer, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
    }
}
