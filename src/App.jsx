import { useState, useEffect } from 'react';
import GlobeComponent from './components/Globe';
import RadioPanel from './components/RadioPanel';
import Player from './components/Player';
import OpeningScene from './components/OpeningScene';
import SearchBar from './components/SearchBar';
import SettingsModal from './components/SettingsModal';
import ToastNotification from './components/ToastNotification';
import { useRadioStore } from './stores/useRadioStore';
import HeaderMenu from './components/HeaderMenu';
import { translations } from './utils/translations';
import { useKeyboardControls } from './hooks/useKeyboardControls';
import { AnimatePresence, motion } from 'framer-motion';
import './App.css';

function App() {
  const [showOpening, setShowOpening] = useState(true);
  const [globeReady, setGlobeReady] = useState(false);
  const { openFavorites, openHistory, openSettings, theme, toggleMenu, showRadioPanel, completeStartup, language } = useRadioStore();

  useKeyboardControls();

  useEffect(() => {
    // Finish startup phase after 5 seconds to suppress initial errors
    const timer = setTimeout(() => {
      completeStartup();
    }, 5000);
    return () => clearTimeout(timer);
  }, [completeStartup]);

  useEffect(() => {
    document.body.className = `theme-${theme}`;
  }, [theme]);

  // Global ESC Handler to close menu
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        const { showRadioPanel, toggleMenu } = useRadioStore.getState();
        if (showRadioPanel) {
          toggleMenu();
        }
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const handleOpeningComplete = () => {
    setShowOpening(false);
  };

  const handleGlobeReady = () => {
    setGlobeReady(true);
  };

  return (
    <div className="app-container">
      {/* Background Globe */}
      <GlobeComponent onGlobeReady={() => setGlobeReady(true)} />

      {/* Opening Scene (Overlay) */}
      <AnimatePresence>
        {showOpening && (
          <motion.div
            className="opening-overlay"
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            <OpeningScene onComplete={handleOpeningComplete} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main UI Layer */}
      <div className="ui-layer" style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none' }}>

        {/* App Title & Hamburger */}
        {globeReady && !showOpening && (
          <motion.div
            style={{
              position: 'absolute',
              top: '20px',
              left: '30px',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              pointerEvents: 'auto'
            }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <motion.button
              onClick={toggleMenu}
              className="btn-neon"
              style={{
                padding: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                minWidth: 'auto'
              }}
              aria-label="Menü"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2, type: 'spring', stiffness: 200 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </motion.button>

            <motion.div
              style={{ pointerEvents: 'none' }}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
            >
              <h1 className="gradient-text" style={{ margin: 0, fontSize: '2rem', lineHeight: 1 }}>SONICATLAS</h1>
              <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.7, letterSpacing: '4px' }}>{translations[language].subtitle}</p>
            </motion.div>
          </motion.div>
        )}

        {/* Unified Header Menu */}
        {globeReady && !showOpening && (
          <div style={{ pointerEvents: 'auto' }}>
            <HeaderMenu />
          </div>
        )}

        {/* Radio Station Panel */}
        <div className="side-panel-wrapper" style={{ pointerEvents: 'auto' }}>
          <RadioPanel />
        </div>



        {/* Player Controls - Bottom */}
        <div style={{ pointerEvents: 'auto' }}>
          <Player />
        </div>

        {/* Overlays */}
        <SettingsModal />
        <ToastNotification />

      </div>
    </div>
  );
}

export default App;
