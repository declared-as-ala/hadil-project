const mongoose = require('mongoose');

const POPULATE_OPTS = [
  { path: 'employe', select: 'nom prenom poste dateEmbauche salaire_base', populate: { path: 'utilisateur', select: 'nom prenom email' } },
];

async function run() {
  await mongoose.connect('mongodb+srv://hadiljaziri:hadiljaz123@cluster0.eww7x6y.mongodb.net/?appName=Cluster0');
  console.log('Connected to MongoDB');
  
  const Employe = require('./src/models/Employe.model');
  const User = require('./src/models/User.model');
  const DemandeDocument = require('./src/models/DemandeDocument.model');
  const paieService = require('./src/services/paie.service');
  
  const demands = await DemandeDocument.find({}).populate(POPULATE_OPTS);
  console.log('Total Demands found:', demands.length);
  
  if (demands.length > 0) {
    const testDem = demands.find(d => d.employe && d.employe.nom === 'Ahmed');
    if (testDem) {
      console.log('Populated Employe in demand:', testDem.employe);
      console.log('Employe ID:', testDem.employe._id);
      
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const calculatedPaie = await paieService.calculerSalaire(testDem.employe._id, currentMonth, currentYear);
      console.log('Calculated payroll for this employee:', calculatedPaie);
    } else {
      console.log('No demand found for Ahmed');
    }
  }
  
  await mongoose.disconnect();
}

run().catch(console.error);
