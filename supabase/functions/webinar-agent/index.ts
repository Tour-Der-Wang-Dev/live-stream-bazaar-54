
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  let requestBody;
  
  try {
    // Consumir el body una sola vez
    requestBody = await req.json();
    console.log('Request body:', requestBody);

    const { action, webinarId, text, question, audio } = requestBody;
    console.log('Processing action:', action);

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
      if (!webinarId || !text) {
        throw new Error('webinarId y text son requeridos');
      }

      console.log('Saving transcript for webinar:', webinarId);
      console.log('Transcript text:', text);
      
      const { data: existingData, error: existingError } = await supabaseClient
        .from('webinar_transcriptions')
        .select('*')
        .eq('webinar_id', webinarId)
        .maybeSingle();

      if (existingError) {
        console.error('Error checking existing transcription:', existingError);
        throw existingError;
      }

      let result;
      
      if (existingData) {
        console.log('Updating existing transcription:', existingData.id);
        const newTranscript = existingData.transcript + " " + text;
        
        const { error: updateError } = await supabaseClient
          .from('webinar_transcriptions')
          .update({ 
            transcript: newTranscript,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingData.id);

        if (updateError) {
          console.error('Error updating transcription:', updateError);
          throw updateError;
        }
        
        result = { id: existingData.id, transcript: newTranscript };
      } else {
        console.log('Creating new transcription for webinar:', webinarId);
        const { data: insertData, error: insertError } = await supabaseClient
          .from('webinar_transcriptions')
          .insert({
            webinar_id: webinarId,
            transcript: text,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error inserting transcription:', insertError);
          throw insertError;
        }
        
        result = insertData;
      }

      console.log('Successfully saved transcript:', result);

      return new Response(
        JSON.stringify({ success: true, data: result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'ask_question') {
      console.log('Processing question for webinar:', webinarId);
      
      const { data: transcription, error: transcriptionError } = await supabaseClient
        .from('webinar_transcriptions')
        .select('transcript')
        .eq('webinar_id', webinarId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (transcriptionError) {
        console.error('Error fetching transcription:', transcriptionError);
        throw transcriptionError;
      }

      if (!transcription) {
        throw new Error('No hay transcripción disponible para este webinar');
      }

      console.log('Sending request to OpenAI');
      
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
          temperature: 0.7,
          max_tokens: 500
        }),
      });

      const data = await response.json();
      
      if (!data.choices?.[0]?.message?.content) {
        throw new Error('No se pudo generar una respuesta');
      }

      return new Response(
        JSON.stringify({ answer: data.choices[0].message.content }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'transcribe_audio') {
      console.log('Starting audio transcription...');
      
      if (!audio) {
        throw new Error('No audio data provided');
      }

      // Base64 to binary
      const binary = atob(audio);
      const array = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        array[i] = binary.charCodeAt(i);
      }

      // Create form data
      const formData = new FormData();
      formData.append('file', new Blob([array], { type: 'audio/webm' }), 'audio.webm');
      formData.append('model', 'whisper-1');
      formData.append('language', 'es');

      console.log('Sending request to Whisper API...');
      
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Whisper API error:', error);
        throw new Error('Error al transcribir el audio: ' + error);
      }

      const result = await response.json();
      console.log('Transcription result:', result);

      return new Response(
        JSON.stringify({ text: result.text }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action')
  } catch (error) {
    console.error('Error in edge function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString(),
        requestBody: requestBody || 'No body parsed'
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
