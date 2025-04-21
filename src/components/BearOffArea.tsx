import React from 'react';
import { Checker as CheckerModel } from '../models/Checker'; // Assuming your Checker model is named Checker
import Checker from './Checker'; // Import the actual Checker component
import { PlayerColor, PlayerId } from '../models/enums';
import './BearOffArea.css'; // Make sure your CSS is correctly styling checkers now

interface BearOffAreaProps {
    playerCheckers: CheckerModel[];
    playerId: PlayerId;
    playerColor: PlayerColor;
}

const BearOffArea: React.FC<BearOffAreaProps> = ({ playerCheckers, playerId }) => {
    const count = playerCheckers.length;
    const maxVisibleCheckers = 15; // You can adjust this limit if needed, up to 15

    // Get the checkers to display (e.g., the top few or all if within limit)
    const displayedCheckers = playerCheckers.slice(0, maxVisibleCheckers);

    return (
        <div className={`bear-off-area player-${playerId}`}>
            {/* REMOVED: <div className="bear-off-label">{playerColor} Bear Off</div> */}

            {/* Keep the bear-off-count div to display the count */}
            <div className="bear-off-count">{count} / 15</div>

            {/* Visualize borne off checkers */}
            <div className="bear-off-visual">
                {/* Render actual Checker components */}
                {displayedCheckers.map((checker) => (
                    // We don't need isSelected for borne off checkers
                    <Checker key={checker.id} color={checker.color} isSelected={false} />
                ))}
                {/* Optional: Add a count for hidden checkers if maxVisibleCheckers is less than 15 */}
                {count > maxVisibleCheckers && <div className="hidden-checker-count">+{count - maxVisibleCheckers}</div>}

            </div>
        </div>
    );
};

export default BearOffArea;