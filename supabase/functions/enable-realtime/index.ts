
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    // Get the Supabase URL and key from environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
    
    // Create a Supabase client with the service role key
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Get the table name from the request body
    const { tableName } = await req.json()
    
    if (!tableName) {
      throw new Error('Table name is required')
    }
    
    // Execute SQL directly to enable realtime on the specified table
    const { error: alterPublicationError } = await supabase
      .from('_exec_sql')
      .select('*')
      .eq('query', `ALTER PUBLICATION supabase_realtime ADD TABLE ${tableName}`)
      .single()
    
    if (alterPublicationError) {
      throw new Error(`Failed to add table to publication: ${alterPublicationError.message}`)
    }
    
    // Set replica identity to full
    const { error: alterTableError } = await supabase
      .from('_exec_sql')
      .select('*')
      .eq('query', `ALTER TABLE ${tableName} REPLICA IDENTITY FULL`)
      .single()
    
    if (alterTableError) {
      throw new Error(`Failed to set replica identity: ${alterTableError.message}`)
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Realtime enabled for ${tableName} table` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in enable-realtime function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
