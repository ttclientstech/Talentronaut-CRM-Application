import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICampaign extends Document {
    name: string;
    domain: mongoose.Types.ObjectId;
    status: 'Active' | 'Inactive';
    createdAt: Date;
    updatedAt: Date;
}

const CampaignSchema: Schema<ICampaign> = new Schema(
    {
        name: {
            type: String,
            required: [true, 'Please provide a campaign name'],
            trim: true,
        },
        domain: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Domain',
            required: [true, 'Campaign must belong to a Domain'],
        },
        status: {
            type: String,
            enum: ['Active', 'Inactive'],
            default: 'Active',
        },
    },
    {
        timestamps: true,
    }
);

const Campaign: Model<ICampaign> =
    mongoose.models.Campaign || mongoose.model<ICampaign>('Campaign', CampaignSchema);

export default Campaign;
