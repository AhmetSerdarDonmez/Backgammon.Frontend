/* eslint-disable @typescript-eslint/no-unused-vars */
// src/App.tsx
import React, { useState, useEffect } from 'react';
import './App.css';
import GameContainer from './components/GameContainer';
import NotificationDisplay from './components/NotificationDisplay';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { GameState, createInitialGameState } from './models/GameState';
import { MoveData } from './models/MoveData';
import { PlayerColor, PlayerId, GamePhase } from './models/enums';

interface Notification {
    message: string;
    type: 'error' | 'info' | 'success' | 'warning';
}

const SIGNALR_HUB_URL = "http://10.16.4.28:5369/gamehub";

function App() {
    const [connection, setConnection] = useState<HubConnection | null>(null);
    const [gameState, setGameState] = useState<GameState>(createInitialGameState());
    const [playerInfo, setPlayerInfo] = useState<{ id: PlayerId | null; color: PlayerColor | null }>({ id: null, color: null });
    const [connectionStatus, setConnectionStatus] = useState<string>("Connecting...");
    const [notification, setNotification] = useState<Notification | null>(null);

    const showNotification = (message: string, type: Notification['type'] = 'info', duration: number = 4000) => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), duration);
    };

    useEffect(() => {
        const newConnection = new HubConnectionBuilder()
            .withUrl(SIGNALR_HUB_URL)
            .configureLogging(LogLevel.Information)
            .build();

        setConnection(newConnection);

        return () => {
            newConnection.stop();
        };
    }, []);

    useEffect(() => {
        if (!connection) return;

        connection.start()
            .then(() => {
                setConnectionStatus("Connected");
                console.log('SignalR Connected.');

                connection.on("UpdateGameState", (state: GameState) => {
                    console.log("Received GameState:", state);
                    setGameState(state);
                });

                connection.on("AssignPlayerRole", (id: PlayerId, colorStr: string) => {
                    const color = colorStr === "White" ? PlayerColor.White : PlayerColor.Black;

                    setPlayerInfo({ id, color });
                
                });

                connection.on("WaitingForOpponent", () => {
                    setConnectionStatus("Waiting for opponent...");
                });

                connection.on("GameStart", (initialState: GameState) => {
                    console.log(">>> FRONTEND: GameStart event received!", initialState);
                    setGameState(initialState);
                    showNotification("Game started!", 'success');
                });

                connection.on("NotifyTurn", (currentPlayerId: PlayerId) => {
                    console.log(`>>> FRONTEND: NotifyTurn event received: Player ${currentPlayerId}`);
                    setGameState(prev => ({ ...prev, currentPlayerId }));
                });

                connection.on("NotifyError", (message: string) => {
                    showNotification(message, 'error');
                });

                connection.on("InvalidMove", (message: string) => {
                    showNotification(`Invalid Move: ${message}`, 'warning');
                });

                connection.on("GameOver", (winnerId: PlayerId) => {
                    setGameState(prev => ({ ...prev, winnerId }));
                    showNotification(`Game Over! Winner: Player ${winnerId}`, 'success');
                });

                connection.onclose(() => {
                    setConnectionStatus("Disconnected");
                    showNotification("Disconnected from server", 'error');
                });
            })
            .catch(e => {
                setConnectionStatus("Connection Failed");
                showNotification("Could not connect to the game server.", 'error', 6000);
            });

        connection.onreconnecting(() => {
            setConnectionStatus("Reconnecting...");
            showNotification("Connection lost. Trying to reconnect...", 'warning');
        });

        connection.onreconnected(() => {
            setConnectionStatus("Connected");
            setNotification(null);
        });
    }, [connection]);

    const handleRollDice = async () => {
        try {
            await connection?.invoke("RollDice");
        } catch (e) {
            showNotification("Failed to send Roll Dice command.", 'error');
        }
    };

    const handleMakeMove = async (move: MoveData) => {
        try {
            await connection?.invoke("MakeMove", move);
        } catch (e) {
            showNotification("Failed to send Move command.", 'error');
        }
    };

    return (
        <div className="App">
            <header className="App-header">
                <h1>Backgammon</h1>
                <p>Status: {connectionStatus}</p>
            </header>

            <NotificationDisplay notification={notification} />

            <main>
                {gameState.phase !== GamePhase.WaitingForPlayers ? (
                    <GameContainer
                        gameState={gameState}
                        currentPlayerId={playerInfo.id}
                        onRollDice={handleRollDice}
                        onMakeMove={handleMakeMove}
                        currentPlayerColor={playerInfo.color}
//                        triggerNotification={showNotification}
                    />
                ) : (
                    <p>Waiting for players to connect...</p>
                )}
            </main>
        </div>
    );
}

export default App;