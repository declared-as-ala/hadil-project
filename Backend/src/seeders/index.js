/* eslint-env node */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config/env');
const User = require('../models/User.model');
const Employe = require('../models/Employe.model');
const Absence = require('../models/Absence.model');
const DemandeDocument = require('../models/DemandeDocument.model');
const Conge = require('../models/Conge.model');
const HeureSupplementaire = require('../models/HeureSupplementaire.model');
const Message = require('../models/Message.model');
const Affectation = require('../models/Affectation.model');
const Poste = require('../models/Poste.model');


const seedDatabase = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB');

    // Clear all data
    await Promise.all([
      User.deleteMany({}),
      Employe.deleteMany({}),

      Absence.deleteMany({}),
      DemandeDocument.deleteMany({}),
      Conge.deleteMany({}),
      HeureSupplementaire.deleteMany({}),
      Message.deleteMany({}),
      Affectation.deleteMany({}),
      Poste.deleteMany({}),

    ]);
    console.log('Cleared all collections');

    // Create users with different roles
    const passwordHash = await bcrypt.hash('password123', 10);

    const adminUser = await User.create({
      nom: 'Admin',
      prenom: 'Super',
      email: 'admin@hr.com',
      adresse: '123 Admin Street',
      passwordHash,
      role: 'admin',
    });

    const rhUser = await User.create({
      nom: 'RH',
      prenom: 'Ressource',
      email: 'rh@hr.com',
      adresse: '456 HR Avenue',
      passwordHash,
      role: 'rh',
    });

    const employeUser1 = await User.create({
      nom: 'Dupont',
      prenom: 'Jean',
      email: 'jean.dupont@hr.com',
      adresse: '789 Employee Road',
      passwordHash,
      role: 'employe',
    });

    const employeUser2 = await User.create({
      nom: 'Martin',
      prenom: 'Sophie',
      email: 'sophie.martin@hr.com',
      adresse: '321 Worker Lane',
      passwordHash,
      role: 'employe',
    });



    console.log('Created users');

    // Create employees
    const rhEmploye = await Employe.create({
      utilisateur: rhUser._id,
      nom: 'Ressource',
      prenom: 'RH',
      poste: 'RH',
      dateEmbauche: new Date('2022-01-01'),
      telephone: '',
      status: 'actif',
    });

    const employe1 = await Employe.create({
      utilisateur: employeUser1._id,
      nom: 'Dupont',
      prenom: 'Jean',
      poste: 'Developpeur Senior',
      dateEmbauche: new Date('2023-01-15'),
      telephone: '+1234567890',
      status: 'actif',
    });

    const employe2 = await Employe.create({
      utilisateur: employeUser2._id,
      nom: 'Martin',
      prenom: 'Sophie',
      poste: 'Chef de Projet',
      dateEmbauche: new Date('2022-06-01'),
      telephone: '+0987654321',
      status: 'actif',
    });

    console.log('Created employees');



    // Create absences
    await Absence.create({
      employe: employe1._id,
      date: new Date('2024-02-15'),
      nombre_des_heures: 8,
      raison: 'Maladie',
    });

    await Absence.create({
      employe: employe2._id,
      date: new Date('2024-03-01'),
      nombre_des_heures: 4,
      raison: 'Rendez-vous medical',
    });

    console.log('Created absences');

    // Create demandes
    await DemandeDocument.create({
      typeDocument: 'attestation_travail',
      description: 'Je souhaite recevoir une attestation de travail pour mon dossier bancaire.',
      employe: employe1._id,
      status: 'en_attente',
    });

    await DemandeDocument.create({
      typeDocument: 'attestation_salaire',
      description: 'Pour un dossier de credit.',
      employe: employe2._id,
      status: 'acceptee',
      commentaireAdmin: 'Valide et pret.',
    });

    console.log('Created demandes');

    // Create conges
    await Conge.create({
      employe: employe1._id,
      date_debut: new Date('2024-07-01'),
      periode: 14,
      type_conge: 'annual',
      motif: 'Vacances d\'ete',
      status: 'approved',
    });

    console.log('Created conges');

    // Create heures supplementaires
    await HeureSupplementaire.create({
      employe: employe1._id,
      heureSupplementaire: 5,
      date: new Date('2024-02-20'),
      description: 'Urgence projet',
    });

    console.log('Created heures supplementaires');





    // Create messages
    await Message.create({
      expediteur: employe1._id,
      destinataire: employe2._id,
      message: 'Bonjour Sophie, le projet avance bien.',
      date: new Date('2024-03-15'),
      lu: true,
    });

    await Message.create({
      expediteur: employe2._id,
      destinataire: employe1._id,
      message: 'Super Jean! On fait un point demain?',
      date: new Date('2024-03-15'),
      lu: false,
    });

    // Create initial Postes and Affectations for the seeded employees
    const posteDev = await Poste.create({
      nom_poste: 'Developpeur Senior',
      salaire_base: 2500,
      prix_heure_sup: 20,
    });

    const postePm = await Poste.create({
      nom_poste: 'Chef de Projet',
      salaire_base: 3000,
      prix_heure_sup: 25,
    });

    const posteRh = await Poste.create({
      nom_poste: 'RH',
      salaire_base: 2800,
      prix_heure_sup: 22,
    });

    await Affectation.create({
      employe: rhEmploye._id,
      poste: posteRh._id,
      date_debut: new Date('2022-01-01'),
      date_fin: null,
    });

    await Affectation.create({
      employe: employe1._id,
      poste: posteDev._id,
      date_debut: new Date('2023-01-15'),
      date_fin: null,
    });

    await Affectation.create({
      employe: employe2._id,
      poste: postePm._id,
      date_debut: new Date('2022-06-01'),
      date_fin: null,
    });

    console.log('Created postes and affectations');

    console.log('Created messages');

    console.log('\n===== SEEDING COMPLETE =====');
    console.log('\nTest credentials (password: password123):');
    console.log(`Admin: ${adminUser.email}`);
    console.log(`RH: ${rhUser.email}`);
    console.log(`Employe 1: ${employeUser1.email}`);
    console.log(`Employe 2: ${employeUser2.email}`);

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();
