import PushNotification from 'react-native-push-notification';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

class NotificationService {
    constructor() {
        this.configure();
    }

    async checkNotificationsEnabled(): Promise<boolean> {
        try {
            const notificationsEnabled = await AsyncStorage.getItem('notificationsEnabled');
            return notificationsEnabled !== null ? JSON.parse(notificationsEnabled) : true; // Default to enabled
        } catch (error) {
            console.log('Error checking notification setting:', error);
            return true; // Default to enabled if error
        }
    }

    async checkSoundEnabled(): Promise<boolean> {
        try {
            const soundEnabled = await AsyncStorage.getItem('soundEnabled');
            return soundEnabled !== null ? JSON.parse(soundEnabled) : true; // Default to enabled
        } catch (error) {
            console.log('Error checking sound setting:', error);
            return true; // Default to enabled if error
        }
    } configure() {
        PushNotification.configure({
            onRegister: function (token: any) {
                console.log('TOKEN:', token);
            },
            onNotification: function (notification: any) {
                console.log('NOTIFICATION:', notification);
                // FR-10: Handle notification tap to return to app
                if (notification.userInteraction) {
                    // User tapped notification - app will come to foreground automatically
                    console.log('User tapped notification, returning to app');
                }
            },
            requestPermissions: Platform.OS === 'ios',
        });

        PushNotification.createChannel(
            {
                channelId: 'pomodoro-timer',
                channelName: 'Pomodoro Timer',
                channelDescription: 'Notifications for Pomodoro timer sessions',
                soundName: 'default',
                importance: 4,
                vibrate: true,
            },
            (created: any) => console.log(`createChannel returned '${created}'`)
        );
    } async showNotification(title: string, message: string) {
        if (await this.checkNotificationsEnabled()) {
            const soundEnabled = await this.checkSoundEnabled();
            PushNotification.localNotification({
                channelId: 'pomodoro-timer',
                title,
                message,
                playSound: soundEnabled,
                soundName: soundEnabled ? 'default' : undefined,
                vibrate: true,
                vibration: 300,
                actions: ['OK'],
            });
        }
    }

    async scheduleNotification(title: string, message: string, date: Date) {
        if (await this.checkNotificationsEnabled()) {
            const soundEnabled = await this.checkSoundEnabled();
            PushNotification.localNotificationSchedule({
                channelId: 'pomodoro-timer',
                title,
                message,
                date,
                playSound: soundEnabled,
                soundName: soundEnabled ? 'default' : undefined,
                vibrate: true,
                vibration: 300,
            });
        }
    }

    cancelAllNotifications() {
        PushNotification.cancelAllLocalNotifications();
    }

    // FR-08: Session Start Notification
    showSessionStartNotification(sessionType: string) {
        this.showNotification(
            'Pomodoro Session Started',
            `${sessionType} session has begun. Stay focused!`
        );
    }

    // FR-09: Session End Notification
    showSessionEndNotification(sessionType: string) {
        this.showNotification(
            'Pomodoro Session Completed',
            `${sessionType} session completed. Great job!`
        );
    }

    // FR-10: Break Start Notification
    showBreakStartNotification(breakType: string) {
        this.showNotification(
            'Break Time',
            `Time for a ${breakType}. Relax and recharge!`
        );
    }    // FR-11: Break End Notification
    showBreakEndNotification() {
        this.showNotification(
            'Break Finished',
            'Break time is over. Ready to get back to work?'
        );
    }    // FR-08, FR-09: Persistent notification during active session with remaining time
    async showOngoingSessionNotification(sessionType: string, remainingTime: string) {
        if (await this.checkNotificationsEnabled()) {
            PushNotification.localNotification({
                channelId: 'pomodoro-timer',
                title: `${sessionType} in Progress`,
                message: `${remainingTime} remaining • Tap to return to app`,
                playSound: false, // Don't play sound for ongoing notifications
                soundName: 'default',
                vibrate: false, // Don't vibrate for ongoing notifications
                ongoing: true, // Makes it persistent
                actions: ['Open App'],
                userInfo: { type: 'ongoing_session' }, // FR-10: For tap handling
            });
        }
    }

    // Update ongoing notification with new time
    async updateOngoingNotification(sessionType: string, remainingTime: string) {
        await this.showOngoingSessionNotification(sessionType, remainingTime);
    }

    // Clear ongoing notification
    clearOngoingNotification() {
        PushNotification.cancelAllLocalNotifications();
    }
}

export default new NotificationService();
