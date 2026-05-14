const mongoose = require('mongoose');

const heureSupplementaireSchema = new mongoose.Schema(
  {
    employe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employe',
      required: true,
    },
    heureSupplementaire: {
      type: Number,
      required: true,
      min: 0,
      description: 'Number of overtime hours',
    },
    date: {
      type: Date,
      required: true,
    },
    description: {
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

// Hot path: payroll calculation scans overtime for an employee in a date range.
heureSupplementaireSchema.index({ employe: 1, date: 1 });

const HeureSupplementaire = mongoose.model('HeureSupplementaire', heureSupplementaireSchema);

module.exports = HeureSupplementaire;
