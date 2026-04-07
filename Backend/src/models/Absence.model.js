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

const Absence = mongoose.model('Absence', absenceSchema);

module.exports = Absence;
