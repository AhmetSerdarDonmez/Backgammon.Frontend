/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { Player } from '../models/Player';
import { PlayerColor, PlayerId } from '../models/enums';
import './PlayerInfoPanel.css';

interface PlayerInfoPanelProps {
    player: Player | null | undefined; // Player data, could be null/undefined before connection
    isCurrentTurn: boolean;
    isClientPlayer: boolean; // Is this panel representing the user viewing the screen?
    className?: string; 

}

const PlayerInfoPanel: React.FC<PlayerInfoPanelProps> = ({ player, isCurrentTurn, isClientPlayer, className }) => { // <-- Add className here
    console.log(`>>> PlayerInfoPanel rendering. Player Prop:`, player, `IsCurrentTurn:`, isCurrentTurn, `ClassName:`, className);

    if (!player) {
        console.log(`>>> PlayerInfoPanel rendering placeholder for className: ${className}`);

        // Render a placeholder if player data isn't available yet
        return <div className="player-info-panel placeholder">Waiting for Player...</div>;
    }

    const panelClasses = `player-info-panel ${player.color} ${isCurrentTurn ? 'active-turn' : ''} ${isClientPlayer ? 'client-player' : ''} ${className || ''}`;

    return (
        <div className={panelClasses}>
            <div className="player-name">
                {player.name} {isClientPlayer && '(You)'}
            </div>
            <div className="player-color-indicator">
                Color: {player.color}
                <span className={`color-swatch ${player.color}`}></span>
            </div>
            {isCurrentTurn && <div className="turn-indicator">Current Turn</div>}
            {/* Add more info later if needed (e.g., checkers on bar/borne off count) */}
            {/* <div className="player-stats">
                 Bar: {barCount} | Borne Off: {borneOffCount}
             </div> */}
        </div>
    );
};

export default PlayerInfoPanel;