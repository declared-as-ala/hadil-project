const mongoose = require('mongoose');

const posteSchema = new mongoose.Schema(
  {
    nom_poste: { type: String, required: true, trim: true },
    salaire_base: { type: Number, required: true, min: 0 },
    prix_heure_sup: { type: Number, required: true, min: 0 },
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

const Poste = mongoose.model('Poste', posteSchema);
module.exports = Poste;
