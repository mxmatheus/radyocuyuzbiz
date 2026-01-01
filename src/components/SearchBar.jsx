import { useState } from 'react';
import { useRadioStore } from '../stores/useRadioStore';
import './SearchBar.css';

export const SearchBar = () => {
    const [isFocused, setIsFocused] = useState(false);
    const { searchQuery, setSearchQuery, selectedCountry } = useRadioStore();

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleClear = () => {
        setSearchQuery('');
    };

    // Only show if a country is selected
    if (!selectedCountry) return null;

    return (
        <div className={`search-bar glass ${isFocused ? 'focused' : ''}`}>
            <svg
                className="search-icon"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
            >
                <circle
                    cx="11"
                    cy="11"
                    r="8"
                    stroke="currentColor"
                    strokeWidth="2"
                />
                <path
                    d="M21 21L16.65 16.65"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                />
            </svg>

            <input
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Radyo ara..."
                className="search-input"
            />

            {searchQuery && (
                <button
                    className="clear-button"
                    onClick={handleClear}
                    aria-label="Temizle"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path
                            d="M18 6L6 18M6 6L18 18"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                    </svg>
                </button>
            )}
        </div>
    );
};

export default SearchBar;
