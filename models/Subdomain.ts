import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISubdomain extends Document {
    name: string;
    domain: mongoose.Types.ObjectId;
    status: 'Active' | 'Inactive';
    createdAt: Date;
    updatedAt: Date;
}

const SubdomainSchema: Schema<ISubdomain> = new Schema(
    {
        name: {
            type: String,
            required: [true, 'Please provide a subdomain name'],
            trim: true,
        },
        domain: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Domain',
            required: [true, 'Subdomain must belong to a Domain'],
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

const Subdomain: Model<ISubdomain> =
    mongoose.models.Subdomain || mongoose.model<ISubdomain>('Subdomain', SubdomainSchema);

export default Subdomain;
