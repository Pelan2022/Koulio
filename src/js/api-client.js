/**
 * Unroll API Client
 * Handles all communication with the backend API
 */

class ApiClient {
    constructor(baseURL = null) {
        // Automatická detekce backend URL
        this.baseURL = baseURL || this.detectBackendURL();
        this.token = this.getStoredToken();
    }

    /**
     * Automatická detekce backend URL
     */
    detectBackendURL() {
        // Pro lokální vývoj
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:3000';
        }
        
        // Pro produkci - Nginx proxy routuje /api/* na backend
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        
        // API je dostupné přes nginx proxy na /api/*
        return `${protocol}//${hostname}/api`;
    }

    /**
     * Get stored JWT token
     */
    getStoredToken() {
        return localStorage.getItem('unroll_token');
    }

    /**
     * Set JWT token
     */
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('unroll_token', token);
        } else {
            localStorage.removeItem('unroll_token');
        }
    }

    /**
     * Clear stored token and user data
     */
    clearAuth() {
        this.token = null;
        localStorage.removeItem('unroll_token');
        localStorage.removeItem('unroll_user_data');
        localStorage.removeItem('unroll_logged_in');
    }

    /**
     * Make HTTP request podle cursorrules
     */
    async request(endpoint, options = {}) {
        return await this.makeRequest(endpoint, options);
    }

    /**
     * Make HTTP request with proper error handling
     */
    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Add authorization header if token exists
        if (this.token) {
            config.headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);
            
            // Check if response is ok
            if (!response.ok) {
                // Try to parse error response
                let errorData;
                try {
                    errorData = await response.json();
                } catch {
                    errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
                }

                // If token is expired or invalid, clear auth
                if (response.status === 401 && errorData.message?.includes('token')) {
                    this.clearAuth();
                    window.location.href = '/login.html';
                    return null;
                }

                return {
                    success: false,
                    status: response.status,
                    data: errorData
                };
            }

            // Parse successful response
            const data = await response.json();

            return {
                success: true,
                status: response.status,
                data: data
            };
        } catch (error) {
            console.error('API request failed:', error);
            
            // Handle specific error types
            let errorMessage = error.message;
            
            if (error.message.includes('Failed to fetch')) {
                errorMessage = 'Nelze se připojit k serveru. Zkontrolujte připojení k internetu.';
            } else if (error.message.includes('CERT') || error.message.includes('SSL') || error.message.includes('certificate')) {
                errorMessage = 'Problém s připojením k serveru. Zkuste to prosím znovu.';
            }
            
            return {
                success: false,
                status: 0,
                error: errorMessage
            };
        }
    }

    /**
     * Authentication endpoints
     */

    async register(userData) {
        const response = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });

        if (response && response.success) {
            this.setToken(response.data.data.tokens.accessToken);
            localStorage.setItem('unroll_user_data', JSON.stringify(response.data.data.user));
            localStorage.setItem('unroll_logged_in', 'true');
        }

        return response;
    }

    async login(email, password, rememberMe = false) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (response && response.success) {
            this.setToken(response.data.data.tokens.accessToken);
            localStorage.setItem('unroll_user_data', JSON.stringify(response.data.data.user));
            localStorage.setItem('unroll_logged_in', 'true');
            
            // Handle remember me functionality
            if (rememberMe) {
                localStorage.setItem('unroll_remember_me', 'true');
                localStorage.setItem('unroll_remembered_email', email);
                localStorage.setItem('unroll_remembered_timestamp', new Date().getTime().toString());
            } else {
                localStorage.removeItem('unroll_remember_me');
                localStorage.removeItem('unroll_remembered_email');
                localStorage.removeItem('unroll_remembered_timestamp');
            }
        }

        return response;
    }

    async logout() {
        const response = await this.request('/auth/logout', {
            method: 'POST'
        });

        this.clearAuth();
        return response;
    }

    async refreshToken() {
        const refreshToken = localStorage.getItem('unroll_refresh_token');
        if (!refreshToken) {
            return { success: false, error: 'No refresh token available' };
        }

        const response = await this.request('/auth/refresh', {
            method: 'POST',
            body: JSON.stringify({ refreshToken })
        });

        if (response && response.success) {
            this.setToken(response.data.data.tokens.accessToken);
            if (response.data.data.tokens.refreshToken) {
                localStorage.setItem('unroll_refresh_token', response.data.data.tokens.refreshToken);
            }
        }

        return response;
    }

    async verifyToken() {
        return await this.request('/auth/verify', {
            method: 'GET'
        });
    }

    async changePassword(currentPassword, newPassword) {
        return await this.request('/auth/change-password', {
            method: 'POST',
            body: JSON.stringify({
                currentPassword,
                newPassword,
                confirmNewPassword: newPassword
            })
        });
    }

    /**
     * User endpoints
     */

    async getUserProfile() {
        return await this.request('/user/profile', {
            method: 'GET'
        });
    }

    async updateUserProfile(profileData) {
        return await this.request('/user/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
    }

    async deleteAccount(password) {
        const response = await this.request('/user/account', {
            method: 'DELETE',
            body: JSON.stringify({ password })
        });

        if (response && response.success) {
            this.clearAuth();
        }

        return response;
    }

    async getUserStats() {
        return await this.request('/user/stats', {
            method: 'GET'
        });
    }

    async exportUserData() {
        return await this.request('/user/export', {
            method: 'GET'
        });
    }

    /**
     * Utility methods
     */

    isLoggedIn() {
        return !!this.token && localStorage.getItem('unroll_logged_in') === 'true';
    }

    getUserData() {
        const userData = localStorage.getItem('unroll_user_data');
        return userData ? JSON.parse(userData) : null;
    }

    /**
     * Check if user has remember me enabled
     */
    hasRememberMe() {
        const rememberMe = localStorage.getItem('unroll_remember_me');
        const rememberedEmail = localStorage.getItem('unroll_remembered_email');
        const rememberedTimestamp = localStorage.getItem('unroll_remembered_timestamp');
        
        if (rememberMe === 'true' && rememberedEmail && rememberedTimestamp) {
            // Check if remember me is not too old (30 days)
            const thirtyDaysAgo = new Date().getTime() - (30 * 24 * 60 * 60 * 1000);
            const timestamp = parseInt(rememberedTimestamp);
            
            if (timestamp > thirtyDaysAgo) {
                return rememberedEmail;
            } else {
                // Remove old remember me data
                localStorage.removeItem('unroll_remember_me');
                localStorage.removeItem('unroll_remembered_email');
                localStorage.removeItem('unroll_remembered_timestamp');
            }
        }
        
        return null;
    }

    /**
     * Auto-fill remember me data
     */
    autoFillRememberMe() {
        const rememberedEmail = this.hasRememberMe();
        if (rememberedEmail) {
            const emailInput = document.getElementById('email');
            const rememberCheckbox = document.getElementById('rememberMe');
            
            if (emailInput) emailInput.value = rememberedEmail;
            if (rememberCheckbox) rememberCheckbox.checked = true;
            
            return true;
        }
        return false;
    }
}

// Create global API client instance
window.apiClient = new ApiClient();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiClient;
}
