import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';

// REPLACE WITH YOUR SUPABASE URL AND ANON KEY
// For prototype, we can use empty strings if not provided, 
// but Realtime won't strictly work without a valid project.
// I will add a fallback or ask user.
// Since User said "no login required, use mock realtime or Supabase/Firebase",
// I will setup the Hook to be generic. 
// IF KEYS ARE MISSING, WE FALLBACK TO MOCK?
// The prompt said "use mock realtime OR Supabase".
// I will implement a "Mock Realtime" service if no keys are found, 
// but for "Online" usually keys are needed.
// I will assume User can fill these in.

// Placeholder keys - User needs to replace or I can simulate.
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Fallback to Mock Client if keys are missing
const isMock = !SUPABASE_URL || !SUPABASE_ANON_KEY;

// Mock implementation to prevent crashing
const mockClient = {
    channel: (name: string) => ({
        on: () => ({ subscribe: () => { } }),
        subscribe: (cb: any) => { if (cb) cb('SUBSCRIBED'); },
        send: async () => { },
        unsubscribe: () => { }
    }),
    removeChannel: () => { }
};

export const supabase = isMock
    ? (mockClient as any)
    : createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);

// -- Types --

export interface RoomPayload {
    roomId: string;
    players: any[];
    gameState: any;
}

// -- Realtime Service --

export const RealtimeService = {
    // Subscribe to a room channel
    subscribeToRoom: (roomId: string, onUpdate: (payload: any) => void) => {
        // Create channel
        const channel = supabase.channel(`room:${roomId}`, {
            config: {
                presence: {
                    key: roomId, // Use local player ID?
                },
                broadcast: { self: false }
            }
        });

        channel
            .on('broadcast', { event: 'GAME_UPDATE' }, (payload) => {
                console.log('Received update:', payload);
                if (payload.payload) {
                    onUpdate(payload.payload);
                }
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('Subscribed to room', roomId);
                }
            });

        return channel;
    },

    // Broadcast an update to the room
    broadcastUpdate: async (channel: any, payload: any) => {
        if (!channel) return;
        await channel.send({
            type: 'broadcast',
            event: 'GAME_UPDATE',
            payload: payload,
        });
    },

    // Mock Implementation for Testing if no Keys
    // ...
};
