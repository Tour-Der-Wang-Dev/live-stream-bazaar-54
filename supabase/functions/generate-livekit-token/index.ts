
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

    // Verificar credenciales primero
    const apiKey = Deno.env.get('LIVEKIT_API_KEY');
    const apiSecret = Deno.env.get('LIVEKIT_API_SECRET');

    if (!apiKey || !apiSecret) {
      throw new Error('LiveKit credentials not configured');
    }

    // Parsear el body
    const body = await req.json();
    console.log('Request body:', JSON.stringify(body, null, 2));

    const { roomName, participantName } = body;
    
    if (!roomName || !participantName) {
      throw new Error('Room name and participant name are required');
    }

    // Crear token - versión simplificada
    console.log('Creating token for:', participantName, 'in room:', roomName);
    const at = new AccessToken(apiKey, apiSecret);
    at.identity = participantName;
    at.name = participantName;
    
    at.addGrant({ 
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true
    });

    const token = at.toJwt();
    console.log('Token generated');

    return new Response(
      JSON.stringify({ token }),
      { 
        headers: corsHeaders,
        status: 200 
      }
    );

  } catch (error) {
    console.error('Function error:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message
      }),
      {
        headers: corsHeaders,
        status: 500
      }
    );
  }
});
