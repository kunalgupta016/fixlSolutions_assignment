import axios from "axios";
import toast from "react-hot-toast";

const isLocalhost =
  typeof window !== "undefined" &&
  ["localhost", "127.0.0.1"].includes(window.location.hostname);

const resolvedApiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  (isLocalhost
    ? "http://localhost:5000/api"
    : "https://fixlsolutions-assignment.onrender.com/api");

const api = axios.create({
  baseURL: resolvedApiBaseUrl,
  withCredentials: true, // Send HTTPOnly cookies automatically
});
// Request Interceptor
api.interceptors.request.use(
  (config) => {
    // You can attach specific custom headers here if needed.
    // JWT is handled automatically via HttpOnly cookie.
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
  (response) => {
    // Return data cleanly without nesting if possible
    return response.data;
  },
  (error) => {
    const errorResponse = error.response?.data;
    let message = errorResponse?.message || "An unexpected error occurred.";

    // Prefer the specific validation error details if they exist in the payload
    if (errorResponse?.errors && errorResponse.errors.length > 0) {
      message = errorResponse.errors[0];
    }

    // Show toast for most errors automatically for UX
    if (error.response?.status !== 401 || !error.config.url.includes("/auth/me")) {
      toast.error(message);
    }

    // Auto-logout event dispatch if 401 happens (session timeout)
    if (error.response?.status === 401 && !error.config.url.includes("/auth/login") && !error.config.url.includes("/auth/me")) {
       // Dispatch a custom event to notify AuthContext to purge state
       window.dispatchEvent(new Event("auth-expired"));
    }

    return Promise.reject(errorResponse || error);
  }
);

export default api;
