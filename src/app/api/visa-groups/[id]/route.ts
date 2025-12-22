import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectToDatabase from "@/lib/db";
import VisaGroup from "@/models/VisaGroup";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

// ... (PUT handler remains same)

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Debug "params" content
    console.log("[DELETE] Resolved ID:", id);

    try {
        if (!id) {
            console.error("[DELETE] Missing ID");
            return NextResponse.json({ error: "Invalid Request: Missing ID" }, { status: 400 });
        }

        const cleanId = id.trim();
        const visa = await VisaGroup.findById(cleanId);

        if (!visa) {
            // Debugging: Return details about why it wasn't found
            // Safe access to connection details
            const dbName = mongoose.connection.db ? mongoose.connection.db.databaseName : 'Unknown';
            const collectionName = VisaGroup.collection.name;
            const totalDocs = await VisaGroup.countDocuments();

            return NextResponse.json({
                error: "Visa not found",
                debug: {
                    receivedId: cleanId,
                    cleanIdLength: cleanId.length,
                    dbName,
                    collectionName,
                    totalDocs,
                    readyState: mongoose.connection.readyState
                }
            }, { status: 404 });
        }

        // Robust ownership check (String comparison)
        if (visa.agency_id.toString() !== session.user.agencyId) {
            return NextResponse.json({
                error: "Unauthorized: You do not own this visa",
                debug: {
                    visaAgency: visa.agency_id.toString(),
                    userAgency: session.user.agencyId
                }
            }, { status: 403 });
        }

        const result = await VisaGroup.deleteOne({ _id: visa._id });

        if (result.deletedCount === 0) {
            return NextResponse.json({ error: "Delete failed" }, { status: 500 });
        }

        return NextResponse.json({ message: "Deleted successfully" });
    } catch (error: any) {
        console.error("Delete Error:", error);
        return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const body = await req.json();

    console.log(`[PUT] /api/visa-groups/${id}`);
    console.log("Body:", body);

    try {
        const visa = await VisaGroup.findById(id);
        if (!visa) return NextResponse.json({ error: "Not found" }, { status: 404 });

        // Rule: Only owner can update
        if (visa.agency_id.toString() !== session.user.agencyId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Rule: Agency cannot modify visas after expiry
        if (visa.expires_at && new Date() > new Date(visa.expires_at)) {
            return NextResponse.json({ error: "Cannot modify expired visa group" }, { status: 400 });
        }

        // Logic cleanup & protection
        delete body.agency_id;
        delete body._id;
        delete body.created_at;
        delete body.updated_at;

        // Auto-update status based on inventory
        if (body.available_visas !== undefined) {
            if (Number(body.available_visas) === 0) {
                body.status = 'sold_out';
            } else if (Number(body.available_visas) > 0 && visa.status === 'sold_out') {
                body.status = 'active';
            }
        }

        console.log("Updating with body:", body);

        const updatedVisa = await VisaGroup.findByIdAndUpdate(
            id,
            { $set: body },
            { new: true, runValidators: true }
        );

        console.log("Update Result:", updatedVisa);

        return NextResponse.json(updatedVisa);

    } catch (error: any) {
        console.error("PUT Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


