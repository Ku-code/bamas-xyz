# Member Management Features for Superadmins

## Overview
Enhanced member management system that allows superadmins to manage approved members with suspend, ban, restore, and delete functionality.

## New Features

### 1. Member Status System
- **Suspended Status**: New status for temporarily banned members
- Members can be suspended, restored, banned, or deleted
- All actions are logged in activity history

### 2. Superadmin Actions

#### Suspend Member
- Temporarily removes member access
- Member can be restored later
- Requires reason for suspension
- Status changes to `suspended`

#### Restore Member
- Restores suspended member's access
- Changes status back to `approved`
- Clears suspension tracking fields

#### Ban Member
- Permanently bans member
- Changes status to `rejected`
- Requires reason for ban
- Cannot be easily undone

#### Delete Member
- Soft deletes member (marks as deleted)
- Keeps data for audit purposes
- Requires reason for deletion
- Member is filtered from member lists

### 3. UI Enhancements

#### New Tab: Suspended Members
- Dedicated tab to view all suspended members
- Only visible to superadmins
- Shows member details and restore option

#### Action Buttons in Approved Members Table
- **Suspend** button (Ban icon)
- **Ban** button (UserX icon)
- **Delete** button (Trash icon)
- Only visible to superadmins

#### Confirmation Dialogs
- All destructive actions require confirmation
- Reason input required for suspend/ban/delete
- Clear warnings about action consequences

## Database Changes

### Migration: `004_member_management.sql`
- Adds `suspended` status to status constraint
- Adds `suspended_at`, `suspended_by`, `suspension_reason` fields
- Adds `deleted_at`, `deleted_by`, `deletion_reason` fields (soft delete)
- Adds indexes for performance

## Files Modified

1. **`supabase/migrations/004_member_management.sql`**
   - Database schema updates

2. **`src/lib/members.ts`** (NEW)
   - `suspendMember()` - Suspend a member
   - `restoreMember()` - Restore suspended member
   - `banMember()` - Ban a member permanently
   - `deleteMember()` - Soft delete a member
   - `getMemberActivity()` - Get member's activity history

3. **`src/lib/history.ts`**
   - Added new history types: `member_suspended`, `member_restored`, `member_banned`, `member_deleted`

4. **`src/components/dashboard/NetworkContent.tsx`**
   - Added suspend/restore/ban/delete handlers
   - Added suspended members tab
   - Added action buttons in approved members table
   - Added confirmation dialogs

5. **`src/contexts/AuthContext.tsx`**
   - Updated `MemberStatus` type to include `'suspended'`

6. **`src/lib/supabase.ts`**
   - Updated database type to include `'suspended'` status

7. **`src/translations/en.json` & `bg.json`**
   - Added all new translation keys for member management

## Security Features

- **Self-Protection**: Cannot suspend/ban/delete yourself
- **Last Admin Protection**: Cannot remove last superadmin
- **Audit Trail**: All actions logged with reason and admin info
- **Soft Delete**: Data preserved for audit purposes
- **Permission Checks**: Only superadmins can perform these actions

## Usage

### To Suspend a Member:
1. Go to Dashboard → Network → Approved tab
2. Find the member
3. Click the **Suspend** button (Ban icon)
4. Enter reason for suspension
5. Click "Suspend Member"

### To Restore a Suspended Member:
1. Go to Dashboard → Network → Suspended tab
2. Find the suspended member
3. Click **Restore** button
4. Confirm restoration

### To Ban a Member:
1. Go to Dashboard → Network → Approved tab
2. Find the member
3. Click the **Ban** button (UserX icon)
4. Enter reason for ban
5. Click "Ban Member"

### To Delete a Member:
1. Go to Dashboard → Network → Approved tab
2. Find the member
3. Click the **Delete** button (Trash icon)
4. Enter reason for deletion
5. Click "Delete Member"

## Setup Instructions

1. **Run Database Migration**:
   ```sql
   -- Run: supabase/migrations/004_member_management.sql
   -- In Supabase Dashboard → SQL Editor
   ```

2. **Verify Migration**:
   - Check that `suspended` status is available
   - Verify new columns exist in `users` table

3. **Test Features**:
   - Try suspending a test member
   - Verify they appear in Suspended tab
   - Restore them and verify access restored

## Notes

- Suspended members lose access immediately
- All actions are logged in activity history
- Reasons are stored for audit purposes
- Soft delete preserves data for compliance
- Only superadmins see these features

## Future Enhancements

- Email notifications when member is suspended/banned
- Bulk operations (suspend multiple members)
- Suspension duration/expiration
- Member activity view
- Content transfer before deletion

