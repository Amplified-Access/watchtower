# Password Reset Functionality

## Overview

The application now includes comprehensive password reset functionality that allows administrators and super-admins to reset passwords for users in their organization.

## Features

### 1. TRPC Mutation: `resetUserPassword`

- **Location**: `src/_trpc/routers/_app.ts`
- **Access**: Admin+ roles only
- **Purpose**: Triggers password reset emails for users
- **Security**:
  - Organization-scoped (admins can only reset passwords for users in their organization)
  - Super-admins can reset any user's password

### 2. User Interface Integration

Password reset buttons are available in three main user management tables:

#### Admin Watchers Table

- **Location**: `src/features/admin/components/watchers/watchers-table/data-table.tsx`
- **Access**: Organization admins
- **Scope**: Can reset passwords for watchers in their organization

#### Super Admin - Admins Table

- **Location**: `src/features/superadmin/components/admins/admins-table/data-table.tsx`
- **Access**: Super admins only
- **Scope**: Can reset passwords for any admin user

#### Super Admin - Watchers Table

- **Location**: `src/features/superadmin/components/watchers/watchers-table/data-table.tsx`
- **Access**: Super admins only
- **Scope**: Can reset passwords for any watcher user

## How It Works

### For Administrators

1. Navigate to the watchers management page (`/admin/watchers`)
2. Click the action menu (⋮) for any watcher
3. Select "Password reset"
4. A password reset email will be sent to the user
5. Success/error message will be displayed

### For Super Administrators

1. Navigate to either:
   - Admin management page (`/superadmin/admins`)
   - Watcher management page (`/superadmin/watchers`)
2. Click the action menu (⋮) for any user
3. Select "Password reset"
4. A password reset email will be sent to the user
5. Success/error message will be displayed

## Technical Implementation

### API Endpoint

```typescript
resetUserPassword: adminProcedure
  .input(
    z.object({
      userId: z.string(),
      email: z.string().email(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    // Validates user exists
    // Checks organization permissions
    // Sends password reset email via Better Auth
  });
```

### Frontend Integration

Each table includes:

- TRPC mutation hook: `trpc.resetUserPassword.useMutation()`
- Handler function: `handlePasswordReset(userId, email, name)`
- UI feedback: Loading states and toast notifications

## Security Considerations

### Access Control

- **Admins**: Can only reset passwords for users in their own organization
- **Super Admins**: Can reset passwords for any user in the system
- **Watchers**: Cannot reset any passwords

### Validation

- User existence is verified before sending reset email
- Organization membership is checked for non-super-admin users
- Email validation ensures proper email format

## Email Flow

1. Password reset is triggered via the admin interface
2. Better Auth generates a secure reset token
3. Email is sent to the user with reset link
4. User clicks link and is redirected to `/reset-password?token=...`
5. User sets new password using the existing reset form
6. User is redirected to appropriate dashboard after successful reset

## Error Handling

- **User not found**: "User not found" error message
- **Permission denied**: "You can only reset passwords for users in your organization"
- **Email failure**: "Failed to send password reset email"
- **Network errors**: Generic error handling with toast notifications

## Future Enhancements

- Bulk password reset functionality
- Password reset history/audit log
- Custom email templates
- Password strength requirements
- Reset link expiration settings
