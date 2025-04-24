// src/components/Die.tsx
import React from 'react';
import './Die.css';

// Import your dice images
import die1 from '../assets/dice/die1.png';
import die2 from '../assets/dice/die2.png';
import die3 from '../assets/dice/die3.png';
import die4 from '../assets/dice/die4.png';
import die5 from '../assets/dice/die5.png';
import die6 from '../assets/dice/die6.png';

interface DieProps {
    value: number; // The number on the die (1-6)
    isRolling?: boolean; // Optional: true when the die is animating
}

const diceImages: { [key: number]: string } = {
    1: die1,
    2: die2,
    3: die3,
    4: die4,
    5: die5,
    6: die6,
};

const Die: React.FC<DieProps> = ({ value, isRolling }) => {
    // Fallback to a default image or null if value is out of range
    const imageUrl = diceImages[value] || null;

    const className = `die ${isRolling ? 'rolling' : ''}`;

    if (!imageUrl) {
        return <div className={className}>?</div>; // Or some other placeholder
    }

    return (
        <div className={className}>
            <img src={imageUrl} alt={`Die face showing ${value}`} />
        </div>
    );
};

export default Die;