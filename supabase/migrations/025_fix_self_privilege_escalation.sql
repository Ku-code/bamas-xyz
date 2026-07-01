-- Migration 025: Fix self role/status escalation guard
--
-- The "Users can update own profile" policy in 001_initial_schema.sql tried to
-- prevent users from changing their own role/status with:
--     WITH CHECK (... AND (OLD.role = NEW.role AND OLD.status = NEW.status))
-- but OLD/NEW are NOT valid inside RLS policy expressions (they only exist in
-- PL/pgSQL triggers). That expression errors on apply, so the protection was
-- never actually enforced -> a privilege-escalation risk.
--
-- Fix: keep a clean RLS policy for row ownership, and enforce role/status
-- immutability for non-admins in a BEFORE UPDATE trigger, where OLD/NEW work.

-- ────────────────────────────────────────────────────────────
-- 1. Replace the broken RLS policy with a clean ownership check
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

-- ────────────────────────────────────────────────────────────
-- 2. Trigger that blocks non-admins from changing role/status
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.prevent_self_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  acting_role TEXT;
BEGIN
  -- Allow when neither role nor status is changing.
  IF NEW.role IS NOT DISTINCT FROM OLD.role
     AND NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  -- Trusted server contexts (service_role key, SECURITY DEFINER jobs,
  -- the create_user_profile RPC, direct DB access) have no auth.uid().
  -- Those are already privileged, so let them through.
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Look up the acting user's role (the one performing the UPDATE).
  SELECT role INTO acting_role
  FROM public.users
  WHERE id = auth.uid();

  -- Only admins / superadmins may change a role or status value.
  IF acting_role IN ('superadmin', 'admin') THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Insufficient privileges to modify role or status'
    USING ERRCODE = '42501'; -- insufficient_privilege
END;
$$;

DROP TRIGGER IF EXISTS enforce_no_self_privilege_escalation ON public.users;
CREATE TRIGGER enforce_no_self_privilege_escalation
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_self_privilege_escalation();
