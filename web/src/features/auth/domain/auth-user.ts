export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string | null;
  organizationId: string | null;
  banned: boolean | null;
  banReason: string | null;
  banExpires: Date | null;
}
