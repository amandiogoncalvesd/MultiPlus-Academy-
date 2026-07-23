import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Get the user from the token to verify they are authenticated
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check if user is ADMIN in public.users table
    const { data: dbUser, error: dbError } = await supabaseClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (dbError || dbUser?.role !== 'ADMIN') {
      return new Response(JSON.stringify({ error: 'Forbidden - ADMIN role required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create admin-privileged client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, email, password, nome_completo, role, id, status } = await req.json()

    if (action === 'create') {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { nome_completo, role }
      })

      if (error) throw error
      await supabaseAdmin.from('audit_logs').insert({
        actor_id: user.id,
        action: 'USER_CREATED',
        entity_type: 'user',
        entity_id: data.user.id,
        metadata: { role, email }
      })
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } else if (action === 'update-status') {
      if (!id || !['ACTIVE', 'SUSPENDED'].includes(status)) throw new Error('ID e estado válido são obrigatórios')
      const { data, error } = await supabaseAdmin
        .from('users')
        .update({ status })
        .eq('id', id)
        .select('id, status')
        .single()
      if (error) throw error
      await supabaseAdmin.from('audit_logs').insert({
        actor_id: user.id,
        action: 'USER_STATUS_UPDATED',
        entity_type: 'user',
        entity_id: id,
        metadata: { status }
      })
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } else if (action === 'delete') {
      if (!id) throw new Error('ID required for deletion')
      const { data, error } = await supabaseAdmin.auth.admin.deleteUser(id)

      if (error) throw error
      await supabaseAdmin.from('audit_logs').insert({
        actor_id: user.id,
        action: 'USER_DELETED',
        entity_type: 'user',
        entity_id: id,
        metadata: {}
      })
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } else {
      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
