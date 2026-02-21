import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotification extends Document {
    userId: mongoose.Types.ObjectId;
    title: string;
    message: string;
    type: 'Lead' | 'Meeting' | 'System';
    read: boolean;
    link?: string;
    createdAt: Date;
    updatedAt: Date;
}

const NotificationSchema = new Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Please provide a user ID'],
            index: true,
        },
        title: {
            type: String,
            required: [true, 'Please provide a title'],
        },
        message: {
            type: String,
            required: [true, 'Please provide a message'],
        },
        type: {
            type: String,
            enum: ['Lead', 'Meeting', 'System'],
            default: 'System',
        },
        read: {
            type: Boolean,
            default: false,
        },
        link: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

// Prevent model overwrite upon hot reload
if (mongoose.models && mongoose.models.Notification) {
    delete mongoose.models.Notification;
}

const Notification: Model<INotification> = mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;
