/**
 * API Configuration
 * Centralized API configuration to make deployment easier
 */

// Get API base URL from environment variable or fallback to localhost
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3333';

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
    
    // Otherwise, add /api prefix
    // Ensure no double slash by checking if API_URL ends with slash
    const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
    return `${baseUrl}/${cleanEndpoint}`;
};

export default {
    API_BASE_URL,
    API_URL,
    getAuthHeaders,
    buildApiUrl,
};
