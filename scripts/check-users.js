const mongoose = require('mongoose');

// Connect string should be pulled from .env.local usually, but for a quick script we'll use dotenv
require('dotenv').config({ path: '.env.local' });

async function checkUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await mongoose.connection.collection('users').find({}).toArray();
        console.log("Users available:");
        users.forEach(u => {
            console.log(`- ${u.email} | Role: ${u.role} | Status: ${u.status}`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkUsers();
