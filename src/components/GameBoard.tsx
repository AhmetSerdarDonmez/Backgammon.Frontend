// src/components/GameBoard.tsx
import React from 'react';
import { GameState } from '../models/GameState';
import Point from './Point';
import Bar from './Bar';
import BearOffArea from './BearOffArea';
import './GameBoard.css'; // Make sure CSS is imported
import { PlayerId, PlayerColor } from '../models/enums';

interface GameBoardProps {
    gameState: GameState;
    onPointClick: (pointIndex: number) => void;
    onBarClick: (playerId: PlayerId) => void;
    selectedCheckerLocation: { type: 'point' | 'bar', index: number } | null;
    validMoveTargets: number[];
    currentPlayerColor: PlayerColor | null; // <<< Added this prop
}

// Helper function to get grid style for a point index (Updated logic)
const getPointGridStyle = (
    pointIndex: number,
    currentPlayerColor: PlayerColor | null // <<< Added parameter
): React.CSSProperties => {
    let gridColumn = 0;
    let gridRow = 0;

    // Calculate base grid position (assuming Black's perspective initially)
    if (pointIndex >= 1 && pointIndex <= 6) {
        gridRow = 2;
        gridColumn = 13 - pointIndex + 1;
    } else if (pointIndex >= 7 && pointIndex <= 12) {
        gridRow = 2;
        gridColumn = 12 - pointIndex + 1;
    } else if (pointIndex >= 13 && pointIndex <= 18) {
        gridRow = 1;
        gridColumn = pointIndex - 12;
    } else if (pointIndex >= 19 && pointIndex <= 24) {
        gridRow = 1;
        gridColumn = pointIndex - 12 + 1;
    }

    // Mirror rows for white perspective <<< Added perspective logic
    if (currentPlayerColor === PlayerColor.White) {
        gridRow = gridRow === 1 ? 2 : 1;
    }

    return { gridColumn, gridRow };
};



const GameBoard: React.FC<GameBoardProps> = ({
    gameState,
    onPointClick,
    onBarClick,
    selectedCheckerLocation,
    validMoveTargets,
    currentPlayerColor // <<< Destructured the new prop
}) => {
    // Ensure board is an array before mapping
    const board = Array.isArray(gameState.board) ? gameState.board : [];
    const barCheckers = gameState.bar || {}; // Default to empty object
    const borneOffCheckers = gameState.borneOff || {}; // Default to empty object
    const selectedBarPlayerId = selectedCheckerLocation?.type === 'bar' ? selectedCheckerLocation.index as PlayerId : null;

    // <<< Added dynamic perspective class
    const perspectiveClass = currentPlayerColor === PlayerColor.White ? 'white' : 'black';

    return (
        // <<< Applied dynamic class here
        <div className={`game-board-area perspective-${perspectiveClass}`}>
            {/* Player 2 Bear Off Area (Rendered based on perspective in CSS potentially) */}
            <BearOffArea
                playerCheckers={borneOffCheckers[PlayerId[PlayerId.Player2]] || []}
                playerId={PlayerId.Player2}
                playerColor={PlayerColor.Black} />

            {/* Main Board - Render Points directly inside */}
            <div className="game-board">
                {/* Render all 24 points */}
                {board.map(point => {
                    // Basic check if point data is valid
                    if (!point || typeof point.pointIndex !== 'number') {
                        console.error("Invalid point data encountered:", point);
                        return null; // Skip rendering invalid point data
                    }

                    // <<< Calculate gridStyle using the updated function and prop
                    const gridStyle = getPointGridStyle(point.pointIndex, currentPlayerColor);
                    // <<< Determine isTopRow based on the *calculated* gridRow
                    const isTopRow = gridStyle.gridRow === 1;
                    const isSelected = selectedCheckerLocation?.type === 'point' && selectedCheckerLocation.index === point.pointIndex;


                    return (
                        <Point
                            key={point.pointIndex}
                            pointData={point}
                            isTopRow={isTopRow} // <<< Use calculated isTopRow
                            onClick={onPointClick}
                            isValidMoveTarget={validMoveTargets.includes(point.pointIndex)}
                            isSelected={isSelected}
                            style={gridStyle} // <<< APPLY CALCULATED STYLE
                        />
                    );
                })}

                {/* Bar Component - Positioned by its own CSS grid-column: 7 */}
                <Bar
                    player1Checkers={barCheckers[PlayerId[PlayerId.Player1]] || []}
                    player2Checkers={barCheckers[PlayerId[PlayerId.Player2]] || []}
                    selectedBarPlayerId={selectedBarPlayerId}
                    onBarClick={onBarClick}
                />
            </div>

            {/* Player 1 Bear Off Area (Rendered based on perspective in CSS potentially) */}
            <BearOffArea
                playerCheckers={borneOffCheckers[PlayerId[PlayerId.Player1]] || []}
                playerId={PlayerId.Player1}
                playerColor={PlayerColor.White} />

        </div>
    );
};

export default GameBoard;