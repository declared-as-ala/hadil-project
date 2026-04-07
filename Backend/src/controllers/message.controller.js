const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const messageService = require('../services/message.service');

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
  const message = await messageService.createMessage(req.body);
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
