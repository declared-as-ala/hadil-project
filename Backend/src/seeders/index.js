const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config/env');
const User = require('../models/User.model');
const Employe = require('../models/Employe.model');
const Stagiaire = require('../models/Stagiaire.model');
const Absence = require('../models/Absence.model');
const DemandeEtReclamation = require('../models/DemandeEtReclamation.model');
const Conge = require('../models/Conge.model');
const HeureSupplementaire = require('../models/HeureSupplementaire.model');
const Message = require('../models/Message.model');
const Projet = require('../models/Projet.model');
const Tache = require('../models/Tache.model');
const Reunion = require('../models/Reunion.model');
const Contrat = require('../models/Contrat.model');

const seedDatabase = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB');

    // Clear all data
    await Promise.all([
      User.deleteMany({}),
      Employe.deleteMany({}),
      Stagiaire.deleteMany({}),
      Absence.deleteMany({}),
      DemandeEtReclamation.deleteMany({}),
      Conge.deleteMany({}),
      HeureSupplementaire.deleteMany({}),
      Message.deleteMany({}),
      Projet.deleteMany({}),
      Tache.deleteMany({}),
      Reunion.deleteMany({}),
      Contrat.deleteMany({}),
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

    const stagiaireUser = await User.create({
      nom: 'Bernard',
      prenom: 'Pierre',
      email: 'pierre.bernard@hr.com',
      adresse: '654 Intern Blvd',
      passwordHash,
      role: 'stagiaire',
    });

    console.log('Created users');

    // Create employees
    const employe1 = await Employe.create({
      utilisateur: employeUser1._id,
      poste: 'Developpeur Senior',
      departement: 'IT',
      dateEmbauche: new Date('2023-01-15'),
      telephone: '+1234567890',
      status: 'actif',
    });

    const employe2 = await Employe.create({
      utilisateur: employeUser2._id,
      poste: 'Chef de Projet',
      departement: 'Management',
      dateEmbauche: new Date('2022-06-01'),
      telephone: '+0987654321',
      status: 'actif',
    });

    console.log('Created employees');

    // Create stagiaire
    const stagiaire = await Stagiaire.create({
      utilisateur: stagiaireUser._id,
      sujetDeStage: 'Developpement d\'une application HR',
      encadrant: employe1._id,
      dateDebut: new Date('2024-01-01'),
      dateFin: new Date('2024-06-30'),
      status: 'actif',
    });

    console.log('Created stagiaire');

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
    await DemandeEtReclamation.create({
      sujet: 'Demande de formation',
      description: 'Je souhaite suivre une formation en React',
      employe: employe1._id,
      status: 'pending',
    });

    await DemandeEtReclamation.create({
      sujet: 'Reclamation materiel',
      description: 'Mon ordinateur est tres lent',
      employe: employe2._id,
      status: 'in_progress',
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

    // Create projet
    const projet = await Projet.create({
      nom: 'Projet HR System',
      description: 'Developpement du systeme de gestion RH',
      status: 'in_progress',
      dateDebut: new Date('2024-01-01'),
      dateFin: new Date('2024-12-31'),
      chefDeProjet: employe2._id,
      membres: [employe1._id],
    });

    console.log('Created projet');

    // Create taches
    await Tache.create({
      projet: projet._id,
      description: 'Implementer le module d\'authentication',
      status: 'completed',
      assigneA: employe1._id,
      priorite: 'high',
      dateEcheance: new Date('2024-03-01'),
    });

    await Tache.create({
      projet: projet._id,
      description: 'Creer le module de gestion des conges',
      status: 'in_progress',
      assigneA: employe1._id,
      priorite: 'medium',
      dateEcheance: new Date('2024-06-01'),
    });

    console.log('Created taches');

    // Create reunion
    await Reunion.create({
      projet: projet._id,
      date_debut: new Date('2024-04-01T10:00:00Z'),
      date_fin: new Date('2024-04-01T11:00:00Z'),
      description: 'Reunion de lancement du sprint 2',
      lieu: 'Salle de conference A',
      participants: [employe1._id, employe2._id],
      organisateur: employe2._id,
    });

    console.log('Created reunion');

    // Create contrats
    await Contrat.create({
      employe: employe1._id,
      type: 'CDI',
      salaire: 50000,
      clausesGeneral: 'Clauses standards CDI',
      posteTravail: 'Developpeur Full Stack',
      date_de_debut: new Date('2023-01-15'),
      periode_essai: 3,
      status: 'actif',
    });

    await Contrat.create({
      employe: employe2._id,
      type: 'CDD',
      salaire: 55000,
      clausesGeneral: 'Clauses standards CDD',
      posteTravail: 'Chef de Projet IT',
      date_de_debut: new Date('2022-06-01'),
      date_de_fin: new Date('2025-06-01'),
      periode_essai: 2,
      status: 'actif',
    });

    console.log('Created contrats');

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

    console.log('Created messages');

    console.log('\n===== SEEDING COMPLETE =====');
    console.log('\nTest credentials (password: password123):');
    console.log(`Admin: ${adminUser.email}`);
    console.log(`RH: ${rhUser.email}`);
    console.log(`Employe 1: ${employeUser1.email}`);
    console.log(`Employe 2: ${employeUser2.email}`);
    console.log(`Stagiaire: ${stagiaireUser.email}`);

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();
