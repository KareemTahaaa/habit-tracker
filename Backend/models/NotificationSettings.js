const mongoose = require('mongoose');

const NotificationSettingsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    habitRemindersEnabled: {
      type: Boolean,
      default: true,
    },
    streakAlertsEnabled: {
      type: Boolean,
      default: true,
    },
    emailNotificationsEnabled: {
      type: Boolean,
      default: true,
    },
    pushNotificationsEnabled: {
      type: Boolean,
      default: false,
    },
    defaultReminderTime: {
      type: String,
      default: '09:00',
      match: [/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'],
    },
    streakMilestones: {
      type: [Number],
      default: [7, 14, 30, 60, 100],
    },
    pushSubscription: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const NotificationSettings = mongoose.model('NotificationSettings', NotificationSettingsSchema);

module.exports = NotificationSettings;
