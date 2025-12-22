import { getSession, signOut } from "next-auth/react";

const BASE_URL = "http://localhost:5000/api";
const SERVER_URL = "http://localhost:5000";

type RequestConfig = RequestInit & {
    token?: string;
};

export class ApiClient {
    private static async getHeaders(contentType?: string): Promise<HeadersInit> {
        const session = await getSession();
        // @ts-ignore - session.user is extended in types
        const token = session?.user?.accessToken || session?.accessToken;
        console.log("ApiClient Token:", token ? "Present" : "Missing", token);

        const headers: HeadersInit = {};

        if (contentType) {
            headers["Content-Type"] = contentType;
        }

        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
            headers["X-Auth-Token"] = token;
        }

        return headers;
    }

    static async get<T>(path: string): Promise<T> {
        try {
            const headers = await this.getHeaders();
            console.log('Fetching:', `${BASE_URL}${path}`);
            const res = await fetch(`${BASE_URL}${path}`, {
                method: "GET",
                headers,
                cache: "no-store",
            });

            if (!res.ok) {
                if (res.status === 401 || res.status === 403) {
                    if (typeof window !== 'undefined') {
                        signOut({ callbackUrl: '/auth/login' });
                    }
                }
                const error = await res.json();
                throw new Error(error.message || "API request failed");
            }

            return res.json();
        } catch (error) {
            console.error('Fetch error details:', error);
            console.error('URL attempted:', `${BASE_URL}${path}`);
            throw error;
        }
    }

    static async post<T>(path: string, body: any): Promise<T> {
        const isFormData = body instanceof FormData;
        const headers = await this.getHeaders(isFormData ? undefined : "application/json");

        const res = await fetch(`${BASE_URL}${path}`, {
            method: "POST",
            headers,
            body: isFormData ? body : JSON.stringify(body),
        });

        if (!res.ok) {
            if (res.status === 401 || res.status === 403) {
                if (typeof window !== 'undefined') {
                    console.warn("Unauthorized access. Signing out...");
                    signOut({ callbackUrl: '/auth/login' });
                }
            }
            const text = await res.text();
            console.error(`API Error POST ${path}: ${res.status} ${res.statusText}`, text);
            let message = "API request failed";
            try {
                const data = JSON.parse(text);
                message = data.error || message;
            } catch (e) {
                // If not JSON, use text or status
                message = text || `API Error: ${res.status}`;
            }
            throw new Error(message);
        }

        const text = await res.text();
        return text ? JSON.parse(text) : ({} as T);
    }

    static async put<T>(path: string, body: any): Promise<T> {
        const isFormData = body instanceof FormData;
        const headers = await this.getHeaders(isFormData ? undefined : "application/json");

        const res = await fetch(`${BASE_URL}${path}`, {
            method: "PUT",
            headers,
            body: isFormData ? body : JSON.stringify(body),
        });

        if (!res.ok) {
            if (res.status === 401 || res.status === 403) {
                if (typeof window !== 'undefined') {
                    signOut({ callbackUrl: '/auth/login' });
                }
            }
            const data = await res.json();
            const message = data.error || "API request failed";
            throw new Error(message);
        }

        return res.json();
    }

    static async patch<T>(path: string, body: any): Promise<T> {
        const isFormData = body instanceof FormData;
        const headers = await this.getHeaders(isFormData ? undefined : "application/json");

        const res = await fetch(`${BASE_URL}${path}`, {
            method: "PATCH",
            headers,
            body: isFormData ? body : JSON.stringify(body),
        });

        return this.handleResponse<T>(res);
    }

    static async delete<T>(path: string): Promise<T> {
        try {
            const headers = await this.getHeaders();
            const res = await fetch(`${BASE_URL}${path}`, {
                method: "DELETE",
                headers,
            });

            return this.handleResponse<T>(res);
        } catch (error) {
            console.error('Delete error details:', error);
            throw error;
        }
    }

    private static async handleResponse<T>(res: Response): Promise<T> {
        if (!res.ok) {
            if (res.status === 401 || res.status === 403) {
                if (typeof window !== 'undefined') {
                    signOut({ callbackUrl: '/auth/login' });
                }
            }
            const text = await res.text();
            let message = "API request failed";
            try {
                const data = JSON.parse(text);
                message = data.error || data.message || message;
            } catch (e) {
                message = text || `API Error: ${res.status}`;
            }
            throw new Error(message);
        }
        try {
            const text = await res.text();
            return text ? JSON.parse(text) : {} as T;
        } catch (e) {
            return {} as T;
        }
    }


    static async getFile(path: string): Promise<Blob> {
        const headers = await this.getHeaders();
        const res = await fetch(`${BASE_URL}${path}`, {
            method: "GET",
            headers,
        });

        if (!res.ok) {
            throw new Error("Download failed");
        }

        return res.blob();
    }



    static async postAuth(email: string, password: string) {
        const res = await fetch(`${BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || "Invalid credentials");
        }

        return res.json();
    }

    // Internal API methods (for Next.js Route Handlers)
    static async getInternal<T>(path: string): Promise<T> {
        // Relative path, browser handles domain
        const res = await fetch(`/api${path}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            cache: "no-store"
        });

        if (!res.ok) {
            const text = await res.text();
            let errorMessage;
            try {
                const error = JSON.parse(text);
                errorMessage = error.error || error.message || `Request failed: ${res.status}`;
            } catch (e: any) {
                // If JSON parse fails (e.g. HTML 404), throw raw text or status
                errorMessage = `API Error ${res.status}: ${res.statusText}`;
            }
            throw new Error(errorMessage);
        }
        return res.json();
    }

    static async postInternal<T>(path: string, body: any): Promise<T> {
        const res = await fetch(`/api${path}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const text = await res.text();
            let errorMessage;
            try {
                const error = JSON.parse(text);
                errorMessage = error.error || error.message || `Request failed: ${res.status}`;
            } catch (e: any) {
                console.error("API Error Response (Non-JSON):", text); // Log the actual response
                errorMessage = `API Error ${res.status}: ${res.statusText}`;
            }
            throw new Error(errorMessage);
        }
        return res.json();
    }

    static async putInternal<T>(path: string, body: any): Promise<T> {
        const res = await fetch(`/api${path}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const text = await res.text();
            let errorMessage;
            try {
                const error = JSON.parse(text);
                errorMessage = error.error || error.message || `Request failed: ${res.status}`;
            } catch (e: any) {
                errorMessage = `API Error ${res.status}: ${res.statusText}`;
            }
            throw new Error(errorMessage);
        }
        return res.json();
    }

    static async delInternal<T>(path: string): Promise<T> {
        const res = await fetch(`/api${path}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" }
        });

        if (!res.ok) {
            const text = await res.text();
            let errorMessage;
            try {
                const error = JSON.parse(text);
                errorMessage = error.error || error.message || `Request failed: ${res.status}`;
            } catch (e: any) {
                errorMessage = `API Error ${res.status}: ${res.statusText}`;
            }
            throw new Error(errorMessage);
        }
        return res.json();
    }

    /**
     * Helper to get full URL for file attachments
     */
    static getFileUrl(path: string | null | undefined): string | null {
        if (!path) return null;
        if (path.startsWith('http://') || path.startsWith('https://')) {
            return path;
        }
        return `${SERVER_URL}${path.startsWith('/') ? '' : '/'}${path}`;
    }
}
