# Rejected User Re-Registration Feature

## Overview
Implemented functionality that allows users who were previously rejected by a superadmin to sign up again and be placed back into the pending approval queue.

## What Was Changed

### 1. Email/Password Registration (`signUpWithEmail`)
**File:** `src/contexts/AuthContext.tsx`

**Behavior:**
- Before creating a new account, the system checks if a user with the email already exists
- If the user exists and has status `'rejected'`:
  - Their status is reset to `'pending'`
  - Their name is updated with the new registration name
  - The `approved_at` and `approved_by` fields are cleared
  - The system attempts to sign them in with the provided password
  - If the password doesn't match, they receive a helpful message directing them to reset their password
- If the user exists and has status `'pending'` or `'approved'`:
  - They receive a message telling them to login instead
- If the user doesn't exist:
  - Normal registration flow proceeds

### 2. Google OAuth Sign-In (`signInWithGoogle`)
**File:** `src/contexts/AuthContext.tsx`

**Behavior:**
- After Google authentication succeeds, the system checks if the user exists in the database
- If the user exists and has status `'rejected'`:
  - Their status is reset to `'pending'`
  - The `approved_at` and `approved_by` fields are cleared
  - The user is logged in and taken to the pending approval screen
- If the user doesn't exist:
  - Normal user creation flow proceeds

### 3. Enhanced User Feedback
**File:** `src/pages/Register.tsx`

**Behavior:**
- Special handling for reactivated accounts with helpful error messages
- Auto-redirect to forgot password page if password reset is needed
- Auto-redirect to login page if account already exists and is not rejected
- Toast notifications with translated messages

### 4. Translation Keys Added
**Files:** `src/translations/en.json` and `src/translations/bg.json`

**New Keys:**
- `auth.register.error.exists.title` - "Account Already Exists" / "Акаунтът вече съществува"
- `auth.register.reactivated.title` - "Account Reactivated" / "Акаунтът е реактивиран"

## User Flow Scenarios

### Scenario 1: Rejected User Re-registers with Same Password
1. User tries to register with an email that was previously rejected
2. System recognizes the rejected account
3. Status is reset to `'pending'`
4. User is automatically signed in
5. User sees the pending approval screen
6. Superadmin can now re-approve or reject them again

### Scenario 2: Rejected User Re-registers with Different Password
1. User tries to register with an email that was previously rejected, but uses a different password
2. System recognizes the rejected account and resets status to `'pending'`
3. System attempts to sign in but password doesn't match
4. User receives a message: "Your account has been reactivated, but the password is incorrect. Please use 'Forgot Password' to reset your password."
5. After 3 seconds, user is automatically redirected to the forgot password page
6. User resets their password
7. User can now log in with their new password
8. User sees the pending approval screen

### Scenario 3: Rejected User Signs in with Google OAuth
1. User was previously rejected after email/password registration
2. User tries to sign in with Google OAuth using the same email
3. System recognizes the rejected account
4. Status is reset to `'pending'`
5. User is automatically signed in via Google
6. User sees the pending approval screen

### Scenario 4: Pending/Approved User Tries to Re-register
1. User tries to register with an email that already has an active account (pending or approved)
2. System detects the existing account
3. User receives message: "An account with this email already exists. Please login instead."
4. After 2 seconds, user is automatically redirected to the login page

## Database Changes
No database migrations required. The feature uses existing fields:
- `status` - Set to `'pending'` for reactivated accounts
- `approved_at` - Cleared (set to `null`) for reactivated accounts
- `approved_by` - Cleared (set to `null`) for reactivated accounts
- `updated_at` - Updated to current timestamp

## Testing Instructions

### Test 1: Email Registration - Same Password
1. Create a test user via email registration
2. As superadmin, reject the user
3. Log out
4. Try to register again with the same email and password
5. ✅ Expected: User is signed in and sees pending approval message

### Test 2: Email Registration - Different Password
1. Create a test user via email registration
2. As superadmin, reject the user
3. Log out
4. Try to register again with the same email but a different password
5. ✅ Expected: User sees reactivation message and is redirected to forgot password page
6. Reset the password
7. Log in with new password
8. ✅ Expected: User sees pending approval message

### Test 3: Google OAuth After Rejection
1. Create a test user via email registration
2. As superadmin, reject the user
3. Log out
4. Try to sign in with Google OAuth using the same email
5. ✅ Expected: User is signed in via Google and sees pending approval message

### Test 4: Multiple Rejections
1. Create a test user
2. As superadmin, reject the user
3. User re-registers (status becomes pending)
4. As superadmin, reject the user again
5. User re-registers again (status becomes pending)
6. ✅ Expected: User can be rejected and re-register multiple times

### Test 5: Existing Approved User
1. Create and approve a test user
2. Log out
3. Try to register again with the same email
4. ✅ Expected: User sees "account already exists" message and is redirected to login

## Superadmin View
From the superadmin's perspective:
- Rejected users who re-register will reappear in the pending users list
- The superadmin can see the user's history (if audit logs are enabled)
- The superadmin can approve or reject them again
- Each time a user is reactivated, the `updated_at` timestamp changes, helping track activity

## Security Considerations
- Users cannot change their status directly (RLS policies prevent this)
- Only rejected users can be reactivated through re-registration
- Approved users cannot re-register (must login)
- Password changes require proper authentication through the forgot password flow
- All status changes are logged via the `updated_at` timestamp

## Future Enhancements
Consider implementing:
1. Audit log to track rejection/reactivation cycles
2. Email notification to superadmins when a rejected user re-registers
3. Limit on number of times a user can be rejected and re-register
4. Optional superadmin comment/reason field for rejections
5. Permanent ban status for users who should never be allowed back

## Notes
- The feature is fully bilingual (English/Bulgarian)
- Works seamlessly with both authentication methods (email and Google OAuth)
- No breaking changes to existing functionality
- Compatible with the existing pending approval system
