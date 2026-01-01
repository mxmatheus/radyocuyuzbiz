import { create } from 'zustand';
import radioBrowserService from '../services/RadioBrowserService';

export const useRadioStore = create((set, get) => ({
  // Radio Stations Data
  allStations: [],
  filteredStations: [],
  isLoadingStations: false,
  stationsError: null,

  // Currently Playing
  currentStation: null,

  // UI State
  selectedCountry: null,
  selectedCountryCode: null,
  showRadioPanel: false,
  showSettingsModal: false,
  searchQuery: '',
  selectedGenre: null,
  theme: 'cyan',
  language: typeof window !== 'undefined' && localStorage.getItem('radioLanguage')
    ? localStorage.getItem('radioLanguage')
    : 'tr',
  history: typeof window !== 'undefined' && localStorage.getItem('radioHistory')
    ? JSON.parse(localStorage.getItem('radioHistory'))
    : [],
  sleepTime: null,
  notification: null, // For Toast messages

  // Favorites
  favorites: typeof window !== 'undefined' && localStorage.getItem('radioFavorites')
    ? JSON.parse(localStorage.getItem('radioFavorites'))
    : [],

  // Trending
  trendingStations: [],
  trendingLocalStations: [], // Country-specific trends
  isLoadingTrending: false,
  trendMode: 'global', // 'global' or 'local'

  // Hidden Stations (Blacklist)
  hiddenStations: typeof window !== 'undefined' && localStorage.getItem('radioHidden')
    ? JSON.parse(localStorage.getItem('radioHidden'))
    : [],

  // New/Modified State from snippet
  isLoadingAudio: false,
  error: null, // New error state, potentially replacing stationsError

  // Audio State (re-declaration/modification of existing)
  isPlaying: false, // Initialized to false
  volume: typeof window !== 'undefined' && localStorage.getItem('radioVolume')
    ? parseFloat(localStorage.getItem('radioVolume'))
    : 1, // Default volume to 1, or from localStorage
  previousVolume: typeof window !== 'undefined' && localStorage.getItem('radioVolume')
    ? parseFloat(localStorage.getItem('radioVolume'))
    : 1, // Initialize previousVolume to current volume or 1

  // Advanced Audio Features
  visualizerMode: 'wave', // 'wave', 'bars', 'circle', 'off'
  eqSettings: { bass: 0, mid: 0, treble: 0 },

  // Globe State
  globeReady: false,
  cameraPosition: null,

  // Startup State
  isStartup: true, // New flag
  completeStartup: () => set({ isStartup: false }),

  // Actions
  setAllStations: (stations) => set({ allStations: stations }),

  setFilteredStations: (stations) => set({ filteredStations: stations }),

  setIsLoadingStations: (loading) => set({ isLoadingStations: loading }),

  setStationsError: (error) => set({ stationsError: error }), // Keeping original, but 'error' state is also introduced

  setCurrentStation: (station) => set({ currentStation: station }),

  // Modified playStation from snippet
  playStation: (station) => {
    const { currentStation, isPlaying, addToHistory } = get();
    if (currentStation?.stationuuid === station.stationuuid && isPlaying) {
      return; // Already playing this station
    }
    // Add to history
    addToHistory(station);

    set({
      currentStation: station,
      isPlaying: true,
      error: null,
      isLoadingAudio: true
    });
  },

  // Modified pauseStation from snippet (same as original)
  pauseStation: () => set({ isPlaying: false }),

  // Modified stopStation from snippet
  stopStation: () => set({
    currentStation: null,
    isPlaying: false,
    isLoadingAudio: false
  }),

  // Modified setVolume from snippet
  setVolume: (volume) => {
    const newVolume = Math.max(0, Math.min(1, volume)); // Ensure volume is between 0 and 1
    set({ volume: newVolume });
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('radioVolume', newVolume.toString());
    }
  },

  toggleMute: () => {
    const { volume, previousVolume } = get();
    if (volume > 0) {
      set({ volume: 0, previousVolume: volume });
    } else {
      set({ volume: previousVolume && previousVolume > 0 ? previousVolume : 0.5 });
    }
  },

  setVisualizerMode: (mode) => set({ visualizerMode: mode }),

  setEqSettings: (settings) => set(state => ({
    eqSettings: { ...state.eqSettings, ...settings }
  })),

  toggleMenu: () => set(state => ({ showRadioPanel: !state.showRadioPanel })),

  toggleFavorite: (station) => {
    const { favorites } = get();
    const isFav = favorites.some(f => f.stationuuid === station.stationuuid);

    let newFavorites;
    if (isFav) {
      newFavorites = favorites.filter(f => f.stationuuid !== station.stationuuid);
    } else {
      newFavorites = [...favorites, station];
    }

    set({ favorites: newFavorites });

    if (typeof window !== 'undefined') {
      localStorage.setItem('radioFavorites', JSON.stringify(newFavorites));
    }
  },

  // Theme & Language Actions
  setTheme: (theme) => {
    if (typeof window !== 'undefined') localStorage.setItem('radioTheme', theme); // Assuming theme persistence logic existed or not, adding simpler specific setter if needed, but mainly focused on language
    set({ theme });
  },

  setLanguage: (lang) => {
    if (typeof window !== 'undefined') localStorage.setItem('radioLanguage', lang);
    set({ language: lang });
  },

  openFavorites: () => {
    const { favorites } = get();
    set({
      isLoadingStations: false, // Ensure loading is off
      stationsError: null,      // Clear errors
      showRadioPanel: true,
      selectedCountry: 'Favorilerim',
      selectedCountryCode: 'FAV',
      filteredStations: [...favorites], // New reference
      searchQuery: '',
      selectedGenre: null
    });
  },

  setTheme: (theme) => {
    set({ theme });
    // Note: Effect to apply class on body should be in App.jsx or a hook
  },

  setLanguage: (language) => {
    set({ language });
    if (typeof window !== 'undefined') {
      localStorage.setItem('radioLanguage', language);
    }
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
    // Trigger applyFilters after setting
    get().applyFilters();
  },

  setVisualizerMode: (mode) => set({ visualizerMode: mode }),

  setEqSettings: (settings) => set({ eqSettings: settings }),

  addToHistory: (station) => {
    const { history, selectedCountryCode } = get();
    // Remove if exists, add to front
    const newHistory = [station, ...history.filter(s => s.stationuuid !== station.stationuuid)].slice(0, 20);
    set({ history: newHistory });
    if (typeof window !== 'undefined') {
      localStorage.setItem('radioHistory', JSON.stringify(newHistory));
    }

    // Refresh list if currently viewing history
    if (selectedCountryCode === 'HIST') {
      set({ filteredStations: newHistory });
    }
  },

  openHistory: () => {
    const { history } = get();
    set({
      isLoadingStations: false, // Ensure loading is off
      stationsError: null,      // Clear errors
      showRadioPanel: true,
      selectedCountry: 'Geçmiş',
      selectedCountryCode: 'HIST',
      filteredStations: [...history], // New reference
      searchQuery: '',
      selectedGenre: null
    });
  },

  setNotification: (msg) => {
    set({ notification: msg });
    setTimeout(() => set({ notification: null }), 3000);
  },

  openSettings: () => set({ showSettingsModal: true }),
  closeSettings: () => set({ showSettingsModal: false }),

  // Trending Actions
  openTrending: async (mode = null) => {
    const state = get();
    const useMode = mode || state.trendMode;
    const currentCountry = state.selectedCountryCode;

    set({
      showRadioPanel: true,
      selectedCountryCode: 'TRENDS',
      filteredStations: [],
      isLoadingStations: true,
      menuOpen: false,
      trendMode: useMode
    });

    try {
      let stations;

      if (useMode === 'local' && currentCountry && currentCountry !== 'TRENDS') {
        // Local trends for selected country
        const cachedLocal = state.trendingLocalStations;
        if (cachedLocal.length > 0 && cachedLocal[0]?.countrycode === currentCountry) {
          stations = cachedLocal;
        } else {
          stations = await radioBrowserService.getTopStations(50, currentCountry);
          set({ trendingLocalStations: stations });
        }
      } else {
        // Global trends
        const cachedGlobal = state.trendingStations;
        if (cachedGlobal.length > 0) {
          stations = cachedGlobal;
        } else {
          stations = await radioBrowserService.getTopStations(50);
          set({ trendingStations: stations });
        }
      }

      set({
        filteredStations: stations,
        isLoadingStations: false
      });
    } catch (err) {
      console.error("Failed to load trending:", err);
      set({ isLoadingStations: false });
    }
  },

  toggleTrendMode: () => {
    const { trendMode, openTrending } = get();
    const newMode = trendMode === 'global' ? 'local' : 'global';
    openTrending(newMode);
  },

  // Surprise Me (Smart Shuffle)
  surpriseMe: async () => {
    try {
      // 1. Get Random Station
      const station = await radioBrowserService.getRandomHighQualityStation();
      if (!station) return;

      // 2. Play it
      const { playStation, setSelectedCountry, allStations } = get();
      playStation(station);

      // 3. Move Globe (Set Selected Country)
      // We need to fetch country name for the store to be consistent?
      // Or just code. "country" field in station has name.
      if (station.countrycode) {
        // We need localized name preferably, but station.country is fallback.
        setSelectedCountry(station.country, station.countrycode);

        // Also, populate the panel with that country's stations so the user isn't alone?
        // Or just let it be.
        set({
          showRadioPanel: true,
          isLoadingStations: true,
          selectedCountryCode: station.countrycode,
          menuOpen: false
        });

        // Fetch stations for that country
        const countryStations = await radioBrowserService.getStationsByCountry(station.countrycode);
        set({
          allStations: countryStations, // Or keep global? Better to switch context to that country.
          filteredStations: countryStations,
          isLoadingStations: false
        });
      }
    } catch (err) {
      console.error("Surprise Me failed:", err);
    }
  },

  resetHiddenStations: () => {
    set({ hiddenStations: [] });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('radioHidden');
    }
    get().setNotification('Gizlenen istasyon listesi temizlendi.');
    get().filterStations();
  },

  playNextStation: () => {
    const { filteredStations, currentStation, playStation } = get();
    if (!currentStation || filteredStations.length === 0) return;
    const currentIndex = filteredStations.findIndex(s => s.stationuuid === currentStation.stationuuid);
    let nextIndex = currentIndex + 1;
    if (nextIndex >= filteredStations.length) nextIndex = 0;
    playStation(filteredStations[nextIndex]);
  },

  playPreviousStation: () => {
    const { filteredStations, currentStation, playStation } = get();
    if (!currentStation || filteredStations.length === 0) return;
    const currentIndex = filteredStations.findIndex(s => s.stationuuid === currentStation.stationuuid);
    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) prevIndex = filteredStations.length - 1;
    playStation(filteredStations[prevIndex]);
  },

  handleStationError: () => {
    const { currentStation, playStation, setNotification, filteredStations, stopStation, isStartup, language } = get();

    // Silent fail on startup
    if (isStartup) {
      stopStation();
      set({ currentStation: null }); // Remove broken station to prevent console errors
      return;
    }

    const msg = language === 'tr'
      ? `"${currentStation?.name || 'Radio'}" şu an çalmıyor. Başka bir istasyona geçiliyor...`
      : `"${currentStation?.name || 'Radio'}" is unavailable. Switching station...`;

    setNotification(msg);

    // Pick random valid station
    if (filteredStations && filteredStations.length > 0) {
      // Try to pick a different one if possible, or just random
      const validStations = filteredStations.filter(s => s.stationuuid !== currentStation?.stationuuid);
      if (validStations.length > 0) {
        const randomIndex = Math.floor(Math.random() * validStations.length);
        playStation(validStations[randomIndex]);
      } else {
        stopStation();
      }
    } else {
      stopStation();
    }

    // UI update not needed for blacklist anymore
  },

  setSleepTimer: (minutes) => {
    if (minutes === 0) {
      set({ sleepTime: null });
      return;
    }
    const endTime = Date.now() + minutes * 60 * 1000;
    set({ sleepTime: endTime });
  },

  cancelSleepTimer: () => {
    set({ sleepTime: null });
  },

  setSelectedCountry: (country, countryCode) => {
    set({
      selectedCountry: country,
      selectedCountryCode: countryCode,
      showRadioPanel: true,
      searchQuery: '',      // Reset search when selecting new country
      selectedGenre: null   // Reset genre filter
    });
    // After country selection, the Globe component will load and set filteredStations
  },

  clearSelectedCountry: () => set({
    selectedCountry: null,
    selectedCountryCode: null,
    showRadioPanel: false
  }),

  setSearchQuery: (query) => {
    set({ searchQuery: query });
    get().filterStations();
  },

  setSelectedGenre: (genre) => {
    set({ selectedGenre: genre });
    get().filterStations();
  },

  filterStations: () => {
    const { allStations, searchQuery, selectedGenre, selectedCountryCode, favorites, history } = get();

    let filtered;

    // Select Source based on Mode
    if (selectedCountryCode === 'FAV') {
      filtered = [...favorites];
    } else if (selectedCountryCode === 'HIST') {
      filtered = [...history];
    } else {
      filtered = [...allStations];
    }

    // Filter by country (Only for normal browsing)
    if (selectedCountryCode && selectedCountryCode !== 'FAV' && selectedCountryCode !== 'HIST') {
      filtered = filtered.filter(station =>
        station.countrycode?.toLowerCase() === selectedCountryCode.toLowerCase()
      );
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(station =>
        station.name?.toLowerCase().includes(query) ||
        station.tags?.toLowerCase().includes(query)
      );
    }

    // Filter by genre
    if (selectedGenre && selectedGenre !== 'all') {
      filtered = filtered.filter(station =>
        station.tags?.toLowerCase().includes(selectedGenre.toLowerCase())
      );
    }

    set({ filteredStations: filtered });
  },

  setGlobeReady: (ready) => set({ globeReady: ready }),

  setCameraPosition: (position) => set({ cameraPosition: position }),
}));
