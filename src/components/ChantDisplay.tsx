import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CHANT_WORDS } from '../context/GameContext';

interface ChantDisplayProps {
    currentIndex: number; // 0-5
}

export const ChantDisplay: React.FC<ChantDisplayProps> = ({ currentIndex }) => {
    // If index is -1, show nothing or "Ready"
    if (currentIndex < 0) return (
        <View style={styles.container}>
            <Text style={styles.waitingText}>Ready...</Text>
        </View>
    );

    const currentWord = CHANT_WORDS[currentIndex]; // Safe access? currentIndex % length logic sits in context

    return (
        <View style={styles.container}>
            <Text style={styles.word}>{currentWord}</Text>
            <View style={styles.dots}>
                {CHANT_WORDS.map((w, i) => (
                    <View key={w} style={[styles.dot, i === currentIndex && styles.activeDot]} />
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 20,
    },
    word: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#333',
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    waitingText: {
        fontSize: 24,
        color: '#aaa',
        fontStyle: 'italic',
    },
    dots: {
        flexDirection: 'row',
        marginTop: 10,
        gap: 5,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#eee',
    },
    activeDot: {
        backgroundColor: '#333',
        transform: [{ scale: 1.2 }],
    }
});
