import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProject extends Document {
    name: string;
    status: 'Active' | 'Inactive';
    createdAt: Date;
    updatedAt: Date;
}

const ProjectSchema: Schema<IProject> = new Schema(
    {
        name: {
            type: String,
            required: [true, 'Please provide a project name'],
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

const Project: Model<IProject> =
    mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);

export default Project;
