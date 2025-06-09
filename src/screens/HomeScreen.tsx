import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground, SafeAreaView, Switch } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLOR_PALETTES } from './ThemeScreen';
import NotificationService from '../services/NotificationService';
import SoundService from '../services/SoundService';

const WORK = 'Work';
const SHORT_BREAK = 'Short Break';
const LONG_BREAK = 'Long Break';
const POMODOROS_BEFORE_LONG = 4;

interface HomeScreenProps {
  navigation: any;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [seconds, setSeconds] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [viewAnalog, setViewAnalog] = useState<boolean>(false);
  const [session, setSession] = useState<string>(WORK);
  const [pomodoros, setPomodoros] = useState<number>(0);
  const [paletteIdx, setPaletteIdx] = useState<number>(0);
  const [workDuration, setWorkDuration] = useState<number>(25 * 60);
  const [shortBreak, setShortBreak] = useState<number>(5 * 60);
  const [longBreak, setLongBreak] = useState<number>(15 * 60);
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load palette
        const idx = await AsyncStorage.getItem('paletteIdx');
        if (idx) setPaletteIdx(Number(idx));

        // FR-14: Load daily Pomodoros with date check
        const today = new Date().toDateString();
        const lastDate = await AsyncStorage.getItem('lastPomodoroDate');
        const savedPomodoros = await AsyncStorage.getItem('pomodoros');

        if (lastDate === today && savedPomodoros) {
          setPomodoros(Number(savedPomodoros));
        } else {
          // New day - reset Pomodoros
          setPomodoros(0);
          await AsyncStorage.setItem('lastPomodoroDate', today);
          await AsyncStorage.setItem('pomodoros', '0');
        }

        // Load timer durations
        const workDur = await AsyncStorage.getItem('workDuration');
        const shortBr = await AsyncStorage.getItem('shortBreak');
        const longBr = await AsyncStorage.getItem('longBreak');

        if (workDur) setWorkDuration(Number(workDur));
        if (shortBr) setShortBreak(Number(shortBr));
        if (longBr) setLongBreak(Number(longBr));

        // Set initial timer based on current session
        if (session === WORK) setSeconds(workDuration);
        else if (session === SHORT_BREAK) setSeconds(shortBreak);
        else setSeconds(longBreak);
      } catch (error) {
        console.log('Error loading data:', error);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (isRunning) {
      timer = setInterval(() => {
        setSeconds((prev: number) => {
          if (prev > 0) {
            // FR-08, FR-09: Update ongoing notification with remaining time every minute
            if (prev % 60 === 0) { // Update every minute to avoid spam
              NotificationService.updateOngoingNotification(session, formatTime(prev - 1));
            }

            return prev - 1;
          }
          handleSessionEnd();
          return 0;
        });
      }, 1000);
    } else {
      // Clear ongoing notification when timer stops
      NotificationService.clearOngoingNotification();
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, session, workDuration, shortBreak, longBreak]);
  const handleSessionEnd = async () => {
    setIsRunning(false);
    // Clear ongoing notification first
    NotificationService.clearOngoingNotification();

    if (session === WORK) {
      // Show session end notification and play sound
      await NotificationService.showSessionEndNotification(session);
      await SoundService.vibrateSessionEnd();

      const newPomodoros = pomodoros + 1;
      setPomodoros(newPomodoros);

      // Save updated pomodoro count
      await AsyncStorage.setItem('pomodoros', newPomodoros.toString());

      if (newPomodoros % POMODOROS_BEFORE_LONG === 0) {
        setSession(LONG_BREAK);
        setSeconds(longBreak);
        // Show break start notification and play sound
        await NotificationService.showBreakStartNotification('Long Break');
        await SoundService.vibrateBreakStart();
      } else {
        setSession(SHORT_BREAK);
        setSeconds(shortBreak);
        // Show break start notification and play sound
        await NotificationService.showBreakStartNotification('Short Break');
        await SoundService.vibrateBreakStart();
      }
    } else {
      // Show break end notification and play sound
      await NotificationService.showBreakEndNotification();
      setSession(WORK);
      setSeconds(workDuration);
      // Show session start notification and play sound
      await NotificationService.showSessionStartNotification(WORK);
      await SoundService.vibrateWorkStart();
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const reset = () => {
    setIsRunning(false);
    // Clear ongoing notification when resetting
    NotificationService.clearOngoingNotification();
    setSession(WORK);
    setSeconds(workDuration);
  };
  const palette = COLOR_PALETTES[paletteIdx];

  return (
    <ImageBackground
      source={require('../../assets/bg_dark.png')}
      style={[styles.bg, { backgroundColor: palette.bg }]}
      resizeMode="cover"
      blurRadius={10}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('Settings', {
            workDuration,
            shortBreak,
            longBreak,
            paletteIdx,
            onUpdateSettings: (settings: any) => {
              setWorkDuration(settings.workDuration);
              setShortBreak(settings.shortBreak);
              setLongBreak(settings.longBreak);
            }
          })}>
            <Ionicons name="settings-outline" size={28} color="#ffffffcc" />
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
            <Text style={{ color: palette.btnText, marginRight: 8 }}>Analog</Text>
            <Switch value={viewAnalog} onValueChange={setViewAnalog} />
          </View>
        </View>

        <View style={styles.iconContainer}>
          <ImageBackground
            source={require('../../assets/icon.png')}
            style={styles.icon}
            resizeMode="contain"
          />
        </View>

        <Text style={[styles.session, { color: palette.btnText }]}>{session}</Text>

        {viewAnalog ? (
          <AnalogTimer seconds={seconds} total={session === WORK ? workDuration : session === SHORT_BREAK ? shortBreak : longBreak} color={palette.timer} />
        ) : (
          <Text style={[styles.timer, { color: palette.timer }]}>{formatTime(seconds)}</Text>
        )}

        <Text style={{ color: palette.btnText, marginBottom: 10 }}>Pomodoros Today: {pomodoros}</Text>

        <View style={styles.buttons}>
          <TouchableOpacity onPress={reset} style={[styles.btn, { backgroundColor: palette.btn }]}>
            <Text style={[styles.btnText, { color: palette.btnText }]}>Reset</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={async () => {
            if (!isRunning) {
              // Show session start notification when starting manually
              if (session === WORK) {
                await NotificationService.showSessionStartNotification(session);
              } else {
                await NotificationService.showBreakStartNotification(session);
              }
              // FR-08: Start ongoing notification when timer starts
              setTimeout(async () => {
                await NotificationService.showOngoingSessionNotification(session, formatTime(seconds));
              }, 1000); // Small delay to ensure session start notification shows first
            } else {
              // Clear ongoing notification when pausing
              NotificationService.clearOngoingNotification();
            }
            setIsRunning(!isRunning);
          }} style={[styles.btn, { backgroundColor: palette.btn }]}>
            <Text style={[styles.btnText, { color: palette.btnText }]}>{isRunning ? 'Pause' : 'Start'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Theme', {
            selectedPalette: paletteIdx,
            onSelectPalette: setPaletteIdx
          })} style={[styles.btn, { backgroundColor: palette.btn }]}>
            <Text style={[styles.btnText, { color: palette.btnText }]}>Theme</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

type AnalogTimerProps = { seconds: number; total: number; color: string };
function AnalogTimer({ seconds, total, color }: AnalogTimerProps) {
  const radius = 70;
  const stroke = 8;
  const progress = (total - seconds) / total;
  const angle = progress * 2 * Math.PI;
  return (
    <View style={{ alignItems: 'center', marginVertical: 20 }}>
      <View style={{ width: radius * 2, height: radius * 2 }}>
        <View style={{
          position: 'absolute',
          width: radius * 2,
          height: radius * 2,
          borderRadius: radius,
          borderWidth: stroke,
          borderColor: color,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <View style={{ position: 'absolute', width: 4, height: radius, backgroundColor: color, top: radius / 2, left: radius - 2, transform: [{ rotate: `${progress * 360}deg` }] }} />
        </View>
        <Text style={{ position: 'absolute', width: '100%', textAlign: 'center', top: radius - 24, fontSize: 32, color }}>
          {Math.floor(seconds / 60).toString().padStart(2, '0')}:{(seconds % 60).toString().padStart(2, '0')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 50,
  },
  header: {
    width: '100%',
    alignItems: 'flex-end',
  },
  iconContainer: {
    width: 140,
    height: 140,
  },
  icon: {
    width: '100%',
    height: '100%',
  },
  timer: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#e0f7ff',
    marginVertical: 20,
  },
  session: {
    fontSize: 32,
    fontWeight: '500',
    marginBottom: 10,
  },
  buttons: {
    flexDirection: 'row',
    gap: 20,
  },
  btn: {
    backgroundColor: '#007acc',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
  },
  btnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
