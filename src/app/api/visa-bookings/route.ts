import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectToDatabase from "@/lib/db";
import VisaBooking from "@/models/VisaBooking";
import VisaGroup from "@/models/VisaGroup";
import AgentProfile from "@/models/AgentProfile";
import "@/models/Agency";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
// ... imports

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'sales' or 'purchases'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    console.log(`[GET /visa-bookings] Fetching for Agency: ${session.user.agencyId}, Type: ${type}, Page: ${page}`);

    let query: any = {};

    if (type === 'sales') {
        query.seller_agency_id = session.user.agencyId;
    } else if (type === 'purchases') {
        query.buyer_agency_id = session.user.agencyId;
    } else {
        // Default or admin view? For now restrict to valid types or own interaction
        return NextResponse.json({ error: "Specify type=sales or type=purchases" }, { status: 400 });
    }

    try {
        const bookings = await VisaBooking.find(query)
            .populate('visa_group_id', 'visa_title country visa_type processing_time_days visa_validity_days') // Keep minimal
            .populate('buyer_agency_id', 'name contactInfo')
            .populate('seller_agency_id', 'name contactInfo')
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await VisaBooking.countDocuments(query);

        // --- Side-load Agent Profile Mobile Numbers ---
        const agencyIds = new Set<string>();
        bookings.forEach((b: any) => {
            if (b.buyer_agency_id?._id) agencyIds.add(b.buyer_agency_id._id.toString());
            if (b.seller_agency_id?._id) agencyIds.add(b.seller_agency_id._id.toString());
        });

        const profiles = await AgentProfile.find({ agencyId: { $in: Array.from(agencyIds) } }).lean();
        const phoneMap: Record<string, string> = {};

        profiles.forEach((p: any) => {
            if (!phoneMap[p.agencyId.toString()]) {
                phoneMap[p.agencyId.toString()] = p.mobile_number;
            }
        });

        bookings.forEach((b: any) => {
            // Fix Buyer Phone
            if (b.buyer_agency_id) {
                const id = b.buyer_agency_id._id.toString();
                if (phoneMap[id]) {
                    if (!b.buyer_agency_id.contactInfo) b.buyer_agency_id.contactInfo = {};
                    b.buyer_agency_id.contactInfo.phone = phoneMap[id];
                }
            }
            // Fix Seller Phone
            if (b.seller_agency_id) {
                const id = b.seller_agency_id._id.toString();
                if (phoneMap[id]) {
                    if (!b.seller_agency_id.contactInfo) b.seller_agency_id.contactInfo = {};
                    b.seller_agency_id.contactInfo.phone = phoneMap[id];
                }
            }
        });
        // ----------------------------------------------

        console.log(`[GET /visa-bookings] Found ${bookings.length} bookings (Total: ${total})`);

        return NextResponse.json({
            data: bookings,
            meta: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Failed to fetch bookings:", error);
        return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
    }
}

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
        body = await req.json();
    } catch (e) {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    console.log(`[POST /visa-bookings] Request from Agency: ${session.user.agencyId}`);
    console.log(`[POST /visa-bookings] Payload:`, JSON.stringify(body, null, 2));

    const {
        visa_group_id,
        quantity,
        applicants,
        total_amount,
        final_amount,
        payment_method,
        receipt_url
    } = body;

    // Validate required fields explicitly before DB
    if (!visa_group_id) console.error("Missing visa_group_id");
    if (!quantity) console.error("Missing quantity");
    if (!total_amount) console.error("Missing total_amount");
    if (!final_amount) console.error("Missing final_amount");

    if (!visa_group_id || !quantity || quantity <= 0) {
        return NextResponse.json({ error: "Invalid request parameters" }, { status: 400 });
    }

    await connectToDatabase();

    // Start Transaction Session
    const dbSession = await mongoose.startSession();
    dbSession.startTransaction();

    try {
        // 1. Fetch Visa Group & Validate Stock (Locking via findOneAndUpdate atomic check)
        // We use findOne to check logic first
        const visaGroup = await VisaGroup.findById(visa_group_id).session(dbSession);

        if (!visaGroup) {
            throw new Error("Visa Group not found");
        }

        console.log(`[POST /visa-bookings] Found VisaGroup: ${visaGroup._id}, Agency: ${visaGroup.agency_id}`);

        // Rule: Prevent self-booking
        if (visaGroup.agency_id.toString() === session.user.agencyId) {
            throw new Error("Cannot book your own visa group");
        }

        // Rule: Check expiry
        if (visaGroup.expires_at && new Date() > new Date(visaGroup.expires_at)) {
            throw new Error("Visa Group has expired");
        }

        // Rule: Check availability
        if (visaGroup.available_visas < quantity) {
            throw new Error(`Insufficient stock. Only ${visaGroup.available_visas} available.`);
        }

        // 2. Atomically Decrement and Update
        // Calculate new status if stock hits 0
        const newAvailable = visaGroup.available_visas - quantity;
        const newStatus = newAvailable === 0 ? 'sold_out' : visaGroup.status;

        const updatedGroup = await VisaGroup.findOneAndUpdate(
            { _id: visa_group_id, available_visas: { $gte: quantity } }, // Optimistic locking condition
            {
                $inc: { available_visas: -quantity },
                $set: { status: newStatus }
            },
            { session: dbSession, new: true }
        );

        if (!updatedGroup) {
            // Concurrency fail: someone else took the stock in the split second
            throw new Error("Stock unavailable due to high demand. Please try again.");
        }

        // 3. Create Booking
        // In a real app we would validate applicants array against visaGroup requirements here

        // Generate Booking Reference Manually (Middleware removed)
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomStr = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const bookingRef = `VB-${dateStr}-${randomStr}`;

        const booking = new VisaBooking({
            buyer_agency_id: session.user.agencyId,
            seller_agency_id: visaGroup.agency_id,
            visa_group_id,
            booking_reference: bookingRef,
            quantity,
            applicants: applicants || [],
            total_amount,
            discount: body.discount || 0, // Ensure discount is passed
            final_amount,
            payment_method,
            receipt_url
        });

        await booking.save({ session: dbSession });

        // 4. Commit Transaction
        await dbSession.commitTransaction();

        return NextResponse.json({
            message: "Booking confirmed successfully",
            booking_id: booking._id,
            booking_reference: booking.booking_reference,
            remaining_stock: updatedGroup.available_visas
        }, { status: 201 });

    } catch (error: any) {
        // Rollback on any failure
        if (dbSession.inTransaction()) {
            await dbSession.abortTransaction();
        }
        console.error("Booking Transaction Failed. Full Error:", error);
        if (error.errors) {
            console.error("Mongoose Validation Errors:", JSON.stringify(error.errors, null, 2));
        }

        const status = (error.message.includes("Insufficient") || error.message.includes("Stock")) ? 409 : 400;
        return NextResponse.json({
            error: error.message || "Booking failed",
            details: error.errors ? Object.keys(error.errors).map(k => ({ field: k, message: error.errors[k].message })) : undefined
        }, { status });

    } finally {
        dbSession.endSession();
    }
}
