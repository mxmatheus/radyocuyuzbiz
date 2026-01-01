import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRadioStore } from '../stores/useRadioStore';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
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

    // Volume Tooltip State
    const [isVolumeHovered, setIsVolumeHovered] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

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

    useEffect(() => {
        if (!sleepTime) {
            setTimeLeft('');
            return;
        }

        const interval = setInterval(() => {
            const now = Date.now();
            const diff = sleepTime - now;

            if (diff <= 0) {
                stopStation();
                cancelSleepTimer();
                setTimeLeft('');
            } else {
                setTimeLeft(Math.ceil(diff / 60000));
            }
        }, 1000);

        setTimeLeft(Math.ceil((sleepTime - Date.now()) / 60000));

        return () => clearInterval(interval);
    }, [sleepTime, stopStation, cancelSleepTimer]);

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
                        <div className="track-title" title={currentStation.name}>{currentStation.name}</div>
                        <div className="track-artist">{getCountryName(currentStation.countrycode, language) || currentStation.country || 'Unknown'}</div>
                    </div>

                    {/* Controls */}
                    <div className="controls-row">


                        <button onClick={playPreviousStation} className="control-button">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
                        </button>

                        <button
                            className="control-button large"
                            onClick={handlePlayPause}
                            disabled={isBuffering}
                            aria-label={isPlaying ? 'Pause' : 'Play'}
                        >
                            {isBuffering ? (
                                <div className="spinner small" style={{ width: '20px', height: '20px', border: '2px solid rgba(0,0,0,0.3)', borderTopColor: 'black' }}></div>
                            ) : isPlaying ? (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="black"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                            ) : (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="black"><path d="M8 5v14l11-7z" /></svg>
                            )}
                        </button>

                        <button onClick={playNextStation} className="control-button">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
                        </button>
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
