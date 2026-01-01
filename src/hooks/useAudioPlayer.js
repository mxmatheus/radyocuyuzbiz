import { useEffect, useRef, useState } from 'react';
import { useRadioStore } from '../stores/useRadioStore';

export const useAudioPlayer = () => {
    const audioRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const sourceRef = useRef(null);
    const retryCountRef = useRef(0);
    const isProcessingErrorRef = useRef(false); // Prevent duplicate error handling

    const { currentStation, isPlaying, volume, pauseStation, stopStation, setNotification } = useRadioStore();

    const [isBuffering, setIsBuffering] = useState(false);
    const [error, setError] = useState(null);
    const [audioData, setAudioData] = useState(new Uint8Array(128));

    // Helper: Wrap HTTP URLs with proxy in production
    const getProxiedUrl = (url) => {
        // OnlyProxy HTTP URLs in production (HTTPS environment)
        const isProduction = window.location.protocol === 'https:';
        const isHttpUrl = url.startsWith('http://');

        if (isProduction && isHttpUrl) {
            // Use backend proxy to avoid Mixed Content
            const proxyUrl = `/api/radio-proxy?url=${encodeURIComponent(url)}`;
            console.log(`🔄 Proxying HTTP stream: ${url}`);
            return proxyUrl;
        }

        // HTTPS URLs or localhost - use directly
        return url;
    };

    // Cleanup helper
    const cleanupAudioListeners = (audio) => {
        if (!audio) return;
        audio.onloadstart = null;
        audio.oncanplay = null;
        audio.onplaying = null;
        audio.onwaiting = null;
        audio.onerror = null;
    };

    // Attach listeners helper
    const attachAudioListeners = (audio) => {
        if (!audio) return;

        audio.onloadstart = () => setIsBuffering(true);
        audio.oncanplay = () => setIsBuffering(false);
        audio.onplaying = () => setIsBuffering(false);
        audio.onwaiting = () => setIsBuffering(true);

        audio.onerror = (e) => {
            // Prevent duplicate error processing
            if (isProcessingErrorRef.current) {
                console.warn('Error already being processed, ignoring duplicate');
                return;
            }

            // Check if we can retry without CORS
            if (audio.src && audio.src !== window.location.href && retryCountRef.current === 0 && currentStation) {
                console.warn('Audio Error (Likely CORS). Retrying without crossOrigin...', e);
                isProcessingErrorRef.current = true;
                retryCountRef.current = 1;

                // Save station reference to avoid null issues during async
                const stationToRetry = currentStation;

                // Add timeout to prevent indefinite waiting
                const retryTimeout = setTimeout(() => {
                    console.warn('CORS retry timed out');
                    setError('Radyo yüklenemedi (zaman aşımı)');
                    setIsBuffering(false);
                    stopStation();
                    isProcessingErrorRef.current = false;
                }, 5000); // Increased to 5 seconds

                // Stop current
                audio.pause();
                cleanupAudioListeners(audio);

                // RECREATE AUDIO ELEMENT
                const newAudio = new Audio();
                newAudio.crossOrigin = undefined; // NO CORS
                newAudio.preload = 'metadata'; // Changed from 'none' to help load
                newAudio.volume = volume;

                // Update ref FIRST
                audioRef.current = newAudio;

                // Set src and load BEFORE attaching full error listeners
                newAudio.src = stationToRetry.url_resolved || stationToRetry.url;
                newAudio.load();

                // Attach minimal listeners for retry
                newAudio.oncanplay = () => {
                    clearTimeout(retryTimeout);
                    isProcessingErrorRef.current = false;
                    if (setNotification) setNotification("Visualizer devre dışı (CORS) ⚠️");
                    // Now attach full listeners
                    attachAudioListeners(newAudio);
                };

                newAudio.onerror = (retryError) => {
                    clearTimeout(retryTimeout);
                    console.error("Retry play failed", retryError);
                    setError('Radyo çalınamadı');
                    setIsBuffering(false);
                    stopStation();
                    isProcessingErrorRef.current = false;
                };

                // Try to play
                newAudio.play().catch(err => {
                    clearTimeout(retryTimeout);
                    console.error("Play after retry failed", err);
                    isProcessingErrorRef.current = false;
                });

                return;
            }

            // Real Error checking
            if (!audio.src || audio.src === '' || audio.src === window.location.href) return;

            console.error('Audio fatal error:', e);
            setError('Radyo yüklenemedi');
            setIsBuffering(false);
            stopStation();
        };
    };

    // Initialize Audio Element (Once)
    useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio();
            audioRef.current.crossOrigin = 'anonymous';
            audioRef.current.preload = 'none';
            attachAudioListeners(audioRef.current);
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                cleanupAudioListeners(audioRef.current);
                audioRef.current = null;
            }
            // DO NOT close AudioContext here - it breaks reusability
            // AudioContext will be garbage collected when component unmounts
        };
    }, []);

    // Initialize Web Audio API for Visualizer
    useEffect(() => {
        // Create or recreate context if needed
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                audioContextRef.current = new AudioContext();
                analyserRef.current = audioContextRef.current.createAnalyser();
                analyserRef.current.fftSize = 256;
            } catch (err) {
                console.error('Failed to initialize Web Audio API:', err);
                return;
            }
        }

        // Only create source if context is valid and element has CORS
        if (audioRef.current &&
            !sourceRef.current &&
            audioRef.current.crossOrigin === 'anonymous' &&
            audioContextRef.current &&
            audioContextRef.current.state !== 'closed') {
            try {
                sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
                sourceRef.current.connect(analyserRef.current);
                analyserRef.current.connect(audioContextRef.current.destination);
            } catch (e) {
                console.warn("Failed to create MediaElementSource", e);
            }
        }
    }, []);


    // Handle Station Changes
    useEffect(() => {
        // Reset retry count and error flag on station change
        retryCountRef.current = 0;
        isProcessingErrorRef.current = false;

        const audio = audioRef.current;
        if (!audio) return;

        // CRITICAL: Stop current playback immediately
        audio.pause();

        // Ensure we are using a "Visualizer Compatible" Audio element for the new station FIRST
        if (audio.crossOrigin !== 'anonymous') {
            // Reset to "Good" player
            cleanupAudioListeners(audio);

            audioRef.current = new Audio();
            audioRef.current.crossOrigin = 'anonymous';
            audioRef.current.preload = 'none';
            attachAudioListeners(audioRef.current);

            // Re-connect to Web Audio if context is still valid
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                try {
                    if (sourceRef.current) {
                        sourceRef.current.disconnect();
                        sourceRef.current = null;
                    }
                    const newSource = audioContextRef.current.createMediaElementSource(audioRef.current);
                    newSource.connect(analyserRef.current);
                    sourceRef.current = newSource;
                } catch (e) {
                    console.warn("Visualizer reconnect failed", e);
                }
            }
        }

        // Get latest audio ref (might have been recreated above)
        const activeAudio = audioRef.current;
        if (!activeAudio) return;

        if (currentStation && isPlaying) {
            let streamUrl = currentStation.url_resolved || currentStation.url;

            // Use proxy for HTTP URLs in production
            streamUrl = getProxiedUrl(streamUrl);

            setError(null);
            setIsBuffering(true);

            activeAudio.src = streamUrl;
            activeAudio.load();

            const playPromise = activeAudio.play();

            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        // Resume audio context if suspended
                        if (audioContextRef.current?.state === 'suspended') {
                            audioContextRef.current.resume();
                        }
                    })
                    .catch(e => {
                        // Ignore AbortError (rapid switching)
                        if (e.name !== 'AbortError') {
                            console.warn("Play promise rejected", e);
                        }
                    });
            }
        } else {
            setIsBuffering(false);
        }
    }, [currentStation, isPlaying]);

    // Volume Effect
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    // Visualizer Loop
    useEffect(() => {
        let animationFrameId;

        const updateVisualizer = () => {
            if (audioRef.current && !audioRef.current.paused && analyserRef.current) {
                analyserRef.current.getByteFrequencyData(audioData);
                // Create new array to trigger React render
                setAudioData(new Uint8Array(audioData));
            } else {
                setAudioData(new Uint8Array(128).fill(0));
            }
            animationFrameId = requestAnimationFrame(updateVisualizer);
        };

        updateVisualizer();
        return () => cancelAnimationFrame(animationFrameId);
    }, []);

    return { isBuffering, error, audioData };
};
