import { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import Globe from 'react-globe.gl';
import { useRadioStore } from '../stores/useRadioStore';
import radioBrowserService from '../services/RadioBrowserService';
import { COUNTRY_COORDS, getCountryAltitude } from '../utils/countryCoordinates';
import { getCountryName } from '../utils/countryTranslator';
import { translations } from '../utils/translations';
import './Globe.css';

// Get user's timezone offset to determine if it's day or night
const getUserTimezoneOffset = () => {
    return new Date().getTimezoneOffset() / -60;
};

// Detect user's approximate country from timezone
const detectUserCountry = () => {
    const now = new Date();
    const offset = getUserTimezoneOffset();

    // Simple heuristic: Turkey is UTC+3
    if (offset === 3) return 'TR';
    if (offset === 0) return 'GB';
    if (offset === 1) return 'FR';
    if (offset === 2) return 'GR';
    if (offset === -5) return 'US';
    if (offset === 9) return 'JP';

    return 'TR'; // Default to Turkey
};

export const GlobeComponent = ({ onGlobeReady }) => {
    const globeRef = useRef();
    const [statsData, setStatsData] = useState([]); // Country stats (station counts)
    const [countriesGeoJson, setCountriesGeoJson] = useState({ features: [] });
    const [hoveredPolygon, setHoveredPolygon] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasInitialized, setHasInitialized] = useState(false);

    const {
        setSelectedCountry,
        selectedCountryCode,
        currentStation,
        isPlaying,
        setAllStations,
        setFilteredStations,
        setIsLoadingStations,
        language
    } = useRadioStore();

    // Load GeoJSON
    useEffect(() => {
        // Use a reliable GeoJSON source tailored for globe visualization
        fetch('//raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
            .then(res => res.json())
            .then(data => {
                setCountriesGeoJson(data);
                setIsLoading(false);
            })
            .catch(err => {
                console.error('Failed to load GeoJSON:', err);
                setIsLoading(false);
            });
    }, []);

    // Initial camera animation
    useEffect(() => {
        if (globeRef.current && !hasInitialized) {
            setHasInitialized(true);

            // Start from far away
            globeRef.current.pointOfView({ altitude: 4.5 }, 0);

            // Animate to user's country
            setTimeout(() => {
                const userCountry = detectUserCountry();
                const coords = COUNTRY_COORDS[userCountry];

                if (coords && onGlobeReady && globeRef.current) {
                    globeRef.current.pointOfView(
                        {
                            lat: coords.lat,
                            lng: coords.lng,
                            altitude: 2.5,
                        },
                        3000
                    );

                    setTimeout(() => {
                        if (onGlobeReady) onGlobeReady();
                    }, 3000);
                }
            }, 500);

            // Enable smooth rotation with inertia (momentum)
            if (globeRef.current) {
                const controls = globeRef.current.controls();
                controls.enableDamping = true;
                controls.dampingFactor = 0.1;
                controls.rotateSpeed = 0.5;
            }
        }
    }, [hasInitialized, onGlobeReady]);

    // Load station counts
    useEffect(() => {
        const loadStats = async () => {
            try {
                const countries = await radioBrowserService.getStationCountByCountry();
                setStatsData(countries);
            } catch (error) {
                console.error('Failed to load station stats:', error);
            }
        };

        loadStats();
    }, []);

    // Helper to get station count for a polygon
    const getCountryStats = (isoCode) => {
        if (!isoCode || isoCode === '-99') return null;
        return statsData.find(c => c.code === isoCode) || { stationCount: 0 };
    };

    // Helper to fix broken ISO codes in GeoJSON (e.g. Norway as -99)
    const getSafeCountryCode = (feature) => {
        let code = feature.ISO_A2;
        const name = feature.ADMIN;

        if (code === '-99') {
            if (name === 'Norway') return 'NO';
            if (name === 'France') return 'FR';
            if (name === 'Kosovo') return 'XK'; // Or RS depending on political view, but XK is often used
            if (name === 'Somaliland') return 'SO';
            if (name === 'Northern Cyprus') return 'TR'; // Or CY? Usually handled as TR radio wise or specific
        }
        return code;
    };

    const handleCountryClick = async (polygon) => {
        if (!polygon) return;

        const countryCode = getSafeCountryCode(polygon.properties);
        const countryName = polygon.properties.ADMIN; // or NAME

        if (!countryCode) return;

        // Use precise coordinates if available, otherwise rely on globe interaction
        const coords = COUNTRY_COORDS[countryCode];

        if (globeRef.current && coords) {
            const altitude = getCountryAltitude(countryCode);
            globeRef.current.pointOfView(
                {
                    lat: coords.lat,
                    lng: coords.lng,
                    altitude: altitude,
                },
                1200
            );
        }

        // Load country stations
        try {
            // 1. Optimistic Update: Switch UI to loading state immediately
            setIsLoadingStations(true);
            setFilteredStations([]); // Clear old list

            // Set Title immediately so menu shows correct country and breaks out of FAV/HIST mode
            const trName = getCountryName(countryCode, language);
            setSelectedCountry(trName || countryName, countryCode);

            // 2. Fetch
            const stations = await radioBrowserService.getStationsByCountry(countryCode);

            // 3. Race Condition Check: Did user switch away (e.g. to FAV) while fetching?
            const currentCode = useRadioStore.getState().selectedCountryCode;
            if (currentCode !== countryCode) return; // Discard result if we moved to another country/mode

            // 4. Update Logic
            setAllStations(stations);
            setFilteredStations(stations);
        } catch (error) {
            console.error('Failed to load country stations:', error);
            // If failed, maybe revert title? But better to leave it or show error.
        } finally {
            // Only stop loading if we are still on the target country
            if (useRadioStore.getState().selectedCountryCode === countryCode) {
                setIsLoadingStations(false);
            }
        }
    };

    // React to Country Selection changes (e.g. from Surprise Me / Store updates)
    useEffect(() => {
        if (globeRef.current && selectedCountryCode && selectedCountryCode.length === 2 && selectedCountryCode !== 'FAV' && selectedCountryCode !== 'HIST' && selectedCountryCode !== 'TRENDS') {
            const coords = COUNTRY_COORDS[selectedCountryCode];
            if (coords) {
                const altitude = getCountryAltitude(selectedCountryCode);
                globeRef.current.pointOfView(
                    {
                        lat: coords.lat,
                        lng: coords.lng,
                        altitude: altitude,
                    },
                    2000 // Smooth fly to new country
                );
            }
        }
    }, [selectedCountryCode]);

    // Add Sun Light and improve ambient lighting
    useEffect(() => {
        if (globeRef.current) {
            const scene = globeRef.current.scene();
            const directionalLight = scene.children.find(c => c.type === 'DirectionalLight');
            if (directionalLight) {
                directionalLight.position.set(1, 1, 1); // Fixed generic sunlight
                directionalLight.intensity = 1.2;
            }

            const ambientLight = scene.children.find(c => c.type === 'AmbientLight');
            if (ambientLight) {
                ambientLight.intensity = 0.6; // Brighter ambient for standard look
            }
        }
    }, [hasInitialized]);

    return (
        <div className="globe-container">
            {isLoading && (
                <div className="globe-loading">
                    <div className="spinner"></div>
                    <p className="gradient-text">Dünya Yükleniyor...</p>
                </div>
            )}

            <Globe
                ref={globeRef}
                backgroundColor="rgba(0,0,0,0)"
                globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
                bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"

                // Polygons Layer (Countries)
                polygonsData={countriesGeoJson.features}
                polygonAltitude={d => d === hoveredPolygon ? 0.03 : 0.01}
                polygonCapColor={d => {
                    // Check if selected
                    if (selectedCountryCode && d.properties.ISO_A2 === selectedCountryCode) {
                        return 'rgba(139, 92, 246, 0.4)'; // Neon Purple for selected
                    }
                    // Check if hovered
                    if (d === hoveredPolygon) {
                        return 'rgba(56, 189, 248, 0.3)'; // Neon Cyan for hover
                    }
                    return 'rgba(0, 0, 0, 0)'; // Transparent default
                }}
                polygonSideColor={() => 'rgba(255, 255, 255, 0.05)'}
                polygonStrokeColor={d => {
                    if (selectedCountryCode && d.properties.ISO_A2 === selectedCountryCode) {
                        return '#c084fc'; // Bright Purple Border selected
                    }
                    if (d === hoveredPolygon) {
                        return '#38bdf8'; // Cyan Border hover
                    }
                    return 'rgba(255, 255, 255, 0.1)'; // Subtle border default
                }}
                polygonLabel={({ properties: d }) => {
                    const code = getSafeCountryCode(d);
                    const stats = getCountryStats(code);
                    const countryName = getCountryName(code, language);
                    return `
                        <div class="point-tooltip">
                            <strong>${countryName || d.ADMIN}</strong><br/>
                            ${stats ? stats.stationCount : 0} ${translations[language].radioStationCount}
                        </div>
                    `;
                }}
                onPolygonHover={setHoveredPolygon}
                onPolygonClick={handleCountryClick}

                // Atmosphere
                atmosphereColor="#38bdf8"
                atmosphereAltitude={0.12}

                // Config
                rendererConfig={{
                    antialias: true,
                    alpha: true,
                    powerPreference: 'high-performance',
                }}
                animateIn={false}
            />

            {hoveredPolygon && (
                <div className="country-label">
                    <h3 className="gradient-text">{getCountryName(getSafeCountryCode(hoveredPolygon.properties), language) || hoveredPolygon.properties.ADMIN}</h3>
                    <p>{getCountryStats(getSafeCountryCode(hoveredPolygon.properties))?.stationCount || 0} {translations[language].radioStationCount}</p>
                </div>
            )}
        </div>
    );
};

export default GlobeComponent;
