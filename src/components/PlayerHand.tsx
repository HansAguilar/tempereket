import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Rect, G } from 'react-native-svg';
import { Player } from '../context/GameContext';

interface PlayerHandProps {
    player: Player;
    isCurrentTarget: boolean; // Is this player currently being counted?
    activeFingerIndex: number | null; // If targeting, which finger? (0-based)
}

// Simple Hand: A palm circle + 5 fingers fanned out.
// We only render `maxFingers`.
// We highlight `activeFingerIndex` if `isCurrentTarget`.

const FINGER_POSITIONS = [
    { x: 20, y: 50, angle: -60 }, // Thumb?
    { x: 45, y: 20, angle: -30 },
    { x: 80, y: 15, angle: 0 },   // Middle
    { x: 115, y: 20, angle: 30 },
    { x: 140, y: 50, angle: 60 },
];

export const PlayerHand: React.FC<PlayerHandProps> = ({ player, isCurrentTarget, activeFingerIndex }) => {
    const { maxFingers, selectedFingers } = player;

    // We need to show `maxFingers` slots.
    // But which ones are "Up" (selected)?
    // Usually in this game, you just show a number of fingers.
    // Visual representation: 
    // - Show `maxFingers` as "Available Fingers" (maybe ghosted/outlined?)
    // - Show `selectedFingers` as "Raised/Filled". 
    // - And we count the Raised ones.
    // Wait, if I have 5 fingers but only show 2:
    // I should only draw 2 active fingers?
    // But the "Losing Finger" is one of my real fingers.
    // If I show 2 fingers, and the chant ends on my 2nd finger...
    // Is that my Index finger? Or just "A" finger?
    // Logic: "The losing finger is removed".
    // This implies specific fingers matter.
    // BUT the prompt: "Each player selects how many fingers (1-5) they want to show."
    // If I choose 2, I hold up 2.
    // If I lose, I have 4 left. Next round I can choose 1-4.
    // So visually, I should just render `selectedFingers` number of items for the counting.
    // BUT to show damage, maybe I just show `maxFingers` as a stat?
    // Let's render `selectedFingers` clearly for the game loop.
    // The counting touches these specific rendered fingers.

    return (
        <View style={styles.container}>
            <Text style={[styles.name, isCurrentTarget && styles.activeName]}>
                {player.name} ({player.maxFingers} Left)
            </Text>

            <View style={styles.handContainer}>
                <Svg height="150" width="160" viewBox="0 0 160 150">
                    {/* Palm */}
                    <Circle cx="80" cy="110" r="35" fill={isCurrentTarget ? "#FFCDD2" : "#E0E0E0"} stroke="#333" strokeWidth="2" />

                    {/* Fingers - Render only `selectedFingers` for the Chant? 
               Usage: We visualize the fingers that are "In Play".
               We loop through `selectedFingers`.
           */}
                    {Array.from({ length: selectedFingers }).map((_, index) => {
                        // Calculate position - fan them out based on count
                        // Simple mapping to 5 positions roughly centered
                        // Center index is 2. 
                        // If 1 finger: pos 2.
                        // If 2 fingers: pos 1, 3? 
                        // Let's just use first N positions for stability.
                        const pos = FINGER_POSITIONS[index];
                        const isActive = isCurrentTarget && activeFingerIndex === index;

                        return (
                            <G key={index} rotation={pos.angle} origin={`${pos.x}, ${pos.y + 40}`}>
                                <Rect
                                    x={pos.x}
                                    y={pos.y}
                                    width="20"
                                    height="60"
                                    rx="10"
                                    fill={isActive ? "#FF5252" : "#FFCCBC"} // Red highlight if active
                                    stroke={isActive ? "#D32F2F" : "#333"}
                                    strokeWidth={isActive ? 3 : 2}
                                />
                                {isActive && (
                                    <Circle cx={pos.x + 10} cy={pos.y + 10} r="5" fill="white" />
                                )}
                            </G>
                        );
                    })}
                </Svg>
            </View>

            {player.selectedBet && (
                <View style={styles.betBadge}>
                    <Text style={styles.betText}>{player.selectedBet}</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        margin: 10,
    },
    handContainer: {
        height: 100, // clipped for overlap
        width: 160,
        justifyContent: 'flex-end',
    },
    name: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 4,
        color: '#333',
    },
    activeName: {
        color: '#D32F2F',
        transform: [{ scale: 1.1 }],
    },
    betBadge: {
        backgroundColor: '#333',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        marginTop: -10,
        zIndex: 10,
    },
    betText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    }
});
