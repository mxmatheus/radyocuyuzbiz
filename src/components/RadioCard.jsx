import { motion } from 'framer-motion';
import { useRadioStore } from '../stores/useRadioStore';
import { getCountryName } from '../utils/countryTranslator';
import './RadioCard.css';

export const RadioCard = ({ station }) => {
    const {
        currentStation,
        isPlaying,
        playStation,
        pauseStation,
        toggleFavorite,
        favorites,
        language
    } = useRadioStore();

    const isFavorite = favorites.some(f => f.stationuuid === station.stationuuid);

    const isCurrentStation = currentStation?.stationuuid === station.stationuuid;
    const isCurrentlyPlaying = isCurrentStation && isPlaying;

    const handlePlay = () => {
        if (isCurrentStation) {
            if (isPlaying) {
                pauseStation();
            } else {
                playStation(station);
            }
        } else {
            playStation(station);
        }
    };

    // Parse tags for display
    const tags = station.tags
        ? station.tags.split(',').slice(0, 3).map(tag => tag.trim())
        : [];

    return (
        <motion.div
            className={`radio-card card-glass ${isCurrentlyPlaying ? 'playing' : ''}`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePlay}
        >
            <div className="radio-card-content">
                <div className="radio-card-image">
                    {station.favicon ? (
                        <img
                            src={station.favicon}
                            alt={station.name}
                            onError={(e) => {
                                e.target.onerror = null; // Prevent subtle loop
                                e.target.src = '/radio-placeholder-v2.png';
                            }}
                        />
                    ) : (
                        <img
                            src="/radio-placeholder-v2.png"
                            alt={station.name || 'Station'}
                            className="placeholder-image"
                        />
                    )}

                    {isCurrentlyPlaying && (
                        <motion.div
                            className="playing-indicator"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                        >
                            <div className="wave-bar"></div>
                            <div className="wave-bar"></div>
                            <div className="wave-bar"></div>
                        </motion.div>
                    )}
                </div>

                <div className="radio-card-info">
                    <h3 className="radio-card-title">{station.name}</h3>
                    <p className="radio-card-location">
                        {station.state ? `${station.state}, ` : ''}
                        {getCountryName(station.countrycode, language) || station.country}
                    </p>

                    {tags.length > 0 && (
                        <div className="radio-card-tags">
                            {tags.map((tag, index) => (
                                <span key={index} className="tag">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

            </div>

            <div className="card-controls">
                <button
                    className={`favorite-button ${isFavorite ? 'active' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(station);
                    }}
                    aria-label={isFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                </button>

                <button
                    className="play-button"
                    aria-label={isCurrentlyPlaying ? 'Pause' : 'Play'}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (isCurrentlyPlaying) {
                            pauseStation();
                        } else {
                            playStation(station);
                        }
                    }}
                >
                    {isCurrentlyPlaying ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M10 4H6V20H10V4ZM18 4H14V20H18V4Z"
                                fill="currentColor"
                            />
                        </svg>
                    ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M8 5.14V19.14L19 12.14L8 5.14Z"
                                fill="currentColor"
                            />
                        </svg>
                    )}
                </button>
            </div>

            {isCurrentlyPlaying && (
                <motion.div
                    className="active-border"
                    layoutId="activeBorder"
                />
            )}
        </motion.div>
    );
};

export default RadioCard;
