# Board Member Permissions & Meeting-Agenda Binding Implementation Plan

## Overview
This plan implements permissions for board members to create votes and agendas, adds meeting creation UI, and enables binding meetings to agendas. The database schema already supports these features via RLS policies, but the frontend needs updates.

## Current State Analysis

### Database Schema (Already Implemented)
- ✅ `meetings` table exists with: id, type, title, scheduled_date, scheduled_time, location, status, chairperson_id, created_by
- ✅ `agendas` table exists with: id, meeting_id (FK), version, rules, status
- ✅ `agenda_items` table has: meeting_id, agenda_id (both FKs)
- ✅ RLS policies already allow `board_member` role to create meetings and agendas (migration 013)

### Frontend Current State
- ✅ `MeetingsContent.tsx` has create meeting button (line 270-350)
- ✅ Uses `canManageMeetings` which checks `isSuperAdmin || isAdmin || isBoardMember`
- ❌ `isBoardMember` is NOT exported from `AuthContext.tsx` (causes TypeScript error)
- ❌ `AgendaContent.tsx` only checks `isSuperAdmin` for creating agendas (line 39)
- ❌ `VotesContent.tsx` has no permission checks - anyone can create polls
- ❌ No UI for binding meetings to agendas during creation
- ❌ No UI for selecting agenda when creating a meeting

## Implementation Tasks

### 1. Add `isBoardMember` to AuthContext
**File: `src/contexts/AuthContext.tsx`**
- Add `isBoardMember: boolean` to `AuthContextType` interface
- Calculate `isBoardMember` in `AuthProvider` (similar to `isAdmin` and `isSuperAdmin`)
- Export `isBoardMember` in the context value
- Update TypeScript types

**Impact**: Fixes TypeScript errors in `MeetingsContent.tsx` and `MeetingDetailView.tsx`

### 2. Update AgendaContent to Allow Board Members
**File: `src/components/dashboard/AgendaContent.tsx`**
- Change line 39: `const { user, isSuperAdmin } = useAuth();`
- To: `const { user, isSuperAdmin, isAdmin, isBoardMember } = useAuth();`
- Add permission check: `const canManageAgendas = isSuperAdmin || isAdmin || isBoardMember;`
- Update all places where `isSuperAdmin` is used for agenda creation/editing to use `canManageAgendas`
- Ensure create/edit/delete buttons are visible to board members

**Impact**: Board members can now create and manage agendas

### 3. Restrict Vote Creation to Board Members, Admins, SuperAdmins
**File: `src/components/dashboard/VotesContent.tsx`**
- Add permission check: `const { user, isSuperAdmin, isAdmin, isBoardMember } = useAuth();`
- Add: `const canCreateVotes = isSuperAdmin || isAdmin || isBoardMember;`
- Wrap the "Create Poll" button with permission check
- Show message to regular members explaining they need board member status

**Impact**: Only authorized users can create votes/polls

### 4. Add Meeting-Agenda Binding UI
**File: `src/components/dashboard/MeetingsContent.tsx`**
- Add state for selected agenda: `const [selectedAgendaId, setSelectedAgendaId] = useState<string>("");`
- Load available agendas when creating/editing a meeting
- Add Select dropdown in create/edit meeting dialog to choose an agenda
- Update `handleCreateMeeting` to optionally link agenda
- Add function to bind agenda to meeting: `bindAgendaToMeeting(meetingId, agendaId)`

**File: `src/lib/meetings.ts`**
- Add function: `bindAgendaToMeeting(meetingId: string, agendaId: string): Promise<void>`
- This updates the agenda's `meeting_id` field

**Impact**: Users can bind agendas to meetings during meeting creation

### 5. Add Agenda Creation with Meeting Selection
**File: `src/components/dashboard/AgendaContent.tsx`**
- Add state for selected meeting: `const [selectedMeetingId, setSelectedMeetingId] = useState<string>("");`
- Load available meetings when creating an agenda
- Add Select dropdown in create agenda dialog to choose a meeting
- Update `handleCreateAgenda` to link to selected meeting
- Use `createAgenda(meetingId, rules)` from `src/lib/agendas.ts`

**Impact**: Users can create agendas and bind them to meetings

### 6. Display Meeting-Agenda Relationships
**File: `src/components/dashboard/MeetingsContent.tsx`**
- When displaying meetings list, show linked agenda if exists
- Add badge or indicator showing agenda status
- Add button to view/edit agenda from meeting card

**File: `src/components/dashboard/AgendaContent.tsx`**
- When displaying agendas, show linked meeting title and date
- Add navigation link to view meeting details

**Impact**: Better visibility of meeting-agenda relationships

### 7. Update Meeting Detail View
**File: `src/components/dashboard/MeetingDetailView.tsx`**
- Display linked agenda if exists
- Add button to create agenda if none exists
- Add button to bind existing agenda
- Show agenda items within the meeting view

**Impact**: Complete meeting-agenda integration in detail view

## Database Functions Needed

### Optional: Create Helper Function
**Migration: `supabase/migrations/014_bind_meeting_agenda.sql`** (if needed)
- Function to safely bind agenda to meeting with validation
- Ensure meeting exists and agenda exists
- Prevent duplicate bindings

**Note**: This may not be necessary if frontend handles it correctly via direct updates.

## UI/UX Improvements

### Meeting Creation Dialog
- Add "Link to Agenda" section (collapsible/optional)
- Show list of existing agendas (draft status only)
- Option to "Create New Agenda" from meeting dialog
- Visual indicator when agenda is bound

### Agenda Creation Dialog
- Add "Link to Meeting" section (required or optional based on use case)
- Show list of meetings (draft/scheduled status)
- Option to create standalone agenda (no meeting)
- Visual indicator when meeting is bound

### Visual Indicators
- Badge on meeting card showing "Has Agenda" or "No Agenda"
- Badge on agenda card showing linked meeting
- Color coding: Green = bound, Gray = unbound

## Testing Checklist

- [ ] Board members can create meetings
- [ ] Board members can create agendas
- [ ] Board members can create votes
- [ ] Regular members cannot create votes (see message)
- [ ] Super admins, admins, and board members can bind meetings to agendas
- [ ] Meeting creation dialog shows agenda selection
- [ ] Agenda creation dialog shows meeting selection
- [ ] Bound meetings show linked agenda in list view
- [ ] Bound agendas show linked meeting in list view
- [ ] Meeting detail view shows agenda
- [ ] Can unbind agenda from meeting (if needed)
- [ ] RLS policies work correctly (test with different user roles)

## Files to Modify

1. `src/contexts/AuthContext.tsx` - Add isBoardMember
2. `src/components/dashboard/AgendaContent.tsx` - Add board member permissions
3. `src/components/dashboard/VotesContent.tsx` - Restrict vote creation
4. `src/components/dashboard/MeetingsContent.tsx` - Add agenda binding UI
5. `src/lib/meetings.ts` - Add bindAgendaToMeeting function
6. `src/components/dashboard/MeetingDetailView.tsx` - Show agenda in meeting view
7. `src/translations/en.json` - Add new translation keys
8. `src/translations/bg.json` - Add new translation keys

## Translation Keys Needed

```json
{
  "dashboard.meetings.agenda.bound": "Bound to Agenda",
  "dashboard.meetings.agenda.notBound": "No Agenda",
  "dashboard.meetings.agenda.select": "Select Agenda",
  "dashboard.meetings.agenda.createNew": "Create New Agenda",
  "dashboard.agenda.meeting.bound": "Bound to Meeting",
  "dashboard.agenda.meeting.select": "Select Meeting",
  "dashboard.votes.create.restricted": "Only board members, admins, and super admins can create votes.",
  "dashboard.agenda.create.restricted": "Only board members, admins, and super admins can create agendas."
}
```

## Implementation Order

1. **Add isBoardMember to AuthContext** (Foundation - fixes existing errors)
2. **Update AgendaContent permissions** (Quick win)
3. **Restrict VotesContent** (Quick win)
4. **Add meeting-agenda binding UI** (Core feature)
5. **Add agenda creation with meeting selection** (Core feature)
6. **Display relationships** (UX improvement)
7. **Update MeetingDetailView** (Complete integration)
8. **Add translations** (Throughout implementation)

## Expected Outcomes

- ✅ Board members have full permissions to create votes and agendas
- ✅ Meeting creation includes agenda binding option
- ✅ Agenda creation includes meeting binding option
- ✅ Clear visual indicators of meeting-agenda relationships
- ✅ Proper permission checks throughout
- ✅ Better UX for managing meetings and agendas together
