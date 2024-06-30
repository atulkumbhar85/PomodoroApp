import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HomeScreen: React.FC = () => {
    const [timeLeft, setTimeLeft] = useState<number>(25 * 60); // 25 minutes in seconds
    const [isActive, setIsActive] = useState<boolean>(false);

    useEffect(() => {
        const loadState = async () => {
            try {
                const savedTimeLeft = await AsyncStorage.getItem('timeLeft');
                const savedIsActive = await AsyncStorage.getItem('isActive');
                if (savedTimeLeft !== null) {
                    setTimeLeft(parseInt(savedTimeLeft));
                }
                if (savedIsActive !== null) {
                    setIsActive(JSON.parse(savedIsActive));
                }
            } catch (error) {
                console.error(error);
            }
        };

        loadState();
    }, []);

    useEffect(() => {
        const saveState = async () => {
            try {
                await AsyncStorage.setItem('timeLeft', timeLeft.toString());
                await AsyncStorage.setItem('isActive', JSON.stringify(isActive));
            } catch (error) {
                console.error(error);
            }
        };

        saveState();
    }, [timeLeft, isActive]);

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (isActive) {
            interval = setInterval(() => {
                setTimeLeft((seconds) => seconds - 1);
            }, 1000);
        } else if (!isActive && timeLeft !== 0) {
            clearInterval(interval!);
        }
        return () => clearInterval(interval!);
    }, [isActive, timeLeft]);

    const toggleTimer = () => {
        setIsActive(!isActive);
    };

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(25 * 60);
    };

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes < 10 ? '0' : ''}${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    };

    return (
        <View style={styles.container}>
            <Text style={styles.timer}>{formatTime(timeLeft)}</Text>
            <Button onPress={toggleTimer} title={isActive ? 'Pause' : 'Start'} />
            <Button onPress={resetTimer} title="Reset" />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    timer: {
        fontSize: 48,
        marginBottom: 20,
    },
    button: {
        marginTop: 10,
    },
});

export default HomeScreen;
