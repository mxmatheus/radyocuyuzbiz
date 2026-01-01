import React from 'react';
import { useRadioStore } from '../stores/useRadioStore';
import { translations } from '../utils/translations';
import { motion, AnimatePresence } from 'framer-motion';

export default function SettingsModal() {
    const {
        showSettingsModal,
        closeSettings,
        theme,
        setTheme,
        language,
        setLanguage,
        visualizerMode,
        setVisualizerMode,
        eqSettings,
        setEqSettings
    } = useRadioStore();

    // Close on ESC
    React.useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && showSettingsModal) {
                closeSettings();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [showSettingsModal, closeSettings]);

    if (!showSettingsModal) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="settings-overlay"
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'auto' // Ensure clickable
                }}
            >
                {/* Backdrop */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)'
                    }}
                    onClick={closeSettings}
                />

                {/* Content */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="glass"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        position: 'relative',
                        width: '90%',
                        maxWidth: '450px',
                        padding: '2rem',
                        borderRadius: '24px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        maxHeight: '90vh',
                        overflowY: 'auto'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h2 className="gradient-text" style={{ margin: 0, fontSize: '1.5rem' }}>{translations[language].settings}</h2>
                        <button onClick={closeSettings} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {/* LANGUAGE */}
                        <div>
                            <h3 style={sectionTitleStyle}>{translations[language].language}</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <ThemeButton active={language === 'tr'} color="#ffffff" label="Türkçe (TR)" onClick={() => setLanguage('tr')} />
                                <ThemeButton active={language === 'en'} color="#ffffff" label="English (EN)" onClick={() => setLanguage('en')} />
                            </div>
                        </div>

                        {/* THEME */}
                        <div>
                            <h3 style={sectionTitleStyle}>{translations[language].appearance}</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <ThemeButton active={theme === 'cyan'} color="#38bdf8" label={translations[language].neon} onClick={() => setTheme('cyan')} />
                                <ThemeButton active={theme === 'gold'} color="#ffd700" label={translations[language].gold} onClick={() => setTheme('gold')} />
                                <ThemeButton active={theme === 'green'} color="#00ff88" label={translations[language].green} onClick={() => setTheme('green')} />
                                <ThemeButton active={theme === 'purple'} color="#d946ef" label={translations[language].purple} onClick={() => setTheme('purple')} />
                            </div>
                        </div>

                        {/* VISUALIZER & EQ MOVED TO HEADER MENU */}

                    </div>

                    <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
                        SonicAtlas v1.3.0
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

const sectionTitleStyle = {
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: '#94a3b8',
    marginBottom: '1rem'
};

function ThemeButton({ active, color, label, onClick }) {
    return (
        <button
            onClick={onClick}
            style={{
                padding: '12px',
                border: `1px solid ${color}`,
                borderRadius: '12px',
                background: active ? `${color}33` : 'transparent',
                color: color,
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                transform: active ? 'scale(1.02)' : 'scale(1)',
                boxShadow: active ? `0 0 15px ${color}40` : 'none'
            }}
        >
            {label}
        </button>
    );
}

function VisButton({ active, label, onClick }) {
    return (
        <button
            onClick={onClick}
            style={{
                padding: '8px',
                border: active ? '1px solid var(--color-neon-cyan)' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                background: active ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                color: active ? 'var(--color-neon-cyan)' : 'rgba(255,255,255,0.6)',
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
            }}
        >
            {label}
        </button>
    );
}

function EqSlider({ label, value, onChange }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ width: '80px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>{label}</span>
            <input
                type="range"
                min="-10"
                max="10"
                step="1"
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                style={{ flex: 1, accentColor: 'var(--color-neon-cyan)', height: '4px' }}
            />
            <span style={{ width: '30px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', textAlign: 'right' }}>{value > 0 ? `+${value}` : value}</span>
        </div>
    );
}
