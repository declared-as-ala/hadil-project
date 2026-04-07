const Message = require('../models/Message.model');
const ApiError = require('../utils/ApiError');

class MessageService {
  async getAllMessages(filters = {}) {
    const query = {};
    if (filters.expediteurId) query.expediteur = filters.expediteurId;
    if (filters.destinataireId) query.destinataire = filters.destinataireId;
    if (filters.lu !== undefined) query.lu = filters.lu;

    const messages = await Message.find(query)
      .populate('expediteur', 'poste departement')
      .populate('destinataire', 'poste departement')
      .populate([
        { path: 'expediteur', populate: { path: 'utilisateur', select: 'nom prenom email' } },
        { path: 'destinataire', populate: { path: 'utilisateur', select: 'nom prenom email' } },
      ])
      .sort({ date: -1 });

    return messages;
  }

  async getMessageById(id) {
    const message = await Message.findById(id)
      .populate('expediteur', 'poste departement')
      .populate('destinataire', 'poste departement')
      .populate([
        { path: 'expediteur', populate: { path: 'utilisateur', select: 'nom prenom email' } },
        { path: 'destinataire', populate: { path: 'utilisateur', select: 'nom prenom email' } },
      ]);

    if (!message) {
      throw new ApiError(404, 'Message not found');
    }
    return message;
  }

  async createMessage(data) {
    const message = new Message({
      expediteur: data.expediteurId,
      destinataire: data.destinataireId,
      message: data.message,
      date: data.date || new Date(),
    });

    await message.save();

    return Message.findById(message._id)
      .populate('expediteur', 'poste departement')
      .populate('destinataire', 'poste departement')
      .populate([
        { path: 'expediteur', populate: { path: 'utilisateur', select: 'nom prenom email' } },
        { path: 'destinataire', populate: { path: 'utilisateur', select: 'nom prenom email' } },
      ]);
  }

  async updateMessage(id, data) {
    const message = await Message.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    })
      .populate('expediteur', 'poste departement')
      .populate('destinataire', 'poste departement')
      .populate([
        { path: 'expediteur', populate: { path: 'utilisateur', select: 'nom prenom email' } },
        { path: 'destinataire', populate: { path: 'utilisateur', select: 'nom prenom email' } },
      ]);

    if (!message) {
      throw new ApiError(404, 'Message not found');
    }
    return message;
  }

  async deleteMessage(id) {
    const message = await Message.findByIdAndDelete(id);
    if (!message) {
      throw new ApiError(404, 'Message not found');
    }
    return { message: 'Message deleted successfully' };
  }

  async envoyerMessage(data) {
    return this.createMessage(data);
  }

  async recevoirMessage(destinataireId) {
    const messages = await Message.find({ destinataire: destinataireId, lu: false })
      .populate('expediteur', 'poste departement')
      .populate([
        { path: 'expediteur', populate: { path: 'utilisateur', select: 'nom prenom email' } },
      ])
      .sort({ date: -1 });

    return messages;
  }

  async markAsRead(messageId) {
    const message = await Message.findByIdAndUpdate(
      messageId,
      { lu: true },
      { new: true, runValidators: true }
    )
      .populate('expediteur', 'poste departement')
      .populate('destinataire', 'poste departement')
      .populate([
        { path: 'expediteur', populate: { path: 'utilisateur', select: 'nom prenom email' } },
        { path: 'destinataire', populate: { path: 'utilisateur', select: 'nom prenom email' } },
      ]);

    if (!message) {
      throw new ApiError(404, 'Message not found');
    }
    return message;
  }
}

module.exports = new MessageService();
