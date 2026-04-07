const mongoose = require('mongoose');

const reunionSchema = new mongoose.Schema(
  {
    projet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Projet',
      required: true,
    },
    date_debut: {
      type: Date,
      required: true,
    },
    date_fin: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    lieu: {
      type: String,
      trim: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employe',
      },
    ],
    organisateur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employe',
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

const Reunion = mongoose.model('Reunion', reunionSchema);

module.exports = Reunion;
