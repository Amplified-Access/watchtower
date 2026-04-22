import { api } from "./client";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string;
  role: string;
  organizationId?: string;
  banned: boolean;
  banReason?: string;
  banExpires?: string;
  createdAt: string;
  updatedAt: string;
}

export const authApi = {
  me: () => api.get<AuthUser>("/me"),
};
