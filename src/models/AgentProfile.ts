import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAgentProfile extends Document {
    name: string;
    mobile_number: string;
    agencyId: mongoose.Types.ObjectId;
    source_name?: string;
    cnic?: string;
    created_at: Date;
    updated_at: Date;
}

const AgentProfileSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        mobile_number: { type: String, required: true },
        agencyId: { type: Schema.Types.ObjectId, ref: 'Agency', required: true, index: true },
        source_name: String,
        cnic: String,
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        collection: 'agent_profiles'
    }
);

// Prevent overwrite during HMR
if (process.env.NODE_ENV === 'development' && mongoose.models.AgentProfile) {
    delete mongoose.models.AgentProfile;
}

const AgentProfile: Model<IAgentProfile> =
    mongoose.models.AgentProfile || mongoose.model<IAgentProfile>('AgentProfile', AgentProfileSchema);

export default AgentProfile;
