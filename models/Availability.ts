import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAvailability extends Document {
    leaderId: mongoose.Types.ObjectId;
    dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    startTime: string; // e.g., "09:00" in 24h format
    endTime: string;   // e.g., "17:00" in 24h format
    isAvailable: boolean; // false if they took the day off entirely
}

const AvailabilitySchema = new Schema(
    {
        leaderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        dayOfWeek: {
            type: Number,
            required: true,
            min: 0,
            max: 6,
        },
        startTime: {
            type: String,
            required: true,
            default: "09:00",
        },
        endTime: {
            type: String,
            required: true,
            default: "17:00",
        },
        isAvailable: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index to ensure one record per day per leader
AvailabilitySchema.index({ leaderId: 1, dayOfWeek: 1 }, { unique: true });

// Prevent model overwrite upon hot reload
if (mongoose.models && mongoose.models.Availability) {
    delete mongoose.models.Availability;
}

const Availability: Model<IAvailability> = mongoose.model<IAvailability>('Availability', AvailabilitySchema);

export default Availability;
