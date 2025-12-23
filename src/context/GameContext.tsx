import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { RealtimeService, supabase } from '../services/supabase';

// Types
export type ChantWord = 'Si' | 'Kwali' | 'Hindu' | 'Pak' | 'Tempe' | 'Reket';
export const CHANT_WORDS: ChantWord[] = ['Si', 'Kwali', 'Hindu', 'Pak', 'Tempe', 'Reket'];

export type PlayerStatus = 'active' | 'eliminated';
export type GameMode = 'local' | 'online';

export interface Player {
    id: string;
    name: string;
    isCpu: boolean;
    maxFingers: number;
    selectedFingers: number;
    selectedBet: ChantWord;
    status: PlayerStatus;
}

export interface GameState {
    mode: GameMode;
    roomCode: string | null;
    localPlayerId: string | null; // For online mode, who am I?
    isHost: boolean; // Only host controls flow in online

    players: Player[];
    roundPhase: 'setup' | 'chanting' | 'result' | 'gameover';
    currentChantIndex: number;
    currentGlobalFingerCount: number;
    totalFingersInRound: number;
    targetFingerIndex: number;
    losingPlayerId: string | null;
    winnerPlayerId: string | null;
}

type Action =
    | { type: 'SET_MODE'; payload: GameMode }
    | { type: 'SET_ROOM'; payload: { code: string; localId: string; isHost: boolean } }
    | { type: 'SYNC_STATE'; payload: Partial<GameState> } // Massive sync from server
    | { type: 'ADD_PLAYER'; payload: { name: string; isCpu: boolean; id?: string } }
    | { type: 'SET_PLAYER_INPUT'; payload: { id: string; fingers: number; bet: ChantWord } }
    | { type: 'START_ROUND' }
    | { type: 'STEP_CHANT' }
    | { type: 'RESOLVE_ROUND' }
    | { type: 'RESET_GAME' }
    | { type: 'NEXT_ROUND' }
    | { type: 'REMOVE_PLAYER'; payload: { id: string } };

const INITIAL_STATE: GameState = {
    mode: 'local',
    roomCode: null,
    localPlayerId: null,
    isHost: true, // Always true for local

    players: [],
    roundPhase: 'setup',
    currentChantIndex: -1,
    currentGlobalFingerCount: 0,
    totalFingersInRound: 0,
    targetFingerIndex: -1,
    losingPlayerId: null,
    winnerPlayerId: null,
};

const GameContext = createContext<{
    state: GameState;
    dispatch: React.Dispatch<Action>;
    broadcast: (action: any) => void;
} | null>(null);

const gameReducer = (state: GameState, action: Action): GameState => {
    switch (action.type) {
        case 'SET_MODE':
            return { ...state, mode: action.payload };

        case 'SET_ROOM':
            return {
                ...state,
                roomCode: action.payload.code,
                localPlayerId: action.payload.localId,
                isHost: action.payload.isHost
            };

        case 'SYNC_STATE':
            return { ...state, ...action.payload };

        case 'ADD_PLAYER':
            // Prevent duplicates in online mode if multiple syncs happen
            if (state.players.find(p => p.id === action.payload.id)) return state;

            return {
                ...state,
                players: [
                    ...state.players,
                    {
                        id: action.payload.id || Date.now().toString() + Math.random(),
                        name: action.payload.name,
                        isCpu: action.payload.isCpu,
                        maxFingers: 5,
                        selectedFingers: 1, // Default to avoid nulls
                        selectedBet: 'Si',
                        status: 'active',
                    },
                ],
            };

        case 'REMOVE_PLAYER':
            return {
                ...state,
                players: state.players.filter(p => p.id !== action.payload.id),
            };

        case 'SET_PLAYER_INPUT':
            return {
                ...state,
                players: state.players.map((p) =>
                    p.id === action.payload.id
                        ? { ...p, selectedFingers: action.payload.fingers, selectedBet: action.payload.bet }
                        : p
                ),
            };

        case 'START_ROUND': {
            const activePlayers = state.players.filter(p => p.status === 'active');
            const totalFingers = activePlayers.reduce((sum, p) => sum + p.selectedFingers, 0);
            return {
                ...state,
                roundPhase: 'chanting',
                currentChantIndex: -1,
                currentGlobalFingerCount: 0,
                totalFingersInRound: totalFingers,
                targetFingerIndex: totalFingers,
                losingPlayerId: null,
            };
        }

        case 'STEP_CHANT': {
            const nextCount = state.currentGlobalFingerCount + 1;
            const nextWordIndex = (state.currentChantIndex + 1) % CHANT_WORDS.length;
            return {
                ...state,
                currentGlobalFingerCount: nextCount,
                currentChantIndex: nextWordIndex,
            };
        }

        case 'RESOLVE_ROUND': {
            let remainingCount = state.totalFingersInRound;
            let loserId: string | null = null;
            let updatedPlayers = [...state.players];
            for (const player of updatedPlayers) {
                if (player.status !== 'active') continue;
                if (remainingCount <= player.selectedFingers) {
                    loserId = player.id;
                    player.maxFingers -= 1;
                    if (player.maxFingers <= 0) player.status = 'eliminated';
                    break;
                }
                remainingCount -= player.selectedFingers;
            }

            const activeCount = updatedPlayers.filter(p => p.status === 'active').length;
            let phase: GameState['roundPhase'] = 'result';
            let winnerId: string | null = null;
            if (activeCount <= 1) {
                phase = 'gameover';
                const lastMan = updatedPlayers.find(p => p.status === 'active');
                winnerId = lastMan ? lastMan.id : null;
            }

            return {
                ...state,
                players: updatedPlayers,
                roundPhase: phase,
                losingPlayerId: loserId,
                winnerPlayerId: winnerId
            };
        }

        case 'RESET_GAME':
            return {
                ...INITIAL_STATE,
                mode: state.mode, // Preserve Mode
                roomCode: state.roomCode,
                localPlayerId: state.localPlayerId,
                isHost: state.isHost,
                players: [],
            };

        case 'NEXT_ROUND':
            return {
                ...state,
                roundPhase: 'setup',
                currentChantIndex: -1,
                currentGlobalFingerCount: 0,
                totalFingersInRound: 0,
                targetFingerIndex: -1,
                losingPlayerId: null,
            };

        default:
            return state;
    }
};

export const GameProvider = ({ children }: { children: ReactNode }) => {
    const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE);

    // Online Sync
    useEffect(() => {
        if (state.mode === 'online' && state.roomCode) {
            console.log("Subscribing to Room:", state.roomCode);
            const channel = RealtimeService.subscribeToRoom(state.roomCode, (payload) => {
                // Determine what to do with payload
                // If payload is a full state sync? Or Action?
                // Let's broadcast Actions.
                if (payload.type) {
                    // Check if action is already applied? 
                    // Or just dispatch it blindly.
                    // Caution: infinite loops if we broadcast reception.
                    // We need a wrapper `broadcast` that sends, but `dispatch` just acts local.
                    // But if we receive, we `dispatch`.
                    console.log("Remote Action:", payload);
                    dispatch(payload);
                }
            });
            return () => { supabase.removeChannel(channel); };
        }
    }, [state.mode, state.roomCode]);

    const broadcast = (action: Action) => {
        // Apply locally
        dispatch(action);

        // Send to others if online
        if (state.mode === 'online' && state.roomCode) {
            // Need reference to channel? Or just recreate/cache?
            // `RealtimeService` helper might need context awareness or we fetch channel.
            // Simplified: Re-fetch channel (it's cached in supabase-js usually) or just send.
            // For prototype, let's assume we can get channel easily or pass it.
            // Actually, we need the channel instance from `subscribeToRoom`. 
            // I'll make `RealtimeService` manage a singleton channel map or simplistic approach.
            const channel = supabase.channel(`room:${state.roomCode}`);
            channel.send({
                type: 'broadcast',
                event: 'GAME_UPDATE',
                payload: action,
            });
        }
    };

    return (
        <GameContext.Provider value={{ state, dispatch: broadcast, broadcast }}>
            {/* Note: I replaced `dispatch` with `broadcast` so all UI calls auto-broadcast! */}
            {children}
        </GameContext.Provider>
    );
};

export const useGame = () => {
    const context = useContext(GameContext);
    if (!context) throw new Error("useGame must be used within GameProvider");
    return context;
};
