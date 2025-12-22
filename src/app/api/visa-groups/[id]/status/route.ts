import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectToDatabase from "@/lib/db";
import VisaGroup from "@/models/VisaGroup";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        if (!['active', 'paused', 'sold_out'].includes(body.status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        await connectToDatabase();

        const visa = await VisaGroup.findOne({ _id: id, agency_id: session.user.agencyId });
        if (!visa) return NextResponse.json({ error: "Not found" }, { status: 404 });

        // Rule: Cannot activate if available = 0
        if (body.status === 'active' && visa.available_visas === 0) {
            return NextResponse.json({ error: "Cannot activate sold-out group" }, { status: 400 });
        }

        visa.status = body.status;
        await visa.save();

        return NextResponse.json(visa);
    } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
