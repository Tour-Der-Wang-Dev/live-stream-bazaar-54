
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { AccessToken } from 'https://esm.sh/v135/livekit-server-sdk@1.2.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Content-Type': 'application/json'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Log the incoming request for debugging
    console.log('Received request:', req.method, req.url);
    
    let body;
    try {
      body = await req.json();
      console.log('Request body:', body);
    } catch (e) {
      console.error('Error parsing request body:', e);
      throw new Error('Invalid JSON in request body');
    }

    const { roomName, participantName } = body;
    
    if (!roomName || !participantName) {
      throw new Error('Room name and participant name are required');
    }

    console.log(`Generating token for room: ${roomName}, participant: ${participantName}`);

    const apiKey = Deno.env.get('LIVEKIT_API_KEY');
    const apiSecret = Deno.env.get('LIVEKIT_API_SECRET');

    if (!apiKey || !apiSecret) {
      console.error('Missing LiveKit credentials');
      throw new Error('LiveKit credentials not configured');
    }

    console.log('Creating AccessToken...');
    
    try {
      // Create a new token
      const at = new AccessToken(apiKey, apiSecret, {
        identity: participantName,
        name: participantName,
      });

      // Grant appropriate permissions
      at.addGrant({
        room: roomName,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
      });

      // Generate the JWT token
      const token = at.toJwt();
      console.log('Token generated successfully');

      return new Response(
        JSON.stringify({
          token: token
        }),
        {
          headers: corsHeaders,
          status: 200,
        },
      )
    } catch (e) {
      console.error('Error generating token:', e);
      throw new Error(`Failed to generate token: ${e.message}`);
    }
  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      {
        headers: corsHeaders,
        status: 500,
      },
    )
  }
});
