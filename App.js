import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GameProvider } from './src/context/GameContext';
import { HomeScreen } from './src/screens/HomeScreen';
import { SetupScreen } from './src/screens/SetupScreen';
import { GameScreen } from './src/screens/GameScreen';
import { GameOverScreen } from './src/screens/GameOverScreen';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <GameProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Setup" component={SetupScreen} />
            <Stack.Screen name="Game" component={GameScreen} />
            <Stack.Screen name="GameOver" component={GameOverScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </GameProvider>
    </SafeAreaProvider>
  );
}
