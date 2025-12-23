import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CHANT_WORDS, ChantWord } from '../context/GameContext';

interface BetSelectorProps {
    value: ChantWord;
    onChange: (word: ChantWord) => void;
    disabled?: boolean;
}

export const BetSelector: React.FC<BetSelectorProps> = ({ value, onChange, disabled }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.label}>Bet Prediction:</Text>
            <View style={styles.grid}>
                {CHANT_WORDS.map((word) => (
                    <TouchableOpacity
                        key={word}
                        style={[
                            styles.button,
                            value === word && styles.selectedButton,
                            disabled && styles.disabledButton
                        ]}
                        onPress={() => !disabled && onChange(word)}
                        disabled={disabled}
                    >
                        <Text style={[styles.text, value === word && styles.selectedText]}>{word}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 10,
        alignItems: 'center',
        width: '100%',
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#333',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
    },
    button: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ccc',
        minWidth: 80,
        alignItems: 'center',
    },
    selectedButton: {
        backgroundColor: '#6C63FF',
        borderColor: '#6C63FF',
    },
    disabledButton: {
        opacity: 0.5,
    },
    text: {
        fontSize: 14,
        color: '#333',
    },
    selectedText: {
        color: 'white',
        fontWeight: 'bold',
    },
});
