import { Vibration } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

class SoundService {
    // FR-16: Sound and vibration feedback with user preferences
    async checkVibrationEnabled(): Promise<boolean> {
        try {
            const vibrationEnabled = await AsyncStorage.getItem('vibrationEnabled');
            return vibrationEnabled !== null ? JSON.parse(vibrationEnabled) : true; // Default to enabled
        } catch (error) {
            console.log('Error checking vibration setting:', error);
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
    }

    async vibrate(duration: number = 300) {
        if (await this.checkVibrationEnabled()) {
            Vibration.vibrate(duration);
        }
    }

    async vibratePattern(pattern: number[] = [0, 250, 250, 250]) {
        if (await this.checkVibrationEnabled()) {
            Vibration.vibrate(pattern);
        }
    }

    // Different vibration patterns for different events
    async vibrateSessionEnd() {
        // Three short vibrations for session end
        await this.vibratePattern([0, 200, 100, 200, 100, 200]);
    }

    async vibrateBreakStart() {
        // Two longer vibrations for break start
        await this.vibratePattern([0, 400, 200, 400]);
    }

    async vibrateWorkStart() {
        // Single long vibration for work start
        await this.vibrate(500);
    }

    cancel() {
        Vibration.cancel();
    }
}

export default new SoundService();
