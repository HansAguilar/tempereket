import { Player } from "../context/GameContext";

export const getFingerOwner = (players: Player[], globalCount: number) => {
    // Determine which player and which of their fingers corresponds to the global count
    // globalCount is 1-based index from the start of the cycle.

    // Step 1: Normalize globalCount to be within [1, TotalFingers] if needed, 
    // but the game state usually tracks absolute progress up to TotalFingers.
    // If globalCount > TotalFingers, it shouldn't happen during valid Chanting phase.

    let currentCount = 0;

    for (const player of players) {
        if (player.status !== 'active') continue;

        // Does this player contain the globalCount?
        if (currentCount + player.selectedFingers >= globalCount) {
            // Yes.
            // Local finger index (0-based) = globalCount - currentCount - 1
            const localIndex = globalCount - currentCount - 1;
            return { playerId: player.id, fingerIndex: localIndex };
        }

        currentCount += player.selectedFingers;
    }

    return null;
};

export const getFingerColor = (index: number) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#1A535C', '#F7FFF7'];
    return colors[index % colors.length];
};
