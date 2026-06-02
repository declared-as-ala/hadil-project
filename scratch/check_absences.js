require('dotenv').config({ path: './Backend/.env' });
const mongoose = require('mongoose');
const Absence = require('../Backend/src/models/Absence.model');

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected');

  // Try to find one
  const abs = await Absence.findOne();
  console.log('Found:', abs);

  process.exit(0);
}

test();
