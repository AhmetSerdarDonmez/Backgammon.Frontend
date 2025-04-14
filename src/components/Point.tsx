// src/components/Point.tsx
import React from 'react';
import { BoardPoint as BoardPointModel } from '../models/BoardPoint'; // Ensure this import is correct
import Checker from './Checker'; // Ensure this import is correct
import { Checker as CheckerModel } from '../models/Checker'; // Import Checker type for map
import './Point.css'; // Ensure CSS is imported

interface PointProps {
    pointData: BoardPointModel;
    isTopRow: boolean;
    onClick: (pointIndex: number) => void;
    isValidMoveTarget: boolean;
    isSelected: boolean;
    style?: React.CSSProperties; // Style prop MUST be in the interface
}

const Point: React.FC<PointProps> = ({
    pointData,
    isTopRow,
    onClick,
    isValidMoveTarget,
    isSelected,
    style // Destructure the style prop
}) => {
    const pointIndex = pointData.pointIndex;
    const checkers = pointData.checkers;

    // Define backgroundColorClass based on index
    const isOddPoint = pointIndex % 2 !== 0;
    // Use consistent logic for coloring based on standard boards
    // Example: Outer boards often have colors swapped compared to home boards relative to odd/even
    // This example assumes simple odd/even coloring for now. Adjust if needed.
    const backgroundColorClass = isOddPoint ? 'point-odd' : 'point-even';

    // Define displayedCheckers and hidden count
    const maxVisibleCheckers = 6; // Or your preferred limit
    const displayedCheckers = checkers.slice(0, maxVisibleCheckers);
    const hiddenCheckersCount = checkers.length - displayedCheckers.length;

    // Define handleClick
    const handleClick = () => {
        onClick(pointIndex); // Call the onClick prop passed from parent
    };

    const pointClasses = `point ${isTopRow ? 'top' : 'bottom'} ${backgroundColorClass} ${isValidMoveTarget ? 'valid-move' : ''} ${isSelected ? 'selected-point' : ''}`;

    // Determine if the top checker should be visually selected
    const isTopCheckerSelected = isSelected && displayedCheckers.length > 0;

    return (
        // Apply the passed style prop to this root div
        <div className={pointClasses} onClick={handleClick} style={style}>
            <div className="point-triangle"></div>
            <div className={`checker-stack ${isTopRow ? 'stack-down' : 'stack-up'}`}>
                {/* Add explicit types for map parameters */}
                {displayedCheckers.map((checker: CheckerModel, index: number) => (
                    <Checker
                        key={checker.id}
                        color={checker.color}
                        // Highlight only the last checker in the displayed stack if selected
                        isSelected={isTopCheckerSelected && index === displayedCheckers.length - 1}
                    />
                ))}
                {hiddenCheckersCount > 0 && (
                    <div className="hidden-checker-count">+{hiddenCheckersCount}</div>
                )}
            </div>
            {/* Optional: Point Number */}
            {/* <div className="point-number">{pointIndex}</div> */}
        </div>
    );
};

export default Point;