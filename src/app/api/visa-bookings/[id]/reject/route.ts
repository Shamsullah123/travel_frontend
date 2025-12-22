import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import VisaBooking from '@/models/VisaBooking';
import VisaGroup from '@/models/VisaGroup';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    await connectToDatabase();

    const session = await getServerSession(authOptions);
    if (!session?.user?.agencyId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const bookingId = id;
        const agencyId = session.user.agencyId;

        // Find the booking
        const booking = await VisaBooking.findById(bookingId);
        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // Verify this agency is the seller
        if (booking.seller_agency_id?.toString() !== agencyId) {
            return NextResponse.json({ error: 'Unauthorized - not the seller' }, { status: 403 });
        }

        // Check if already confirmed or rejected
        if (booking.status !== 'submitted') {
            return NextResponse.json({ error: `Booking already ${booking.status}` }, { status: 400 });
        }

        // Restore visas to the marketplace
        await VisaGroup.findByIdAndUpdate(
            booking.visa_group_id,
            { $inc: { available_visas: booking.quantity } }
        );

        // Update booking status
        booking.status = 'rejected';
        await booking.save();

        return NextResponse.json({ success: true, booking });
    } catch (error) {
        console.error('Failed to reject booking:', error);
        return NextResponse.json({ error: 'Failed to reject booking' }, { status: 500 });
    }
}
