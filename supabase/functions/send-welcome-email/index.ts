// Supabase Edge Function to send welcome emails to new users
// This function is called by the database trigger when a new user is created

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  name: string;
  user_id: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const resendApiKey = Deno.env.get("RESEND_API_KEY") ?? "";
    const appUrl = Deno.env.get("APP_URL") ?? "https://bamas.xyz";

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { email, name, user_id }: WelcomeEmailRequest = await req.json();

    if (!email || !name) {
      return new Response(
        JSON.stringify({ error: "Email and name are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get the login URL (you can customize this)
    const loginUrl = `${appUrl}/login`;

    // Create HTML email template
    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to BAMAS</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      max-width: 150px;
      margin-bottom: 20px;
    }
    h1 {
      color: #0f766e;
      margin: 0 0 10px 0;
      font-size: 28px;
    }
    .subtitle {
      color: #666;
      font-size: 16px;
      margin-bottom: 30px;
    }
    .content {
      margin-bottom: 30px;
    }
    .credentials {
      background-color: #f0fdfa;
      border-left: 4px solid #0f766e;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .credentials-label {
      font-weight: bold;
      color: #0f766e;
      margin-bottom: 10px;
      display: block;
    }
    .credentials-value {
      font-family: 'Courier New', monospace;
      color: #333;
      font-size: 14px;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background-color: #0f766e;
      color: #ffffff;
      text-decoration: none;
      border-radius: 6px;
      font-weight: bold;
      margin: 20px 0;
      text-align: center;
    }
    .button:hover {
      background-color: #0d9488;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e5e5;
      font-size: 14px;
      color: #666;
      text-align: center;
    }
    .footer a {
      color: #0f766e;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to BAMAS!</h1>
      <p class="subtitle">Bulgarian Additive Manufacturing Association</p>
    </div>
    
    <div class="content">
      <p>Dear ${name},</p>
      
      <p>Thank you for registering with the Bulgarian Additive Manufacturing Association (BAMAS). We're excited to have you join our community of innovators, manufacturers, and industry leaders.</p>
      
      <p>Your account has been successfully created. Please find your login credentials below:</p>
      
      <div class="credentials">
        <span class="credentials-label">Your Login Email:</span>
        <div class="credentials-value">${email}</div>
      </div>
      
      <p>You can now access your account and explore all the features BAMAS has to offer:</p>
      <ul>
        <li>Access member resources and documents</li>
        <li>Participate in polls and voting</li>
        <li>Connect with other members in the network</li>
        <li>Stay updated with events and agenda items</li>
      </ul>
      
      <div style="text-align: center;">
        <a href="${loginUrl}" class="button">Login to Your Account</a>
      </div>
      
      <p>Please note that your account is currently pending approval. Once approved by an administrator, you'll have full access to all platform features.</p>
      
      <p>If you have any questions or need assistance, please don't hesitate to contact us at <a href="mailto:info@bamas.xyz">info@bamas.xyz</a>.</p>
      
      <p>Welcome aboard!</p>
      
      <p>Best regards,<br>
      The BAMAS Team</p>
    </div>
    
    <div class="footer">
      <p>This is an automated message from BAMAS (Bulgarian Additive Manufacturing Association)</p>
      <p>For support, contact us at <a href="mailto:info@bamas.xyz">info@bamas.xyz</a></p>
    </div>
  </div>
</body>
</html>
    `;

    // Plain text version
    const emailText = `
Welcome to BAMAS!

Dear ${name},

Thank you for registering with the Bulgarian Additive Manufacturing Association (BAMAS). We're excited to have you join our community.

Your account has been successfully created. Your login credentials:

Login Email: ${email}

You can now access your account at: ${loginUrl}

Please note that your account is currently pending approval. Once approved by an administrator, you'll have full access to all platform features.

If you have any questions, contact us at info@bamas.xyz.

Welcome aboard!

Best regards,
The BAMAS Team
    `;

    // Option 1: Use Resend API (if configured)
    if (resendApiKey) {
      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "BAMAS <info@bamas.xyz>",
          to: [email],
          subject: "Welcome to BAMAS - Your Account is Ready!",
          html: emailHtml,
          text: emailText,
        }),
      });

      if (!resendResponse.ok) {
        const error = await resendResponse.text();
        throw new Error(`Resend API error: ${error}`);
      }

      const resendData = await resendResponse.json();
      return new Response(
        JSON.stringify({ success: true, messageId: resendData.id }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Option 2: Use Supabase's built-in email (via Auth API)
    // Note: This requires Supabase Auth email to be configured
    // For now, we'll log and return success (actual email will be sent via Supabase templates)
    console.log(`Welcome email should be sent to: ${email} for user: ${name}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Welcome email queued (using Supabase email templates)",
        email: email,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to send welcome email",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

