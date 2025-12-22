import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import connectToDatabase from "@/lib/db";
import Customer from "@/models/Customer";
import { NextRequest, NextResponse } from "next/server";
import mongoose from 'mongoose';

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const { id } = params;

    try {
        const customer = await Customer.findOne({ _id: id, agencyId: session.user.agencyId });
        if (!customer) {
            return NextResponse.json({ error: "Customer not found" }, { status: 404 });
        }
        return NextResponse.json(customer);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch customer" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const { id } = params;
    const body = await req.json();

    try {
        const customer = await Customer.findOneAndUpdate(
            { _id: id, agencyId: session.user.agencyId },
            { $set: body },
            { new: true }
        );

        if (!customer) {
            return NextResponse.json({ error: "Customer not found" }, { status: 404 });
        }

        return NextResponse.json(customer);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update customer" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const { id } = params;
    console.log("DEBUG DELETE API: Deleting customer", id, "for agency", session.user.agencyId);

    try {
        const result = await Customer.deleteOne({
            _id: new mongoose.Types.ObjectId(id),
            agencyId: new mongoose.Types.ObjectId(session.user.agencyId as string)
        });

        if (result.deletedCount === 0) {
            return NextResponse.json({ error: "Customer not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Customer deleted successfully" });
    } catch (error) {
        console.error("Delete Error:", error);
        return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 });
    }
}
