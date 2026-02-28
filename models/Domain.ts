import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDomain extends Document {
    name: string;
    project: mongoose.Types.ObjectId;
    status: 'Active' | 'Inactive';
    createdAt: Date;
    updatedAt: Date;
}

const DomainSchema: Schema<IDomain> = new Schema(
    {
        name: {
            type: String,
            required: [true, 'Please provide a domain name'],
            trim: true,
        },
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            required: [true, 'Domain must belong to a Project'],
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

DomainSchema.index({ name: 1, project: 1 }, { unique: true });

const Domain: Model<IDomain> =
    mongoose.models.Domain || mongoose.model<IDomain>('Domain', DomainSchema);

export default Domain;
