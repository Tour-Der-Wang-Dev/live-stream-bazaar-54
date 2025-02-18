
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Modified chunked base64 conversion
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 1024;
  
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, Math.min(i + chunkSize, bytes.length));
    for (let j = 0; j < chunk.length; j++) {
      binary += String.fromCharCode(chunk[j]);
    }
  }
  
  return btoa(binary);
}

serve(async (req) => {
  try {
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    // Parse request body once at the beginning
    let requestBody;
    try {
      const text = await req.text();
      requestBody = JSON.parse(text);
      console.log('Request body parsed:', { action: requestBody.action });
    } catch (e) {
      console.error('Error parsing request body:', e);
      throw new Error('Invalid JSON in request body');
    }

    const { action, webinarId, text, question, audio } = requestBody;

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        }
      }
    )

    // Handle save transcript action
    if (action === 'save_transcript') {
      if (!webinarId || !text) {
        throw new Error('webinarId y text son requeridos');
      }

      console.log('Saving transcript for webinar:', webinarId);
      
      const { data: existingData, error: existingError } = await supabaseClient
        .from('webinar_transcriptions')
        .select('*')
        .eq('webinar_id', webinarId)
        .maybeSingle();

      if (existingError) throw existingError;

      let result;
      if (existingData) {
        const newTranscript = existingData.transcript + " " + text;
        const { error: updateError } = await supabaseClient
          .from('webinar_transcriptions')
          .update({ 
            transcript: newTranscript,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingData.id);

        if (updateError) throw updateError;
        result = { id: existingData.id, transcript: newTranscript };
      } else {
        const { data: insertData, error: insertError } = await supabaseClient
          .from('webinar_transcriptions')
          .insert({
            webinar_id: webinarId,
            transcript: text,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (insertError) throw insertError;
        result = insertData;
      }

      return new Response(
        JSON.stringify({ success: true, data: result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle ask question action
    if (action === 'ask_question') {
      const { data: transcription, error: transcriptionError } = await supabaseClient
        .from('webinar_transcriptions')
        .select('transcript')
        .eq('webinar_id', webinarId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (transcriptionError) throw transcriptionError;
      if (!transcription) throw new Error('No hay transcripción disponible');

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

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error:', errorText);
        throw new Error('Error al generar respuesta');
      }

      const data = await response.json();
      if (!data.choices?.[0]?.message?.content) {
        throw new Error('No se pudo generar una respuesta');
      }

      return new Response(
        JSON.stringify({ answer: data.choices[0].message.content }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle audio transcription action
    if (action === 'transcribe_audio') {
      if (!audio || typeof audio !== 'string' || audio.trim() === '') {
        console.error('Invalid audio data:', { 
          hasAudio: !!audio, 
          type: typeof audio,
          length: audio ? audio.length : 0 
        });
        return new Response(
          JSON.stringify({ 
            error: 'No audio data provided',
            details: 'Audio data is missing or invalid'
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      try {
        // Convert base64 to binary
        const binary = atob(audio);
        const array = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          array[i] = binary.charCodeAt(i);
        }

        // Prepare form data for Whisper API
        const formData = new FormData();
        const audioBlob = new Blob([array], { type: 'audio/webm' });
        formData.append('file', audioBlob, 'audio.webm');
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
          const errorText = await response.text();
          console.error('Whisper API error:', errorText);
          throw new Error(`Error en la transcripción: ${errorText}`);
        }

        const result = await response.json();
        console.log('Transcription successful:', result);

        return new Response(
          JSON.stringify({ text: result.text }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Error processing audio:', error);
        return new Response(
          JSON.stringify({ 
            error: 'Error processing audio',
            details: error.message
          }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    throw new Error('Invalid action');
  } catch (error) {
    console.error('Error in edge function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error',
        details: error.toString()
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
