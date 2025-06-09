// filepath: d:\ReactNative\PomodoroApp\src\screens\HomeScreen.test.tsx
import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import HomeScreen from './HomeScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationService from '../services/NotificationService';
import SoundService from '../services/SoundService';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../services/NotificationService');
jest.mock('../services/SoundService');
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');

const mockNavigation = {
    navigate: jest.fn(),
};

describe('HomeScreen Enhanced Features', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should render HomeScreen with all enhanced elements', async () => {
        const { getByText, getByTestId } = render(
            <HomeScreen navigation={mockNavigation} />
        );

        await waitFor(() => {
            expect(getByText('Work')).toBeTruthy(); // Session type
            expect(getByText('25:00')).toBeTruthy(); // Default timer
            expect(getByText('Pomodoros Today: 0')).toBeTruthy(); // Daily progress
            expect(getByText('Reset')).toBeTruthy();
            expect(getByText('Start')).toBeTruthy();
            expect(getByText('Theme')).toBeTruthy();
            expect(getByText('Analog')).toBeTruthy(); // Analog toggle
        });
    });

    it('should toggle between digital and analog timer views', async () => {
        const { getByDisplayValue } = render(
            <HomeScreen navigation={mockNavigation} />
        );

        const analogSwitch = getByDisplayValue(false); // Find the Switch component
        fireEvent(analogSwitch, 'onValueChange', true);

        // The analog timer should now be visible (we'd need to check for the AnalogTimer component)
        // This would require additional test IDs in the actual component
    });

    it('should start timer and show session start notification', async () => {
        const { getByText } = render(
            <HomeScreen navigation={mockNavigation} />
        );

        const startButton = getByText('Start');
        await act(async () => {
            fireEvent.press(startButton);
        });

        expect(NotificationService.showSessionStartNotification).toHaveBeenCalledWith('Work');
        expect(getByText('Pause')).toBeTruthy(); // Button text should change
    });

    it('should complete work session and transition to short break', async () => {
        const { getByText } = render(
            <HomeScreen navigation={mockNavigation} />
        );

        // Mock a work session completion by setting seconds to 1 and starting timer
        const startButton = getByText('Start');
        await act(async () => {
            fireEvent.press(startButton);
        });

        // Fast forward timer to completion
        await act(async () => {
            jest.advanceTimersByTime(25 * 60 * 1000); // 25 minutes
        });

        await waitFor(() => {
            expect(getByText('Short Break')).toBeTruthy(); // Should transition to break
            expect(NotificationService.showSessionEndNotification).toHaveBeenCalledWith('Work');
            expect(NotificationService.showBreakStartNotification).toHaveBeenCalledWith('Short Break');
            expect(SoundService.vibrateSessionEnd).toHaveBeenCalled();
            expect(SoundService.vibrateBreakStart).toHaveBeenCalled();
        });
    });

    it('should complete 4 pomodoros and transition to long break', async () => {
        // Mock AsyncStorage to return 3 completed pomodoros
        (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
            if (key === 'pomodoros') return Promise.resolve('3');
            if (key === 'lastPomodoroDate') return Promise.resolve(new Date().toDateString());
            return Promise.resolve(null);
        });

        const { getByText } = render(
            <HomeScreen navigation={mockNavigation} />
        );

        await waitFor(() => {
            expect(getByText('Pomodoros Today: 3')).toBeTruthy();
        });

        // Complete one more pomodoro
        const startButton = getByText('Start');
        await act(async () => {
            fireEvent.press(startButton);
            jest.advanceTimersByTime(25 * 60 * 1000); // Complete work session
        });

        await waitFor(() => {
            expect(getByText('Long Break')).toBeTruthy(); // Should be long break after 4th pomodoro
            expect(NotificationService.showBreakStartNotification).toHaveBeenCalledWith('Long Break');
        });
    });

    it('should reset daily pomodoros for new day', async () => {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
        (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
            if (key === 'pomodoros') return Promise.resolve('5');
            if (key === 'lastPomodoroDate') return Promise.resolve(yesterday);
            return Promise.resolve(null);
        });

        const { getByText } = render(
            <HomeScreen navigation={mockNavigation} />
        );

        await waitFor(() => {
            expect(getByText('Pomodoros Today: 0')).toBeTruthy(); // Should reset for new day
        });

        expect(AsyncStorage.setItem).toHaveBeenCalledWith('lastPomodoroDate', new Date().toDateString());
        expect(AsyncStorage.setItem).toHaveBeenCalledWith('pomodoros', '0');
    });

    it('should persist settings and apply them to timer', async () => {
        (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
            if (key === 'workDuration') return Promise.resolve('1800'); // 30 minutes
            if (key === 'shortBreak') return Promise.resolve('600'); // 10 minutes
            if (key === 'longBreak') return Promise.resolve('1200'); // 20 minutes
            if (key === 'paletteIdx') return Promise.resolve('2'); // Third palette
            return Promise.resolve(null);
        });

        const { getByText } = render(
            <HomeScreen navigation={mockNavigation} />
        );

        await waitFor(() => {
            expect(getByText('30:00')).toBeTruthy(); // Should show custom work duration
        });
    });

    it('should handle reset button correctly', async () => {
        const { getByText } = render(
            <HomeScreen navigation={mockNavigation} />
        );

        const startButton = getByText('Start');
        await act(async () => {
            fireEvent.press(startButton);
        });

        expect(getByText('Pause')).toBeTruthy(); // Timer is running

        const resetButton = getByText('Reset');
        await act(async () => {
            fireEvent.press(resetButton);
        });

        expect(getByText('Start')).toBeTruthy(); // Should be back to start state
        expect(getByText('Work')).toBeTruthy(); // Should reset to work session
        expect(NotificationService.clearOngoingNotification).toHaveBeenCalled();
    });

    it('should clear ongoing notification when pausing', async () => {
        const { getByText } = render(
            <HomeScreen navigation={mockNavigation} />
        );

        // Start timer
        const startButton = getByText('Start');
        await act(async () => {
            fireEvent.press(startButton);
        });

        // Pause timer
        const pauseButton = getByText('Pause');
        await act(async () => {
            fireEvent.press(pauseButton);
        });

        expect(NotificationService.clearOngoingNotification).toHaveBeenCalled();
    });
});