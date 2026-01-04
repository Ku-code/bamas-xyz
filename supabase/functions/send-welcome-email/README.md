# Send Welcome Email Edge Function

This Edge Function sends welcome emails to new users upon registration.

## Environment Variables

Set these in Supabase Dashboard -> Edge Functions -> Settings:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your service role key (for admin operations)
- `RESEND_API_KEY`: (Optional) Resend API key if using Resend for email delivery
- `APP_URL`: Your application URL (default: https://bamas.xyz)

## Deployment

1. Install Supabase CLI: `npm install -g supabase`
2. Login: `supabase login`
3. Link project: `supabase link --project-ref your-project-ref`
4. Deploy: `supabase functions deploy send-welcome-email`

## Usage

This function is automatically called by the database trigger when a new user is created. It can also be called manually via HTTP POST:

```bash
curl -X POST https://your-project.supabase.co/functions/v1/send-welcome-email \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe",
    "user_id": "uuid-here"
  }'
```

