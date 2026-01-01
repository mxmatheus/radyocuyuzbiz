const trNames = new Intl.DisplayNames(['tr'], { type: 'region' });
const enNames = new Intl.DisplayNames(['en'], { type: 'region' });

export const getCountryName = (code, lang = 'tr') => {
    if (!code) return '';
    try {
        const formatter = lang === 'en' ? enNames : trNames;
        return formatter.of(code.toUpperCase());
    } catch (e) {
        return code;
    }
};

// Alias for backward compatibility (Deprecated)
export const getTurkishCountryName = (code) => getCountryName(code, 'tr');
