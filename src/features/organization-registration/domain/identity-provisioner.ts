export interface IdentityProvisioner {
  createAdminAccount(params: {
    name: string;
    email: string;
    password: string;
  }): Promise<{ userId?: string }>;
  setUserRole(params: { userId: string; role: "admin" }): Promise<void>;
  sendPasswordReset(params: { email: string; redirectTo: string }): Promise<void>;
}
