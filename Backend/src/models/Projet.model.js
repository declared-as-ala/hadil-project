const mongoose = require('mongoose');

const projetSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed', 'on_hold', 'cancelled'],
      default: 'not_started',
    },
    dateDebut: {
      type: Date,
    },
    dateFin: {
      type: Date,
    },
    chefDeProjet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employe',
    },
    membres: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employe',
      },
    ],
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

// Virtual for tasks
projetSchema.virtual('taches', {
  ref: 'Tache',
  localField: '_id',
  foreignField: 'projet',
});

// Virtual for meetings
projetSchema.virtual('reunions', {
  ref: 'Reunion',
  localField: '_id',
  foreignField: 'projet',
});

projetSchema.set('toJSON', { virtuals: true });
projetSchema.set('toObject', { virtuals: true });

const Projet = mongoose.model('Projet', projetSchema);

module.exports = Projet;
