import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";

const statement = {
  ...defaultStatements,
  incident: [
    "create",
    "read_own",
    "read_all",
    "update_own",
    "update_all",
    "delete_own",
    "delete_all",
  ],
} as const;

export const ac = createAccessControl(statement);

export const independentReporter = ac.newRole({
  incident: ["create", "read_own"],
});

export const watcher = ac.newRole({
  incident: ["create", "read_all", "update_own"],
});

export const admin = ac.newRole({
  ...adminAc.statements,
  incident: ["read_all", "update_all", "delete_all"],
});

export const superAdmin = ac.newRole({
  ...adminAc.statements,
  incident: ["create", "read_all", "update_all", "delete_all"],
  // A super admin can also manage other admins if needed.
  user: ["list", "set-role", "ban", "delete", "impersonate"],
});

export const roles = {
  "independent-reporter": independentReporter,
  watcher,
  admin,
  "super-admin": superAdmin,
};