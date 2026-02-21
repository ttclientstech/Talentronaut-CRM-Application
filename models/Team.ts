import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITeam extends Document {
    name: string;
    leader: string;
    members: string[];
}

const TeamSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
        },
        leader: {
            type: String,
            required: true,
        },
        members: {
            type: [String],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

// Prevent model overwrite upon hot reload
if (mongoose.models && mongoose.models.Team) {
    delete mongoose.models.Team;
}

const Team: Model<ITeam> = mongoose.model<ITeam>('Team', TeamSchema);

export default Team;
