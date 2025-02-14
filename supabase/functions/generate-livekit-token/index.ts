
import { serve } from "https://deno.fresh.dev/std@v9.6.2/http/server.ts";

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
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  try {
    // Log request details for debugging
    const url = new URL(req.url);
    console.log('Request received from:', req.headers.get('origin'));
    console.log('Request path:', url.pathname);
    console.log('Request method:', req.method);

    // Basic function verification
    return new Response(
      JSON.stringify({ 
        message: "Function is working",
        // Include some debug info in response
        debug: {
          origin: req.headers.get('origin'),
          path: url.pathname,
          method: req.method
        }
      }),
      { 
        headers: corsHeaders,
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        // Include debug info even in error response
        debug: {
          origin: req.headers.get('origin'),
          method: req.method
        }
      }),
      { 
        headers: corsHeaders,
        status: 500
      }
    );
  }
});
