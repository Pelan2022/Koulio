/**
 * KOULIO API Client
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
        // Zkusíme nejdříve HTTP pro lokální vývoj
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:3000';
        }
        
        // Pro produkci zkusíme HTTPS, ale s fallback na HTTP
        const currentHost = window.location.hostname;
        if (currentHost.includes('unrollit.aici.cz')) {
            return 'https://koulio-backend.unrollit.aici.cz';
        }
        
        // Fallback na HTTP
        return 'http://koulio-backend.unrollit.aici.cz';
    }

    /**
     * Get stored JWT token
     */
    getStoredToken() {
        return localStorage.getItem('koulio_token');
    }

    /**
     * Set JWT token
     */
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('koulio_token', token);
        } else {
            localStorage.removeItem('koulio_token');
        }
    }

    /**
     * Clear stored token and user data
     */
    clearAuth() {
        this.token = null;
        localStorage.removeItem('koulio_token');
        localStorage.removeItem('koulio_user_data');
        localStorage.removeItem('koulio_logged_in');
    }

    /**
     * Make HTTP request with SSL fallback
     */
    async request(endpoint, options = {}) {
        return await this.makeRequest(endpoint, options);
    }

    /**
     * Make HTTP request with automatic fallback
     */
    async makeRequest(endpoint, options = {}, isRetry = false) {
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
            const data = await response.json();

            // If token is expired or invalid, clear auth
            if (response.status === 401 && data.message?.includes('token')) {
                this.clearAuth();
                window.location.href = '/login.html';
                return null;
            }

            return {
                success: response.ok,
                status: response.status,
                data: data
            };
        } catch (error) {
            console.error('API request failed:', error);
            
            // Pokud je to SSL chyba a ještě jsme nezkusili fallback
            if (!isRetry && (error.message.includes('CERT') || error.message.includes('SSL') || error.message.includes('certificate'))) {
                console.log('SSL error detected, trying HTTP fallback...');
                
                // Zkusíme HTTP místo HTTPS
                const httpURL = this.baseURL.replace('https://', 'http://');
                if (httpURL !== this.baseURL) {
                    const originalURL = this.baseURL;
                    this.baseURL = httpURL;
                    
                    try {
                        const result = await this.makeRequest(endpoint, options, true);
                        return result;
                    } catch (fallbackError) {
                        console.error('HTTP fallback also failed:', fallbackError);
                        this.baseURL = originalURL; // Vrátíme původní URL
                    }
                }
            }
            
            return {
                success: false,
                status: 0,
                error: error.message
            };
        }
    }

    /**
     * Authentication endpoints
     */

    async register(userData) {
        const response = await this.request('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });

        if (response && response.success) {
            this.setToken(response.data.data.tokens.accessToken);
            localStorage.setItem('koulio_user_data', JSON.stringify(response.data.data.user));
            localStorage.setItem('koulio_logged_in', 'true');
        }

        return response;
    }

    async login(email, password, rememberMe = false) {
        const response = await this.request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (response && response.success) {
            this.setToken(response.data.data.tokens.accessToken);
            localStorage.setItem('koulio_user_data', JSON.stringify(response.data.data.user));
            localStorage.setItem('koulio_logged_in', 'true');
            
            // Handle remember me functionality
            if (rememberMe) {
                localStorage.setItem('koulio_remember_me', 'true');
                localStorage.setItem('koulio_remembered_email', email);
                localStorage.setItem('koulio_remembered_timestamp', new Date().getTime().toString());
            } else {
                localStorage.removeItem('koulio_remember_me');
                localStorage.removeItem('koulio_remembered_email');
                localStorage.removeItem('koulio_remembered_timestamp');
            }
        }

        return response;
    }

    async logout() {
        const response = await this.request('/api/auth/logout', {
            method: 'POST'
        });

        this.clearAuth();
        return response;
    }

    async refreshToken() {
        const refreshToken = localStorage.getItem('koulio_refresh_token');
        if (!refreshToken) {
            return { success: false, error: 'No refresh token available' };
        }

        const response = await this.request('/api/auth/refresh', {
            method: 'POST',
            body: JSON.stringify({ refreshToken })
        });

        if (response && response.success) {
            this.setToken(response.data.data.tokens.accessToken);
            if (response.data.data.tokens.refreshToken) {
                localStorage.setItem('koulio_refresh_token', response.data.data.tokens.refreshToken);
            }
        }

        return response;
    }

    async verifyToken() {
        return await this.request('/api/auth/verify', {
            method: 'GET'
        });
    }

    async changePassword(currentPassword, newPassword) {
        return await this.request('/api/auth/change-password', {
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
        return await this.request('/api/user/profile', {
            method: 'GET'
        });
    }

    async updateUserProfile(profileData) {
        return await this.request('/api/user/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
    }

    async deleteAccount(password) {
        const response = await this.request('/api/user/account', {
            method: 'DELETE',
            body: JSON.stringify({ password })
        });

        if (response && response.success) {
            this.clearAuth();
        }

        return response;
    }

    async getUserStats() {
        return await this.request('/api/user/stats', {
            method: 'GET'
        });
    }

    async exportUserData() {
        return await this.request('/api/user/export', {
            method: 'GET'
        });
    }

    /**
     * Utility methods
     */

    isLoggedIn() {
        return !!this.token && localStorage.getItem('koulio_logged_in') === 'true';
    }

    getUserData() {
        const userData = localStorage.getItem('koulio_user_data');
        return userData ? JSON.parse(userData) : null;
    }

    /**
     * Check if user has remember me enabled
     */
    hasRememberMe() {
        const rememberMe = localStorage.getItem('koulio_remember_me');
        const rememberedEmail = localStorage.getItem('koulio_remembered_email');
        const rememberedTimestamp = localStorage.getItem('koulio_remembered_timestamp');
        
        if (rememberMe === 'true' && rememberedEmail && rememberedTimestamp) {
            // Check if remember me is not too old (30 days)
            const thirtyDaysAgo = new Date().getTime() - (30 * 24 * 60 * 60 * 1000);
            const timestamp = parseInt(rememberedTimestamp);
            
            if (timestamp > thirtyDaysAgo) {
                return rememberedEmail;
            } else {
                // Remove old remember me data
                localStorage.removeItem('koulio_remember_me');
                localStorage.removeItem('koulio_remembered_email');
                localStorage.removeItem('koulio_remembered_timestamp');
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
