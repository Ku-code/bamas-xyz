import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const DOCUSEAL_API_KEY = Deno.env.get('DOCUSEAL_API_KEY')!
const DOCUSEAL_API_URL = 'https://api.docuseal.co'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DocuSealRequest {
  action: 'create_template' | 'create_submission' | 'get_submission' | 'get_templates' | 'download_submission'
  data?: any
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify request has authorization
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { action, data }: DocuSealRequest = await req.json()

    console.log(`[DocuSeal Proxy] Action: ${action}`)

    let response: Response

    switch (action) {
      case 'create_template':
        console.log('[DocuSeal Proxy] Creating template:', data.name)
        response = await fetch(`${DOCUSEAL_API_URL}/templates`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Auth-Token': DOCUSEAL_API_KEY,
          },
          body: JSON.stringify({
            name: data.name,
            documents: [{
              name: data.name,
              file: data.file_base64,
            }]
          }),
        })
        break

      case 'create_submission':
        console.log('[DocuSeal Proxy] Creating submission for template:', data.template_id)
        response = await fetch(`${DOCUSEAL_API_URL}/submissions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Auth-Token': DOCUSEAL_API_KEY,
          },
          body: JSON.stringify({
            template_id: data.template_id,
            send_email: data.send_email !== false,
            external_id: data.external_id,
            submitters: data.submitters,
          }),
        })
        break

      case 'get_submission':
        console.log('[DocuSeal Proxy] Getting submission:', data.submission_id)
        response = await fetch(`${DOCUSEAL_API_URL}/submissions/${data.submission_id}`, {
          method: 'GET',
          headers: {
            'X-Auth-Token': DOCUSEAL_API_KEY,
          },
        })
        break

      case 'get_templates':
        console.log('[DocuSeal Proxy] Getting templates')
        response = await fetch(`${DOCUSEAL_API_URL}/templates`, {
          method: 'GET',
          headers: {
            'X-Auth-Token': DOCUSEAL_API_KEY,
          },
        })
        break

      case 'download_submission':
        console.log('[DocuSeal Proxy] Downloading submission:', data.submission_id)
        response = await fetch(`${DOCUSEAL_API_URL}/submissions/${data.submission_id}/download`, {
          method: 'GET',
          headers: {
            'X-Auth-Token': DOCUSEAL_API_KEY,
          },
        })
        break

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action. Supported: create_template, create_submission, get_submission, get_templates, download_submission' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    const result = await response.json()

    if (!response.ok) {
      console.error(`[DocuSeal Proxy] Error from DocuSeal API:`, result)
      return new Response(
        JSON.stringify({ error: result.message || 'DocuSeal API error', details: result }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[DocuSeal Proxy] Success for action: ${action}`)
    return new Response(
      JSON.stringify(result),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error: any) {
    console.error('[DocuSeal Proxy] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

