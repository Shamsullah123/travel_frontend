import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectToDatabase from "@/lib/db";
import VisaGroup from "@/models/VisaGroup";
import "@/models/Agency";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    try {
        // Multi-tenant: List ONLY own agency visas
        const visas = await VisaGroup.find({ agency_id: session.user.agencyId })
            .sort({ created_at: -1 });

        return NextResponse.json(visas);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch visa groups" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();

        // Validation: Basic checks
        if (!body.visa_title || !body.total_visas || !body.price_per_visa) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        await connectToDatabase();

        // Business Rule: available_visas initially equals total_visas
        const available = body.total_visas;

        const newGroup = await VisaGroup.create({
            ...body,
            agency_id: session.user.agencyId, // Force owner
            available_visas: available,
            status: available === 0 ? 'sold_out' : (body.status || 'active')
        });

        return NextResponse.json(newGroup, { status: 201 });

    } catch (error: any) {
        console.error("Create Visa Group Error:", error);
        if (error.name === 'ValidationError') {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
