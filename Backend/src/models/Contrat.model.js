const mongoose = require('mongoose');

const contratSchema = new mongoose.Schema(
  {
    employe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employe',
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['CDI', 'CDD', 'CIVP'],
    },
    salaire: {
      type: Number,
      required: true,
      min: 0,
    },
    clausesGeneral: {
      type: String,
      trim: true,
    },
    posteTravail: {
      type: String,
      trim: true,
    },
    date_de_debut: {
      type: Date,
      required: true,
    },
    date_de_fin: {
      type: Date,
      // Only for CDD contracts
    },
    periode_essai: {
      type: Number,
      description: 'Trial period in months',
    },
    renouvellements: [
      {
        dateRenouvellement: {
          type: Date,
          default: Date.now,
        },
        notes: {
          type: String,
          trim: true,
        },
      },
    ],
    status: {
      type: String,
      enum: ['actif', 'expire', 'resilie', 'en_attente'],
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

/**
 * Business logic: renew the contract
 */
contratSchema.methods.renouveler = function (notes) {
  this.renouvellements.push({
    dateRenouvellement: new Date(),
    notes: notes || '',
  });
  // If CDD, extend end date by the original period
  if (this.type === 'CDD' && this.date_de_fin) {
    const originalDuration = this.date_de_fin.getTime() - this.date_de_debut.getTime();
    this.date_de_fin = new Date(this.date_de_fin.getTime() + originalDuration);
  }
  return this.save();
};

const Contrat = mongoose.model('Contrat', contratSchema);

module.exports = Contrat;
