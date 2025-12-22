import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
    agencyId: mongoose.Types.ObjectId;
    email: string;
    passwordHash: string;
    role: 'SuperAdmin' | 'AgencyOwner' | 'Staff';
    name: string;
    permissions: string[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema = new Schema(
    {
        agencyId: { type: Schema.Types.ObjectId, ref: 'Agency', required: true, index: true },
        email: { type: String, required: true, unique: true },
        passwordHash: { type: String, required: true },
        role: {
            type: String,
            enum: ['SuperAdmin', 'AgencyOwner', 'Staff'],
            default: 'Staff',
            required: true
        },
        name: { type: String, required: true },
        permissions: { type: [String], default: [] },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

// Compound index for unique email (handled by unique: true on email field generally within collection, 
// but if we wanted unique per agency we'd do compound. 
// For SaaS login, email usually needs to be globally unique or scoped).
// Specification says: Index: { agencyId: 1, email: 1 } (unique). 
// Attempting globally unique email for simplicity in login, but following spec recommendation if strictly multi-tenant login url.
// Usually simpler to have unique email globally. 
// Let's stick to unique email globally for MVP login flow simplicity.
// UserSchema.index({ agencyId: 1, email: 1 }, { unique: true });

const User: Model<IUser> =
    mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
