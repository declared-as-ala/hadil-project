const mongoose = require('mongoose');

const stagiaireSchema = new mongoose.Schema(
  {
    utilisateur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    sujetDeStage: {
      type: String,
      trim: true,
    },
    encadrant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employe',
    },
    dateDebut: {
      type: Date,
    },
    dateFin: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['actif', 'termine', 'annule'],
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

const Stagiaire = mongoose.model('Stagiaire', stagiaireSchema);

module.exports = Stagiaire;
