import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRemark {
    _id?: string;
    note: string;
    lastContactedDate?: Date;
    method: 'Call' | 'Email' | 'WhatsApp' | 'In-Person' | 'Other';
    addedBy: mongoose.Types.ObjectId;
    addedByName?: string;
    createdAt?: Date;
}

export interface IMeeting {
    _id?: string;
    title: string;
    date: Date;
    link?: string;
    status: 'Scheduled' | 'Completed' | 'Rescheduled' | 'Cancelled';
    notes?: string;
    createdAt?: Date;
}

export interface ILead extends Document {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    company?: string;
    sourceUrl?: string;
    source: mongoose.Types.ObjectId;
    status: 'New' | 'In Progress' | 'Contacted' | 'Needs Analysis' | 'Proposal Sent' | 'Won' | 'Lost' | 'Closed' | 'Qualified';
    details?: Map<string, any>;
    assignedTo?: mongoose.Types.ObjectId;
    value?: number;
    remarks: IRemark[];
    meetings: IMeeting[];
    createdAt: Date;
    updatedAt: Date;
}

const RemarkSchema = new Schema<IRemark>({
    note: { type: String, required: true },
    lastContactedDate: { type: Date },
    method: {
        type: String,
        enum: ['Call', 'Email', 'WhatsApp', 'In-Person', 'Other'],
        default: 'Call',
    },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    addedByName: { type: String },
}, { timestamps: true });

const MeetingSchema = new Schema<IMeeting>({
    title: { type: String, required: true },
    date: { type: Date, required: true },
    link: { type: String },
    status: {
        type: String,
        enum: ['Scheduled', 'Completed', 'Rescheduled', 'Cancelled'],
        default: 'Scheduled',
    },
    notes: { type: String },
}, { timestamps: true });

const LeadSchema: Schema<ILead> = new Schema(
    {
        firstName: { type: String, required: [true, 'Please provide first name'], trim: true },
        lastName: { type: String, required: [true, 'Please provide last name'], trim: true },
        email: { type: String, required: [true, 'Please provide email'], lowercase: true, trim: true },
        phone: { type: String, trim: true },
        company: { type: String, trim: true },
        sourceUrl: { type: String, trim: true },
        source: { type: mongoose.Schema.Types.ObjectId, ref: 'Source', required: [true, 'Lead must belong to a Source'] },
        assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        value: { type: Number, default: 0 },
        status: {
            type: String,
            enum: ['New', 'In Progress', 'Contacted', 'Needs Analysis', 'Proposal Sent', 'Won', 'Lost', 'Closed', 'Qualified'],
            default: 'New',
        },
        details: { type: Map, of: Schema.Types.Mixed },
        remarks: { type: [RemarkSchema], default: [] },
        meetings: { type: [MeetingSchema], default: [] },
    },
    { timestamps: true }
);

const Lead: Model<ILead> =
    mongoose.models.Lead || mongoose.model<ILead>('Lead', LeadSchema);

export default Lead;
