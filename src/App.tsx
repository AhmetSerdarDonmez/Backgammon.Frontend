/* eslint-disable @typescript-eslint/no-unused-vars */
// src/App.tsx
import React, { useState, useEffect } from 'react';
import './App.css';
import GameContainer from './components/GameContainer';
import NotificationDisplay from './components/NotificationDisplay'; // Create this component
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { GameState, createInitialGameState } from './models/GameState';
import { MoveData } from './models/MoveData';
import { PlayerColor, PlayerId, GamePhase } from './models/enums'; // Import GamePhase

// Define notification type (can be in a separate models file)
interface Notification {
    message: string;
    type: 'error' | 'info' | 'success' | 'warning';
}

const SIGNALR_HUB_URL = "https://10.16.4.28:5369/gamehub";

function App() {
    const [connection, setConnection] = useState<HubConnection | null>(null);
    const [gameState, setGameState] = useState<GameState>(createInitialGameState());
    const [playerInfo, setPlayerInfo] = useState<{ id: PlayerId | null; color: PlayerColor | null }>({ id: null, color: null });
    const [connectionStatus, setConnectionStatus] = useState<string>("Connecting...");
    // Lift notification state here
    const [notification, setNotification] = useState<Notification | null>(null);

    // Function to display notification and clear after delay
    const showNotification = (message: string, type: Notification['type'] = 'info', duration: number = 4000) => {
        setNotification({ message, type });
        setTimeout(() => {
            setNotification(null);
        }, duration);
    };

    // --- SignalR Connection Effects (largely the same) ---
    useEffect(() => {
        // ... connection setup ...
        const newConnection = new HubConnectionBuilder()
            .withUrl(SIGNALR_HUB_URL)
            .withAutomaticReconnect()
            .configureLogging(LogLevel.Information)
            .build();
        setConnection(newConnection);
        return () => { newConnection.stop(); };
    }, []);

    
    
    useEffect(() => {
        if (connection) {
            connection.start()
                .then(() => {
                    setConnectionStatus("Connected");
                    console.log('SignalR Connected.');

                    // --- Register SignalR Event Handlers ---
                    connection.on("UpdateGameState", (state: GameState) => {
                        console.log("Received GameState:", state);
                        setGameState(state);
                        // Optionally clear notifications on full state updates if desired
                        // setNotification(null);
                    });

                    connection.on("AssignPlayerRole", (id: PlayerId, colorStr: string) => { /* ... setPlayerInfo ... */ });
                    connection.on("WaitingForOpponent", () => { /* ... setConnectionStatus ... */ });
                    connection.on("GameStart", (initialState: GameState) => {
                        console.log(">>> FRONTEND: GameStart event received!", initialState); // Add this

                        /* ... setGameState, setConnectionStatus ... */
                    });

                    connection.on("NotifyTurn", (currentPlayerId: PlayerId) => {
                        console.log(`>>> FRONTEND: NotifyTurn event received: Player ${currentPlayerId}`); // Add this

                        // ... update gameState ... 
});

                    // Use showNotification for errors/warnings
                    connection.on("NotifyError", (message: string) => {
                        console.error("Server Error:", message);
                        showNotification(message, 'error');
                    });
                    connection.on("InvalidMove", (message: string) => {
                        console.warn("Invalid Move:", message);
                        showNotification(`Invalid Move: ${message}`, 'warning');
                    });
                    connection.on("GameOver", (winnerId: PlayerId) => { /* ... update gameState, setConnectionStatus ... */ });
                    connection.on("OpponentDisconnected", () => {
                        console.log("Opponent disconnected.");
                        showNotification("Opponent disconnected. Game reset.", 'warning');
                        setConnectionStatus("Opponent disconnected");
                        // Backend reset should trigger UpdateGameState
                    });
                })
                .catch(e => {
                    console.error('SignalR Connection Error: ', e);
                    setConnectionStatus("Connection Failed");
                    showNotification("Could not connect to the game server.", 'error', 6000); // Longer duration
                });

            // ... reconnection/close handlers ...
            connection.onreconnecting(() => { setConnectionStatus("Reconnecting..."); showNotification("Connection lost. Trying to reconnect...", 'warning'); });
            connection.onreconnected(() => { setConnectionStatus("Connected"); setNotification(null); }); // Clear notification on reconnect
            connection.onclose(() => { /* ... setConnectionStatus ... */ });
        }
    }, [connection]);

    // --- Hub Invocation Functions (same as before) ---
    const handleRollDice = async () => {
        if (!connection || gameState.currentPlayerId !== playerInfo.id /*... other checks ...*/) {
            showNotification("Cannot roll dice now.", 'warning'); // Use notification
            return;
        }
        try {
            // setNotification(null); // Clear previous notifications before action (optional)
            await connection.invoke("RollDice");
        } catch (e) { showNotification("Failed to send Roll Dice command.", 'error'); }
    };

    const handleMakeMove = async (move: MoveData) => {
        if (!connection || gameState.currentPlayerId !== playerInfo.id /*... other checks ...*/) {
            showNotification("Cannot make move now.", 'warning'); // Use notification
            return;
        }
        try {
            // setNotification(null); // Clear previous notifications before action (optional)
            await connection.invoke("MakeMove", move);
        } catch (e) { showNotification("Failed to send Move command.", 'error'); }
    };

    // --- Render ---
    return (
        <div className="App">
            <header className="App-header">
                <h1>Backgammon</h1>
                <p>Status: {connectionStatus}</p>
                {/* Removed old lastError display */}
            </header>

            {/* Render Notification Display */}
            <NotificationDisplay notification={notification} />

            <main>
                {connectionStatus === "Connected" || connectionStatus.startsWith("Connected as") || connectionStatus === "Game Started!" || connectionStatus.startsWith("Game Over") ? (
                    <GameContainer
                        gameState={gameState}
                        currentPlayerId={playerInfo.id}
                        onRollDice={handleRollDice}
                        onMakeMove={handleMakeMove} triggerNotification={function(message: string, type?: 'error' | 'info' | 'success' | 'warning'): void {
                            throw new Error('Function not implemented.');
                        } }                    // No longer need to pass triggerNotification down
                    />
                ) : (
                    <p>Loading game or waiting to connect...</p>
                )}
            </main>
        </div>
    );
}

export default App;