const mongoose = require('mongoose');

const congeSchema = new mongoose.Schema(
  {
    employe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employe',
      required: true,
    },
    date_debut: {
      type: Date,
      required: true,
    },
    periode: {
      type: Number,
      required: true,
      min: 1,
      description: 'Duration in days',
    },
    type_conge: {
      type: String,
      required: true,
      enum: ['annual', 'sick', 'maternity', 'paternity', 'unpaid', 'special'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    motif: {
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

/**
 * Business logic: extend the leave period
 */
congeSchema.methods.prolonger = function (joursSupplementaires) {
  if (joursSupplementaires < 1) {
    throw new Error('Extension period must be at least 1 day');
  }
  this.periode += joursSupplementaires;
  return this.save();
};

// Hot paths: per-employee list, status filter on admin view, and the
// dashboard "out this week" query which scans by date_debut + status.
congeSchema.index({ employe: 1, status: 1 });
congeSchema.index({ status: 1, date_debut: 1 });

const Conge = mongoose.model('Conge', congeSchema);

module.exports = Conge;
