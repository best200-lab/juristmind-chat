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

    const { action, entryData } = await req.json();

    console.log(`Diary management action: ${action}`);

    switch (action) {
      case 'create': {
        const { data, error } = await supabaseClient
          .from('diary_entries')
          .insert({
            ...entryData,
            user_id: user.id,
          })
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify(data), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'list': {
        const { data, error } = await supabaseClient
          .from('diary_entries')
          .select('*')
          .order('entry_date', { ascending: false });

        if (error) throw error;
        return new Response(JSON.stringify(data), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'update': {
        const { data, error } = await supabaseClient
          .from('diary_entries')
          .update(entryData)
          .eq('id', entryData.id)
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify(data), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'delete': {
        const { error } = await supabaseClient
          .from('diary_entries')
          .delete()
          .eq('id', entryData.id);

        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Error in manage-diary:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});