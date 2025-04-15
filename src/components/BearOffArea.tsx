import React from 'react';
import { Checker } from '../models/Checker';
import { PlayerColor, PlayerId } from '../models/enums';
import './BearOffArea.css';

interface BearOffAreaProps {
    playerCheckers: Checker[];
    playerId: PlayerId;
    playerColor: PlayerColor;
}

const BearOffArea: React.FC<BearOffAreaProps> = ({ playerCheckers, playerId, playerColor }) => {
    const count = playerCheckers.length;

    return (
        <div className={`bear-off-area player-${playerId}`}>
            <div className="bear-off-label">{playerColor} Bear Off</div>
            <div className="bear-off-count">{count} / 15</div>
            {/* Optional: Visualize some checkers */}
            <div className="bear-off-visual">
                {/* Show a few representative checkers */}
                {count > 0 && <div className={`bear-off-checker ${playerColor}`}></div>}
                {count > 3 && <div className={`bear-off-checker ${playerColor}`}></div>}
                {count > 6 && <div className={`bear-off-checker ${playerColor}`}></div>}
                {count > 9 && <div className={`bear-off-checker ${playerColor}`}></div>}
                {count > 12 && <div className={`bear-off-checker ${playerColor}`}></div>}
            </div>
        </div>
    );
};

export default BearOffArea;