
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

console.log("Hello from Functions!");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Content-Type': 'application/json'
};

serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Log the method and URL for debugging
    console.log(`Method: ${req.method}`);
    console.log(`URL: ${req.url}`);
    console.log('Headers:', JSON.stringify(Object.fromEntries(req.headers.entries()), null, 2));

    return new Response(
      JSON.stringify({
        message: "Success from generate-livekit-token function",
        timestamp: new Date().toISOString(),
        token: "test-token"
      }),
      {
        headers: corsHeaders,
        status: 200,
      },
    )
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: corsHeaders,
        status: 500,
      },
    )
  }
});
