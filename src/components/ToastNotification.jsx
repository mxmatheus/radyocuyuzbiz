import { useRadioStore } from '../stores/useRadioStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function ToastNotification() {
    const { notification } = useRadioStore();

    return (
        <AnimatePresence>
            {notification && (
                <motion.div
                    initial={{ opacity: 0, y: 50, x: '-50%' }}
                    animate={{ opacity: 1, y: 0, x: '-50%' }}
                    exit={{ opacity: 0, y: 50, x: '-50%' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    style={{
                        position: 'fixed',
                        bottom: '120px', // Above player
                        left: '50%',
                        zIndex: 2000,
                        background: 'rgba(15, 23, 42, 0.9)',
                        backdropFilter: 'blur(8px)',
                        color: 'white',
                        padding: '12px 30px',
                        borderRadius: '50px',
                        fontWeight: '500',
                        boxShadow: '0 0 20px rgba(56, 189, 248, 0.3)',
                        border: '1px solid rgba(56, 189, 248, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        whiteSpace: 'nowrap'
                    }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                    {notification}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
