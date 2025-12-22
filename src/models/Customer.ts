import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICustomer extends Document {
    agencyId: mongoose.Types.ObjectId;
    fullName: string;
    phone: string;
    cnic?: string;
    passportNumber?: string;
    passportExpiry?: Date;
    dob?: Date;
    address?: string;
    city?: string;
    gender: 'Male' | 'Female' | 'Other';
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const CustomerSchema: Schema = new Schema(
    {
        agencyId: { type: Schema.Types.ObjectId, ref: 'Agency', required: true, index: true },
        fullName: { type: String, required: true },
        phone: { type: String, required: true },
        cnic: { type: String },
        passportNumber: { type: String },
        passportExpiry: { type: Date },
        dob: { type: Date },
        address: { type: String },
        city: { type: String },
        gender: { type: String, enum: ['Male', 'Female', 'Other'], default: 'Male' },
        notes: { type: String },
    },
    { timestamps: true }
);

// Indexes for search (scoped by agencyId)
CustomerSchema.index({ agencyId: 1, phone: 1 });
CustomerSchema.index({ agencyId: 1, passportNumber: 1 });
CustomerSchema.index({ agencyId: 1, fullName: 'text' }); // Text search

const Customer: Model<ICustomer> =
    mongoose.models.Customer || mongoose.model<ICustomer>('Customer', CustomerSchema);

export default Customer;
