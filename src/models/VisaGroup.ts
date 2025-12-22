import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IVisaGroup extends Document {
    agency_id: mongoose.Types.ObjectId;
    visa_title: string;
    visa_type: 'Work' | 'Umrah' | 'Visit' | 'Family' | 'Business' | 'Other';
    country: string;
    entry_type: 'Single' | 'Multiple';
    processing_time_days: number;
    visa_validity_days: number;
    stay_duration_days: number;

    // Inventory & Pricing
    total_visas: number;
    available_visas: number;
    price_per_visa: number;
    min_buy_quantity?: number;
    max_buy_quantity?: number;

    // Requirements Checks
    passport_required: boolean;
    passport_validity_months?: number;
    cnic_required: boolean;
    photo_required: boolean;
    medical_required: boolean;
    police_certificate_required: boolean;
    vaccine_required: boolean;

    // Documents
    sample_visa_url?: string;
    terms_pdf_url?: string;
    embassy_letter_url?: string;

    // Meta
    status: 'active' | 'paused' | 'sold_out';
    expires_at?: Date;
    created_at: Date;
    updated_at: Date;
}

const VisaGroupSchema: Schema = new Schema(
    {
        agency_id: { type: Schema.Types.ObjectId, ref: 'Agency', required: true, index: true },
        visa_title: { type: String, required: true },
        visa_type: {
            type: String,
            enum: ['Work', 'Umrah', 'Visit', 'Family', 'Business', 'Other'],
            required: true
        },
        country: { type: String, required: true, index: true },
        entry_type: { type: String, enum: ['Single', 'Multiple'], required: true },
        processing_time_days: { type: Number, required: true },
        visa_validity_days: { type: Number, required: true },
        stay_duration_days: { type: Number, required: true },

        total_visas: { type: Number, required: true },
        available_visas: { type: Number, required: true },
        price_per_visa: { type: Number, required: true },
        min_buy_quantity: { type: Number },
        max_buy_quantity: { type: Number },

        passport_required: { type: Boolean, default: false },
        passport_validity_months: { type: Number },
        cnic_required: { type: Boolean, default: false },
        photo_required: { type: Boolean, default: false },
        medical_required: { type: Boolean, default: false },
        police_certificate_required: { type: Boolean, default: false },
        vaccine_required: { type: Boolean, default: false },

        sample_visa_url: { type: String },
        terms_pdf_url: { type: String },
        embassy_letter_url: { type: String },

        status: {
            type: String,
            enum: ['active', 'paused', 'sold_out'],
            default: 'active',
            index: true
        },
        expires_at: { type: Date, index: true },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
    }
);

// Business Logic Middleware
// Business Logic Middleware - REMOVED
// Logic handled in service layer
// VisaGroupSchema.pre<IVisaGroup>('save', function (next) { ... });

// Force model recompilation to apply HMR changes
if (process.env.NODE_ENV === 'development' && mongoose.models.VisaGroup) {
    delete mongoose.models.VisaGroup;
}

const VisaGroup: Model<IVisaGroup> =
    mongoose.models.VisaGroup || mongoose.model<IVisaGroup>('VisaGroup', VisaGroupSchema, 'visagroups');

export default VisaGroup;
