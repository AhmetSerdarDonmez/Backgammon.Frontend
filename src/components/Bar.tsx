// src/components/Bar.tsx
import React from 'react';
import { Checker as CheckerModel } from '../models/Checker';
import Checker from './Checker';
import { PlayerColor, PlayerId } from '../models/enums';
import './Bar.css'; // Assume CSS supports .bar-stack.top and .bar-stack.bottom now

interface BarProps {
    player1Checkers: CheckerModel[]; // Data for White's checkers (PlayerId.Player1)
    player2Checkers: CheckerModel[]; // Data for Black's checkers (PlayerId.Player2)
    selectedBarPlayerId: PlayerId | null; // Which player's bar (static ID) is selected
    onBarClick: (playerId: PlayerId) => void; // Handler expects static PlayerId
    currentPlayerColor: PlayerColor | null; // The color of the player viewing the board
}


const Bar: React.FC<BarProps> = ({
    player1Checkers, // Data for White's bar checkers
    player2Checkers, // Data for Black's bar checkers
    selectedBarPlayerId,
    onBarClick,
    currentPlayerColor
}) => {
    const maxVisibleCheckers = 5; // Limit displayed checkers

    // Helper to render the checkers within a stack div
    const renderCheckerStackContent = (checkers: CheckerModel[]) => {
        const displayedCheckers = checkers.slice(0, maxVisibleCheckers);
        const hiddenCount = checkers.length - displayedCheckers.length;

        // Determine the static PlayerId this specific stack contains (if any)
        const staticPlayerIdInStack = checkers.length > 0 ? checkers[0].playerId : null;

        // A stack is selected if the globally selectedBarPlayerId matches the PlayerId whose checkers are in this stack
        const isSelected = selectedBarPlayerId !== null && staticPlayerIdInStack !== null && selectedBarPlayerId === staticPlayerIdInStack;

        return (
            <> {/* Use fragment */}
                {displayedCheckers.map((checker, index) => (
                    <Checker
                        key={checker.id}
                        color={checker.color}
                        // Highlight the visually top checker if the stack is selected
                        isSelected={isSelected && index === 0}
                    />
                ))}
                {hiddenCount > 0 && <div className="hidden-checker-count">+{hiddenCount}</div>}
            </>
        );
    };

    // Determine which static PlayerId is the current player and opponent
    // Assume White is Player 1, Black is Player 2 based on typical Backgammon and your enums
    const currentPlayerId = currentPlayerColor === PlayerColor.White ? PlayerId.Player1 : PlayerId.Player2;
    const opponentId = currentPlayerColor === PlayerColor.White ? PlayerId.Player2 : PlayerId.Player1;

    // Determine which checkers data belongs to the current player and opponent
    const currentPlayerBarCheckers = currentPlayerColor === PlayerColor.White ? player1Checkers : player2Checkers;
    const opponentBarCheckers = currentPlayerColor === PlayerColor.White ? player2Checkers : player1Checkers;


    return (
        <div className="bar-area-component">
            {/* Top Bar Stack Area - ALWAYS shows Current Player's checkers based on the new rule */}
            {/* We might need new CSS classes like 'top-bar-stack'/'bottom-bar-stack'
                or rely on the flex direction of the parent .bar-area-component and order.
                Assuming your CSS now positions the first child div at the top and second at the bottom,
                or you have .bar-stack.top / .bar-stack.bottom classes you can apply.
                Let's use .bar-stack.top / .bar-stack.bottom class names for clarity in intent.
                YOU WILL LIKELY NEED TO UPDATE YOUR Bar.css based on this.
            */}
            <div
                className={`bar-stack top`} // Use 'top' class for CSS positioning
                onClick={() => {
                    // Clicking the top stack always means selecting the Current Player's bar
                    onBarClick(currentPlayerId);
                }}
            >
                {renderCheckerStackContent(currentPlayerBarCheckers)}
            </div>

            <div className="bar-divider">BAR</div>

            {/* Bottom Bar Stack Area - ALWAYS shows Opponent's checkers based on the new rule */}
            <div
                className={`bar-stack bottom`} // Use 'bottom' class for CSS positioning
                onClick={() => {
                    // Clicking the bottom stack always means selecting the Opponent's bar
                    onBarClick(opponentId);
                }}
            >
                {renderCheckerStackContent(opponentBarCheckers)}
            </div>
        </div>
    );
};

export default Bar;