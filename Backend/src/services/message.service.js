const Message = require('../models/Message.model');
const ApiError = require('../utils/ApiError');

// Populate sender + recipient with name fields from Employe and email from User.
// (User schema has no nom/prenom — those live on Employe.)
const PARTY_SELECT = 'nom prenom poste status';
const USER_SELECT = 'email role';

const POPULATE = [
  { path: 'expediteur', select: PARTY_SELECT, populate: { path: 'utilisateur', select: USER_SELECT } },
  { path: 'destinataire', select: PARTY_SELECT, populate: { path: 'utilisateur', select: USER_SELECT } },
];

const SENDER_POPULATE = [
  { path: 'expediteur', select: PARTY_SELECT, populate: { path: 'utilisateur', select: USER_SELECT } },
];

class MessageService {
  async getAllMessages(filters = {}) {
    const query = {};
    // Guard: skip if value is missing or the literal string "null"/"undefined"
    const isValidId = (v) => v && v !== 'null' && v !== 'undefined';
    if (isValidId(filters.expediteurId)) query.expediteur = filters.expediteurId;
    if (isValidId(filters.destinataireId)) query.destinataire = filters.destinataireId;
    if (filters.lu !== undefined) query.lu = filters.lu;

    return Message.find(query).populate(POPULATE).sort({ date: -1 });
  }

  async getMessageById(id) {
    const message = await Message.findById(id).populate(POPULATE);
    if (!message) throw new ApiError(404, 'Message not found');
    return message;
  }

  async createMessage(data) {
    if (!data.expediteurId || !String(data.expediteurId).trim()) {
      throw new ApiError(400, 'Sender ID is required');
    }
    if (!data.destinataireId || !String(data.destinataireId).trim()) {
      throw new ApiError(400, 'Recipient ID is required');
    }

    const message = await Message.create({
      expediteur: data.expediteurId,
      destinataire: data.destinataireId,
      message: data.message,
      date: data.date || new Date(),
    });

    return Message.findById(message._id).populate(POPULATE);
  }

  async updateMessage(id, data) {
    const message = await Message.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).populate(POPULATE);
    if (!message) throw new ApiError(404, 'Message not found');
    return message;
  }

  async deleteMessage(id) {
    const message = await Message.findByIdAndDelete(id);
    if (!message) throw new ApiError(404, 'Message not found');
    return { message: 'Message deleted successfully' };
  }

  async envoyerMessage(data) {
    return this.createMessage(data);
  }

  async recevoirMessage(destinataireId) {
    return Message.find({ destinataire: destinataireId, lu: false })
      .populate(SENDER_POPULATE)
      .sort({ date: -1 });
  }

  async markAsRead(messageId) {
    const message = await Message.findByIdAndUpdate(
      messageId,
      { lu: true },
      { new: true, runValidators: true }
    ).populate(POPULATE);
    if (!message) throw new ApiError(404, 'Message not found');
    return message;
  }
}

module.exports = new MessageService();
