import Constants from "expo-constants";
import axios from "axios";

const DEFAULT_BACKEND_PORT = "8000";

const stripPort = (hostWithMaybePort?: string | null) => {
  if (!hostWithMaybePort) return null;
  return hostWithMaybePort.split(":")[0] || null;
};

const isDevBuild = typeof __DEV__ !== "undefined" && __DEV__;

const getBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

  if (!isDevBuild) {
    if (!envUrl) {
      throw new Error("EXPO_PUBLIC_API_BASE_URL is required for production builds.");
    }
    if (!envUrl.startsWith("https://")) {
      throw new Error("EXPO_PUBLIC_API_BASE_URL must use HTTPS in production builds.");
    }
    return envUrl;
  }

  if (envUrl) {
    return envUrl;
  }

  const expoHost = stripPort(Constants.expoConfig?.hostUri);
  if (expoHost) {
    return `http://${expoHost}:${DEFAULT_BACKEND_PORT}`;
  }

  const manifest2Host = stripPort((Constants as any)?.manifest2?.extra?.expoClient?.hostUri);
  if (manifest2Host) {
    return `http://${manifest2Host}:${DEFAULT_BACKEND_PORT}`;
  }

  const debuggerHost = stripPort(
    (Constants as any)?.manifest?.debuggerHost || (Constants as any)?.expoGoConfig?.debuggerHost,
  );
  if (debuggerHost) {
    return `http://${debuggerHost}:${DEFAULT_BACKEND_PORT}`;
  }

  throw new Error(
    "No backend URL found. Set EXPO_PUBLIC_API_BASE_URL env var or run in Expo CLI / EAS.",
  );
};

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 10000,
});

let _authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  _authToken = token;
};

api.interceptors.request.use((config) => {
  if (_authToken) {
    config.headers.Authorization = `Bearer ${_authToken}`;
  }
  return config;
});

export default api;
