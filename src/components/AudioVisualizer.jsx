import { useEffect, useRef } from 'react';

export const AudioVisualizer = ({ audioData, isPlaying, mode = 'wave' }) => {
    const canvasRef = useRef(null);
    const frameIdRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Resize handler
        const handleResize = () => {
            if (canvas && canvas.parentElement) {
                canvas.width = canvas.parentElement.offsetWidth;
                canvas.height = canvas.parentElement.offsetHeight;
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        const ctx = canvas.getContext('2d');

        const draw = () => {
            frameIdRef.current = requestAnimationFrame(draw);

            if (!isPlaying || !audioData) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                return;
            }

            const width = canvas.width;
            const height = canvas.height;
            const bufferLength = audioData.length;

            ctx.clearRect(0, 0, width, height);

            if (mode === 'off') return;

            if (mode === 'bars') {
                const barWidth = (width / bufferLength) * 2.5;
                let x = 0;
                for (let i = 0; i < bufferLength; i++) {
                    const barHeight = (audioData[i] / 255) * height * 0.8; // Use 80% height Max

                    // Gradient fill for bars
                    const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
                    gradient.addColorStop(0, 'rgba(56, 189, 248, 0.8)');
                    gradient.addColorStop(1, 'rgba(139, 92, 246, 0.5)');

                    ctx.fillStyle = gradient;
                    ctx.fillRect(x, height - barHeight, barWidth, barHeight);
                    x += barWidth + 1;
                }
            } else if (mode === 'wave') {
                ctx.lineWidth = 3;
                ctx.strokeStyle = 'rgba(217, 70, 239, 0.8)'; // Neon Purple
                ctx.beginPath();
                const sliceWidth = width * 1.0 / bufferLength;
                let x = 0;

                // Draw wave centered vertically in the canvas (which is bottom 50vh)
                // So it will be around 25% from bottom of screen
                const centerY = height / 1.5;

                for (let i = 0; i < bufferLength; i++) {
                    const v = audioData[i] / 128.0;
                    const y = v * (height / 4) + (centerY - height / 4); // Amplitude adjustment

                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                    x += sliceWidth;
                }
                ctx.stroke();
            } else if (mode === 'circle') {
                const centerX = width / 2;
                const centerY = height / 2;
                // Radius adjusted to fit around Globe (Approx 35-40% of screen min dim)
                const radius = Math.min(width, height) / 3.2;

                // Draw glowy circle base
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
                ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
                ctx.lineWidth = 2;
                ctx.stroke();

                // Draw pulsing bars around circle
                const barCount = 120;
                const step = Math.floor(bufferLength / barCount);

                for (let i = 0; i < barCount; i++) {
                    const value = audioData[i * step];
                    const percent = value / 255;
                    const barHeight = percent * (radius * 0.4); // Bars extend out

                    const angle = (i / barCount) * Math.PI * 2;

                    // Start from outer edge of radius
                    const x1 = centerX + Math.cos(angle) * radius;
                    const y1 = centerY + Math.sin(angle) * radius;

                    const x2 = centerX + Math.cos(angle) * (radius + barHeight);
                    const y2 = centerY + Math.sin(angle) * (radius + barHeight);

                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);

                    // Color cycle around circle
                    ctx.strokeStyle = `hsla(${i * 360 / barCount}, 100%, 70%, 0.8)`;
                    ctx.lineWidth = 3;
                    ctx.stroke();
                }
            }
        };

        draw();

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(frameIdRef.current);
        };
    }, [audioData, isPlaying, mode]);

    return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />;
};
