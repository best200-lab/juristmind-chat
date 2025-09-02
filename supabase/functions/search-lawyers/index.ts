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

    const { action, state, specialization, location, lawyerData } = await req.json();

    console.log(`Lawyer search action: ${action}`);

    switch (action) {
      case 'search': {
        let query = supabaseClient
          .from('lawyers')
          .select('*')
          .eq('verified', true);

        if (state) {
          query = query.ilike('state', `%${state}%`);
        }

        if (location) {
          query = query.or(`city.ilike.%${location}%,location.ilike.%${location}%`);
        }

        if (specialization) {
          query = query.contains('specialization', [specialization]);
        }

        const { data, error } = await query
          .order('rating', { ascending: false })
          .order('years_experience', { ascending: false });

        if (error) throw error;
        return new Response(JSON.stringify(data), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'get-all': {
        const { data, error } = await supabaseClient
          .from('lawyers')
          .select('*')
          .eq('verified', true)
          .order('rating', { ascending: false });

        if (error) throw error;
        return new Response(JSON.stringify(data), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'get-states': {
        const { data, error } = await supabaseClient
          .from('lawyers')
          .select('state')
          .eq('verified', true);

        if (error) throw error;
        
        const uniqueStates = [...new Set(data.map(lawyer => lawyer.state))].sort();
        return new Response(JSON.stringify(uniqueStates), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'get-specializations': {
        const { data, error } = await supabaseClient
          .from('lawyers')
          .select('specialization')
          .eq('verified', true);

        if (error) throw error;
        
        const allSpecializations = data.flatMap(lawyer => lawyer.specialization);
        const uniqueSpecializations = [...new Set(allSpecializations)].sort();
        
        return new Response(JSON.stringify(uniqueSpecializations), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'register': {
        // Check if user is authenticated
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) throw new Error('Unauthorized');

        const { data, error } = await supabaseClient
          .from('lawyers')
          .insert({
            ...lawyerData,
            user_id: user.id,
            verified: false, // Will need admin approval
          })
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ 
          ...data, 
          message: 'Our customer support will contact you for verification'
        }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Error in search-lawyers:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});