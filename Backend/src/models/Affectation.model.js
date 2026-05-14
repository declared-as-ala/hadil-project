const mongoose = require('mongoose');

const affectationSchema = new mongoose.Schema(
  {
    employe: { type: mongoose.Schema.Types.ObjectId, ref: 'Employe', required: true },
    poste: { type: mongoose.Schema.Types.ObjectId, ref: 'Poste', required: true },
    date_debut: { type: Date, required: true },
    date_fin: { type: Date, default: null },
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

// Hot paths: paie.service looks up the active affectation for an employee
// via { employe, date_fin: null } and an overlap date range; the sync flow
// also queries by employe.
affectationSchema.index({ employe: 1, date_fin: 1 });
affectationSchema.index({ employe: 1, date_debut: -1 });

const Affectation = mongoose.model('Affectation', affectationSchema);
module.exports = Affectation;
