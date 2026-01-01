import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRadioStore } from '../stores/useRadioStore';
import { translations } from '../utils/translations';
import './OpeningScene.css';

export const OpeningScene = ({ onComplete }) => {
    const [show, setShow] = useState(true);
    const { language } = useRadioStore();

    const handleStart = () => {
        setShow(false);
        setTimeout(() => {
            if (onComplete) onComplete();
        }, 300);
    };

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    className="opening-scene"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="opening-content">
                        <motion.h1
                            className="opening-title gradient-text"
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
                        >
                            {translations[language].openingTitle}
                        </motion.h1>

                        <motion.p
                            className="opening-subtitle"
                            initial={{ y: 30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.8, duration: 0.6, ease: 'easeOut' }}
                        >
                            SONICATLAS
                        </motion.p>

                        <motion.div
                            className="opening-description"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.3, duration: 0.6 }}
                        >
                            <p>{translations[language].openingDesc}</p>
                        </motion.div>

                        <motion.button
                            className="skip-button btn-neon"
                            onClick={handleStart}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.8, duration: 0.5 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {translations[language].start}
                        </motion.button>
                    </div>

                    {/* Animated Background */}
                    <div className="opening-background">
                        <motion.div
                            className="pulse-ring"
                            animate={{
                                scale: [1, 2.5, 1],
                                opacity: [0.4, 0, 0.4],
                            }}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                                ease: 'easeInOut',
                            }}
                        />
                        <motion.div
                            className="pulse-ring"
                            animate={{
                                scale: [1, 2.5, 1],
                                opacity: [0.4, 0, 0.4],
                            }}
                            transition={{
                                duration: 4,
                                delay: 2,
                                repeat: Infinity,
                                ease: 'easeInOut',
                            }}
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default OpeningScene;
