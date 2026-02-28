require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function fix() {
    if (!process.env.MONGODB_URI) {
        console.error('Missing MONGODB_URI in .env.local');
        process.exit(1);
    }
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        await mongoose.connection.collection('domains').dropIndex('name_1');
        console.log('Successfully dropped old unique index on domains collection');
    } catch (e) {
        console.log('Index might not exist or other error:', e.message);
    } finally {
        mongoose.disconnect();
        process.exit(0);
    }
}

fix();
