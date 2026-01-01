import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRadioStore } from '../stores/useRadioStore';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useDesktopNotification } from '../hooks/useDesktopNotification';
import { translations } from '../utils/translations';
import { getCountryName } from '../utils/countryTranslator';
import './Player.css';


const Player = () => {
    const {
        currentStation,
        isPlaying,
        volume,
        playStation,
        pauseStation,
        stopStation,
        setVolume,
        sleepTime,
        setSleepTimer,
        cancelSleepTimer,
        playNextStation,
        playPreviousStation,
        handleStationError,
        toggleMute,
        language
    } = useRadioStore();

    const { isBuffering, error } = useAudioPlayer();

    // Desktop notifications
    const { requestPermission, permission } = useDesktopNotification(currentStation, isPlaying);

    // Volume Tooltip State
    const [isVolumeHovered, setIsVolumeHovered] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // Listening Time Tracker
    const [listeningTime, setListeningTime] = useState(0);

    // Track listening duration
    useEffect(() => {
        if (!isPlaying || !currentStation) {
            setListeningTime(0);
            return;
        }

        const startTime = Date.now();
        const interval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            setListeningTime(elapsed);
        }, 1000);

        return () => clearInterval(interval);
    }, [isPlaying, currentStation]);

    // Format time as MM:SS or HH:MM:SS
    const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hrs > 0) {
            return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Auto-skip on error with Debounce
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                handleStationError();
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [error, currentStation, handleStationError]);

    const [timeLeft, setTimeLeft] = useState('');
    const fadeOutRef = useRef(null);
    const originalVolumeRef = useRef(volume);

    useEffect(() => {
        if (!sleepTime) {
            setTimeLeft('');
            // Clear any ongoing fade out
            if (fadeOutRef.current) {
                clearInterval(fadeOutRef.current);
                fadeOutRef.current = null;
            }
            return;
        }

        const interval = setInterval(() => {
            const now = Date.now();
            const diff = sleepTime - now;

            if (diff <= 0) {
                // Time's up - stop
                stopStation();
                cancelSleepTimer();
                setTimeLeft('');
                // Restore original volume
                setVolume(originalVolumeRef.current);
            } else if (diff <= 10000 && !fadeOutRef.current) {
                // Start fade out in last 10 seconds
                originalVolumeRef.current = volume; // Save current volume
                const fadeSteps = 20; // 20 steps over 10 seconds
                const fadeInterval = 500; // Every 500ms
                const volumeStep = volume / fadeSteps;
                let currentFadeVolume = volume;

                fadeOutRef.current = setInterval(() => {
                    currentFadeVolume = Math.max(0, currentFadeVolume - volumeStep);
                    setVolume(currentFadeVolume);

                    if (currentFadeVolume <= 0) {
                        clearInterval(fadeOutRef.current);
                        fadeOutRef.current = null;
                    }
                }, fadeInterval);
            } else {
                setTimeLeft(Math.ceil(diff / 60000));
            }
        }, 1000);

        setTimeLeft(Math.ceil((sleepTime - Date.now()) / 60000));

        return () => {
            clearInterval(interval);
            if (fadeOutRef.current) {
                clearInterval(fadeOutRef.current);
                fadeOutRef.current = null;
            }
        };
    }, [sleepTime, stopStation, cancelSleepTimer, volume, setVolume]);

    const handleSleepTimer = () => {
        if (!sleepTime) {
            setSleepTimer(15);
        } else {
            const remaining = Math.ceil((sleepTime - Date.now()) / 60000);
            if (remaining <= 15) setSleepTimer(30);
            else if (remaining <= 30) setSleepTimer(60);
            else cancelSleepTimer();
        }
    };

    if (!currentStation) return null;

    const handlePlayPause = () => {
        if (isPlaying) {
            pauseStation();
        } else {
            playStation(currentStation);
        }
    };

    const handleVolumeChange = (e) => {
        setVolume(parseFloat(e.target.value));
    };

    return (
        <AnimatePresence>
            <motion.div
                className="player-container glass"
                initial={{ y: 150, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 150, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
                {/* Vinyl Art */}
                <div className="vinyl-wrapper">
                    <motion.img
                        // Try station logo first, fallback to v2.png
                        src={currentStation.favicon || '/radio-placeholder-v2.png'}
                        alt="Station Art"
                        className="vinyl-disc"
                        animate={{ rotate: isPlaying ? 360 : 0 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        onError={(e) => {
                            // Fallback logic
                            if (!e.target.src.includes('radio-placeholder-v2.png')) {
                                e.target.src = '/radio-placeholder-v2.png';
                            } else {
                                // If fallback also fails, hide image to show black vinyl background
                                e.target.style.display = 'none';
                            }
                        }}
                        style={{ display: 'block' }} // Ensure visible initially
                    />
                    <div className="vinyl-hole"></div>
                </div>

                <div className="player-content">
                    {/* Station Info */}
                    <div className="track-info">
                        <div className="station-header">
                            <div className="track-title" title={currentStation.name}>{currentStation.name}</div>
                            {isPlaying && (
                                <div className="listening-time">
                                    <span>{formatTime(listeningTime)} / </span>
                                    <span className="live-dot"></span>
                                    <span className="live-text">CANLI</span>
                                </div>
                            )}
                        </div>
                        <div className="track-artist">{getCountryName(currentStation.countrycode, language) || currentStation.country || 'Unknown'}</div>
                    </div>

                    {/* Controls */}
                    <div className="controls">
                        <motion.button
                            className="control-btn secondary"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => playPreviousStation()}
                            title={translations[language].prevStation}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="19 20 9 12 19 4 19 20"></polygon>
                                <line x1="5" y1="19" x2="5" y2="5"></line>
                            </svg>
                        </motion.button>

                        {isBuffering ? (
                            <div className="buffering-spinner"></div>
                        ) : (
                            <motion.button
                                className="control-btn primary"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={handlePlayPause}
                            >
                                {isPlaying ? (
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                                        <rect x="6" y="4" width="4" height="16"></rect>
                                        <rect x="14" y="4" width="4" height="16"></rect>
                                    </svg>
                                ) : (
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                    </svg>
                                )}
                            </motion.button>
                        )}
                        <motion.button
                            className="control-btn secondary"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => playNextStation()}
                            title={translations[language].nextStation}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="5 4 15 12 5 20 5 4"></polygon>
                                <line x1="19" y1="5" x2="19" y2="19"></line>
                            </svg>
                        </motion.button>
                    </div>

                    {/* Volume Control */}
                    <div className="volume-container">
                        <button
                            onClick={toggleMute}
                            style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex' }}
                        >
                            {volume === 0 ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                                </svg>
                            )}
                        </button>

                        <div
                            className="volume-slider-wrapper"
                            style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
                            onMouseEnter={() => setIsVolumeHovered(true)}
                            onMouseLeave={() => { setIsVolumeHovered(false); setIsDragging(false); }}
                        >
                            {(isVolumeHovered || isDragging) && (
                                <div style={{
                                    position: 'absolute',
                                    top: '-35px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    background: 'var(--color-neon-cyan)',
                                    color: 'black',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold',
                                    pointerEvents: 'none',
                                    whiteSpace: 'nowrap',
                                    boxShadow: '0 5px 15px rgba(0,0,0,0.3)'
                                }}>
                                    %{Math.round(volume * 100)}
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '-4px',
                                        left: '50%',
                                        transform: 'translateX(-50%) rotate(45deg)',
                                        width: '8px',
                                        height: '8px',
                                        background: 'var(--color-neon-cyan)'
                                    }}></div>
                                </div>
                            )}
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={volume}
                                onChange={handleVolumeChange}
                                onMouseDown={() => setIsDragging(true)}
                                onMouseUp={() => setIsDragging(false)}
                                onTouchStart={() => setIsDragging(true)}
                                onTouchEnd={() => setIsDragging(false)}
                                className="volume-slider"
                            />
                        </div>

                        <button
                            className={`control-button ${sleepTime ? 'active' : ''}`}
                            onClick={handleSleepTimer}
                            aria-label={translations[language].sleepTimer}
                            style={{ marginLeft: '10px' }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                            </svg>
                            {timeLeft && (
                                <span style={{
                                    position: 'absolute',
                                    top: '-5px',
                                    right: '-5px',
                                    background: 'var(--color-neon-magenta)',
                                    color: 'white',
                                    fontSize: '0.6rem',
                                    padding: '2px 4px',
                                    borderRadius: '10px',
                                    border: '1px solid black',
                                    fontWeight: 'bold'
                                }}>
                                    {timeLeft}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default Player;
