/* eslint-disable @typescript-eslint/no-unused-vars */
import { PlayerColor, PlayerId, GamePhase } from './enums';
import { Player } from './Player';
import { BoardPoint } from './BoardPoint';
import { Checker } from './Checker';

export interface GameState {
    gameId: string;
    players: { [key: string]: Player }; // Allow string keys
    color: { [key in PlayerColor]?: Player };
    board: BoardPoint[]; // Array of 24 points (index 0 = point 1, index 23 = point 24)
    bar: { [key: string]: Checker[] }; // Use string keys to match backend's enum names
    borneOff: { [key : string]: Checker[] }; // Checkers borne off for each player
    currentPlayerId: PlayerId | null;   
    currentDiceRoll: number[] | null; // The actual dice shown, e.g., [6, 4]
    remainingMoves: number[] | null; // Dice numbers left to play, e.g., [6, 4] or [5, 5, 5, 5]
    phase: GamePhase;
    winnerId: PlayerId | null;
    initialRoll: number[] | null; // [P1_die, P2_die]
    
}

// Helper function to create a default/initial state
export const createInitialGameState = (): GameState => ({
    gameId: '',
    players: {},
    color: {},
    board: Array.from({ length: 24 }, (_, i) => ({ pointIndex: i + 1, checkers: [] })), // Initialize empty board
    bar: { [PlayerId.Player1]: [], [PlayerId.Player2]: [] },
    borneOff: { [PlayerId.Player1]: [], [PlayerId.Player2]: [] },
    currentPlayerId: null,
    currentDiceRoll: null,
    remainingMoves: null,
    phase: GamePhase.WaitingForPlayers,
    winnerId: null,
    initialRoll: null,
});