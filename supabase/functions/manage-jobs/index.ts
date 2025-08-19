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

    const { action, jobData, applicationData } = await req.json();

    console.log(`Jobs management action: ${action}`);

    switch (action) {
      case 'create-job': {
        const { data, error } = await supabaseClient
          .from('jobs')
          .insert({
            ...jobData,
            posted_by: user.id,
          })
          .select(`
            *,
            profiles!jobs_posted_by_fkey(display_name)
          `)
          .single();

        if (error) throw error;
        return new Response(JSON.stringify(data), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'list-jobs': {
        const { data, error } = await supabaseClient
          .from('jobs')
          .select(`
            *,
            profiles!jobs_posted_by_fkey(display_name)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return new Response(JSON.stringify(data), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'apply-job': {
        // Check if already applied
        const { data: existingApp } = await supabaseClient
          .from('job_applications')
          .select('id')
          .eq('job_id', applicationData.job_id)
          .eq('applicant_id', user.id)
          .single();

        if (existingApp) {
          return new Response(JSON.stringify({ error: 'You have already applied to this job' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Create application and increment count
        const { data, error } = await supabaseClient
          .from('job_applications')
          .insert({
            ...applicationData,
            applicant_id: user.id,
          })
          .select()
          .single();

        if (error) throw error;

        // Update applications count
        await supabaseClient
          .from('jobs')
          .update({ 
            applications_count: supabaseClient.sql`applications_count + 1`
          })
          .eq('id', applicationData.job_id);

        return new Response(JSON.stringify(data), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'my-applications': {
        const { data, error } = await supabaseClient
          .from('job_applications')
          .select(`
            *,
            jobs(title, company, location, salary_range)
          `)
          .eq('applicant_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return new Response(JSON.stringify(data), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'job-applications': {
        const { job_id } = jobData;
        const { data, error } = await supabaseClient
          .from('job_applications')
          .select(`
            *,
            profiles!job_applications_applicant_id_fkey(display_name, email)
          `)
          .eq('job_id', job_id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return new Response(JSON.stringify(data), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Error in manage-jobs:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});