/**
 * API Utility Functions
 * Helper functions untuk mempermudah pemanggilan API dengan konfigurasi terpusat
 */

import { API_BASE_URL, API_URL, getAuthHeaders, buildApiUrl } from '../config/api';

/**
 * Wrapper untuk fetch API dengan konfigurasi default
 * @param endpoint - API endpoint (contoh: 'users', 'produk', '/api/dashboard')
 * @param options - Fetch options (method, body, headers, dll)
 */
export async function apiFetch<T = any>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = buildApiUrl(endpoint);
    const headers = {
        ...getAuthHeaders(),
        ...options.headers,
    };

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({
            message: `HTTP Error: ${response.status}`,
        }));
        throw new Error(error.message || `Request failed with status ${response.status}`);
    }

    return response.json();
}

/**
 * GET request
 */
export async function apiGet<T = any>(endpoint: string, params?: Record<string, any>): Promise<T> {
    let url = endpoint;
    if (params) {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                searchParams.append(key, String(value));
            }
        });
        const queryString = searchParams.toString();
        url = queryString ? `${endpoint}?${queryString}` : endpoint;
    }
    
    return apiFetch<T>(url, { method: 'GET' });
}

/**
 * POST request
 */
export async function apiPost<T = any>(endpoint: string, data?: any): Promise<T> {
    return apiFetch<T>(endpoint, {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
    });
}

/**
 * PUT request
 */
export async function apiPut<T = any>(endpoint: string, data?: any): Promise<T> {
    return apiFetch<T>(endpoint, {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
    });
}

/**
 * DELETE request
 */
export async function apiDelete<T = any>(endpoint: string): Promise<T> {
    return apiFetch<T>(endpoint, { method: 'DELETE' });
}

/**
 * Upload file dengan multipart/form-data
 */
export async function apiUpload<T = any>(
    endpoint: string,
    formData: FormData
): Promise<T> {
    const url = buildApiUrl(endpoint);
    const token = localStorage.getItem('token');
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
            // Don't set Content-Type for FormData, browser will set it with boundary
        },
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({
            message: `HTTP Error: ${response.status}`,
        }));
        throw new Error(error.message || `Upload failed with status ${response.status}`);
    }

    return response.json();
}

// Export untuk backward compatibility
export { API_BASE_URL, API_URL, buildApiUrl, getAuthHeaders };
