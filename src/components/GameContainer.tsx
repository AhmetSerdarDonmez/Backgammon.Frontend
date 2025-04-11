/* eslint-disable @typescript-eslint/no-unused-vars */
// src/components/GameContainer.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { GameState } from '../models/GameState';
import { MoveData } from '../models/MoveData';
import { PlayerColor, PlayerId, GamePhase } from '../models/enums';
import GameBoard from './GameBoard';
import PlayerInfoPanel from './PlayerInfoPanel';
// import './GameContainer.css';

interface GameContainerProps {
    gameState: GameState;
    currentPlayerId: PlayerId | null;
    onRollDice: () => void;
    onMakeMove: (move: MoveData) => void;
    triggerNotification: (message: string, type?: 'error' | 'info' | 'success' | 'warning') => void;
}

const GameContainer: React.FC<GameContainerProps> = ({
    gameState,
    currentPlayerId,
    onRollDice,
    onMakeMove,
    triggerNotification
}) => {
    const [selectedLocation, setSelectedLocation] = useState<{
        type: 'point' | 'bar';
        index: number;
    } | null>(null);
    const [potentialMoveTargets, setPotentialMoveTargets] = useState<number[]>([]);

    const isMyTurn = gameState.currentPlayerId === currentPlayerId;
    const myColor = currentPlayerId === PlayerId.Player1
        ? PlayerColor.White
        : PlayerColor.Black;

    const canRoll = isMyTurn
        && gameState.phase === GamePhase.PlayerTurn
        && (!gameState.remainingMoves || gameState.remainingMoves.length === 0);

    const calculatePotentialTargets = useCallback((startPointIndex: number): number[] => {
        if (!gameState.remainingMoves) return [];

        const possibleMoves: number[] = [];
        const playerDirection = myColor === PlayerColor.White ? 1 : -1;

        gameState.remainingMoves.forEach((die: number) => {
            const targetIndex = startPointIndex + (die * playerDirection);

            if (myColor === PlayerColor.White && targetIndex > 24) {
                possibleMoves.push(25);
                return;
            }
            if (myColor === PlayerColor.Black && targetIndex < 1) {
                possibleMoves.push(0);
                return;
            }

            if (targetIndex >= 1 && targetIndex <= 24) {
                const targetPoint = gameState.board[targetIndex - 1];
                if (targetPoint.checkers.length > 1 &&
                    targetPoint.checkers[0].color !== myColor) return;

                possibleMoves.push(targetIndex);
            }
        });

        return possibleMoves;
    }, [gameState, myColor]);

    useEffect(() => {
        if (!selectedLocation) {
            setPotentialMoveTargets([]);
            return;
        }

        if (selectedLocation.type === 'point') {
            const startPoint = gameState.board[selectedLocation.index - 1];
            if (startPoint.checkers.length === 0 || startPoint.checkers[0].color !== myColor) {
                setSelectedLocation(null);
                return;
            }
            setPotentialMoveTargets(calculatePotentialTargets(selectedLocation.index));
        }

        if (selectedLocation.type === 'bar') {
            const barCheckers = gameState.bar[currentPlayerId!];
            if (!barCheckers || barCheckers.length === 0) {
                setSelectedLocation(null);
                return;
            }

            const entryPoint = myColor === PlayerColor.White
                ? (die: number) => die
                : (die: number) => 25 - die;

            setPotentialMoveTargets(gameState.remainingMoves!.map(entryPoint));
        }
    }, [selectedLocation, gameState, calculatePotentialTargets, myColor, currentPlayerId]);

    const handlePointClick = (pointIndex: number) => {
        if (!isMyTurn || !gameState.remainingMoves) return;

        const point = gameState.board[pointIndex - 1];

        if (point.checkers.length > 0 && point.checkers[0].color === myColor) {
            setSelectedLocation({ type: 'point', index: pointIndex });
        } else if (potentialMoveTargets.includes(pointIndex)) {
            const move: MoveData = {
                startPointIndex: selectedLocation!.type === 'bar' ? 0 : selectedLocation!.index,
                endPointIndex: pointIndex
            };

            onMakeMove(move);
            setSelectedLocation(null);
        }
    };

    const handleBarClick = (playerId: PlayerId) => {
        if (playerId !== currentPlayerId || !gameState.bar[currentPlayerId!]?.length) return;

        setSelectedLocation({ type: 'bar', index: playerId });

        const entryPoint = myColor === PlayerColor.White
            ? (die: number) => die
            : (die: number) => 25 - die;

        setPotentialMoveTargets(gameState.remainingMoves!.map(entryPoint));
    };

    return (
        <div className="game-container">
            <div className="player-panels">
                <PlayerInfoPanel
                    player={gameState.players[PlayerId.Player2]}
                    isCurrentTurn={gameState.currentPlayerId === PlayerId.Player2}
                    isClientPlayer={currentPlayerId === PlayerId.Player2}
                />
                <PlayerInfoPanel
                    player={gameState.players[PlayerId.Player1]}
                    isCurrentTurn={gameState.currentPlayerId === PlayerId.Player1}
                    isClientPlayer={currentPlayerId === PlayerId.Player1}
                />
            </div>

            <GameBoard
                gameState={gameState}
                onPointClick={handlePointClick}
                onBarClick={handleBarClick}
                selectedCheckerLocation={selectedLocation}
                validMoveTargets={potentialMoveTargets}
            />

            <div className="controls">
                <button
                    onClick={onRollDice}
                    disabled={!canRoll}
                    className="roll-dice-button"
                >
                    Roll Dice
                </button>

                <div className="dice-display">
                    {gameState.currentDiceRoll?.map((die, index) => (
                        <div key={index} className="die">
                            {die}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default GameContainer;