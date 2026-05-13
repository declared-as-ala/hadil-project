const mongoose = require('mongoose');

const paieSchema = new mongoose.Schema(
  {
    employe: { type: mongoose.Schema.Types.ObjectId, ref: 'Employe', required: true },
    // poste is now a plain string read from Employee at calculation time
    poste: { type: String, default: '' },
    mois: { type: Number, required: true, min: 1, max: 12 },
    annee: { type: Number, required: true },
    salaire_base: { type: Number, required: true, min: 0 },
    total_heures_sup: { type: Number, default: 0, min: 0 },
    prix_heure_sup: { type: Number, default: 0, min: 0 },
    montant_heures_sup: { type: Number, default: 0, min: 0 },
    salaire_total: { type: Number, required: true, min: 0 },
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

paieSchema.index({ employe: 1, mois: 1, annee: 1 }, { unique: true });

const Paie = mongoose.model('Paie', paieSchema);
module.exports = Paie;
