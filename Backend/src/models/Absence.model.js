const mongoose = require('mongoose');

const absenceSchema = new mongoose.Schema(
  {
    employe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employe',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    nombre_des_heures: {
      type: Number,
      required: true,
      min: 0,
    },
    raison: {
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

// Hot path: list-by-employee and list-by-date-range filters used by
// /api/absences and the per-employee scoping in the controller.
absenceSchema.index({ employe: 1, date: -1 });
absenceSchema.index({ date: -1 });

const Absence = mongoose.model('Absence', absenceSchema);

module.exports = Absence;
