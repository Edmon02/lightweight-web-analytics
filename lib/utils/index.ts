/**
 * Utility functions for Lightweight Web Analytics
 */

/**
 * Generate a random session ID
 * @returns {string} A random UUID v4
 */
export function generateSessionId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Format a date for display
 * @param {number} timestamp Unix timestamp in milliseconds
 * @param {string} format Format string ('short', 'long', 'date', 'time')
 * @returns {string} Formatted date string
 */
export function formatDate(timestamp: number, format: 'short' | 'long' | 'date' | 'time' = 'short'): string {
    const date = new Date(timestamp);

    switch (format) {
        case 'long':
            return date.toLocaleString();
        case 'date':
            return date.toLocaleDateString();
        case 'time':
            return date.toLocaleTimeString();
        case 'short':
        default:
            return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    }
}

/**
 * Truncate a string to a maximum length
 * @param {string} str String to truncate
 * @param {number} maxLength Maximum length
 * @returns {string} Truncated string
 */
export function truncate(str: string, maxLength: number): string {
    if (!str) return '';
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength) + '...';
}

/**
 * Sanitize a string for safe display
 * @param {string} str String to sanitize
 * @returns {string} Sanitized string
 */
export function sanitize(str: string): string {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Parse URL parameters
 * @param {string} url URL to parse
 * @returns {Record<string, string>} Object with parameter key-value pairs
 */
export function parseUrlParams(url: string): Record<string, string> {
    const params: Record<string, string> = {};
    const queryString = url.split('?')[1];

    if (!queryString) return params;

    const pairs = queryString.split('&');
    for (const pair of pairs) {
        const [key, value] = pair.split('=');
        params[decodeURIComponent(key)] = decodeURIComponent(value || '');
    }

    return params;
}

/**
 * Get rating for a web vital metric
 * @param {string} name Metric name (LCP, FID, CLS, etc.)
 * @param {number} value Metric value
 * @returns {'good' | 'needs-improvement' | 'poor'} Rating
 */
export function getWebVitalRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    switch (name) {
        case 'LCP':
            return value <= 2500 ? 'good' : (value <= 4000 ? 'needs-improvement' : 'poor');
        case 'FID':
            return value <= 100 ? 'good' : (value <= 300 ? 'needs-improvement' : 'poor');
        case 'CLS':
            return value <= 0.1 ? 'good' : (value <= 0.25 ? 'needs-improvement' : 'poor');
        case 'FCP':
            return value <= 1800 ? 'good' : (value <= 3000 ? 'needs-improvement' : 'poor');
        case 'TTFB':
            return value <= 800 ? 'good' : (value <= 1800 ? 'needs-improvement' : 'poor');
        default:
            return 'needs-improvement';
    }
}
