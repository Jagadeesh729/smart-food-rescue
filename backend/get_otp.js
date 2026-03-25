const mongoose = require('mongoose');

async function run() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/smart-food-rescue');
    const db = mongoose.connection.db;
    const user = await db.collection('users').findOne({ email: 'kundajagadeesh132@gmail.com' });
    console.log("===USER===");
    console.log(user);
    console.log("===");
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}
run();
