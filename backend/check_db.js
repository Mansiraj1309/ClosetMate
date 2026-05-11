const mongoose = require('mongoose');
const uri = 'mongodb+srv://Mansi1309:Mansi1309@cluster0.chbym8x.mongodb.net/?appName=Cluster0';

async function run() {
    try {
        await mongoose.connect(uri);
        const count = await mongoose.connection.db.collection('items').countDocuments();
        console.log(`Total items in production database: ${count}`);
        await mongoose.disconnect();
    } catch (e) {
        console.error(e.message);
    }
}
run();
