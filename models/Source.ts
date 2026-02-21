import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISource extends Document {
    name: string;
    campaign: mongoose.Types.ObjectId;
    type?: string;
    status: 'Active' | 'Inactive';
    createdAt: Date;
    updatedAt: Date;
}

const SourceSchema: Schema<ISource> = new Schema(
    {
        name: {
            type: String,
            required: [true, 'Please provide a source name'],
            trim: true,
        },
        campaign: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Campaign',
            required: [true, 'Source must belong to a Campaign'],
        },
        type: {
            type: String,
            trim: true, // e.g., 'Facebook', 'LinkedIn', 'Website'
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

const Source: Model<ISource> =
    mongoose.models.Source || mongoose.model<ISource>('Source', SourceSchema);

export default Source;
