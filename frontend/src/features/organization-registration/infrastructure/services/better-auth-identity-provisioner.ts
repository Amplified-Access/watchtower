import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import type { IdentityProvisioner } from "../../domain/identity-provisioner";

export class BetterAuthIdentityProvisioner implements IdentityProvisioner {
  async createAdminAccount(params: {
    name: string;
    email: string;
    password: string;
  }): Promise<{ userId?: string }> {
    const response = await auth.api
      .signUpEmail({
        body: {
          name: params.name,
          email: params.email,
          password: params.password,
        },
        asResponse: true,
      })
      .then((res) => res.json());

    return {
      userId: response?.user?.id,
    };
  }

  async setUserRole(params: { userId: string; role: "admin" }): Promise<void> {
    await auth.api.setRole({
      body: {
        userId: params.userId,
        role: params.role,
      },
      headers: await headers(),
    });
  }

  async sendPasswordReset(params: {
    email: string;
    redirectTo: string;
  }): Promise<void> {
    await auth.api.requestPasswordReset({
      body: {
        email: params.email,
        redirectTo: params.redirectTo,
      },
    });
  }
}
