import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRadioStore } from '../stores/useRadioStore';
import { translations } from '../utils/translations';

export default function HeaderMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const [showEq, setShowEq] = useState(true);
    const menuRef = useRef(null);

    const {
        openFavorites,
        openHistory,
        openTrending,
        surpriseMe,
        openSettings,
        eqSettings,
        setEqSettings,
        language
    } = useRadioStore();

    // Close on outside click
    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuRef]);

    return (
        <div ref={menuRef} style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 200 }}>
            {/* Main Arguments Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="btn-neon"
                style={{
                    width: '44px',
                    height: '44px',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isOpen ? 'rgba(56, 189, 248, 0.2)' : 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid var(--color-neon-cyan)',
                    borderRadius: '12px',
                    color: 'var(--color-neon-cyan)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                }}
                aria-label="Menü"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="4" y1="12" x2="20" y2="12"></line>
                    <line x1="4" y1="6" x2="20" y2="6"></line>
                    <line x1="4" y1="18" x2="20" y2="18"></line>
                </svg>
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.2 }}
                        style={{
                            position: 'absolute',
                            top: '55px',
                            right: '0',
                            width: '280px',
                            background: 'rgba(15, 23, 42, 0.9)',
                            backdropFilter: 'blur(16px)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '16px',
                            padding: '12px',
                            boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                        }}
                    >
                        <MenuItem onClick={() => { openFavorites(); setIsOpen(false); }} icon="heart" label={translations[language].favorites} />
                        {/* Only show Trending if not explicitly disabled or check store */}
                        <MenuItem
                            onClick={() => { openTrending(); setIsOpen(false); }}
                            icon="none"
                            customIcon={<span style={{ fontSize: '1.2rem', marginRight: '8px' }}>📈</span>}
                            label={translations[language].trending}
                        />
                        <MenuItem onClick={() => { openHistory(); setIsOpen(false); }} icon="clock" label={translations[language].history} />

                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 0' }}></div>

                        {/* Audio Controls Section */}
                        <div style={{ padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                            <div
                                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', cursor: 'pointer' }}
                                onClick={() => setShowEq(!showEq)}
                            >
                                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'rgba(255,255,255,0.6)', letterSpacing: '1px' }}>{translations[language].soundEq}</span>
                                <svg
                                    width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                    style={{ transform: showEq ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', opacity: 0.5 }}
                                >
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </div>

                            <AnimatePresence>
                                {showEq && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        style={{ overflow: 'hidden' }}
                                    >
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '4px' }}>
                                            <EqSlider label="Bass" value={eqSettings?.bass || 0} onChange={(v) => setEqSettings({ bass: v })} />
                                            <EqSlider label="Mid" value={eqSettings?.mid || 0} onChange={(v) => setEqSettings({ mid: v })} />
                                            <EqSlider label="Treble" value={eqSettings?.treble || 0} onChange={(v) => setEqSettings({ treble: v })} />
                                        </div>
                                        <div style={{ textAlign: 'center', marginTop: '8px' }}>
                                            <button
                                                onClick={() => setEqSettings({ bass: 0, mid: 0, treble: 0 })}
                                                style={{
                                                    fontSize: '0.7rem',
                                                    color: 'rgba(255,255,255,0.5)',
                                                    background: 'rgba(255,255,255,0.05)',
                                                    border: 'none',
                                                    padding: '4px 12px',
                                                    borderRadius: '12px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.2)'}
                                                onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                                            >
                                                {translations[language].reset}
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 0' }}></div>

                        {/* Settings Link */}
                        <MenuItem onClick={() => { openSettings(); setIsOpen(false); }} icon="settings" label="Tema Ayarları" />

                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Helper Component for Menu Items
function MenuItem({ onClick, icon, label, customIcon }) {
    return (
        <motion.div
            onClick={onClick}
            whileHover={{ x: 4, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
            style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                color: 'rgba(255,255,255,0.9)',
                fontSize: '0.95rem',
                transition: 'background 0.2s'
            }}
        >
            {customIcon ? customIcon : (
                <div style={{ width: '20px', marginRight: '12px', display: 'flex', alignItems: 'center' }}>
                    {icon === 'heart' && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>}
                    {icon === 'clock' && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>}
                    {icon === 'settings' && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>}
                    {icon === 'zap' && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>}
                </div>
            )}
            <span>{label}</span>
        </motion.div>
    );
}

function EqSlider({ label, value, onChange }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '40px', fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)' }}>{label}</span>
            <input
                type="range"
                min="-10"
                max="10"
                step="1"
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                style={{ flex: 1, accentColor: 'var(--color-neon-cyan)', height: '4px' }}
            />
        </div>
    );
}
