import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRadioStore } from '../stores/useRadioStore';
import { translations } from '../utils/translations';
import { getCountryName } from '../utils/countryTranslator';
import RadioCard from './RadioCard';
import SearchBar from './SearchBar';
import './RadioPanel.css';

const STATIONS_PER_PAGE = 20;

export const RadioPanel = () => {
    const {
        showRadioPanel,
        selectedCountry,
        filteredStations,
        isLoadingStations,
        clearSelectedCountry,
        currentStation,
        selectedCountryCode,
        theme,
        setTheme,
        toggleMenu,
        language,
        toggleTrendMode,
        trendMode
    } = useRadioStore();

    const [currentPage, setCurrentPage] = useState(1);



    // Reset page when country or filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedCountry, filteredStations]);

    // Pagination logic
    const totalPages = Math.ceil(filteredStations.length / STATIONS_PER_PAGE);
    const startIndex = (currentPage - 1) * STATIONS_PER_PAGE;
    const currentStations = filteredStations.slice(startIndex, startIndex + STATIONS_PER_PAGE);

    const handlePageChange = (page) => {
        setCurrentPage(page);
        // Scroll to top of list
        const list = document.querySelector('.radio-panel-content');
        if (list) list.scrollTop = 0;
    };

    return (
        <AnimatePresence>
            {showRadioPanel && (
                <motion.div
                    className={`radio-panel glass ${currentStation ? 'with-player' : ''}`}
                    initial={{ x: -450, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -450, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                >
                    <div className="radio-panel-header">
                        <div className="header-top">
                            <div>
                                <h2 className="gradient-text">
                                    {selectedCountryCode === 'FAV' ? translations[language].favorites :
                                        selectedCountryCode === 'HIST' ? translations[language].history :
                                            selectedCountryCode === 'TRENDS' ? translations[language].trending :
                                                getCountryName(selectedCountryCode, language) || selectedCountry}
                                </h2>
                                <p className="station-count">
                                    {filteredStations.length} {translations[language].stationsFound}
                                </p>
                            </div>

                            {/* Trend Mode Toggle (only show for TRENDS) */}
                            {selectedCountryCode === 'TRENDS' && (
                                <button
                                    onClick={toggleTrendMode}
                                    className="btn-neon"
                                    style={{
                                        padding: '6px 12px',
                                        fontSize: '0.85rem',
                                        marginRight: '8px'
                                    }}
                                    title={trendMode === 'global' ? 'Global Trends' : 'Local Trends'}
                                >
                                    {trendMode === 'global' ? '🌍 Global' : '📍 Local'}
                                </button>
                            )}

                            <button
                                onClick={toggleMenu}
                                className="close-panel-btn"
                                aria-label="Kapat"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>

                        <div className="panel-search-container">
                            <SearchBar />
                        </div>
                    </div>

                    <div className="radio-panel-content">
                        {isLoadingStations ? (
                            <div className="loading-container">
                                <div className="spinner"></div>
                                <p>{translations[language].stationsLoading}</p>
                            </div>
                        ) : filteredStations.length === 0 ? (
                            <div className="empty-state">
                                <p>{translations[language].noStations}</p>
                            </div>
                        ) : (
                            <div className="stations-list">
                                <div className="radio-list">
                                    {currentStations.map((station, index) => (
                                        <RadioCard
                                            key={`${station.stationuuid}-${index}`}
                                            station={station}
                                        />
                                    ))}
                                </div>

                                {/* Pagination Controls */}
                                {totalPages > 1 && (
                                    <div className="pagination">
                                        <div className="pagination-info">
                                            Sayfa {currentPage} / {totalPages}
                                        </div>
                                        <div className="pagination-controls">
                                            <button
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1}
                                                className="pagination-btn"
                                            >
                                                &lt;
                                            </button>

                                            {/* Page Numbers - simplified logic */}
                                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                // Center active page logic could go here, keeping it simple for now
                                                let pageNum = currentPage;
                                                if (currentPage <= 3) pageNum = i + 1;
                                                else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                                                else pageNum = currentPage - 2 + i;

                                                // Bound checks
                                                if (pageNum < 1) pageNum = i + 1;
                                                if (pageNum > totalPages) return null;

                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => handlePageChange(pageNum)}
                                                        className={`pagination-num ${currentPage === pageNum ? 'active' : ''}`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}

                                            <button
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                                className="pagination-btn"
                                            >
                                                &gt;
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default RadioPanel;
