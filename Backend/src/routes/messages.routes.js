const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const messageController = require('../controllers/message.controller');
const {
  createMessageSchema,
  updateMessageSchema,
  messageParamsSchema,
  getMessagesSchema,
} = require('../validations/message.validation');

router.use(protect);

// GET /api/messages - All authenticated users can see their messages
router.get('/', authorize('admin', 'rh', 'employe', 'stagiaire'), validate(getMessagesSchema), messageController.getAllMessages);

// GET /api/messages/receive/:destinataireId - Get unread messages
router.get('/receive/:destinataireId', authorize('admin', 'rh', 'employe', 'stagiaire'), messageController.recevoirMessages);

// GET /api/messages/:id
router.get('/:id', authorize('admin', 'rh', 'employe', 'stagiaire'), validate(messageParamsSchema), messageController.getMessageById);

// POST /api/messages - Send message
router.post('/', authorize('admin', 'rh', 'employe', 'stagiaire'), validate(createMessageSchema), messageController.createMessage);

// POST /api/messages/envoyer - Alias for send
router.post('/envoyer', authorize('admin', 'rh', 'employe', 'stagiaire'), validate(createMessageSchema), messageController.envoyerMessage);

// PUT /api/messages/:id - Modify message
router.put('/:id', authorize('admin', 'rh', 'employe', 'stagiaire'), validate(messageParamsSchema), validate(updateMessageSchema), messageController.updateMessage);

// PUT /api/messages/:id/read - Mark as read
router.put('/:id/read', authorize('admin', 'rh', 'employe', 'stagiaire'), validate(messageParamsSchema), messageController.markAsRead);

// DELETE /api/messages/:id
router.delete('/:id', authorize('admin', 'rh', 'employe', 'stagiaire'), validate(messageParamsSchema), messageController.deleteMessage);

module.exports = router;
