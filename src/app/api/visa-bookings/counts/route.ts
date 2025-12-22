import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import VisaBooking from '@/models/VisaBooking';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    await connectToDatabase();

    const session = await getServerSession(authOptions);
    if (!session?.user?.agencyId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const agencyId = session.user.agencyId;

        // Count unread sales (incoming bookings where this agency is the seller)
        // Check for 'submitted' instead of 'pending'
        const salesCount = await VisaBooking.countDocuments({
            seller_agency_id: agencyId,
            is_read_by_seller: false,
            status: 'submitted'
        });

        // Count unread purchases (outgoing bookings where this agency is the buyer)
        const purchasesCount = await VisaBooking.countDocuments({
            buyer_agency_id: agencyId,
            is_read_by_buyer: false
        });

        return NextResponse.json({
            sales: salesCount,
            purchases: purchasesCount
        });
    } catch (error: any) {
        console.error('Failed to load counts:', error);
        return NextResponse.json({ error: error.message || 'Failed to load counts' }, { status: 500 });
    }
}
