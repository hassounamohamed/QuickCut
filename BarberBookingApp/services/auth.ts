import api from "@/services/api";

export type UserRole = "user" | "barber";

export interface LoginPayload {
  identifier: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface RegisterPayload {
  email: string;
  username: string;
  password: string;
  confirme_password: string;
  role: UserRole;
}

const parseErrorMessage = (error: unknown) => {
  const detail = (error as { response?: { data?: { detail?: unknown } } })?.response
    ?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Request failed";
};

export const loginUser = async (payload: LoginPayload): Promise<LoginResponse> => {
  try {
    const response = await api.post<LoginResponse>("/auth/login", payload);
    return response.data;
  } catch (error) {
    throw new Error(parseErrorMessage(error));
  }
};

export const registerUser = async (payload: RegisterPayload) => {
  try {
    const response = await api.post("/auth/register", payload);
    return response.data;
  } catch (error) {
    throw new Error(parseErrorMessage(error));
  }
};
