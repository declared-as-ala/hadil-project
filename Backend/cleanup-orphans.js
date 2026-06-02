const mongoose = require('mongoose');
const config = require('./src/config/env');
const Employe = require('./src/models/Employe.model');
const Affectation = require('./src/models/Affectation.model');

async function cleanupOrphans() {
  await mongoose.connect(config.mongoUri);
  console.log('Connected to MongoDB');

  const legacyPaie = await mongoose.connection.db
    .listCollections({ name: 'paies' })
    .toArray();
  if (legacyPaie.length > 0) {
    await mongoose.connection.db.dropCollection('paies');
    console.log('Dropped legacy paies collection');
  } else {
    console.log('No legacy paies collection found');
  }

  // Get all valid employee IDs
  const employes = await Employe.find({}, '_id');
  const validIds = employes.map(e => e._id.toString());

  console.log('Paie records are no longer persisted; payroll now uses dynamic calculation.');

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
