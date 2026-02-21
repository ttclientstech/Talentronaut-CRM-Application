import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDomain extends Document {
    name: string;
    status: 'Active' | 'Inactive';
    createdAt: Date;
    updatedAt: Date;
}

const DomainSchema: Schema<IDomain> = new Schema(
    {
        name: {
            type: String,
            required: [true, 'Please provide a domain name'],
            unique: true,
            trim: true,
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

const Domain: Model<IDomain> =
    mongoose.models.Domain || mongoose.model<IDomain>('Domain', DomainSchema);

export default Domain;
