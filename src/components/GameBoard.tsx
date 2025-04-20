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
}

// Helper function to get grid style for a point index (Verified logic)
const getPointGridStyle = (pointIndex: number): React.CSSProperties => {
    let gridColumn = 0;
    let gridRow = 0;

    if (pointIndex >= 1 && pointIndex <= 6) { // Bottom Right Quadrant (Points 1-6)
        gridRow = 2;
        gridColumn = 13 - pointIndex + 1; // Maps 1->13, 6->8
    } else if (pointIndex >= 7 && pointIndex <= 12) { // Bottom Left Quadrant (Points 7-12)
        gridRow = 2;
        gridColumn = 12 - pointIndex + 1; // Maps 7->6, 12->1
    } else if (pointIndex >= 13 && pointIndex <= 18) { // Top Left Quadrant (Points 13-18)
        gridRow = 1;
        gridColumn = pointIndex - 12; // Maps 13->1, 18->6
    } else if (pointIndex >= 19 && pointIndex <= 24) { // Top Right Quadrant (Points 19-24)
        gridRow = 1;
        gridColumn = pointIndex - 12 + 1; // Maps 19->8, 24->13
    }

    // Return object only if calculation is valid
    if (gridColumn > 0 && gridRow > 0) {
        return { gridColumn, gridRow };
    }
    return {}; // Return empty object otherwise
};



const GameBoard: React.FC<GameBoardProps> = ({
    gameState,
    onPointClick,
    onBarClick,
    selectedCheckerLocation,
    validMoveTargets
}) => {
    // Ensure board is an array before mapping


    const board = Array.isArray(gameState.board) ? gameState.board : [];
    const barCheckers = gameState.bar || {}; // Default to empty object
    const borneOffCheckers = gameState.borneOff || {}; // Default to empty object
    const selectedBarPlayerId = selectedCheckerLocation?.type === 'bar' ? selectedCheckerLocation.index as PlayerId : null;

    return (
        <div className="game-board-area">
            {/* Player 2 Bear Off Area (Left) */}
            <BearOffArea
                playerCheckers={borneOffCheckers[PlayerId.Player2] || []}
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
                    const isTopRow = point.pointIndex >= 13;
                    const isSelected = selectedCheckerLocation?.type === 'point' && selectedCheckerLocation.index === point.pointIndex;
                    const gridStyle = getPointGridStyle(point.pointIndex);

                    return (
                        <Point
                            key={point.pointIndex}
                            pointData={point}
                            isTopRow={isTopRow}
                            onClick={onPointClick}
                            isValidMoveTarget={validMoveTargets.includes(point.pointIndex)}
                            isSelected={isSelected}
                            style={gridStyle} // <<< APPLY CALCULATED STYLE
                        />
                    );
                })}

                {/* Bar Component - Positioned by its own CSS grid-column: 7 */}
                <Bar
                    player1Checkers={barCheckers[PlayerId.Player1] || []}
                    player2Checkers={barCheckers[PlayerId.Player2] || []}
                    selectedBarPlayerId={selectedBarPlayerId}
                    onBarClick={onBarClick}
                />
            </div>

            {/* Player 1 Bear Off Area (Right) */}
            <BearOffArea
                playerCheckers={borneOffCheckers[PlayerId.Player1] || []}
                playerId={PlayerId.Player1}
                playerColor={PlayerColor.White} />

        </div>
    );
};

export default GameBoard;