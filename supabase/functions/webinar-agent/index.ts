
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, webinarId, text, question } = await req.json()
    console.log('Received request:', { action, webinarId, text, question });

    // Configurar cliente de Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        }
      }
    )

    if (action === 'save_transcript') {
      console.log('Saving transcript for webinar:', webinarId);
      
      // Primero intentamos obtener la transcripción existente
      const { data: existingTranscription, error: fetchError } = await supabaseClient
        .from('webinar_transcriptions')
        .select('*')
        .eq('webinar_id', webinarId)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching existing transcription:', fetchError);
        throw fetchError;
      }

      if (existingTranscription) {
        // Actualizar transcripción existente
        const { error: updateError } = await supabaseClient
          .from('webinar_transcriptions')
          .update({
            transcript: existingTranscription.transcript + " " + text
          })
          .eq('webinar_id', webinarId);

        if (updateError) throw updateError;
      } else {
        // Crear nueva transcripción
        const { error: insertError } = await supabaseClient
          .from('webinar_transcriptions')
          .insert({
            webinar_id: webinarId,
            transcript: text
          });

        if (insertError) throw insertError;
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'ask_question') {
      console.log('Processing question for webinar:', webinarId);
      
      // Obtener la transcripción del webinar
      const { data: transcription, error: transcriptionError } = await supabaseClient
        .from('webinar_transcriptions')
        .select('transcript')
        .eq('webinar_id', webinarId)
        .maybeSingle();

      if (transcriptionError) {
        console.error('Error fetching transcription:', transcriptionError);
        throw transcriptionError;
      }

      if (!transcription) {
        console.log('No transcription found for webinar:', webinarId);
        throw new Error('No hay transcripción disponible para este webinar');
      }

      console.log('Sending request to OpenAI');
      
      // Usar OpenAI para generar una respuesta basada en la transcripción
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `Eres un asistente útil que responde preguntas sobre un webinar. 
                       Usa la siguiente transcripción como contexto para responder:
                       ${transcription.transcript}`
            },
            {
              role: 'user',
              content: question
            }
          ],
        }),
      });

      const data = await response.json();
      console.log('OpenAI response received');
      
      if (!data.choices?.[0]?.message?.content) {
        throw new Error('No se pudo generar una respuesta');
      }

      const answer = data.choices[0].message.content;

      return new Response(
        JSON.stringify({ answer }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    throw new Error('Invalid action')
  } catch (error) {
    console.error('Error in edge function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
