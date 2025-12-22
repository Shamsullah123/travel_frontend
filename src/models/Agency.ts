import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAgency extends Document {
    name: string;
    status: 'Active' | 'Suspended';
    subscriptionPlan: 'Basic' | 'Premium';
    contactInfo: {
        phone: string;
        email: string;
        address: string;
    };
    branding: {
        logoUrl?: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

const AgencySchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        status: { type: String, enum: ['Active', 'Suspended'], default: 'Active' },
        subscriptionPlan: { type: String, enum: ['Basic', 'Premium'], default: 'Basic' },
        contactInfo: {
            phone: String,
            email: String,
            address: String,
        },
        branding: {
            logoUrl: String,
        },
    },
    { timestamps: true }
);

const Agency: Model<IAgency> =
    mongoose.models.Agency || mongoose.model<IAgency>('Agency', AgencySchema);

export default Agency;
