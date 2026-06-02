const mongoose = require('mongoose');

const employeSchema = new mongoose.Schema(
  {
    utilisateur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    nom: {
      type: String,
      trim: true,
      required: true,
    },
    prenom: {
      type: String,
      trim: true,
      required: true,
    },
    poste: {
      type: String,
      trim: true,
    },

    dateEmbauche: {
      type: Date,
    },
    telephone: {
      type: String,
      trim: true,
    },
    salaire_base: {
      type: Number,
      default: 0,
      min: 0,
    },
    prix_heure_sup: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['actif', 'inactif', 'en_conge'],
      default: 'actif',
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Virtual for absences, conges, demandes, heures supplementaires, contrats, messages
employeSchema.virtual('absences', {
  ref: 'Absence',
  localField: '_id',
  foreignField: 'employe',
});

employeSchema.virtual('conges', {
  ref: 'Conge',
  localField: '_id',
  foreignField: 'employe',
});

employeSchema.virtual('demandes', {
  ref: 'DemandeEtReclamation',
  localField: '_id',
  foreignField: 'employe',
});

employeSchema.virtual('heuresSupplementaires', {
  ref: 'HeureSupplementaire',
  localField: '_id',
  foreignField: 'employe',
});

employeSchema.virtual('contrats', {
  ref: 'Contrat',
  localField: '_id',
  foreignField: 'employe',
});

employeSchema.virtual('messagesEnvoyes', {
  ref: 'Message',
  localField: '_id',
  foreignField: 'expediteur',
});

employeSchema.virtual('messagesRecus', {
  ref: 'Message',
  localField: '_id',
  foreignField: 'destinataire',
});



employeSchema.set('toJSON', { virtuals: true });
employeSchema.set('toObject', { virtuals: true });

const Employe = mongoose.model('Employe', employeSchema);

module.exports = Employe;
