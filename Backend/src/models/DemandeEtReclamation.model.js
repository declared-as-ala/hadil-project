const mongoose = require('mongoose');

const demandeEtReclamationSchema = new mongoose.Schema(
  {
    sujet: {
      type: String,
      required: true,
      trim: true,
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
      enum: ['pending', 'in_progress', 'accepted', 'rejected', 'resolved'],
      default: 'pending',
    },
    reponse: {
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

const DemandeEtReclamation = mongoose.model('DemandeEtReclamation', demandeEtReclamationSchema);

module.exports = DemandeEtReclamation;
