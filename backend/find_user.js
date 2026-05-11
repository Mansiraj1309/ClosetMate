const mongoose = require('mongoose');
const uri = 'mongodb+srv://Mansi1309:Mansi1309@cluster0.chbym8x.mongodb.net/?appName=Cluster0';

async function run() {
    try {
        await mongoose.connect(uri);
        const item = await mongoose.connection.db.collection('items').findOne({});
        console.log(`Item owner userId: ${item.userId}`);
        await mongoose.disconnect();
    } catch (e) {
        console.error(e.message);
    }
}
run();
