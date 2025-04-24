/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useCallback } from 'react';
import { GameState } from '../models/GameState';
import { MoveData } from '../models/MoveData';
import { PlayerColor, PlayerId, GamePhase } from '../models/enums';
import GameBoard from './GameBoard';
import PlayerInfoPanel from './PlayerInfoPanel';
import { Player } from '../models/Player';
import Die from './Die'; // Import the new Die component

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

    // State to control the animation explicitly
    const [isAnimatingRoll, setIsAnimatingRoll] = useState<boolean>(false);
    const [isAnimatingRollForOpponent, setIsAnimatingRollForOpponent] = useState<boolean>(false);

    // State to hold the values shown DURING animation
    const [animatingDiceValues, setAnimatingDiceValues] = useState<number[]>([]);


    const [previousRemainingMoves, setPreviousRemainingMoves] = useState<number[] | null>(null);

    const [showNoMoveDice, setShowNoMoveDice] = useState<boolean>(false);




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


    useEffect(() => {
        if (!isMyTurn && gameState.remainingMoves) {
            const currentMoves = gameState.remainingMoves;
            const previousMoves = previousRemainingMoves;

            // Detect a new roll (when remainingMoves increases in size)
            if (
                (!previousMoves || previousMoves.length <= 1) &&
                (currentMoves.length === 2 || currentMoves.length === 4)
            ) {
                // Start the opponent's dice animation
                setIsAnimatingRollForOpponent(true);

                // Generate random dice values during the animation
                const intervalId = setInterval(() => {
                    setAnimatingDiceValues([
                        Math.floor(Math.random() * 6) + 1,
                        Math.floor(Math.random() * 6) + 1,
                    ]);
                }, 75);

                // Stop the animation after 1 second and show the actual dice values
                const timeoutId = setTimeout(() => {
                    clearInterval(intervalId);
                    setIsAnimatingRollForOpponent(false);
                }, 1000); // 1 second animation duration

                return () => {
                    clearInterval(intervalId);
                    clearTimeout(timeoutId);
                };
            }

            // Update the previousRemainingMoves state
            setPreviousRemainingMoves([...currentMoves]);
        }
    }, [isMyTurn, gameState.remainingMoves, previousRemainingMoves]);


    useEffect(() => {
        if (isAnimatingRoll && gameState.currentDiceRoll) {
            const timeoutId = setTimeout(() => {
                setIsAnimatingRoll(false);

                // Check if there are no valid moves
                if (!gameState.remainingMoves || gameState.remainingMoves.length === 0) {
                    setShowNoMoveDice(true); // Show the dice for 1 second
                    setTimeout(() => {
                        setShowNoMoveDice(false); // Hide the dice after 1 second
                    }, 1000); // 1 second delay
                }
            }, 1000); // Rolling animation duration

            return () => clearTimeout(timeoutId);
        }
    }, [isAnimatingRoll, gameState.currentDiceRoll, gameState.remainingMoves]);


    // New useEffect for dice animation
    useEffect(() => {
        let intervalId: NodeJS.Timeout | null = null;
        let timeoutId: NodeJS.Timeout | null = null;
        const MIN_ANIMATION_DURATION = 1000; // 1 seconds

        console.log(">>> Animation useEffect: isAnimatingRoll:", isAnimatingRoll, "CurrentDiceRoll:", gameState.currentDiceRoll);

        if (isAnimatingRoll) {
            console.log(">>> Animation useEffect: Starting animation.");
            // Start the interval to change dice values rapidly
            intervalId = setInterval(() => {
                setAnimatingDiceValues([
                    Math.floor(Math.random() * 6) + 1,
                    Math.floor(Math.random() * 6) + 1,
                    // Add more random dice if needed
                ]);
            }, 75); // Adjust speed of random changes

            // Set a timeout to stop the animation after the minimum duration
            timeoutId = setTimeout(() => {
                console.log(">>> Animation useEffect: Minimum duration timeout finished.");
                // When the timeout finishes, stop the animation
                setIsAnimatingRoll(false);
                // Note: We don't set animatingDiceValues here.
                // The render logic will automatically switch to gameState.currentDiceRoll
                // when isAnimatingRoll becomes false.
            }, MIN_ANIMATION_DURATION);

        } else {
            console.log(">>> Animation useEffect: isAnimatingRoll is false or animation stopping.");
            // If isAnimatingRoll becomes false (e.g., due to phase change or game over),
            // ensure any running intervals/timeouts are cleared.
            if (intervalId) { // Check local variable from this effect run
                clearInterval(intervalId);
                intervalId = null; // Clear local variable
            }
            if (timeoutId) { // Check local variable from this effect run
                clearTimeout(timeoutId);
                timeoutId = null; // Clear local variable
            }
            // When animation stops, ensure dice show the actual roll result
            if (gameState.currentDiceRoll && gameState.currentDiceRoll.length > 0) {
                setAnimatingDiceValues(gameState.currentDiceRoll);
            } else {
                // Or clear if no roll is available (e.g., game start)
                setAnimatingDiceValues([]);
            }
        }

        // Cleanup function to clear intervals and timeouts when the effect re-runs or component unmounts
        return () => {
            console.log(">>> Animation useEffect Cleanup.");
            if (intervalId) {
                clearInterval(intervalId);
            }
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [isAnimatingRoll, isMyTurn, gameState.phase]); // Dependencies: Only react to animation state, turn, and phase



    // Local handler for the Roll Dice button
    const handleRollDiceClick = async () => {
        console.log(">>> Local handleRollDiceClick triggered.");
        if (canRoll && !isAnimatingRoll) { // Only roll if allowed and not already animating
            console.log(">>> canRoll is true and not animating. Setting isAnimatingRoll(true) and calling onRollDice prop.");
            setIsAnimatingRoll(true); // Start the animation state

            // Optionally set initial random values immediately for visual feedback
            setAnimatingDiceValues([
                Math.floor(Math.random() * 6) + 1,
                Math.floor(Math.random() * 6) + 1
            ]);

            try {
                // Call the onRollDice prop (which talks to the backend)
                // The useEffect will react to gameState.currentDiceRoll update arriving LATER
                onRollDice();
            } catch (e) {
                console.error("Failed to initiate Roll Dice command.", e);
                // Handle error: stop animation and show error notification
                setIsAnimatingRoll(false); // Stop animation on error
                setAnimatingDiceValues([]); // Clear dice display on error
                // Consider adding error notification here (using a prop if available, or context)
            }
        } else {
            console.log(">>> cannot roll (either not allowed or already animating).");
        }
    };

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
                            {canRoll && (
                                // Call the local handler
                                <button onClick={handleRollDiceClick} disabled={!isMyTurn || !canRoll || isAnimatingRoll}> {/* Disable while animating */}
                                    Roll Dice
                                </button>
                            )}

                            {/* Display Dice Components */}
                            <div className="dice-display" style={{ display: 'flex', justifyContent: 'center' }}>
                                {isAnimatingRoll ? (
                                    animatingDiceValues.map((dieValue, index) => (
                                        <Die key={index} value={dieValue} isRolling={true} />
                                    ))
                                ) : showNoMoveDice ? (
                                    gameState.currentDiceRoll?.map((dieValue, index) => (
                                        <Die key={index} value={dieValue} />
                                    ))
                                ) : (
                                    gameState.currentDiceRoll?.map((dieValue, index) => (
                                        <Die key={index} value={dieValue} />
                                    ))
                                )}
                            </div>

                            {/* Optional: Display remaining moves as die images */}
                            {gameState.remainingMoves && gameState.remainingMoves.length > 0 && !isAnimatingRoll && (
                                <div className="remaining-moves-display" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                    <p style={{ marginBottom: '4px' }}>Moves Left:</p>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {gameState.remainingMoves.map((dieValue, index) => (
                                            <Die key={index} value={dieValue} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {!isMyTurn && gameState.phase === GamePhase.PlayerTurn && gameState.currentPlayerId && (
                        <p>Waiting for Player {gameState.currentPlayerId}'s turn...</p>
                    )}
                    {/* Display Opponent's Dice */}
                    {!isMyTurn && gameState.phase === GamePhase.PlayerTurn && (
                        <div className="opponent-dice-display" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            {isAnimatingRollForOpponent ? (
                                <>
                                    <p>Opponent is rolling...</p>
                                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                                        {animatingDiceValues.map((dieValue, index) => (
                                            <Die key={index} value={dieValue} isRolling={true} />
                                        ))}
                                    </div>
                                </>
                            ) : gameState.currentDiceRoll && gameState.currentDiceRoll.length > 0 ? (
                                <>
                                    <p>Opponent's Dice:</p>
                                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                                        {gameState.currentDiceRoll.map((dieValue, index) => (
                                            <Die key={index} value={dieValue} />
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <p>Opponent didn't roll dice.</p>
                            )}
                        </div>
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