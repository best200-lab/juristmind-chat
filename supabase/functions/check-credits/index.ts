import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { action } = await req.json();

    console.log(`Credits action: ${action}`);

    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    switch (action) {
      case 'check': {
        // Initialize user credits if not exist
        const { data: credits, error: creditsError } = await supabaseClient
          .from('user_credits')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (creditsError && creditsError.code === 'PGRST116') {
          // No record found, create one
          const { data: newCredits, error: createError } = await supabaseClient
            .from('user_credits')
            .insert({
              user_id: user.id,
              credits_remaining: 5,
              is_premium: false
            })
            .select()
            .single();

          if (createError) throw createError;
          return new Response(JSON.stringify(newCredits), { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        if (creditsError) throw creditsError;

        // Check if premium is still valid
        const isPremium = credits.is_premium && 
          credits.premium_expires_at && 
          new Date(credits.premium_expires_at) > new Date();

        return new Response(JSON.stringify({
          ...credits,
          is_premium_active: isPremium
        }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'use': {
        // Use the database function to check and deduct credits
        const { data, error } = await supabaseService
          .rpc('use_credit', { user_uuid: user.id });

        if (error) throw error;

        if (!data) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'No credits remaining. Please upgrade to premium.',
            requiresUpgrade: true
          }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ 
          success: true,
          message: 'Credit used successfully'
        }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Error in check-credits:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});