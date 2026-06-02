const mongoose = require('mongoose');
const config = require('./src/config/env');
const Poste = require('./src/models/Poste.model');
const Affectation = require('./src/models/Affectation.model');

const ROLE_NAMES = ['employe', 'employé', 'admin', 'rh', 'manager'];

async function cleanup() {
  await mongoose.connect(config.mongoUri);
  console.log('Connected to MongoDB');

  // Find postes whose name matches a role name (case-insensitive)
  const allPostes = await Poste.find({});
  const badPostes = allPostes.filter(p =>
    ROLE_NAMES.includes(p.nom_poste.trim().toLowerCase())
  );

  if (badPostes.length === 0) {
    console.log('No bad postes found.');
    await mongoose.disconnect();
    return;
  }

  for (const p of badPostes) {
    const affCount = await Affectation.countDocuments({ poste: p._id });
    await Affectation.deleteMany({ poste: p._id });
    await Poste.findByIdAndDelete(p._id);
    console.log(`Deleted poste "${p.nom_poste}" and ${affCount} affectation(s)`);
  }

  console.log('Cleanup done!');
  await mongoose.disconnect();
}

cleanup().catch(e => { console.error(e.message); process.exit(1); });
