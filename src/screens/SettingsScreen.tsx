import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Switch,
    ImageBackground,
    ScrollView
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLOR_PALETTES } from './ThemeScreen';

interface SettingsScreenProps {
    navigation: any;
    route: {
        params: {
            workDuration: number;
            shortBreak: number;
            longBreak: number;
            paletteIdx: number;
            onUpdateSettings: (settings: {
                workDuration: number;
                shortBreak: number;
                longBreak: number;
            }) => void;
        };
    };
}

export default function SettingsScreen({ navigation, route }: SettingsScreenProps) {
    const { workDuration, shortBreak, longBreak, paletteIdx, onUpdateSettings } = route.params;
    const palette = COLOR_PALETTES[paletteIdx];

    const [workMinutes, setWorkMinutes] = useState<number>(workDuration / 60);
    const [shortBreakMinutes, setShortBreakMinutes] = useState<number>(shortBreak / 60);
    const [longBreakMinutes, setLongBreakMinutes] = useState<number>(longBreak / 60);
    const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
    const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
    const [vibrationEnabled, setVibrationEnabled] = useState<boolean>(true);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const notifications = await AsyncStorage.getItem('notificationsEnabled');
            const sound = await AsyncStorage.getItem('soundEnabled');
            const vibration = await AsyncStorage.getItem('vibrationEnabled');

            if (notifications !== null) setNotificationsEnabled(JSON.parse(notifications));
            if (sound !== null) setSoundEnabled(JSON.parse(sound));
            if (vibration !== null) setVibrationEnabled(JSON.parse(vibration));
        } catch (error) {
            console.log('Error loading settings:', error);
        }
    };

    const saveSettings = async () => {
        try {
            await AsyncStorage.setItem('notificationsEnabled', JSON.stringify(notificationsEnabled));
            await AsyncStorage.setItem('soundEnabled', JSON.stringify(soundEnabled));
            await AsyncStorage.setItem('vibrationEnabled', JSON.stringify(vibrationEnabled));

            onUpdateSettings({
                workDuration: workMinutes * 60,
                shortBreak: shortBreakMinutes * 60,
                longBreak: longBreakMinutes * 60,
            });

            navigation.goBack();
        } catch (error) {
            console.log('Error saving settings:', error);
        }
    };

    const adjustTime = (type: 'work' | 'short' | 'long', increment: boolean) => {
        const change = increment ? 1 : -1;

        switch (type) {
            case 'work':
                setWorkMinutes(Math.max(1, workMinutes + change));
                break;
            case 'short':
                setShortBreakMinutes(Math.max(1, shortBreakMinutes + change));
                break;
            case 'long':
                setLongBreakMinutes(Math.max(1, longBreakMinutes + change));
                break;
        }
    };

    const TimeAdjuster = ({
        label,
        value,
        onDecrease,
        onIncrease
    }: {
        label: string;
        value: number;
        onDecrease: () => void;
        onIncrease: () => void;
    }) => (
        <View style={styles.timeAdjuster}>
            <Text style={[styles.timeLabel, { color: palette.btnText }]}>{label}</Text>
            <View style={styles.timeControls}>
                <TouchableOpacity
                    style={[styles.timeButton, { backgroundColor: palette.btn }]}
                    onPress={onDecrease}
                >
                    <Ionicons name="remove" size={24} color={palette.btnText} />
                </TouchableOpacity>
                <Text style={[styles.timeValue, { color: palette.btnText }]}>{value} min</Text>
                <TouchableOpacity
                    style={[styles.timeButton, { backgroundColor: palette.btn }]}
                    onPress={onIncrease}
                >
                    <Ionicons name="add" size={24} color={palette.btnText} />
                </TouchableOpacity>
            </View>
        </View>
    );

    const SettingItem = ({
        label,
        value,
        onValueChange,
        icon
    }: {
        label: string;
        value: boolean;
        onValueChange: (value: boolean) => void;
        icon: string;
    }) => (
        <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
                <Ionicons name={icon as any} size={24} color={palette.btnText} />
                <Text style={[styles.settingLabel, { color: palette.btnText }]}>{label}</Text>
            </View>
            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{ false: '#767577', true: palette.btn }}
                thumbColor={value ? palette.btnText : '#f4f3f4'}
            />
        </View>
    );

    return (
        <ImageBackground
            source={require('../../assets/bg_dark.png')}
            style={[styles.background, { backgroundColor: palette.bg }]}
            resizeMode="cover"
            blurRadius={10}
        >
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={28} color={palette.btnText} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: palette.btnText }]}>Settings</Text>
                    <TouchableOpacity onPress={saveSettings}>
                        <Text style={[styles.saveText, { color: palette.btnText }]}>Save</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Timer Duration Section */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: palette.btnText }]}>Timer Duration</Text>

                        <TimeAdjuster
                            label="Work Session"
                            value={workMinutes}
                            onDecrease={() => adjustTime('work', false)}
                            onIncrease={() => adjustTime('work', true)}
                        />

                        <TimeAdjuster
                            label="Short Break"
                            value={shortBreakMinutes}
                            onDecrease={() => adjustTime('short', false)}
                            onIncrease={() => adjustTime('short', true)}
                        />

                        <TimeAdjuster
                            label="Long Break"
                            value={longBreakMinutes}
                            onDecrease={() => adjustTime('long', false)}
                            onIncrease={() => adjustTime('long', true)}
                        />
                    </View>

                    {/* Notifications Section */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: palette.btnText }]}>Notifications</Text>

                        <SettingItem
                            label="Push Notifications"
                            value={notificationsEnabled}
                            onValueChange={setNotificationsEnabled}
                            icon="notifications-outline"
                        />

                        <SettingItem
                            label="Sound Alerts"
                            value={soundEnabled}
                            onValueChange={setSoundEnabled}
                            icon="volume-high-outline"
                        />

                        <SettingItem
                            label="Vibration"
                            value={vibrationEnabled}
                            onValueChange={setVibrationEnabled}
                            icon="phone-portrait-outline"
                        />
                    </View>

                    {/* Theme Section */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: palette.btnText }]}>Appearance</Text>

                        <TouchableOpacity
                            style={styles.themeSelector}
                            onPress={() => navigation.navigate('Theme', {
                                selectedPalette: paletteIdx,
                                onSelectPalette: (index: number) => {
                                    // This will be handled by the parent component
                                }
                            })}
                        >
                            <View style={styles.settingLeft}>
                                <Ionicons name="color-palette-outline" size={24} color={palette.btnText} />
                                <Text style={[styles.settingLabel, { color: palette.btnText }]}>Color Theme</Text>
                            </View>
                            <View style={styles.themePreview}>
                                <View style={[styles.colorDot, { backgroundColor: palette.bg }]} />
                                <Text style={[styles.themeName, { color: palette.btnText }]}>
                                    {COLOR_PALETTES[paletteIdx].name}
                                </Text>
                                <Ionicons name="chevron-forward" size={20} color={palette.btnText} />
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* About Section */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: palette.btnText }]}>About</Text>

                        <View style={styles.aboutItem}>
                            <Text style={[styles.aboutLabel, { color: palette.btnText }]}>Version</Text>
                            <Text style={[styles.aboutValue, { color: palette.btnText }]}>1.0.0</Text>
                        </View>

                        <View style={styles.aboutItem}>
                            <Text style={[styles.aboutLabel, { color: palette.btnText }]}>Pomodoro Technique</Text>
                            <Text style={[styles.aboutSubtext, { color: palette.btnText }]}>
                                Work in 25-minute focused sessions followed by 5-minute breaks
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
    },
    container: {
        flex: 1,
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    saveText: {
        fontSize: 16,
        fontWeight: '600',
    },
    content: {
        flex: 1,
    },
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    timeAdjuster: {
        marginBottom: 20,
    },
    timeLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    timeControls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    timeButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 20,
    },
    timeValue: {
        fontSize: 18,
        fontWeight: 'bold',
        minWidth: 80,
        textAlign: 'center',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingLabel: {
        fontSize: 16,
        marginLeft: 12,
    },
    themeSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    themePreview: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    colorDot: {
        width: 20,
        height: 20,
        borderRadius: 10,
        marginRight: 8,
    },
    themeName: {
        fontSize: 14,
        marginRight: 8,
    },
    aboutItem: {
        paddingVertical: 8,
    },
    aboutLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    aboutValue: {
        fontSize: 14,
        opacity: 0.8,
    },
    aboutSubtext: {
        fontSize: 14,
        opacity: 0.8,
        lineHeight: 20,
    },
});
