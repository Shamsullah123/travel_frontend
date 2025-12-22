import mongoose, { Schema, Document, Model } from 'mongoose';

interface IApplicant {
    fullName: string;
    gender: 'Male' | 'Female';
    dob: Date;
    passportNumber: string;
    passportExpiry: Date;
    nationality: string;
    // Store file URLs/paths
    passportScan?: string;
    cnicScan?: string;
    photo?: string;
    medical?: string;
    police?: string;
    vaccine?: string;
}

export interface IVisaBooking extends Document {
    buyer_agency_id: mongoose.Types.ObjectId;
    seller_agency_id: mongoose.Types.ObjectId;
    visa_group_id: mongoose.Types.ObjectId;
    booking_reference: string;
    quantity: number;

    applicants: IApplicant[];

    total_amount: number;
    discount: number;
    final_amount: number;
    payment_method: 'Cash' | 'Bank Transfer';
    receipt_url?: string;

    status: 'pending_documents' | 'submitted' | 'processing' | 'approved' | 'rejected' | 'delivered';

    created_at: Date;
    updated_at: Date;
}

const ApplicantSchema = new Schema({
    fullName: { type: String, required: true },
    gender: { type: String, enum: ['Male', 'Female'], required: true },
    dob: { type: Date, required: true },
    passportNumber: { type: String, required: true },
    passportExpiry: { type: Date, required: true },
    nationality: { type: String, required: true },

    passportScan: String,
    cnicScan: String,
    photo: String,
    medical: String,
    police: String,
    vaccine: String
});

const VisaBookingSchema: Schema = new Schema(
    {
        buyer_agency_id: { type: Schema.Types.ObjectId, ref: 'Agency', required: true, index: true },
        seller_agency_id: { type: Schema.Types.ObjectId, ref: 'Agency', required: true, index: true },
        visa_group_id: { type: Schema.Types.ObjectId, ref: 'VisaGroup', required: true, index: true },
        booking_reference: { type: String, required: true, unique: true },
        quantity: { type: Number, required: true },

        applicants: [ApplicantSchema],

        total_amount: { type: Number, required: true },
        discount: { type: Number, default: 0 },
        final_amount: { type: Number, required: true },

        payment_method: { type: String, required: true, enum: ['Cash', 'Bank Transfer'] },
        receipt_url: String,

        status: {
            type: String,
            enum: ['pending_documents', 'submitted', 'processing', 'approved', 'rejected', 'delivered'],
            default: 'submitted',
            index: true
        },
        is_read_by_seller: { type: Boolean, default: false, index: true },
        is_read_by_buyer: { type: Boolean, default: false, index: true }
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
    }
);

// Helper to generate reference - REMOVED due to middleware issues
// Logic moved to API controller
// VisaBookingSchema.pre<IVisaBooking>('validate', function (next) { ... });

// Force model recompilation
if (process.env.NODE_ENV === 'development' && mongoose.models.VisaBooking) {
    delete mongoose.models.VisaBooking;
}

const VisaBooking: Model<IVisaBooking> =
    mongoose.models.VisaBooking || mongoose.model<IVisaBooking>('VisaBooking', VisaBookingSchema, 'visabookings');

export default VisaBooking;
