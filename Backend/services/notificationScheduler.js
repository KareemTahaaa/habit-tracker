const cron = require('node-cron');
const User = require('../models/User');
const Habit = require('../models/Habit');
const Notification = require('../models/Notification');
const NotificationSettings = require('../models/NotificationSettings');
const { sendHabitReminderEmail, sendStreakDangerEmail, sendStreakMilestoneEmail } = require('./emailNotificationService');
const { sendHabitReminderPush, sendStreakDangerPush, sendStreakMilestonePush } = require('./pushNotificationService');

const computeStreak = (completedDates) => {
  if (!completedDates || completedDates.length === 0) return 0;

  const sorted = completedDates
    .map((d) => new Date(d).toDateString())
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort((a, b) => new Date(b) - new Date(a));

  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;

  let streak = 0;
  let expected = sorted[0] === today ? today : yesterday;

  for (const dateStr of sorted) {
    if (dateStr === expected) {
      streak++;
      const d = new Date(expected);
      d.setDate(d.getDate() - 1);
      expected = d.toDateString();
    } else {
      break;
    }
  }
  return streak;
};

const completedToday = (completedDates) => {
  const today = new Date().toDateString();
  return completedDates.some((d) => new Date(d).toDateString() === today);
};

const alreadySentToday = async (userId, habitId, type) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const existing = await Notification.findOne({
    userId,
    habitId,
    type,
    createdAt: { $gte: startOfDay },
    status: { $in: ['sent', 'pending'] },
  });
  return !!existing;
};

const runHabitReminderJob = async (nowInput) => {
  try {
    const now = nowInput || new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const currentTime = `${hh}:${mm}`;

    const settingsList = await NotificationSettings.find({
      habitRemindersEnabled: true,
      defaultReminderTime: currentTime,
    });

    if (settingsList.length === 0) return;

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    for (const settings of settingsList) {
      const user = await User.findById(settings.userId).select('name email');
      if (!user) continue;

      const habits = await Habit.find({ userId: settings.userId });
      if (!habits.length) continue;

      for (const habit of habits) {
        if (completedToday(habit.completedDates)) continue;
        if (await alreadySentToday(settings.userId, habit._id, 'habit_reminder')) continue;

        const notif = await Notification.create({
          userId: settings.userId,
          habitId: habit._id,
          type: 'habit_reminder',
          title: 'Habit Reminder',
          message: `Time to complete: "${habit.title}"`,
          status: 'pending',
          scheduledAt: now,
        });

        try {
          if (settings.emailNotificationsEnabled) {
            await sendHabitReminderEmail({
              to: user.email,
              userName: user.name,
              habitTitle: habit.title,
              clientUrl,
            });
          }

          if (settings.pushNotificationsEnabled && settings.pushSubscription) {
            await sendHabitReminderPush(settings.pushSubscription, habit.title);
          }

          notif.status = 'sent';
          notif.sentAt = new Date();
        } catch (err) {
          notif.status = 'failed';
          notif.errorMessage = err.message;
        }

        await notif.save();
      }
    }
  } catch (err) {
    console.error('❌ Habit Reminder Job error:', err.message);
  }
};

const runStreakAlertJob = async () => {
  try {
    const allSettings = await NotificationSettings.find({ streakAlertsEnabled: true });
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    for (const settings of allSettings) {
      const user = await User.findById(settings.userId).select('name email');
      if (!user) continue;

      const habits = await Habit.find({ userId: settings.userId });

      for (const habit of habits) {
        const streak = computeStreak(habit.completedDates);
        if (streak === 0) continue;
        if (completedToday(habit.completedDates)) continue;

        if (await alreadySentToday(settings.userId, habit._id, 'streak_alert')) continue;

        const notif = await Notification.create({
          userId: settings.userId,
          habitId: habit._id,
          type: 'streak_alert',
          title: '🔥 Streak in Danger!',
          message: `Your ${streak}-day streak on "${habit.title}" will reset if you don't complete it today!`,
          status: 'pending',
          scheduledAt: new Date(),
        });

        try {
          if (settings.emailNotificationsEnabled) {
            await sendStreakDangerEmail({
              to: user.email,
              userName: user.name,
              habitTitle: habit.title,
              streak,
              clientUrl,
            });
          }
          if (settings.pushNotificationsEnabled && settings.pushSubscription) {
            await sendStreakDangerPush(settings.pushSubscription, { habitTitle: habit.title, streak });
          }

          notif.status = 'sent';
          notif.sentAt = new Date();
        } catch (err) {
          notif.status = 'failed';
          notif.errorMessage = err.message;
        }

        await notif.save();
      }
    }
  } catch (err) {
    console.error('❌ Streak Alert Job error:', err.message);
  }
};

const runStreakMilestoneJob = async () => {
  try {
    const allSettings = await NotificationSettings.find({ streakAlertsEnabled: true });
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    for (const settings of allSettings) {
      const user = await User.findById(settings.userId).select('name email');
      if (!user) continue;

      const milestones = settings.streakMilestones || [7, 14, 30, 60, 100];
      const habits = await Habit.find({ userId: settings.userId });

      for (const habit of habits) {
        const streak = computeStreak(habit.completedDates);
        if (!milestones.includes(streak)) continue;

        const alreadySent = await alreadySentToday(settings.userId, habit._id, 'streak_alert');
        if (alreadySent) continue;

        const notif = await Notification.create({
          userId: settings.userId,
          habitId: habit._id,
          type: 'streak_alert',
          title: `🎉 ${streak}-Day Streak Milestone!`,
          message: `Incredible! You've hit a ${streak}-day streak on "${habit.title}"!`,
          status: 'pending',
          scheduledAt: new Date(),
        });

        try {
          if (settings.emailNotificationsEnabled) {
            await sendStreakMilestoneEmail({
              to: user.email,
              userName: user.name,
              habitTitle: habit.title,
              streak,
              clientUrl,
            });
          }
          if (settings.pushNotificationsEnabled && settings.pushSubscription) {
            await sendStreakMilestonePush(settings.pushSubscription, { habitTitle: habit.title, streak });
          }

          notif.status = 'sent';
          notif.sentAt = new Date();
        } catch (err) {
          notif.status = 'failed';
          notif.errorMessage = err.message;
        }

        await notif.save();
      }
    }
  } catch (err) {
    console.error('❌ Streak Milestone Job error:', err.message);
  }
};

const startScheduler = () => {
  cron.schedule('* * * * *', () => {
    runHabitReminderJob();
  });

  cron.schedule('0 20 * * *', () => {
    runStreakAlertJob();
  });

  cron.schedule('5 0 * * *', () => {
    runStreakMilestoneJob();
  });
};

module.exports = { startScheduler, runHabitReminderJob, runStreakAlertJob, runStreakMilestoneJob };
