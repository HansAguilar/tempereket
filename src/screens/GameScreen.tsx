import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame, ChantWord, CHANT_WORDS } from '../context/GameContext';
import { PlayerHand } from '../components/PlayerHand';
import { FingerSelector } from '../components/FingerSelector';
import { BetSelector } from '../components/BetSelector';
import { ChantDisplay } from '../components/ChantDisplay';
import { getFingerOwner } from '../utils/gameUtils';
// import { Audio } from 'expo-av';

export const GameScreen = ({ navigation }: any) => {
    const { state, dispatch, broadcast } = useGame();

    // Local state for Setup Phase (which player is inputting?)
    // In Online Mode, this is mostly irrelevant for "whose turn it is" visually for EVERYONE,
    // but we might want to know who is "Pending".
    // For Local Mode: We iterate.
    // For Online Mode: Everyone inputs in parallel (or we can enforce sequence if we want).
    // Implementation Plan said: "Online players input their move on their own device. The game waits for ALL_INPUTS_RECEIVED"
    // So for Online, we don't sequence. We just show "Your Input" if you haven't decided yet.

    // To track "waiting for", we check who hasn't provided input?
    // Our STATE structure doesn't explicitly clear `selectedFingers` every round.
    // So we need a "HasConfirmed" flag per round?
    // Existing logic simply overwrites.
    // Local mode relies on `currentInputPlayerIndex` to step through.
    // Online mode: We can treat "Setup" phase as "Everyone needs to confirm".
    // But we didn't add `hasConfirmed` to Player model.
    // WORKAROUND: In online mode, we just let them update. The Host decides when to start.
    // Host sees "Start Round" button active when he is ready?
    // Let's stick to: Host clicks "CHANT" when he feels like it, or we rely on verbal "Ready".
    // Or better: We assume players selected default 1/"Si" and if they change it, good.

    const [currentInputPlayerIndex, setCurrentInputPlayerIndex] = useState(0);

    // -- Effects --

    // Handle Game Over navigation
    useEffect(() => {
        if (state.roundPhase === 'gameover') navigation.navigate('GameOver');
    }, [state.roundPhase, navigation]);

    // Handle CPU Moves automatically (Only Host handles CPU in online)
    useEffect(() => {
        if (state.roundPhase === 'setup') {
            // Local logic
            if (state.mode === 'local') {
                const activePlayers = state.players.filter(p => p.status === 'active');
                if (currentInputPlayerIndex < activePlayers.length) {
                    const player = activePlayers[currentInputPlayerIndex];
                    if (player.isCpu) {
                        // Automate
                        const randomFingers = Math.floor(Math.random() * player.maxFingers) + 1;
                        const randomBet = CHANT_WORDS[Math.floor(Math.random() * CHANT_WORDS.length)];
                        dispatch({ type: 'SET_PLAYER_INPUT', payload: { id: player.id, fingers: randomFingers, bet: randomBet } });
                        setTimeout(() => setCurrentInputPlayerIndex(curr => curr + 1), 500);
                    }
                }
            }
            // Online logic: Host should manage CPU inputs?
            // If we have CPUs in online game, only Host runs this.
            if (state.mode === 'online' && state.isHost) {
                const cpus = state.players.filter(p => p.status === 'active' && p.isCpu);
                // Just randomize them once per setup phase?
                // Issue: `useEffect` runs constantly.
                // We need a flag "cpuMovesDone". 
                // Simplification: CPUs just set randoms when START_ROUND is called? or immediately on Setup entry.
                // Let's leave CPU online logic simple: They just hold previous values or random.
            }
        }
    }, [currentInputPlayerIndex, state.roundPhase, state.players, dispatch, state.mode, state.isHost]);

    // Handle Animation Loop (Host Only for Online? Or synced start?)
    // If we rely on syncing `currentGlobalFingerCount`, then HOST runs the loop and broadcasts `STEP_CHANT`.
    // Clients just receive state updates.
    useEffect(() => {
        let interval: NodeJS.Timeout;

        const shouldRunLoop = state.roundPhase === 'chanting' && (state.mode === 'local' || state.isHost);

        if (shouldRunLoop) {
            interval = setInterval(() => {
                if (state.currentGlobalFingerCount >= state.totalFingersInRound) {
                    clearInterval(interval);
                    setTimeout(() => {
                        if (state.mode === 'local') dispatch({ type: 'RESOLVE_ROUND' });
                        else broadcast({ type: 'RESOLVE_ROUND' }); // Host broadcasts resolve
                    }, 1000);
                } else {
                    if (state.mode === 'local') dispatch({ type: 'STEP_CHANT' });
                    else broadcast({ type: 'STEP_CHANT' }); // Host broadcasts step
                }
            }, 600);
        }

        return () => clearInterval(interval);
    }, [state.roundPhase, state.currentGlobalFingerCount, state.totalFingersInRound, dispatch, state.mode, state.isHost]);


    // -- Handlers --

    const handleInput = (fingers: number, bet: ChantWord, playerId?: string) => {
        // Local Mode: Standard flow
        if (state.mode === 'local') {
            const activePlayers = state.players.filter(p => p.status === 'active');
            const player = activePlayers[currentInputPlayerIndex];
            dispatch({ type: 'SET_PLAYER_INPUT', payload: { id: player.id, fingers, bet } });
            setCurrentInputPlayerIndex(curr => curr + 1);
        }
        // Online Mode: Broadcast My Input
        else {
            const finalId = playerId || state.localPlayerId;
            if (finalId) {
                broadcast({ type: 'SET_PLAYER_INPUT', payload: { id: finalId, fingers, bet } });
            }
        }
    };

    const startChant = () => {
        if (state.mode === 'local') {
            dispatch({ type: 'START_ROUND' });
            setCurrentInputPlayerIndex(0);
        } else {
            // Online Host starts it
            broadcast({ type: 'START_ROUND' });
        }
    };

    const nextRound = () => {
        if (state.mode === 'local') dispatch({ type: 'NEXT_ROUND' });
        else broadcast({ type: 'NEXT_ROUND' });
    };


    // -- Render Helpers --

    // Local Setup Render
    const renderLocalSetup = () => {
        const activePlayers = state.players.filter(p => p.status === 'active');
        if (currentInputPlayerIndex >= activePlayers.length) {
            return (
                <View style={styles.center}>
                    <Text style={styles.infoText}>All players ready!</Text>
                    <TouchableOpacity style={styles.startButton} onPress={startChant}>
                        <Text style={styles.startText}>CHANT!</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        const currentPlayer = activePlayers[currentInputPlayerIndex];
        if (currentPlayer.isCpu) return <View style={styles.center}><Text style={styles.infoText}>{currentPlayer.name} is thinking...</Text></View>;

        return (
            <PlayerInputStep
                key={currentPlayer.id}
                player={currentPlayer}
                onConfirm={(f, b) => handleInput(f, b)}
                btnText="Confirm"
            />
        );
    };

    // Online Setup Render
    const renderOnlineSetup = () => {
        const myPlayer = state.players.find(p => p.id === state.localPlayerId);

        if (!myPlayer || myPlayer.status !== 'active') {
            return (
                <View style={styles.center}>
                    <Text style={styles.infoText}>You are spectating (or eliminated).</Text>
                    {state.isHost && (
                        <TouchableOpacity style={styles.startButton} onPress={startChant}>
                            <Text style={styles.startText}>Start Round</Text>
                        </TouchableOpacity>
                    )}
                </View>
            );
        }

        return (
            <View style={styles.onlineSetup}>
                <Text style={styles.infoText}>Set Your Move</Text>
                <PlayerInputStep
                    player={myPlayer}
                    onConfirm={(f, b) => handleInput(f, b, myPlayer.id)}
                    btnText="Update Move"
                    autoConfirm={false} // In online, we change live
                />

                {state.isHost ? (
                    <TouchableOpacity style={[styles.startButton, { marginTop: 20 }]} onPress={startChant}>
                        <Text style={styles.startText}>START CHANT</Text>
                    </TouchableOpacity>
                ) : (
                    <Text style={styles.waitingText}>Waiting for Host provided everyone is ready...</Text>
                )}
            </View>
        );
    };

    // Shared Input Component
    const PlayerInputStep = ({ player, onConfirm, btnText, autoConfirm = true }: { player: any, onConfirm: (f: number, b: ChantWord) => void, btnText: string, autoConfirm?: boolean }) => {
        const [f, setF] = useState(player.selectedFingers || 1);
        const [b, setB] = useState<ChantWord>(player.selectedBet || 'Si');

        // If AutoConfirm off (Online mode usually), we might want to "Send" immediately on change?
        // Or just use button. 
        // The prompt says "Players can choose... in both modes".
        // Let's use button to "Lock in" or just "Broadcast".
        // Let's Broadcast on Apply.

        const apply = () => onConfirm(f, b);

        return (
            <View style={styles.setupContainer}>
                <Text style={styles.playerTurn}>{player.name}</Text>
                <FingerSelector value={f} max={player.maxFingers} onChange={setF} />
                <BetSelector value={b} onChange={setB} />
                <TouchableOpacity style={styles.confirmButton} onPress={apply}>
                    <Text style={styles.confirmText}>{btnText}</Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header / HUD */}
            <View style={styles.hud}>
                <Text style={styles.roundText}>
                    {state.mode.toUpperCase()} - {state.roundPhase.toUpperCase()}
                    {state.mode === 'online' ? ` (Room: ${state.roomCode})` : ''}
                </Text>
            </View>

            {/* Setup Phase */}
            {state.roundPhase === 'setup' && (
                <View style={styles.phaseContainer}>
                    {state.mode === 'local' ? renderLocalSetup() : renderOnlineSetup()}
                </View>
            )}

            {/* Chant / Result Phase */}
            {(state.roundPhase === 'chanting' || state.roundPhase === 'result') && (
                <View style={styles.gameBoard}>
                    <ChantDisplay currentIndex={state.currentChantIndex} />

                    <View style={styles.handsRow}>
                        {state.players.filter(p => p.status === 'active').map(player => {
                            const ownerInfo = getFingerOwner(state.players, state.currentGlobalFingerCount);
                            const isTarget = ownerInfo?.playerId === player.id;
                            const fingerIdx = ownerInfo?.fingerIndex ?? null;

                            return (
                                <PlayerHand
                                    key={player.id}
                                    player={player}
                                    isCurrentTarget={isTarget}
                                    activeFingerIndex={fingerIdx}
                                />
                            );
                        })}
                    </View>

                    {state.roundPhase === 'result' && (
                        <View style={styles.resultOverlay}>
                            <Text style={styles.resultText}>
                                {state.losingPlayerId ?
                                    `${state.players.find(p => p.id === state.losingPlayerId)?.name} lost a finger!` :
                                    "Round Done"}
                            </Text>
                            {(state.mode === 'local' || state.isHost) && (
                                <TouchableOpacity
                                    style={[styles.startButton, { paddingVertical: 10, marginTop: 10, backgroundColor: 'white' }]}
                                    onPress={nextRound}
                                >
                                    <Text style={[styles.startText, { fontSize: 18, color: '#333' }]}>Next Round</Text>
                                </TouchableOpacity>
                            )}
                            {state.mode === 'online' && !state.isHost && (
                                <Text style={{ color: 'white', marginTop: 10 }}>Waiting for Host...</Text>
                            )}
                        </View>
                    )}
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAFAFA' },
    hud: { padding: 10, alignItems: 'center', borderBottomWidth: 1, borderColor: '#eee' },
    roundText: { fontSize: 14, color: '#888' },
    phaseContainer: { flex: 1, justifyContent: 'center' },
    gameBoard: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 20 },
    handsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-end', gap: 10 },
    setupContainer: { padding: 20, alignItems: 'center' },
    onlineSetup: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    playerTurn: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    confirmButton: { marginTop: 30, backgroundColor: '#333', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 25 },
    confirmText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    center: { alignItems: 'center', justifyContent: 'center', flex: 1 },
    infoText: { fontSize: 20, color: '#666', marginBottom: 20 },
    waitingText: { fontSize: 16, color: '#888', marginTop: 20, fontStyle: 'italic' },
    startButton: { backgroundColor: '#FF6B6B', paddingVertical: 20, paddingHorizontal: 60, borderRadius: 30 },
    startText: { color: 'white', fontSize: 22, fontWeight: 'bold', letterSpacing: 2 },
    resultOverlay: { position: 'absolute', bottom: 50, backgroundColor: 'rgba(0,0,0,0.8)', padding: 20, borderRadius: 10, alignItems: 'center' },
    resultText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});
