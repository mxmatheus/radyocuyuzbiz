import * as THREE from 'three';

// Generate a glow texture programmatically
const createGlowTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 32, 32);
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
};

/**
 * Creates a 3D audio visualizer sphere using Web Audio API
 * @param {number} radius - Radius of the visualizer sphere
 * @param {AnalyserNode} analyser - Web Audio analyser node
 * @returns {THREE.Points} - Three.js Points mesh
 */
export const createAudioVisualizer = (radius = 105, analyser) => {
    const particleCount = 2500;
    const geometry = new THREE.BufferGeometry();

    // Create particles in a sphere
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const originalPositions = new Float32Array(particleCount * 3); // Store for wave calculation

    const color1 = new THREE.Color(0x00ffff); // Cyan
    const color2 = new THREE.Color(0xff00ff); // Magenta

    for (let i = 0; i < particleCount; i++) {
        // Spherical distribution
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = radius + Math.random() * 30; // More spread

        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        originalPositions[i * 3] = x;
        originalPositions[i * 3 + 1] = y;
        originalPositions[i * 3 + 2] = z;

        // Initial Gradient
        const mixedColor = color1.clone().lerp(color2, Math.random());
        colors[i * 3] = mixedColor.r;
        colors[i * 3 + 1] = mixedColor.g;
        colors[i * 3 + 2] = mixedColor.b;

        sizes[i] = Math.random() * 4 + 2; // Larger particles for glow
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('originalPosition', new THREE.BufferAttribute(originalPositions, 3));

    const material = new THREE.PointsMaterial({
        size: 4,
        vertexColors: true,
        map: createGlowTexture(),
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false, // Better glow layering
        sizeAttenuation: true
    });

    const particles = new THREE.Points(geometry, material);
    particles.name = 'audioVisualizer';

    return particles;
};

/**
 * Updates visualizer based on audio frequency data
 * @param {THREE.Points} visualizer - The visualizer mesh
 * @param {Uint8Array} frequencyData - Audio frequency data
 */
let time = 0;
export const updateVisualizer = (visualizer, frequencyData) => {
    if (!visualizer || !frequencyData) return;

    const positions = visualizer.geometry.attributes.position.array;
    const originalPositions = visualizer.geometry.attributes.originalPosition.array;
    const colors = visualizer.geometry.attributes.color.array;
    const sizes = visualizer.geometry.attributes.size.array;

    // Get average frequency for global intensity
    // Focus on bass frequencies (lower indices) for pulse
    let bassSum = 0;
    for (let i = 0; i < 40; i++) bassSum += frequencyData[i]; // First 40 bins
    const bassIntensity = (bassSum / 40) / 255;

    const avg = frequencyData.reduce((a, b) => a + b, 0) / frequencyData.length;
    const intensity = avg / 255;

    time += 0.02 + (intensity * 0.05); // Speed up with music

    // Dynamic Colors based on time and intensity
    // Use higher Lightness for more vibrant colors
    const timeColor1 = new THREE.Color().setHSL((time * 0.1) % 1, 1.0, 0.6);
    const timeColor2 = new THREE.Color().setHSL((time * 0.1 + 0.5) % 1, 1.0, 0.6);

    // Update particle positions based on audio
    for (let i = 0; i < positions.length / 3; i++) {
        const freqIndex = Math.floor((i / (positions.length / 3)) * frequencyData.length);
        const freqValue = frequencyData[freqIndex] / 255;

        // 1. Radial Breathing / Expansion
        const ox = originalPositions[i * 3];
        const oy = originalPositions[i * 3 + 1];
        const oz = originalPositions[i * 3 + 2];

        // Calculate base distance from center
        // const dist = Math.sqrt(ox*ox + oy*oy + oz*oz);

        // Breathing effect: Base sine wave + Bass kick
        // Move particles in/out from center
        const breathing = Math.sin(time * 0.5) * 5; // Slow breathing +/- 5 units
        const kick = bassIntensity * 15; // Fast kick outward

        // Apply radial scale
        // We normalize the vector (ox, oy, oz), then multiply by (original_radius + effects)
        // But since they are already spherical, we can just scale the vector
        const scaleFactor = 1 + (breathing + kick * freqValue) * 0.005; // Gentle scaling

        // Wave movement (keep this, it's nice)
        const wave = Math.sin(time * 2 + oy * 0.05) * 5 * intensity;

        positions[i * 3] = ox * scaleFactor + wave * 0.2; // Reduced wave influence on position
        positions[i * 3 + 1] = oy * scaleFactor + wave; // Up/down movement
        positions[i * 3 + 2] = oz * scaleFactor;

        // 2. Color Shift
        const mixRatio = (Math.sin(time + i * 0.001) + 1) / 2;
        const finalColor = timeColor1.clone().lerp(timeColor2, mixRatio);

        // Brighten on high intensity
        if (freqValue > 0.6) {
            finalColor.lerp(new THREE.Color(1, 1, 1), (freqValue - 0.6) * 1.5);
        }

        colors[i * 3] = finalColor.r;
        colors[i * 3 + 1] = finalColor.g;
        colors[i * 3 + 2] = finalColor.b;

        // 3. Size Scale
        sizes[i] = (Math.random() * 4 + 3) * (1 + freqValue * 1.5);
    }

    // Rotate the visualizer
    visualizer.rotation.y += 0.002 + intensity * 0.005;
    visualizer.rotation.z = Math.sin(time * 0.5) * 0.1;

    visualizer.geometry.attributes.position.needsUpdate = true;
    visualizer.geometry.attributes.color.needsUpdate = true;
    visualizer.geometry.attributes.size.needsUpdate = true;

    // Update opacity based on audio - Keep minimum higher to avoid fading too much
    visualizer.material.opacity = 0.6 + intensity * 0.4;
};
