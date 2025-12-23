import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface FingerSelectorProps {
    value: number;
    max: number; // Constrained by player's maxFingers
    onChange: (value: number) => void;
    disabled?: boolean;
}

export const FingerSelector: React.FC<FingerSelectorProps> = ({ value, max, onChange, disabled }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.label}>Show Fingers:</Text>
            <View style={styles.row}>
                {Array.from({ length: 5 }).map((_, i) => {
                    const num = i + 1;
                    const isSelected = value === num;
                    const isAllowed = num <= max;

                    return (
                        <TouchableOpacity
                            key={num}
                            style={[
                                styles.button,
                                isSelected && styles.selectedButton,
                                (!isAllowed || disabled) && styles.disabledButton
                            ]}
                            onPress={() => isAllowed && !disabled && onChange(num)}
                            disabled={!isAllowed || disabled}
                        >
                            <Text style={[styles.text, isSelected && styles.selectedText]}>{num}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 10,
        alignItems: 'center',
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#333',
    },
    row: {
        flexDirection: 'row',
        gap: 10,
    },
    button: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#eee',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ccc',
    },
    selectedButton: {
        backgroundColor: '#333',
        borderColor: '#333',
    },
    disabledButton: {
        opacity: 0.3,
        backgroundColor: '#ccc',
    },
    text: {
        fontSize: 18,
        color: '#333',
    },
    selectedText: {
        color: 'white',
        fontWeight: 'bold',
    },
});
