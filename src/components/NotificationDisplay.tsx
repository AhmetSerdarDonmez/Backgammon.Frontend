import React from 'react';
import './NotificationDisplay.css'; // Create this CSS file

interface Notification {
    message: string;
    type: 'error' | 'info' | 'success' | 'warning';
}

interface NotificationDisplayProps {
    notification: Notification | null;
}

const NotificationDisplay: React.FC<NotificationDisplayProps> = ({ notification }) => {
    if (!notification) {
        return null; // Render nothing if no notification
    }

    return (
        <div className={`notification-display ${notification.type}`}>
            {notification.message}
        </div>
    );
};

export default NotificationDisplay;