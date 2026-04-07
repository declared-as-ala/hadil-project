const mongoose = require('mongoose');

const tacheSchema = new mongoose.Schema(
  {
    projet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Projet',
      required: true,
    },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed', 'blocked'],
      default: 'not_started',
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    assigneA: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employe',
    },
    priorite: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    dateEcheance: {
      type: Date,
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

const Tache = mongoose.model('Tache', tacheSchema);

module.exports = Tache;
