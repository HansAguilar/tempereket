import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Clipboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '../context/GameContext';

// Simple Clipboard placeholder if expo-clipboard not installed
const copyToClipboard = (text: string) => {
    // In valid React Native, use import * as Clipboard from 'expo-clipboard';
    // For now we just Alert or ignore.
    Alert.alert("Room Code", text);
};

export const SetupScreen = ({ navigation }: any) => {
    const { state, dispatch } = useGame();
    const [playerName, setPlayerName] = useState('');

    const isOnline = state.mode === 'online';
    const isHost = state.isHost;

    const addPlayer = () => {
        if (!playerName.trim()) return;

        // In Online mode, ADD_PLAYER joins YOU to the list.
        // If you are already in the list, update name?
        // Simplified: Just add. 
        // In Online, we use `localPlayerId`.
        const idToUse = isOnline ? state.localPlayerId : undefined;

        // Check if I already joined?
        if (isOnline && state.players.some(p => p.id === state.localPlayerId)) {
            Alert.alert("Already Joined", "You are already in the game!");
            return;
        }

        dispatch({
            type: 'ADD_PLAYER',
            payload: { name: playerName, isCpu: false, id: idToUse! }
        });
        setPlayerName('');
    };

    const addCpu = () => {
        dispatch({
            type: 'ADD_PLAYER',
            payload: { name: 'CPU ' + (state.players.length + 1), isCpu: true }
        });
    };

    const startGame = () => {
        if (state.players.length < 2) {
            Alert.alert("Not enough players", "You need at least 2 players to start.");
            return;
        }
        dispatch({ type: 'START_ROUND' });
        navigation.navigate('Game');
    };

    // Nav to Game automatically if Online and Round Started
    useEffect(() => {
        // If we are waiting in lobby and roundPhase becomes 'chanting' (triggered by Host start), nav to Game.
        // But actually, 'START_ROUND' -> 'chanting'.
        // If host clicks Start, they navigate.
        // Remote players: receive 'START_ROUND' action -> state updates to 'chanting'.
        // This Effect detects that.
        if (state.roundPhase === 'chanting') {
            navigation.navigate('Game');
        }
    }, [state.roundPhase, navigation]);

    // Intercept Back Button to Ask for Confirmation / Leave Room
    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
            if (state.mode === 'online' && state.players.length > 0) {
                // Prevent default behavior of leaving the screen
                e.preventDefault();

                Alert.alert(
                    'Leave Room?',
                    'Are you sure you want to leave the room?',
                    [
                        { text: "Don't leave", style: 'cancel', onPress: () => { } },
                        {
                            text: 'Leave',
                            style: 'destructive',
                            // If the user confirmed, then we dispatch the action we blocked earlier
                            // This will continue the action that had triggered the removal of the screen
                            onPress: () => {
                                // Broadcast removal of self (or just dispatch if local refactor)
                                // If I am joined, I should remove myself.
                                // If I am just watching?
                                if (state.localPlayerId) {
                                    const myPlayer = state.players.find(p => p.id === state.localPlayerId);
                                    if (myPlayer) {
                                        dispatch({ type: 'REMOVE_PLAYER', payload: { id: myPlayer.id } });
                                    }
                                }
                                // Reset State on Leave
                                dispatch({ type: 'RESET_GAME' });
                                navigation.dispatch(e.data.action);
                            },
                        },
                    ]
                );
            } else if (state.mode === 'local') {
                // Local mode confirmation
                e.preventDefault();
                Alert.alert(
                    'Quit Game?',
                    'Are you sure you want to quit setup?',
                    [
                        { text: "Cancel", style: 'cancel', onPress: () => { } },
                        {
                            text: 'Quit',
                            style: 'destructive',
                            onPress: () => {
                                dispatch({ type: 'RESET_GAME' });
                                navigation.dispatch(e.data.action);
                            },
                        },
                    ]
                );
            }
        });

        return unsubscribe;
    }, [navigation, state.mode, state.players, state.localPlayerId]);

    return (
        <SafeAreaView style={styles.container}>
            {isOnline ? (
                <View style={styles.roomHeader}>
                    <Text style={styles.roomLabel}>Room Code:</Text>
                    <TouchableOpacity onPress={() => copyToClipboard(state.roomCode || '')}>
                        <Text style={styles.roomCode}>{state.roomCode}</Text>
                    </TouchableOpacity>
                    <Text style={styles.waiting}>
                        {isHost ? "Waiting for players..." : "Waiting for Host to start..."}
                    </Text>
                </View>
            ) : (
                <Text style={styles.header}>Setup Game</Text>
            )}

            {/* Input only if not joined yet (for Online) OR always for Local */}
            {(!isOnline || !state.players.some(p => p.id === state.localPlayerId)) && (
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder={isOnline ? "Enter Your Name" : "Enter Player Name"}
                        value={playerName}
                        onChangeText={setPlayerName}
                    />
                    <TouchableOpacity style={styles.addButton} onPress={addPlayer}>
                        <Text style={styles.addText}>+</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Only Host or Local can add CPU */}
            {(!isOnline || isHost) && (
                <TouchableOpacity style={styles.cpuButton} onPress={addCpu}>
                    <Text style={styles.cpuText}>Add CPU Player</Text>
                </TouchableOpacity>
            )}

            <View style={styles.listContainer}>
                <Text style={styles.subHeader}>Players ({state.players.length})</Text>
                <ScrollView>
                    {state.players.map((p, i) => (
                        <View key={p.id} style={styles.playerRow}>
                            <Text style={styles.playerText}>
                                {i + 1}. {p.name} {p.isCpu ? '(CPU)' : ''}
                                {isOnline && p.id === state.localPlayerId ? ' (YOU)' : ''}
                            </Text>
                        </View>
                    ))}
                </ScrollView>
            </View>

            {/* Start Button: Local (Always), Online (Only Host) */}
            {state.players.length >= 2 && (!isOnline || isHost) && (
                <TouchableOpacity style={styles.startButton} onPress={startGame}>
                    <Text style={styles.startText}>Start Game</Text>
                </TouchableOpacity>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#FAFAFA' },
    header: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, color: '#333' },
    roomHeader: { alignItems: 'center', marginBottom: 20, padding: 15, backgroundColor: '#E3F2FD', borderRadius: 15 },
    roomLabel: { fontSize: 16, color: '#555' },
    roomCode: { fontSize: 36, fontWeight: 'bold', color: '#6C63FF', letterSpacing: 5 },
    waiting: { marginTop: 5, color: '#888', fontStyle: 'italic' },

    inputContainer: { flexDirection: 'row', marginBottom: 10 },
    input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 10, padding: 10, marginRight: 10, backgroundColor: 'white' },
    addButton: { width: 50, justifyContent: 'center', alignItems: 'center', backgroundColor: '#333', borderRadius: 10 },
    addText: { color: 'white', fontSize: 24 },
    cpuButton: { marginBottom: 20, alignSelf: 'flex-start' },
    cpuText: { color: '#6C63FF', fontWeight: 'bold' },
    listContainer: { flex: 1 },
    subHeader: { fontSize: 18, fontWeight: '600', marginBottom: 10 },
    playerRow: { padding: 15, backgroundColor: 'white', borderRadius: 10, marginBottom: 10, elevation: 2 },
    playerText: { fontSize: 16, color: '#555' },
    startButton: { backgroundColor: '#FF6B6B', padding: 15, borderRadius: 15, alignItems: 'center', marginTop: 10 },
    startText: { color: 'white', fontSize: 20, fontWeight: 'bold' }
});
