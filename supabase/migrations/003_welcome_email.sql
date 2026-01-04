-- ============================================
-- WELCOME EMAIL FUNCTIONALITY
-- ============================================
-- This migration adds functionality to send welcome emails
-- to users upon registration via Supabase Edge Function

-- Enable pg_net extension for HTTP requests (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Function to send welcome email via Edge Function
CREATE OR REPLACE FUNCTION send_welcome_email()
RETURNS TRIGGER AS $$
DECLARE
  edge_function_url TEXT;
  function_response JSONB;
BEGIN
  -- Get the Edge Function URL from environment or use default
  -- This should be set in Supabase Dashboard -> Settings -> Edge Functions
  edge_function_url := current_setting('app.settings.edge_function_url', true);
  
  -- If not set, use the default pattern for Supabase Edge Functions
  IF edge_function_url IS NULL OR edge_function_url = '' THEN
    -- Default to calling the Edge Function via Supabase's internal URL
    -- The actual URL will be: https://<project-ref>.supabase.co/functions/v1/send-welcome-email
    -- We'll use pg_net to make the HTTP request
    SELECT net.http_post(
      url := 'https://' || current_setting('app.settings.supabase_url', true) || '/functions/v1/send-welcome-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'email', NEW.email,
        'name', NEW.name,
        'user_id', NEW.id::text
      )
    ) INTO function_response;
  ELSE
    -- Use custom URL if provided
    SELECT net.http_post(
      url := edge_function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'email', NEW.email,
        'name', NEW.name,
        'user_id', NEW.id::text
      )
    ) INTO function_response;
  END IF;

  -- Log the response (optional, for debugging)
  -- You can check this in Supabase logs if needed
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    -- This ensures user registration succeeds even if email fails
    RAISE WARNING 'Failed to send welcome email to %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to send welcome email after user is created
-- This fires AFTER the user record is inserted into the users table
DROP TRIGGER IF EXISTS trigger_send_welcome_email ON users;
CREATE TRIGGER trigger_send_welcome_email
  AFTER INSERT ON users
  FOR EACH ROW
  WHEN (NEW.email IS NOT NULL)
  EXECUTE FUNCTION send_welcome_email();

-- Note: For this to work, you need to:
-- 1. Deploy the Edge Function (see supabase/functions/send-welcome-email/)
-- 2. Set up environment variables in Supabase Dashboard:
--    - app.settings.supabase_url (your project URL)
--    - app.settings.service_role_key (your service role key)
-- 3. Alternatively, use Supabase's built-in email templates (see WELCOME_EMAIL_SETUP.md)

