// src/components/Point.tsx
import React from 'react';
import { BoardPoint as BoardPointModel } from '../models/BoardPoint'; // Ensure this import is correct
import Checker from './Checker'; // Ensure this import is correct
import { Checker as CheckerModel } from '../models/Checker'; // Import Checker type for map
import './Point.css';

interface PointProps {
    pointData: BoardPointModel;
    isTopRow: boolean;
    onClick: (pointIndex: number) => void;
    isValidMoveTarget: boolean;
    isSelected: boolean;
}

const Point: React.FC<PointProps> = ({ pointData, isTopRow, onClick, isValidMoveTarget, isSelected }) => {
    // --- ADD THESE DEFINITIONS BACK ---
    const pointIndex = pointData.pointIndex;
    const checkers = pointData.checkers;

    // Define backgroundColorClass
    const isOddPoint = pointIndex % 2 !== 0;
    const backgroundColorClass = isOddPoint ? 'point-odd' : 'point-even'; // Or adjust logic as needed

    // Define displayedCheckers and hidden count
    const maxVisibleCheckers = 6; // Or your preferred limit
    const displayedCheckers = checkers.slice(0, maxVisibleCheckers);
    const hiddenCheckersCount = checkers.length - displayedCheckers.length;

    // Define handleClick
    const handleClick = () => {
        onClick(pointIndex); // Call the onClick prop passed from parent
    };
    // --- END OF ADDED DEFINITIONS ---

    const pointClasses = `point ${isTopRow ? 'top' : 'bottom'} ${backgroundColorClass} ${isValidMoveTarget ? 'valid-move' : ''} ${isSelected ? 'selected-point' : ''}`;

    const isCheckerSelected = isSelected; // Top checker selected if point is selected

    return (
        <div className={pointClasses} onClick={handleClick}> {/* Use defined handleClick */}
            <div className="point-triangle"></div>
            <div className={`checker-stack ${isTopRow ? 'stack-down' : 'stack-up'}`}>
                {/* Add explicit types for map parameters */}
                {displayedCheckers.map((checker: CheckerModel, index: number) => (
                    <Checker
                        key={checker.id}
                        color={checker.color}
                        isSelected={isCheckerSelected && index === displayedCheckers.length - 1}
                    />
                ))}
                {hiddenCheckersCount > 0 && (
                    <div className="hidden-checker-count">+{hiddenCheckersCount}</div>
                )}
            </div>
            {/* <div className="point-number">{pointIndex}</div> */}
        </div>
    );
};

export default Point; // Ensure default export is present