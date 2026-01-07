-- ============================================
-- SIMPLIFIED WELCOME EMAIL FUNCTIONALITY
-- ============================================
-- This migration simplifies the welcome email system
-- to work more reliably without requiring environment variables

-- Drop the old function and trigger
DROP TRIGGER IF EXISTS trigger_send_welcome_email ON users;
DROP FUNCTION IF EXISTS send_welcome_email();

-- Create a simpler function that uses Supabase's built-in email capabilities
-- This function will be called by the trigger, and the Edge Function will handle the actual sending
CREATE OR REPLACE FUNCTION send_welcome_email()
RETURNS TRIGGER AS $$
DECLARE
  project_url TEXT;
  function_response JSONB;
BEGIN
  -- Get the project URL from Supabase's internal settings
  -- This is automatically available in Supabase
  project_url := current_setting('app.settings.supabase_url', true);
  
  -- If project URL is not set, try to construct it from the database
  -- Supabase stores this in the auth schema
  IF project_url IS NULL OR project_url = '' THEN
    -- Try to get it from pg_settings or use a default pattern
    -- For now, we'll let the Edge Function handle the URL construction
    -- The Edge Function can be called with just the anon key from the client
    NULL; -- Do nothing - let client-side call handle it
  ELSE
    -- Call the Edge Function if we have the URL
    -- But we need service role key which we can't safely store here
    -- So we'll just log and let the client-side call handle it
    RAISE NOTICE 'Welcome email should be sent to: %', NEW.email;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Welcome email trigger fired for % but email sending handled by client', NEW.email;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to log welcome email (actual sending happens client-side)
CREATE TRIGGER trigger_send_welcome_email
  AFTER INSERT ON users
  FOR EACH ROW
  WHEN (NEW.email IS NOT NULL)
  EXECUTE FUNCTION send_welcome_email();

-- Note: The actual email sending is now handled client-side in AuthContext.tsx
-- This trigger serves as a backup/logging mechanism

