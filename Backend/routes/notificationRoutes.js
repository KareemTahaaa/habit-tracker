const express = require('express');
const { protectRoute } = require('../middleware/authMiddleware');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  getSettings,
  updateSettings,
  subscribePush,
  unsubscribePush,
  sendTestEmail,
  getStats,
} = require('../controllers/notificationController');

const router = express.Router();

router.use(protectRoute);

router.get('/', getNotifications);
router.delete('/', clearAllNotifications);
router.patch('/:id/read', markAsRead);
router.patch('/read-all', markAllAsRead);
router.delete('/:id', deleteNotification);

router.get('/settings', getSettings);
router.put('/settings', updateSettings);

router.post('/subscribe-push', subscribePush);
router.post('/unsubscribe-push', unsubscribePush);

router.post('/test-email', sendTestEmail);
router.get('/stats', getStats);

module.exports = router;
