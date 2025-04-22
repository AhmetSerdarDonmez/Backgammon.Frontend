/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useCallback } from 'react';
import { GameState } from '../models/GameState';
import { MoveData } from '../models/MoveData';
import { PlayerColor, PlayerId, GamePhase } from '../models/enums';
import GameBoard from './GameBoard';
import PlayerInfoPanel from './PlayerInfoPanel';
import { Player } from '../models/Player';
// import './GameContainer.css'; // Optional styles for this container

interface GameContainerProps {
    gameState: GameState;
    currentPlayerId: PlayerId | null; // This is the ID of the player using this client instance
    currentPlayerColor: PlayerColor | null; // This is the color of the player using this client instance
    onRollDice: () => void;
    onMakeMove: (move: MoveData) => void;
    onRestartGame: () => void; // Add this line

}

// Helper function outside component: Check if player can potentially bear off
// Added explicit null checks for safety
const canPotentiallyBearOff = (gameState: GameState, playerId: PlayerId | null, playerColor: PlayerColor | null): boolean => {
    if (!playerId || playerColor === null || !gameState.players?.[playerId]) return false; // Check if player exists
    // Use optional chaining and nullish coalescing for potentially undefined bar array
    if ((gameState.bar?.[playerId]?.length ?? 0) > 0) return false;

    const homeStart = playerColor === PlayerColor.White ? 19 : 1;
    const homeEnd = playerColor === PlayerColor.White ? 24 : 6;

    // Ensure board exists before iterating
    if (!gameState.board) return false;

    for (let i = 0; i < 24; i++) {
        const pointIndex = i + 1;
        if (pointIndex < homeStart || pointIndex > homeEnd) {
            // Safer access to checkers
            if (gameState.board[i]?.checkers?.some(c => c.playerId === playerId)) {
                return false;
            }
        }
    }
    return true;
};


    const getFurthestCheckerPoint = (
        gameState: GameState,
        playerId: PlayerId
    ): number => {
        const player = gameState.players[`Player${playerId}`];
        if (!player || !gameState.board) return -1;

        const isWhite = player.color === PlayerColor.White;

        if (isWhite) {
            // White home: 19→24; smallest index = largest distance
            for (let idx = 19; idx <= 24; idx++) {
                if (gameState.board[idx - 1].checkers.some(c => c.playerId === playerId)) {
                    return idx;
                }
            }
        } else {
            // Black home: 1→6; largest index = largest distance
            for (let idx = 6; idx >= 1; idx--) {
                if (gameState.board[idx - 1].checkers.some(c => c.playerId === playerId)) {
                    return idx;
                }
            }
        }

        return -1;
    };




// Helper function outside component: Get highest point
// Added explicit null checks for safety
const getHighestOccupiedPointInHomeBoard = (gameState: GameState, playerId: PlayerId | null): number => {
    if (!playerId || !gameState.players) {
        console.error("Invalid playerId or gameState.players is undefined:", { playerId, players: gameState.players });
        return -1;
    }

    console.log(">>> gameState:", gameState);

    const player = gameState.players[`Player${playerId}`];
    if (!player) {
        console.error("Player not found for playerId:", playerId, " and player:" , player);
        return -1;
    }

    console.log(">>> getHighestOccupiedPointInHomeBoard: player is valid");
    const playerColor = player.color;


    let highestPoint = -1;

    // Ensure board exists before iterating
    if (!gameState.board) return -1;
    console.log(">>> getHighestOccupiedPointInHomeBoard: gameState.board is valid");

    if (playerColor === PlayerColor.White) { // Home 19-24
        for (let i = 24; i >= 18; i--) {
            if (gameState.board[i]?.checkers?.some(c => c.playerId === playerId)) {
                highestPoint = i + 1;
                break;
            }
        }
    } else { // Home 1-6
        for (let i = 5; i >= 0; i--) {
            if (gameState.board[i]?.checkers?.some(c => c.playerId === playerId)) {
                highestPoint = i + 1;
                break;
            }
        }
    }
    console.log(">>> getHighestOccupiedPointInHomeBoard: highestPoint found:", highestPoint);
    return highestPoint;
};


const GameContainer: React.FC<GameContainerProps> = ({
    gameState,
    currentPlayerId, // This is "me"
    currentPlayerColor, // This is "my color"
    onRollDice,
    onMakeMove
}) => {
    const [selectedLocation, setSelectedLocation] = useState<{ type: 'point' | 'bar', index: number } | null>(null);
    const [potentialMoveTargets, setPotentialMoveTargets] = useState<number[]>([]);

    

    const isMyTurn = gameState.currentPlayerId === currentPlayerId;
    // Safer access to player data and color
    const myPlayerData = currentPlayerId !== null ? gameState.players?.[currentPlayerId] : undefined;


    const myColor = currentPlayerColor ; // Ensure myColor is null if no player data
    const opponentId = currentPlayerId === PlayerId.Player1 ? PlayerId.Player2 : PlayerId.Player1;

    const canRoll = isMyTurn
        && gameState.phase === GamePhase.PlayerTurn
        && (!gameState.remainingMoves || gameState.remainingMoves.length === 0);

    // --- Log received gameState ---
    console.log(">>> GameContainer rendering. Phase:", gameState.phase, "CurrentPlayer:", gameState.currentPlayerId, "Players:", gameState.players, "MyId:", currentPlayerId, "MyColor:", currentPlayerColor);

    // --- Helper: Check if player can potentially bear off ---
    // Added gameState.players to dependency array
    const canBearOffCallback = useCallback((): boolean => {
        // Pass current state values directly to the helper outside
        return canPotentiallyBearOff(gameState, currentPlayerId, myColor);
    }, [gameState, currentPlayerId, myColor]); // Dependencies needed by the helper call


    // --- Helper: Calculate potential targets ---
    // Added gameState.players and canBearOffCallback to dependencies
    const calculatePotentialTargets = useCallback(
        (startLocation: { type: 'point' | 'bar', index: number }): number[] => {
            console.log(`--- Calculating potential targets for ${startLocation.type} ${startLocation.index} with dice ${gameState.remainingMoves}`);
            // Added check for myPlayerData as myColor depends on it
            if (!gameState.remainingMoves || !currentPlayerId || myColor === null || !gameState.board) return [];
                
            const targets: Set<number> = new Set();
            const playerDirection = myColor === PlayerColor.White ? 1 : -1;
            const isBearingOffPossible = canBearOffCallback(); // Use the memoized callback
            const bearOffTargetVal = myColor === PlayerColor.White ? 25 : 0;
            const opponentId = myColor === PlayerColor.White ? PlayerId.Player2 : PlayerId.Player1;

            gameState.remainingMoves.forEach((die: number) => {
                let targetIndex = -1;

                if (startLocation.type === 'bar') {
                    const entryPointIndex = myColor === PlayerColor.White ? die : 25 - die;
                    if (entryPointIndex >= 1 && entryPointIndex <= 24) {
                        const endPoint = gameState.board[entryPointIndex - 1]; // Remove optional chaining (board exists)
                        const checkersAtEnd = endPoint.checkers ?? [];
                        // Correct opponent check: Verify all checkers are opponent's and count ≥2
                        const isBlockedByOpponent =
                            checkersAtEnd.length >= 2 &&
                            checkersAtEnd.every(c => c.playerId === opponentId);

                        if (!isBlockedByOpponent) {
                            targets.add(entryPointIndex);
                        }
                    }
                } else { // Start location is a point
                    const startPointIndex = startLocation.index;
                    targetIndex = startPointIndex + (die * playerDirection);
                    console.log(`--- Calculating target index: ${startPointIndex} + (${die} * ${playerDirection}) = ${targetIndex}`);

                    if (isBearingOffPossible) {
                        const isOnOrBeyondBearOff =
                            (myColor === PlayerColor.White && targetIndex >= 25) ||
                            (myColor === PlayerColor.Black && targetIndex <= 0);

                        if (isOnOrBeyondBearOff) {
                            console.log(`--- Bearing off possible. Target index: ${targetIndex} is on or beyond bear off.`);
                            const highestPoint = getHighestOccupiedPointInHomeBoard(gameState, currentPlayerId);
                            const exactDieNeeded =
                                myColor === PlayerColor.White
                                    ? 25 - startPointIndex
                                    : startPointIndex;

                            const startPointHasCheckers =
                                gameState.board[startPointIndex - 1].checkers.some(
                                    c => c.playerId === currentPlayerId
                                );

                            if (startPointHasCheckers && die === exactDieNeeded) {
                                targets.add(bearOffTargetVal);
                            } else if (
                                startPointHasCheckers &&
                                die > exactDieNeeded &&
                                startPointIndex === highestPoint
                            ) {
                                targets.add(bearOffTargetVal);
                            }
                            targetIndex = -1;
                        }
                    }

                    if (targetIndex >= 1 && targetIndex <= 24) {
                        const endPoint = gameState.board[targetIndex - 1]; // Remove optional chaining (board exists)
                        const checkersAtEnd = endPoint.checkers ?? [];
                        // Correct endpoint validation
                        const isBlockedByOpponent =
                            checkersAtEnd.length >= 2 &&
                            checkersAtEnd.every(c => c.playerId === opponentId);

                        if (!isBlockedByOpponent) {
                            targets.add(targetIndex);
                        }
                    }
                }
            });

            const result = Array.from(targets);
            console.log(`--- Calculated potential targets: [${result.join(', ')}]`);
            return result;
        },
        [gameState, currentPlayerId, myColor, canBearOffCallback] // Updated dependencies
    );



    // --- Effect to update potential targets ---
    // Added potentialMoveTargets.length to dependencies
    useEffect(() => {
        console.log(">>> useEffect for potential moves triggered. selectedLocation:", selectedLocation, "RemainingMoves:", gameState.remainingMoves);
        if (selectedLocation && isMyTurn && myColor !== null && gameState.remainingMoves && gameState.remainingMoves.length > 0) {
            const targets = calculatePotentialTargets(selectedLocation);
            console.log(">>> useEffect calculated targets:", targets);
            // Only update if targets actually changed to prevent potential loop
            if (JSON.stringify(targets) !== JSON.stringify(potentialMoveTargets)) {
                setPotentialMoveTargets(targets);
                console.log(">>> useEffect called setPotentialMoveTargets");
            }
        } else {
            if (potentialMoveTargets.length > 0) {
                setPotentialMoveTargets([]);
                console.log(">>> useEffect cleared potential targets.");
            }
        }
        // Updated dependencies
    }, [selectedLocation, gameState.remainingMoves, isMyTurn, calculatePotentialTargets, myColor, potentialMoveTargets]); // Include potentialMoveTargets state itself





    // --- Interaction Handlers ---
const handlePointClick = (pointIndex: number) => {
    console.log(`>>> handlePointClick: Clicked point ${pointIndex}. MyTurn=${isMyTurn}. Selected=${JSON.stringify(selectedLocation)}`);

    // Early exit checks
    if (!isMyTurn || !gameState.remainingMoves || gameState.remainingMoves.length === 0 || currentPlayerId === null) {
        if (selectedLocation) setSelectedLocation(null);
        return;
    }

    console.log(`>>> handlePointClick: Clicked point ${pointIndex}. MyTurn=${isMyTurn}. Selected=${JSON.stringify(selectedLocation)}`);


    const point = gameState.board?.[pointIndex - 1];
    const hasMyChecker = point?.checkers?.some(c => c.playerId === currentPlayerId) ?? false;

    console.log(`>>> handlePointClick: hasMyChecker=${hasMyChecker}, pointIndex=${pointIndex}, selectedLocationindex=${selectedLocation?.index}`);

    // 1. Handle double-click bear-off attempt
    if (selectedLocation?.type === 'point' && selectedLocation.index === pointIndex) {

        console.log(`>>> handlePointClick: Double-click detected on point ${pointIndex}. Attempting to bear off.`);

        const isWhite = currentPlayerColor === PlayerColor.White;
        const bearOffTarget = isWhite ? 25 : 0;
        const homeStart = isWhite ? 19 : 1;
        const homeEnd = isWhite ? 24 : 6;



        if (pointIndex >= homeStart && pointIndex <= homeEnd) {
            const exactDieNeeded = isWhite ? 25 - pointIndex : pointIndex;
            const highestPoint = getFurthestCheckerPoint(gameState, currentPlayerId);
            const hasExact = gameState.remainingMoves.includes(exactDieNeeded);
            const hasHigher = gameState.remainingMoves.some(d => d > exactDieNeeded);
            const hasLower = gameState.remainingMoves.some(d => d < exactDieNeeded);
            //           const hasLower = gameState.remainingMoves.some(d => d < exactDieNeeded );

            console.log(`>>> handlePointClick: hasExact=${hasExact}, hasHigher=${hasHigher}, hasLower=${hasLower}, highestPoint=${highestPoint}`);




            // FIXED: Use 'currentPoint' to avoid variable shadowing
            const noHigherCheckers = pointIndex === highestPoint || !gameState.board.some((p, i) => {
                const currentPoint = i + 1; // Convert array index to pointIndex (1-24)
                if (!isWhite) {
                    return (
                        currentPoint > pointIndex && // Correct comparison to outer pointIndex
                        currentPoint >= homeStart && currentPoint <= homeEnd &&
                        p.checkers.some(c => c.playerId === currentPlayerId)
                    );
                }
                else {
                    return (
                        currentPoint < pointIndex && // Correct comparison to outer pointIndex
                        currentPoint >= homeStart && currentPoint <= homeEnd &&
                        p.checkers.some(c => c.playerId === currentPlayerId)
                    );
                }


            });
            if (!isWhite&&(hasExact || (noHigherCheckers && hasHigher))) {
                console.log(`BEARING OFF from ${pointIndex}`);
                onMakeMove({
                    startPointIndex: pointIndex,
                    endPointIndex: bearOffTarget
                });
                setSelectedLocation(null);
                return;
            }

            if (isWhite&&(hasExact || (noHigherCheckers && hasHigher))) {
                console.log(`BEARING OFF from ${pointIndex}`);
                onMakeMove({
                    startPointIndex: pointIndex,
                    endPointIndex: bearOffTarget
                });
                setSelectedLocation(null);
                return;
            }
        }
    }

    // 2. Existing selection/movement logic
    if (selectedLocation) {
        console.log(`Trying move from ${selectedLocation.type} ${selectedLocation.index} to ${pointIndex}`);

        if (potentialMoveTargets.includes(pointIndex)) {
            onMakeMove({
                startPointIndex: selectedLocation.type === 'bar' ? 0 : selectedLocation.index,
                endPointIndex: pointIndex
            });
            setSelectedLocation(null);
        } else if (hasMyChecker && selectedLocation.type === 'point') {
            console.log(`Switching selection to point ${pointIndex}`);
            setSelectedLocation({ type: 'point', index: pointIndex });
        } else {
            console.log("Deselecting");
            setSelectedLocation(null);
        }
    } else {
        const mustMoveFromBar = (gameState.bar?.[currentPlayerId]?.length ?? 0) > 0;
        if (mustMoveFromBar) {
            console.log("Must move from bar first");
            return;
        }

        if (hasMyChecker) {
            console.log(`Selecting point ${pointIndex}`);
            setSelectedLocation({ type: 'point', index: pointIndex });
        }
    }
    };

    const onRestartGame = () => {
        console.log("Restarting game by refreshing the page...");
        window.location.reload(); // This will refresh the browser tab
    };


    const handleBarClick = (playerId: PlayerId) => {
        console.log(`>>> handleBarClick: Clicked bar for player ${playerId}. MyTurn=${isMyTurn}. MyId=${currentPlayerId}`);

        if (!isMyTurn || playerId !== currentPlayerId || !gameState.remainingMoves || gameState.remainingMoves.length === 0) {
            if (selectedLocation) setSelectedLocation(null);
            return;
        }

        // Use the enum name as the key (e.g., "Player1" or "Player2")
        const checkersOnBar = gameState.bar?.[PlayerId[currentPlayerId!]]?.length ?? 0;
        console.log(`>>> handleBarClick: Checkers on bar: ${checkersOnBar}`);

        if (checkersOnBar > 0) {
            if (selectedLocation?.type === 'bar' && selectedLocation.index === playerId) {
                console.log(">>> Deselecting bar.");
                setSelectedLocation(null);
            } else {
                console.log(">>> Selecting bar.");
                setSelectedLocation({ type: 'bar', index: playerId });
            }
        } else {
            console.log(">>> Cannot select empty bar.");
            if (selectedLocation) setSelectedLocation(null);
        }
    };

    // Removed unused handleBearOffClick function


    // --- Render ---
    return (
        <div className="game-container">
            {/* Main Game Area Layout */}
            <div className="game-board-area">


                {/* Game Board */}
                <GameBoard
                    gameState={gameState}
                    onPointClick={handlePointClick}
                    onBarClick={handleBarClick}
                    selectedCheckerLocation={selectedLocation}
                    validMoveTargets={potentialMoveTargets}
                        currentPlayerColor={currentPlayerColor}

                />

                {/* Controls Section */}
                <div className="controls">
                    {/* Status Display */}
                    <div>
                        {gameState.phase === GamePhase.PlayerTurn && gameState.currentPlayerId && (
                            <p>Turn: Player {gameState.currentPlayerId} ({PlayerColor[gameState.players[`Player${gameState.currentPlayerId}`].color]}) {gameState.currentPlayerId === currentPlayerId ? "(You)" : ""}</p>
                        )}
                    </div>

                    {/* Dice & Roll Button */}
                    {isMyTurn && gameState.phase !== GamePhase.GameOver && (
                        <div>
                            <h3>Your Turn</h3>
                            {canRoll && <button onClick={onRollDice} disabled={!isMyTurn || !canRoll}>Roll Dice</button>}
                            {gameState.currentDiceRoll && <p>Dice: {gameState.currentDiceRoll.join(', ')}</p>}
                            {gameState.remainingMoves && gameState.remainingMoves.length > 0 && (
                                <p>Moves Left: {gameState.remainingMoves.join(', ')}</p>
                            )}
                        </div>
                    )}
                    {!isMyTurn && gameState.phase === GamePhase.PlayerTurn && gameState.currentPlayerId && (
                        <p>Waiting for Player {gameState.currentPlayerId}'s turn...</p>
                    )}
                    {!isMyTurn && gameState.phase === GamePhase.PlayerTurn && (
                        gameState.currentDiceRoll && gameState.currentDiceRoll.length > 0 ? (
                            <p>Opponent's Roll: {gameState.currentDiceRoll.join(', ')}</p>
                        ) : (
                            <p>Opponent didn't roll dice.</p>
                        )
                    )}

                        {gameState.phase === GamePhase.GameOver && (
                            <div style={{ color: 'white' }}>
                                <h3>Game Over!</h3>
                            {gameState.winnerId && gameState.players?.[PlayerId[gameState.winnerId]] && (
                                <p>
                                    Winner: Player {gameState.winnerId} ({PlayerColor[gameState.players[PlayerId[gameState.winnerId]].color]}) {/* Corrected access here too */}
                                </p>
                            )}
                                {/* Add Restart Button */}
                                <button onClick={onRestartGame}>Restart Game</button>
                            </div>
                        )}
                  
                     
                            
                        
                </div>


            </div>

            
        </div>
    );
};

export default GameContainer;