import { PlayerColor, PlayerId } from './enums';

export interface Checker {
    id: string; // Unique ID per checker piece (e.g., "W1", "B15")
    playerId: PlayerId;
    color: PlayerColor;
}