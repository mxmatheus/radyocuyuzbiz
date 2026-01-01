// Radio Browser API Service
// Documentation: https://de1.api.radio-browser.info/

// Radio Browser API has CORS enabled for all servers
// Using the "all" endpoint which redirects to a random server
const API_BASE_URL = 'https://all.api.radio-browser.info/json';

class RadioBrowserService {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    async fetchWithCache(key, fetchFn) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }

        const data = await fetchFn();
        this.cache.set(key, { data, timestamp: Date.now() });
        return data;
    }

    async getAllStations(limit = 5000) {
        try {
            const response = await fetch(`${API_BASE_URL}/stations?limit=${limit}&order=votes&reverse=true&hidebroken=true`);
            if (!response.ok) throw new Error('Failed to fetch stations');
            return await response.json();
        } catch (error) {
            console.error('Error fetching all stations:', error);
            throw error;
        }
    }

    async getStationsByCountry(countryCode) {
        try {
            return await this.fetchWithCache(
                `country_${countryCode}`,
                async () => {
                    const response = await fetch(
                        `${API_BASE_URL}/stations/bycountrycodeexact/${countryCode}?hidebroken=true&order=votes&reverse=true`
                    );
                    if (!response.ok) throw new Error(`Failed to fetch stations for ${countryCode}`);
                    return await response.json();
                }
            );
        } catch (error) {
            console.error(`Error fetching stations for ${countryCode}:`, error);
            throw error;
        }
    }

    async getStationsByTag(tag) {
        try {
            return await this.fetchWithCache(
                `tag_${tag}`,
                async () => {
                    const response = await fetch(
                        `${API_BASE_URL}/stations/bytag/${encodeURIComponent(tag)}?hidebroken=true&order=votes&reverse=true&limit=1000`
                    );
                    if (!response.ok) throw new Error(`Failed to fetch stations with tag ${tag}`);
                    return await response.json();
                }
            );
        } catch (error) {
            console.error(`Error fetching stations with tag ${tag}:`, error);
            throw error;
        }
    }

    async getTopStations(limit = 100, countryCode = null) {
        try {
            const cacheKey = countryCode ? `top_stations_${countryCode}_${limit}` : `top_stations_global_${limit}`;
            return await this.fetchWithCache(
                cacheKey,
                async () => {
                    let url = `${API_BASE_URL}/stations?hidebroken=true&order=clickcount&reverse=true&limit=${limit}`;
                    if (countryCode) {
                        url += `&countrycode=${countryCode}`;
                    }
                    const response = await fetch(url);
                    if (!response.ok) throw new Error('Failed to fetch top stations');
                    return await response.json();
                }
            );
        } catch (error) {
            console.error('Error fetching top stations:', error);
            throw error;
        }
    }

    async getRandomHighQualityStation() {
        try {
            // Random station with at least 10 votes to ensure quality
            const response = await fetch(
                `${API_BASE_URL}/stations/search?order=random&hidebroken=true&limit=1&votes=10`
            );
            if (!response.ok) throw new Error('Failed to fetch random station');
            const data = await response.json();
            return data[0];
        } catch (error) {
            console.error('Error fetching random station:', error);
            throw error;
        }
    }

    async searchStations(query) {
        try {
            const response = await fetch(
                `${API_BASE_URL}/stations/byname/${encodeURIComponent(query)}?hidebroken=true&order=votes&reverse=true&limit=500`
            );
            if (!response.ok) throw new Error(`Failed to search for ${query}`);
            return await response.json();
        } catch (error) {
            console.error(`Error searching for ${query}:`, error);
            throw error;
        }
    }

    async getTopStationsByCountry(countryCode, limit = 50) {
        try {
            const stations = await this.getStationsByCountry(countryCode);
            return stations.slice(0, limit);
        } catch (error) {
            console.error(`Error fetching top stations for ${countryCode}:`, error);
            throw error;
        }
    }

    async getCountries() {
        try {
            return await this.fetchWithCache(
                'countries',
                async () => {
                    const response = await fetch(`${API_BASE_URL}/countries`);
                    if (!response.ok) throw new Error('Failed to fetch countries');
                    return await response.json();
                }
            );
        } catch (error) {
            console.error('Error fetching countries:', error);
            throw error;
        }
    }

    async getTags() {
        try {
            return await this.fetchWithCache(
                'tags',
                async () => {
                    const response = await fetch(`${API_BASE_URL}/tags?hidebroken=true&order=stationcount&reverse=true&limit=100`);
                    if (!response.ok) throw new Error('Failed to fetch tags');
                    return await response.json();
                }
            );
        } catch (error) {
            console.error('Error fetching tags:', error);
            throw error;
        }
    }

    // Get station count by country for visualization
    async getStationCountByCountry() {
        try {
            const countries = await this.getCountries();
            return countries
                .filter(country => country.stationcount > 0)
                .map(country => ({
                    code: country.iso_3166_1,
                    name: country.name,
                    stationCount: country.stationcount
                }))
                .sort((a, b) => b.stationCount - a.stationCount);
        } catch (error) {
            console.error('Error fetching station count by country:', error);
            throw error;
        }
    }

    clearCache() {
        this.cache.clear();
    }
}

// Export singleton instance
export const radioBrowserService = new RadioBrowserService();
export default radioBrowserService;
