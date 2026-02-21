const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://ttinhousetech_db_user:ttinhousepass@tt-inhouse-project.2gxxatk.mongodb.net/?appName=TT-inhouse-project';

async function listDatabases() {
    try {
        await mongoose.connect(MONGODB_URI);
        const admin = mongoose.connection.db.admin();
        const dbs = await admin.listDatabases();
        console.log('\n--- Databases ---');
        dbs.databases.forEach(db => console.log(`- ${db.name}`));
        console.log('-----------------');

        console.log('\nCurrent Database Name:', mongoose.connection.db.databaseName);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

listDatabases();
