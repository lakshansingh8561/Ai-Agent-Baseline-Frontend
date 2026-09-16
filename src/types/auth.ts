export type UserRole = "user" | "admin";
export type UserPlan = "free" | "pro";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  plan: UserPlan;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponseData {
  token: string;
  user: User;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: AuthResponseData;
}

export interface CurrentUserResponse {
  success: boolean;
  data: {
    user: User;
  };
}

export interface ApiValidationErrorDetails {
  formErrors?: string[];
  fieldErrors?: Record<string, string[]>;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: ApiValidationErrorDetails;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}
