/**
 * API Configuration
 * Centralized API configuration to make deployment easier
 */

// Get API base URL from environment variable or fallback to localhost
// Remove trailing slash to prevent double slashes
const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3333';
export const API_BASE_URL = rawApiBaseUrl.endsWith('/') ? rawApiBaseUrl.slice(0, -1) : rawApiBaseUrl;

// API endpoints with /api prefix
export const API_URL = `${API_BASE_URL}/api`;

// Helper function to get auth headers
export const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        // Tambahkan header khusus untuk bypass ngrok browser warning
        'ngrok-skip-browser-warning': 'true',
        ...(token && { 'Authorization': `Bearer ${token}` }),
    };
};

// Helper function to build API endpoint
export const buildApiUrl = (endpoint: string) => {
    // Remove leading slash if present to prevent double slashes
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    
    // If endpoint already starts with 'api/', use base URL directly
    if (cleanEndpoint.startsWith('api/')) {
        return `${API_BASE_URL}/${cleanEndpoint}`;
    }
    
    // Otherwise, add /api prefix (API_BASE_URL already normalized, no trailing slash)
    return `${API_URL}/${cleanEndpoint}`;
};

export default {
    API_BASE_URL,
    API_URL,
    getAuthHeaders,
    buildApiUrl,
};
