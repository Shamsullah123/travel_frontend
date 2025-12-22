import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import VisaBooking from '@/models/VisaBooking';

export async function POST(req: NextRequest) {
    await connectToDatabase();

    const session = await getServerSession(authOptions);
    if (!session?.user?.agencyId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { type } = await req.json();
        const agencyId = session.user.agencyId;

        if (type === 'sales') {
            // Mark all incoming sales as read
            await VisaBooking.updateMany(
                { seller_agency_id: agencyId, is_read_by_seller: false },
                { $set: { is_read_by_seller: true } }
            );
        } else if (type === 'purchases') {
            // Mark all purchases as read
            await VisaBooking.updateMany(
                { buyer_agency_id: agencyId, is_read_by_buyer: false },
                { $set: { is_read_by_buyer: true } }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to mark as read:', error);
        return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 });
    }
}
