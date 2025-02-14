
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Importamos AccessToken desde una URL más simple y estable
import { AccessToken } from "https://esm.sh/livekit-server-sdk"

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
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Function started');
    
    // Log environment variables (without values)
    const envVars = Object.keys(Deno.env.toObject());
    console.log('Available environment variables:', envVars);

    // Validate request body
    let body;
    try {
      body = await req.json();
      console.log('Request body received:', JSON.stringify(body));
    } catch (e) {
      console.error('Error parsing request body:', e);
      throw new Error('Invalid JSON in request body');
    }

    const { roomName, participantName } = body;
    
    if (!roomName || !participantName) {
      throw new Error('Room name and participant name are required');
    }

    console.log(`Processing request for room: ${roomName}, participant: ${participantName}`);

    // Get LiveKit credentials
    const apiKey = Deno.env.get('LIVEKIT_API_KEY');
    const apiSecret = Deno.env.get('LIVEKIT_API_SECRET');

    if (!apiKey || !apiSecret) {
      console.error('LiveKit credentials not found');
      throw new Error('LiveKit credentials not configured');
    }

    console.log('LiveKit credentials found');

    try {
      // Create access token
      const at = new AccessToken(apiKey, apiSecret, {
        identity: participantName
      });

      at.addGrant({ 
        room: roomName,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true
      });

      const token = at.toJwt();
      console.log('Token generated successfully');

      return new Response(
        JSON.stringify({ token }),
        { 
          headers: corsHeaders,
          status: 200 
        }
      );
    } catch (e) {
      console.error('Error generating token:', e);
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
        headers: corsHeaders,
        status: 500
      }
    );
  }
});
