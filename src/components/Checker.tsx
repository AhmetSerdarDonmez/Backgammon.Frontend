import React from 'react';
import { PlayerColor } from '../models/enums';
import './Checker.css'; // We'll create this CSS file next

interface CheckerProps {
    color: PlayerColor;
    isSelected?: boolean; // Optional: For highlighting later
    onClick?: () => void; // Optional: For interaction later
}

const Checker: React.FC<CheckerProps> = ({ color, isSelected, onClick }) => {
    const className = `checker ${color === PlayerColor.White ? 'white' : 'black'} ${isSelected ? 'selected' : ''}`;

    return (
        <div className={className} onClick={onClick}>
            {/* Inner div for visual effects like borders or gradients if desired */}
            <div className="checker-inner"></div>
        </div>
    );
};

export default Checker;