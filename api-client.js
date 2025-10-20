/**
 * KOULIO API Client
 * Komunikace s backend API místo localStorage
 */

class KoulioAPI {
    constructor(baseURL = 'http://localhost:5000/api') {
        this.baseURL = baseURL;
        this.accessToken = localStorage.getItem('koulio_access_token');
        this.refreshToken = localStorage.getItem('koulio_refresh_token');
    }

    /**
     * Generické volání API
     */
    async apiCall(endpoint, method = 'GET', data = null, requireAuth = false) {
        const url = `${this.baseURL}${endpoint}`;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        // Přidání autentifikace pokud je potřeba
        if (requireAuth && this.accessToken) {
            options.headers['Authorization'] = `Bearer ${this.accessToken}`;
        }

        // Přidání dat pro POST/PUT/DELETE
        if (data && ['POST', 'PUT', 'DELETE'].includes(method)) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);
            const responseData = await response.json();

            // Kontrola, zda je token vypršel
            if (response.status === 401 && this.refreshToken) {
                const refreshed = await this.refreshAccessToken();
                if (refreshed) {
                    // Opakování původního požadavku s novým tokenem
                    options.headers['Authorization'] = `Bearer ${this.accessToken}`;
                    const retryResponse = await fetch(url, options);
                    return await retryResponse.json();
                }
            }

            if (!response.ok) {
                throw new Error(responseData.error || 'API call failed');
            }

            return responseData;
        } catch (error) {
            console.error('API call error:', error);
            throw error;
        }
    }

    /**
     * Registrace nového uživatele
     */
    async register(email, password, fullName) {
        const response = await this.apiCall('/register', 'POST', {
            email,
            password,
            full_name: fullName
        });

        // Uložení tokenů
        if (response.access_token && response.refresh_token) {
            this.accessToken = response.access_token;
            this.refreshToken = response.refresh_token;
            localStorage.setItem('koulio_access_token', this.accessToken);
            localStorage.setItem('koulio_refresh_token', this.refreshToken);
        }

        return response;
    }

    /**
     * Přihlášení uživatele
     */
    async login(email, password) {
        const response = await this.apiCall('/login', 'POST', {
            email,
            password
        });

        // Uložení tokenů
        if (response.access_token && response.refresh_token) {
            this.accessToken = response.access_token;
            this.refreshToken = response.refresh_token;
            localStorage.setItem('koulio_access_token', this.accessToken);
            localStorage.setItem('koulio_refresh_token', this.refreshToken);
            localStorage.setItem('koulio_user_email', response.user.email);
            localStorage.setItem('koulio_user_name', response.user.full_name);
            localStorage.setItem('koulio_user_id', response.user.id);
            localStorage.setItem('koulio_logged_in', 'true');
        }

        return response;
    }

    /**
     * Obnovení access tokenu
     */
    async refreshAccessToken() {
        if (!this.refreshToken) {
            return false;
        }

        try {
            const response = await this.apiCall('/refresh', 'POST', {
                refresh_token: this.refreshToken
            });

            if (response.access_token) {
                this.accessToken = response.access_token;
                if (response.refresh_token) {
                    this.refreshToken = response.refresh_token;
                    localStorage.setItem('koulio_refresh_token', this.refreshToken);
                }
                localStorage.setItem('koulio_access_token', this.accessToken);
                return true;
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
            this.logout();
        }

        return false;
    }

    /**
     * Získání profilu uživatele
     */
    async getProfile() {
        return await this.apiCall('/profile', 'GET', null, true);
    }

    /**
     * Aktualizace profilu uživatele
     */
    async updateProfile(updates) {
        return await this.apiCall('/profile', 'PUT', updates, true);
    }

    /**
     * Změna hesla
     */
    async changePassword(currentPassword, newPassword) {
        return await this.apiCall('/change-password', 'POST', {
            current_password: currentPassword,
            new_password: newPassword
        }, true);
    }

    /**
     * Odhlášení uživatele
     */
    async logout() {
        try {
            await this.apiCall('/logout', 'POST', null, true);
        } catch (error) {
            console.error('Logout API call failed:', error);
        } finally {
            // Vymazání všech tokenů a session dat
            this.accessToken = null;
            this.refreshToken = null;
            localStorage.removeItem('koulio_access_token');
            localStorage.removeItem('koulio_refresh_token');
            localStorage.removeItem('koulio_user_email');
            localStorage.removeItem('koulio_user_name');
            localStorage.removeItem('koulio_user_id');
            localStorage.removeItem('koulio_logged_in');
        }
    }

    /**
     * Smazání účtu
     */
    async deleteAccount(password) {
        const response = await this.apiCall('/delete-account', 'DELETE', {
            password
        }, true);

        // Vymazání všech dat po smazání účtu
        this.logout();
        return response;
    }

    /**
     * Kontrola, zda je uživatel přihlášen
     */
    isLoggedIn() {
        return this.accessToken && localStorage.getItem('koulio_logged_in') === 'true';
    }

    /**
     * Získání informací o aktuálním uživateli
     */
    getCurrentUser() {
        if (!this.isLoggedIn()) {
            return null;
        }

        return {
            id: localStorage.getItem('koulio_user_id'),
            email: localStorage.getItem('koulio_user_email'),
            name: localStorage.getItem('koulio_user_name')
        };
    }

    /**
     * Health check
     */
    async healthCheck() {
        try {
            return await this.apiCall('/health', 'GET');
        } catch (error) {
            return { status: 'unhealthy', error: error.message };
        }
    }
}

// Vytvoření globální instance
window.koulioAPI = new KoulioAPI();

// Export pro moduly
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KoulioAPI;
}
