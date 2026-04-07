const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    expediteur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employe',
      required: true,
    },
    destinataire: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employe',
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    lu: {
      type: Boolean,
      default: false,
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

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
