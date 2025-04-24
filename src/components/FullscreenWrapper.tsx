/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useRef, useState, useEffect } from 'react';

// Fullscreen API functions with Safari fallback
const requestFullScreen = (el: HTMLElement) => {
    if (el.requestFullscreen) {
        el.requestFullscreen({ navigationUI: 'hide' });
    } else if ((el as any).webkitRequestFullscreen) {
        (el as any).webkitRequestFullscreen(); // For Safari
    } else if ((el as any).msRequestFullscreen) {
        (el as any).msRequestFullscreen();
    }
};

const exitFullScreen = () => {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen(); // For Safari
    } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
    }
};

interface FullscreenWrapperProps {
    children: React.ReactNode;
    zoomFactor?: number; // Default: 1 (no scaling)
}

const FullscreenWrapper: React.FC<FullscreenWrapperProps> = ({
    children,
    zoomFactor = 1,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isFs, setIsFs] = useState(false);

    useEffect(() => {
        const handler = () => {
            setIsFs(!!document.fullscreenElement || !!(document as any).webkitFullscreenElement); // Check for Safari
        };

        document.addEventListener('fullscreenchange', handler);
        document.addEventListener('webkitfullscreenchange', handler); // For Safari

        return () => {
            document.removeEventListener('fullscreenchange', handler);
            document.removeEventListener('webkitfullscreenchange', handler);
        };
    }, []);

    const toggleFs = () => {
        if (!containerRef.current) return;
        if (!isFs) requestFullScreen(containerRef.current);
        else exitFullScreen();
    };

    return (
        <div
            ref={containerRef}
            className="fullscreen-container"
            style={{
                position: isFs ? 'fixed' : 'relative',
                top: 0,
                left: 0,
                width: isFs ? '100%' : 'auto',
                height: isFs ? '100%' : 'auto',
                background: isFs ? '#382a1e' : 'transparent',
                zIndex: isFs ? 9999 : 'auto',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: isFs ? 'hidden' : 'auto',
            }}
        >
            <button
                onClick={toggleFs}
                className="fs-toggle-btn"
                style={{
                    position: 'absolute',
                    bottom: 12,
                    right: 12,
                    padding: '8px 12px',
                    fontSize: '0.9rem',
                    zIndex: 10000,
                    cursor: 'pointer',
                    touchAction: 'manipulation',
                }}
            >
                {isFs ? '✕ Exit' : '⛶ Fullscreen'}
            </button>

            {/* Wrap children in a scalable container */}
            <div
                style={{
                    transform: isFs ? `scale(${zoomFactor})` : 'none',
                    transformOrigin: 'center center',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                {children}
            </div>
        </div>
    );
};

export default FullscreenWrapper;
