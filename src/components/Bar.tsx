import React from 'react';
import { Checker as CheckerModel } from '../models/Checker';
import Checker from './Checker';
import { PlayerId } from '../models/enums';
import './Bar.css';

interface BarProps {
    player1Checkers: CheckerModel[]; // White
    player2Checkers: CheckerModel[]; // Black
    selectedBarPlayerId: PlayerId | null; // Which player's bar checker is selected
    onBarClick: (playerId: PlayerId) => void;
}

const Bar: React.FC<BarProps> = ({ player1Checkers, player2Checkers, selectedBarPlayerId, onBarClick }) => {
    const maxVisibleCheckers = 5; // Limit displayed checkers

    const renderCheckerStack = (checkers: CheckerModel[], playerId: PlayerId) => {
        const displayedCheckers = checkers.slice(0, maxVisibleCheckers);
        const hiddenCount = checkers.length - displayedCheckers.length;
        const isSelected = selectedBarPlayerId === playerId && checkers.length > 0;

        return (
            <div className={`bar-stack ${playerId === PlayerId.Player1 ? 'player1' : 'player2'}`} onClick={() => onBarClick(playerId)}>
                {displayedCheckers.map((checker) => (
                    // Mark the representative top checker as selected if the bar is selected
                    <Checker key={checker.id} color={checker.color} isSelected={isSelected && checker.id === checkers[0]?.id} />
                ))}
                {hiddenCount > 0 && <div className="hidden-checker-count">+{hiddenCount}</div>}
            </div>
        );
    };

    return (
        <div className="bar-area-component">
            {/* Player 2 (Black) - typically stacks downwards from top in center view */}
            {renderCheckerStack(player2Checkers, PlayerId.Player2)}
            <div className="bar-divider">BAR</div>
            {/* Player 1 (White) - typically stacks upwards from bottom in center view */}
            {renderCheckerStack(player1Checkers, PlayerId.Player1)}
        </div>
    );
};

export default Bar;