const TOKEN_KEY = "lumina_auth_token";
const LEGACY_TOKEN_KEY = "nexamind_auth_token";

export const getStoredToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY);
  } catch (error) {
    console.error("Failed to read auth token from localStorage:", error);
    return null;
  }
};

export const setStoredToken = (token: string): void => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error("Failed to store auth token in localStorage:", error);
  }
};

export const removeStoredToken = (): void => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error("Failed to remove auth token from localStorage:", error);
  }
};
