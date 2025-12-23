import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '../context/GameContext';

export const GameOverScreen = ({ navigation }: any) => {
    const { state, dispatch } = useGame();

    // WinnerPlayerId tracks the LOSER in our logic (Last Man Standing is Loser)
    const loser = state.players.find(p => p.id === state.winnerPlayerId);

    const restart = () => {
        dispatch({ type: 'RESET_GAME' });
        navigation.reset({
            index: 0,
            routes: [{ name: 'Setup' }],
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>GAME OVER</Text>

            <View style={styles.loserCard}>
                <Text style={styles.loserLabel}>THE LOSER IS</Text>
                <Text style={styles.loserName}>{loser?.name || "Unknown"}</Text>
                <View style={styles.handDisplay}>
                    <Text style={styles.slapEmoji}>👋💥</Text>
                </View>
                <Text style={styles.punishment}>Prepare for Punishment!</Text>
            </View>

            <TouchableOpacity style={styles.button} onPress={restart}>
                <Text style={styles.buttonText}>Play Again</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#222', justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 48, fontWeight: '900', color: '#FF6B6B', marginBottom: 40, letterSpacing: 5 },
    loserCard: { backgroundColor: 'white', padding: 30, borderRadius: 20, alignItems: 'center', width: '80%', marginBottom: 50 },
    loserLabel: { fontSize: 16, color: '#888', marginBottom: 10, letterSpacing: 2 },
    loserName: { fontSize: 36, fontWeight: 'bold', color: '#333', marginBottom: 20 },
    handDisplay: { marginVertical: 20 },
    slapEmoji: { fontSize: 60 },
    punishment: { fontSize: 18, color: '#D32F2F', fontWeight: 'bold' },
    button: { backgroundColor: '#4ECDC4', paddingHorizontal: 40, paddingVertical: 15, borderRadius: 30 },
    buttonText: { color: '#222', fontSize: 20, fontWeight: 'bold' }
});
