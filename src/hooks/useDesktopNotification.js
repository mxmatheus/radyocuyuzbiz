import { useEffect } from 'react';

/**
 * Hook to show desktop notifications for station changes
 * @param {object} currentStation - Currently playing station
 * @param {boolean} isPlaying - Whether audio is playing
 * @returns {object} - { requestPermission, isSupported }
 */
export const useDesktopNotification = (currentStation, isPlaying) => {
    const isSupported = 'Notification' in window;

    const requestPermission = async () => {
        if (!isSupported) return false;

        const permission = await Notification.requestPermission();
        return permission === 'granted';
    };

    useEffect(() => {
        if (!isSupported || !isPlaying || !currentStation) return;
        if (Notification.permission !== 'granted') return;

        // Show notification when station changes
        const notification = new Notification('🎵 Now Playing', {
            body: `${currentStation.name}\n${currentStation.country || 'Unknown Location'}`,
            icon: currentStation.favicon || '/favicon.png',
            badge: '/favicon.png',
            tag: 'radio-station', // Replace previous notification
            requireInteraction: false,
            silent: true
        });

        // Auto-close after 4 seconds
        setTimeout(() => notification.close(), 4000);

        return () => {
            notification.close();
        };
    }, [currentStation?.stationuuid, isPlaying, isSupported]);

    return {
        requestPermission,
        isSupported,
        permission: isSupported ? Notification.permission : 'denied'
    };
};

export default useDesktopNotification;
