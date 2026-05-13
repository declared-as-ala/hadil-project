const mongoose = require('mongoose');
const config = require('./src/config/env');
const Employe = require('./src/models/Employe.model');
const Affectation = require('./src/models/Affectation.model');
const Paie = require('./src/models/Paie.model');

async function cleanupOrphans() {
  await mongoose.connect(config.mongoUri);
  console.log('Connected to MongoDB');

  // Get all valid employee IDs
  const employes = await Employe.find({}, '_id');
  const validIds = employes.map(e => e._id.toString());

  // Find orphaned Paies (employe no longer exists)
  const allPaies = await Paie.find({});
  const orphanPaies = allPaies.filter(p => !validIds.includes(p.employe.toString()));
  if (orphanPaies.length > 0) {
    const ids = orphanPaies.map(p => p._id);
    await Paie.deleteMany({ _id: { $in: ids } });
    console.log(`Deleted ${orphanPaies.length} orphaned Paie record(s)`);
  } else {
    console.log('No orphaned Paie records found');
  }

  // Find orphaned Affectations
  const allAff = await Affectation.find({});
  const orphanAff = allAff.filter(a => !validIds.includes(a.employe.toString()));
  if (orphanAff.length > 0) {
    const ids = orphanAff.map(a => a._id);
    await Affectation.deleteMany({ _id: { $in: ids } });
    console.log(`Deleted ${orphanAff.length} orphaned Affectation record(s)`);
  } else {
    console.log('No orphaned Affectation records found');
  }

  console.log('Cleanup done!');
  await mongoose.disconnect();
}

cleanupOrphans().catch(e => { console.error(e.message); process.exit(1); });
