import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IToolAccess extends Document {
    toolId: string;
    accessList: mongoose.Types.ObjectId[] | string[];
    updatedAt: Date;
}

const ToolAccessSchema = new Schema(
    {
        toolId: {
            type: String,
            required: [true, "Please provide a tool ID"],
            unique: true,
            index: true,
        },
        accessList: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }],
        updatedAt: {
            type: Date,
            default: Date.now,
        },
    }
);

// Prevent model overwrite upon hot reload
if (mongoose.models && mongoose.models.ToolAccess) {
    delete mongoose.models.ToolAccess;
}

const ToolAccess: Model<IToolAccess> = mongoose.model<IToolAccess>('ToolAccess', ToolAccessSchema);

export default ToolAccess;
