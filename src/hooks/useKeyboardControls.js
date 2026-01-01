import { useEffect } from 'react';
import { useRadioStore } from '../stores/useRadioStore';

export const useKeyboardControls = () => {
    const {
        currentStation,
        isPlaying,
        playStation,
        pauseStation,
        volume,
        setVolume,
        toggleMute,
        filteredStations
    } = useRadioStore();

    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ignore if typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            switch (e.code) {
                case 'Space':
                    e.preventDefault(); // Prevent scrolling
                    if (currentStation) {
                        if (isPlaying) pauseStation();
                        else playStation(currentStation);
                    }
                    else if (filteredStations && filteredStations.length > 0) {
                        // Optional: Play first station if none selected
                        playStation(filteredStations[0]);
                    }
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setVolume(Math.min(1, volume + 0.1)); // 0.01 is too slow, user wants responsiveness
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    setVolume(Math.max(0, volume - 0.1));
                    break;
                case 'KeyM':
                    toggleMute();
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentStation, isPlaying, playStation, pauseStation, volume, setVolume, toggleMute, filteredStations]);
};
