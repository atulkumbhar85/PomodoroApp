import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    FlatList,
    ImageBackground
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const COLOR_PALETTES = [
    { name: 'Classic', bg: '#007acc', timer: '#e0f7ff', btn: '#007acc', btnText: '#fff' },
    { name: 'Midnight', bg: '#232946', timer: '#eebbc3', btn: '#232946', btnText: '#eebbc3' },
    { name: 'Forest', bg: '#2d6a4f', timer: '#b7e4c7', btn: '#40916c', btnText: '#fff' },
    { name: 'Sunrise', bg: '#ffb703', timer: '#fb8500', btn: '#ffb703', btnText: '#023047' },
    { name: 'Minimal', bg: '#fff', timer: '#222', btn: '#eee', btnText: '#222' },
];

interface ThemeScreenProps {
    navigation: any;
    route: {
        params: {
            selectedPalette: number;
            onSelectPalette: (index: number) => void;
        };
    };
}

export default function ThemeScreen({ navigation, route }: ThemeScreenProps) {
    const { selectedPalette, onSelectPalette } = route.params;
    const currentPalette = COLOR_PALETTES[selectedPalette];

    const handleSelectTheme = async (index: number) => {
        onSelectPalette(index);
        await AsyncStorage.setItem('paletteIdx', index.toString());
        navigation.goBack();
    };

    const renderThemeItem = ({ item, index }: { item: any; index: number }) => (
        <TouchableOpacity
            style={[
                styles.themeItem,
                { backgroundColor: item.bg },
                index === selectedPalette && styles.selectedTheme
            ]}
            onPress={() => handleSelectTheme(index)}
        >
            <View style={styles.themePreview}>
                <View style={[styles.previewCircle, { backgroundColor: item.timer }]} />
                <View style={[styles.previewButton, { backgroundColor: item.btn }]}>
                    <Text style={[styles.previewButtonText, { color: item.btnText }]}>Start</Text>
                </View>
            </View>
            <Text style={[styles.themeName, { color: item.btnText }]}>{item.name}</Text>
            {index === selectedPalette && (
                <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={item.btnText}
                    style={styles.checkIcon}
                />
            )}
        </TouchableOpacity>
    );

    return (
        <ImageBackground
            source={require('../../assets/bg.png')}
            style={[styles.background, { backgroundColor: currentPalette.bg }]}
            resizeMode="cover"
        >
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={28} color={currentPalette.btnText} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: currentPalette.btnText }]}>Choose Theme</Text>
                    <View style={{ width: 28 }} />
                </View>

                <FlatList
                    data={COLOR_PALETTES}
                    keyExtractor={(item) => item.name}
                    renderItem={renderThemeItem}
                    numColumns={2}
                    contentContainerStyle={styles.themeList}
                    columnWrapperStyle={styles.row}
                />
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
    themeList: {
        paddingVertical: 20,
    },
    row: {
        justifyContent: 'space-around',
    },
    themeItem: {
        width: 150,
        height: 180,
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        alignItems: 'center',
        justifyContent: 'space-between',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    selectedTheme: {
        borderWidth: 3,
        borderColor: '#fff',
    },
    themePreview: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
    },
    previewCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginBottom: 12,
    },
    previewButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
    },
    previewButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    themeName: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    checkIcon: {
        position: 'absolute',
        top: 8,
        right: 8,
    },
});
