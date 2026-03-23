import { useCallback, useState } from "react";

import { loginUser, type RegisterPayload, registerUser } from "@/services/auth";

export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (identifier: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await loginUser({ identifier: identifier.trim(), password });
      setToken(response.access_token);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    try {
      setIsLoading(true);
      setError(null);
      return await registerUser(payload);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setError(null);
  }, []);

  return {
    token,
    isAuthenticated: Boolean(token),
    isLoading,
    error,
    login,
    register,
    logout,
  };
}
