import React from 'react';
import { GameState } from '../models/GameState';
import Point from './Point';
import Bar from './Bar'; // Import Bar
import BearOffArea from './BearOffArea'; // Import BearOffArea
import './GameBoard.css';
import { PlayerId } from '../models/enums';

interface GameBoardProps {
    gameState: GameState;
    onPointClick: (pointIndex: number) => void;
    onBarClick: (playerId: PlayerId) => void; // Add handler for bar clicks
    selectedCheckerLocation: { type: 'point' | 'bar', index: number } | null; // Track selection
    validMoveTargets: number[]; // Indices of valid destinations
}

const GameBoard: React.FC<GameBoardProps> = ({
    gameState,
    onPointClick,
    onBarClick,
    selectedCheckerLocation,
    validMoveTargets
}) => {
    const board = gameState.board;
    const barCheckers = gameState.bar;
    const borneOffCheckers = gameState.borneOff;

    // Split points (same as before)
    const bottomRightPoints = board.slice(0, 6);
    const bottomLeftPoints = board.slice(6, 12);
    const topLeftPoints = board.slice(12, 18);
    const topRightPoints = board.slice(18, 24);

    const selectedBarPlayerId = selectedCheckerLocation?.type === 'bar' ? selectedCheckerLocation.index as PlayerId : null;


    return (
        <div className="game-board-area">
            {/* Player 2 Bear Off Area (Left) */}
            <BearOffArea
                playerCheckers={borneOffCheckers[PlayerId.Player2] || []}
                playerId={PlayerId.Player2}
                playerColor={PlayerColor.Black} />

            {/* Main Board */}
            <div className="game-board">
                {/* Top Row Points */}
                <div className="point-row top-row">
                    {topLeftPoints.slice().reverse().map(point => (
                        <Point
                            key={point.pointIndex}
                            pointData={point}
                            isTopRow={true}
                            onClick={onPointClick}
                            isValidMoveTarget={validMoveTargets.includes(point.pointIndex)} isSelected={false}                        />
                    ))}
                </div>
                <div className="point-row top-row">
                    {topRightPoints.slice().reverse().map(point => (
                        <Point
                            key={point.pointIndex}
                            pointData={point}
                            isTopRow={true}
                            onClick={onPointClick}
                            isValidMoveTarget={validMoveTargets.includes(point.pointIndex)} isSelected={false}                        />
                    ))}
                </div>

                {/* Bar Component */}
                <Bar
                    player1Checkers={barCheckers[PlayerId.Player1] || []}
                    player2Checkers={barCheckers[PlayerId.Player2] || []}
                    selectedBarPlayerId={selectedBarPlayerId}
                    onBarClick={onBarClick}
                />

                {/* Bottom Row Points */}
                <div className="point-row bottom-row">
                    {bottomLeftPoints.map(point => (
                        <Point
                            key={point.pointIndex}
                            pointData={point}
                            isTopRow={false}
                            onClick={onPointClick}
                            isValidMoveTarget={validMoveTargets.includes(point.pointIndex)} isSelected={false}                        />
                    ))}
                </div>
                <div className="point-row bottom-row">
                    {bottomRightPoints.map(point => (
                        <Point
                            key={point.pointIndex}
                            pointData={point}
                            isTopRow={false}
                            onClick={onPointClick}
                            isValidMoveTarget={validMoveTargets.includes(point.pointIndex)} isSelected={false}                        />
                    ))}
                </div>
            </div>

            {/* Player 1 Bear Off Area (Right) */}
            <BearOffArea
                playerCheckers={borneOffCheckers[PlayerId.Player1] || []}
                playerId={PlayerId.Player1}
                playerColor={PlayerColor.White} />

        </div>
    );
};

// Re-import PlayerColor if used directly (like above)
import { PlayerColor } from '../models/enums';

export default GameBoard;