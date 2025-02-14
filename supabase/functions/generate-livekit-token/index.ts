
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { AccessToken } from "https://esm.sh/livekit-server-sdk@1.2.8"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Content-Type': 'application/json'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Function started');

    const apiKey = Deno.env.get('LIVEKIT_API_KEY');
    const apiSecret = Deno.env.get('LIVEKIT_API_SECRET');

    if (!apiKey || !apiSecret) {
      console.error('LiveKit credentials missing');
      throw new Error('LiveKit credentials not configured');
    }

    let body;
    try {
      body = await req.json();
      console.log('Request body:', JSON.stringify(body, null, 2));
    } catch (e) {
      console.error('Error parsing request body:', e);
      throw new Error('Invalid JSON in request body');
    }

    const { roomName, participantName } = body;
    
    if (!roomName || !participantName) {
      throw new Error('Room name and participant name are required');
    }

    console.log(`Processing request for room: ${roomName}, participant: ${participantName}`);

    // Create a new token
    try {
      console.log('Creating AccessToken instance');
      const at = new AccessToken(apiKey, apiSecret, participantName);

      console.log('Adding grant to token');
      at.addGrant({ 
        roomJoin: true,
        room: roomName,
        canPublish: true,
        canSubscribe: true
      });

      console.log('Generating JWT');
      const token = at.toJwt();
      console.log('Token generated successfully:', token.substring(0, 20) + '...');

      return new Response(
        JSON.stringify({ token }),
        { 
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          status: 200 
        }
      );
    } catch (e) {
      console.error('Error in token generation:', e);
      throw new Error(`Token generation failed: ${e.message}`);
    }
  } catch (error) {
    console.error('Function error:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.toString()
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 500
      }
    );
  }
});
