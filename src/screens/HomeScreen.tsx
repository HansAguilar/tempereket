import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '../context/GameContext';

export const HomeScreen = ({ navigation }: any) => {
    const { dispatch } = useGame();
    const [showOnlineModal, setShowOnlineModal] = useState(false);
    const [roomCode, setRoomCode] = useState('');

    const playLocal = () => {
        dispatch({ type: 'SET_MODE', payload: 'local' });
        // Reset game state for fresh local game?
        dispatch({ type: 'RESET_GAME' });
        navigation.navigate('Setup');
    };

    const playOnline = () => {
        setShowOnlineModal(true);
    };

    const createRoom = () => {
        const newCode = Math.random().toString(36).substring(2, 7).toUpperCase();
        const myId = Date.now().toString();

        dispatch({
            type: 'SET_MODE',
            payload: 'online'
        });
        dispatch({
            type: 'SET_ROOM',
            payload: { code: newCode, localId: myId, isHost: true }
        });

        setShowOnlineModal(false);
        navigation.navigate('Setup');
    };

    const joinRoom = () => {
        if (!roomCode.trim()) {
            Alert.alert("Error", "Please enter a room code");
            return;
        }

        const myId = Date.now().toString();

        dispatch({
            type: 'SET_MODE',
            payload: 'online'
        });
        dispatch({
            type: 'SET_ROOM',
            payload: { code: roomCode.toUpperCase(), localId: myId, isHost: false }
        });

        setShowOnlineModal(false);
        navigation.navigate('Setup');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Si Kwali</Text>
                <Text style={styles.subtitle}>Hindu Pak Tempe Reket</Text>

                <View style={styles.spacer} />

                <TouchableOpacity style={styles.button} onPress={playLocal}>
                    <Text style={styles.buttonText}>Play Local</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.button, styles.onlineButton]} onPress={playOnline}>
                    <Text style={styles.buttonText}>Play Online</Text>
                </TouchableOpacity>

                <Text style={styles.footer}>A Traditional Finger Game</Text>
            </View>

            {/* Online Modal */}
            <Modal visible={showOnlineModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Online Mode</Text>

                        <TouchableOpacity style={styles.modalButton} onPress={createRoom}>
                            <Text style={styles.buttonText}>Create Room</Text>
                        </TouchableOpacity>

                        <Text style={styles.orText}>- OR -</Text>

                        <View style={styles.joinContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Room Code"
                                value={roomCode}
                                onChangeText={setRoomCode}
                                autoCapitalize="characters"
                            />
                            <TouchableOpacity style={styles.joinButton} onPress={joinRoom}>
                                <Text style={styles.joinButtonText}>Join</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.closeButton} onPress={() => setShowOnlineModal(false)}>
                            <Text style={styles.closeText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAFAFA' },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    title: { fontSize: 42, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 10 },
    subtitle: { fontSize: 24, color: '#666', textAlign: 'center', marginBottom: 50 },
    spacer: { height: 50 },
    button: { backgroundColor: '#333', paddingHorizontal: 40, paddingVertical: 15, borderRadius: 30, marginBottom: 20, width: '80%', alignItems: 'center' },
    onlineButton: { backgroundColor: '#6C63FF' },
    buttonText: { color: 'white', fontSize: 20, fontWeight: 'bold' },
    footer: { position: 'absolute', bottom: 20, color: '#aaa' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: 'white', width: '90%', padding: 20, borderRadius: 20, alignItems: 'center' },
    modalTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    modalButton: { backgroundColor: '#6C63FF', paddingVertical: 15, width: '100%', borderRadius: 10, alignItems: 'center' },
    orText: { marginVertical: 15, color: '#aaa', fontWeight: 'bold' },
    joinContainer: { flexDirection: 'row', width: '100%', gap: 10 },
    input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 10, padding: 10, fontSize: 18, textAlign: 'center' },
    joinButton: { backgroundColor: '#4ECDC4', justifyContent: 'center', paddingHorizontal: 20, borderRadius: 10 },
    joinButtonText: { color: 'black', fontWeight: 'bold' },
    closeButton: { marginTop: 20 },
    closeText: { color: 'red', fontSize: 16 }
});
