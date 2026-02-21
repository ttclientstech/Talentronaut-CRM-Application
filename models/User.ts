import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    phone?: string;
    domain?: string;
    joinDate?: Date;
    role: string; // 'Admin' | 'Sales Person' | 'Sales Team' etc.
    accessCode: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, 'Please provide a name'],
            maxlength: 60,
        },
        email: {
            type: String,
            required: [true, 'Please provide an email'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        phone: {
            type: String,
            required: false,
        },
        domain: {
            type: String,
            required: false,
        },
        joinDate: {
            type: Date,
            required: false,
        },
        role: {
            type: String,
            required: true,
            // Enum removed to compatibility with Workspace roles. 
            // We will handle mapping in the auth logic.
        },
        accessCode: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            default: 'Active',
        },
    },
    {
        timestamps: true,
    }
);

// Prevent model overwrite upon hot reload
if (mongoose.models && mongoose.models.User) {
    delete mongoose.models.User;
}

const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);

export default User;
