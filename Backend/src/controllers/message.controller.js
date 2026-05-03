const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const messageService = require('../services/message.service');
const Employe = require('../models/Employe.model');

const getAllMessages = asyncHandler(async (req, res) => {
  const { expediteurId, destinataireId, lu } = req.query;
  const messages = await messageService.getAllMessages({ expediteurId, destinataireId, lu });
  res.status(200).json(new ApiResponse(200, messages, 'Messages retrieved successfully'));
});

const getMessageById = asyncHandler(async (req, res) => {
  const message = await messageService.getMessageById(req.params.id);
  res.status(200).json(new ApiResponse(200, message, 'Message retrieved successfully'));
});

const createMessage = asyncHandler(async (req, res) => {
  // Use expediteurId from body, or from token, or resolve/create one from DB
  let expediteurId = req.body.expediteurId || req.user.employeeId;

  // Guard against the string "null" coming from localStorage
  if (!expediteurId || expediteurId === 'null' || expediteurId === 'undefined') {
    const userId = req.user._id || req.user.id;

    // Try to find an existing employee record, or auto-create one for this user
    // (covers admin/RH users who don't yet have an Employe document)
    const employe = await Employe.findOneAndUpdate(
      { utilisateur: userId },
      { $setOnInsert: { utilisateur: userId, poste: req.user.role || 'admin', status: 'actif' } },
      { upsert: true, new: true }
    );
    expediteurId = employe._id;
  }

  const data = {
    ...req.body,
    expediteurId,
  };
  const message = await messageService.createMessage(data);
  res.status(201).json(new ApiResponse(201, message, 'Message sent successfully'));
});

const updateMessage = asyncHandler(async (req, res) => {
  const message = await messageService.updateMessage(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, message, 'Message updated successfully'));
});

const deleteMessage = asyncHandler(async (req, res) => {
  const result = await messageService.deleteMessage(req.params.id);
  res.status(200).json(new ApiResponse(200, null, result.message));
});

const envoyerMessage = asyncHandler(async (req, res) => {
  const message = await messageService.envoyerMessage(req.body);
  res.status(201).json(new ApiResponse(201, message, 'Message sent successfully'));
});

const recevoirMessages = asyncHandler(async (req, res) => {
  const { destinataireId } = req.params;
  const messages = await messageService.recevoirMessage(destinataireId);
  res.status(200).json(new ApiResponse(200, messages, 'Unread messages retrieved'));
});

const markAsRead = asyncHandler(async (req, res) => {
  const message = await messageService.markAsRead(req.params.id);
  res.status(200).json(new ApiResponse(200, message, 'Message marked as read'));
});

module.exports = {
  getAllMessages,
  getMessageById,
  createMessage,
  updateMessage,
  deleteMessage,
  envoyerMessage,
  recevoirMessages,
  markAsRead,
};
