export interface MoveData {
    // 0 = Bar for the current player
    // 1-24 = Board points
    startPointIndex: number;

    // 1-24 = Board points
    // 25 = Bear off for Player 1 (White)
    // 0 = Bear off for Player 2 (Black)
    endPointIndex: number;

    // As decided before, server calculates DiceValueUsed
}