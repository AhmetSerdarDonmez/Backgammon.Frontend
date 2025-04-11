/* eslint-disable @typescript-eslint/no-unused-vars */
// src/components/GameContainer.tsx
import React, { useState, useEffect, useCallback } from 'react'; // Add useCallback
import { GameState } from '../models/GameState';
import { MoveData } from '../models/MoveData';
import { PlayerColor, PlayerId, GamePhase } from '../models/enums';
import GameBoard from './GameBoard';
import PlayerInfoPanel from './PlayerInfoPanel';
// import './GameContainer.css'; // Create or add styles here

interface GameContainerProps {
    gameState: GameState;
    currentPlayerId: PlayerId | null;
    onRollDice: () => void;
    onMakeMove: (move: MoveData) => void;
    // Add a prop to receive notification triggers from App
    triggerNotification: (message: string, type?: 'error' | 'info' | 'success' | 'warning') => void;
}
// Define notification type
interface Notification {
    message: string;
    type: 'error' | 'info' | 'success' | 'warning';
}



const GameContainer: React.FC<GameContainerProps> = ({
    gameState,
    currentPlayerId,
    onRollDice,
    onMakeMove,
    triggerNotification // Receive the function from App
}) => {
    // ... existing state (selectedLocation, potentialMoveTargets) ...
    const [selectedLocation, setSelectedLocation] = useState<{ type: 'point' | 'bar', index: number } | null>(null);
    const [potentialMoveTargets, setPotentialMoveTargets] = useState<number[]>([]);
    const [notification, setNotification] = useState<Notification | null>(null); // State for notification


    // ... existing calculated variables (isMyTurn, myColor, canRoll) ...
    const isMyTurn = gameState.currentPlayerId === currentPlayerId;
    const myColor = currentPlayerId === PlayerId.Player1 ? PlayerColor.White : PlayerColor.Black;
    const canRoll = isMyTurn && gameState.phase === GamePhase.PlayerTurn && (gameState.remainingMoves === null || gameState.remainingMoves?.length === 0);


    // Effect to clear notification after a delay
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                setNotification(null);
            }, 4000); // Display for 4 seconds

            return () => clearTimeout(timer); // Cleanup timer on unmount or if notification changes
        }
    }, [notification]);


    // --- Make triggerNotification accessible within GameContainer if needed ---
    // This wrapper allows GameContainer itself to show notifications,
    // while App.tsx uses the passed prop to trigger them from SignalR events.
    const showNotification = useCallback((message: string, type: Notification['type'] = 'info') => {
        setNotification({ message, type });
    }, []);


    // --- Expose showNotification via triggerNotification prop ---
    useEffect(() => {
        // Register the local showNotification function with the one passed from App
        // This is a way to let App call the state setter inside GameContainer
        // Note: This pattern can be complex; Context API or Zustand might be cleaner for cross-component communication.
        // For now, this demonstrates the idea. A simpler approach might be to lift notification state to App.tsx.
        // Let's simplify: We'll lift the notification state to App.tsx instead.
        // Remove triggerNotification prop and local state/effect here.
    }, []); // Remove this effect


    // ... existing useEffect for potential moves calculation ...
    useEffect(() => { /* ... */ }, [/* ... dependencies ... */]);

    // ... existing handlers (handlePointClick, handleBarClick, handleBearOffClick) ...
    // Modify handlers to potentially show local feedback if needed (optional)
    const handlePointClick = (pointIndex: number) => {
        // ... existing logic ...
        // Example: Maybe add a notification if user clicks opponent piece?
        // if (clickedOpponentPiece) {
        //     showNotification("Cannot select opponent's checker.", 'warning');
        // }
    };
    const handleBarClick = (playerId: PlayerId) => { /* ... */ };
    const handleBearOffClick = (targetPlayerId: PlayerId) => { /* ... */ };


    // --- Render ---
    return (
        <div className="game-container">

            {/* Notification Area */}
            {/* Removed - will be handled in App.tsx */}

            {/* Main Game Area */}
            <div className="game-board-area">
                {/* ... Player Panels, GameBoard etc. ... */}
            </div>

            {/* Controls Section */}
            <div className="controls">
                {/* ... Status, Dice, Roll Button ... */}
            </div>
        </div>
    );
};
// ... helper functions ...
export default GameContainer;