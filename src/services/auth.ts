import api from "./api";

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ApiError {
  error: string;
}

const AuthService = {
  /**
   * Register a new user
   */
  register: async (data: RegisterData): Promise<RegisterResponse> => {
    const response = await api.post<RegisterResponse>("/auth/register", data);
    return response.data;
  },
};

export default AuthService;
