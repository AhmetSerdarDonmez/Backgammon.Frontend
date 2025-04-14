// src/models/enums.ts
export enum PlayerColor {
    White = 0, 
    Black = 1
}

export enum PlayerId {
    Player1 = 1,
    Player2 = 2
}

export enum GamePhase {
    WaitingForPlayers = 0, // Use numbers to match backend
    StartingRoll = 1,     // Assuming backend might use 1 (or maybe skips it)
    PlayerTurn = 2,         // Matches logged value
    GameOver = 3          // Assuming backend might use 3
}