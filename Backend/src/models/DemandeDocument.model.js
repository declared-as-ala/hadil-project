const mongoose = require('mongoose');

const demandeDocumentSchema = new mongoose.Schema(
  {
    typeDocument: {
      type: String,
      enum: ['attestation_travail', 'attestation_salaire', 'fiche_paie', 'certificat_travail'],
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    employe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employe',
      required: true,
    },
    status: {
      type: String,
      enum: ['en_attente', 'acceptee', 'refusee'],
      default: 'en_attente',
    },
    commentaireAdmin: {
      type: String,
      trim: true,
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

const DemandeDocument = mongoose.model('DemandeDocument', demandeDocumentSchema);

module.exports = DemandeDocument;
