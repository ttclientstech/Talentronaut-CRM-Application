/**
 * Utility script to backfill standard Projects and update orphaned Domains.
 * 
 * Run with: npx ts-node scripts/seed-projects.ts
 */

import { connect } from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Simple schemas matching models without complex imports
import mongoose from 'mongoose';

const ProjectSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    status: { type: String, default: 'Active' }
}, { timestamps: true });

const DomainSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    status: { type: String, default: 'Active' }
}, { timestamps: true });

async function seed() {
    console.log('Connecting to database...');
    if (!process.env.MONGODB_URI) {
        console.error('MONGODB_URI is not defined in .env.local');
        process.exit(1);
    }

    await connect(process.env.MONGODB_URI);
    console.log('Connected.');

    const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);
    const Domain = mongoose.models.Domain || mongoose.model('Domain', DomainSchema);

    // 1. Create Projects if they don't exist
    const projectNames = ['Talentronaut', 'LinksUs'];
    const projectDocs: any = {};

    for (const name of projectNames) {
        let p = await Project.findOne({ name });
        if (!p) {
            console.log(`Creating project: ${name}`);
            p = await Project.create({ name });
        } else {
            console.log(`Project already exists: ${name}`);
        }
        projectDocs[name] = p;
    }

    // 2. Find orphaned domains (no project field)
    const defaultProject = projectDocs['Talentronaut']; // We'll assign to Talentronaut by default
    const orphanedDomains = await Domain.find({ project: { $exists: false } });

    console.log(`Found ${orphanedDomains.length} orphaned domains. Assigning to ${defaultProject.name}...`);

    for (const d of orphanedDomains) {
        d.project = defaultProject._id;
        await d.save();
        console.log(`Updated domain: ${d.name}`);
    }

    console.log('Seed complete.');
    process.exit(0);
}

seed().catch(console.error);
