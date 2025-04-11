import { PlayerColor, PlayerId } from './enums';

export interface Player {
    id: PlayerId;
    connectionId: string; // SignalR connection ID (might not be needed directly in frontend state)
    name: string; // e.g., "Player 1"
    color: PlayerColor;
    // Calculated values - Backend will provide these within GameState if needed,
    // or Frontend can derive them from board/bar/borneoff state.
    // Let's rely on backend GameState for counts for now.
    // checkersOnBar?: number;
    // checkersBorneOff?: number;
}