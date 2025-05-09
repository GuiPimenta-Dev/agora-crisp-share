
import { supabase } from "@/integrations/supabase/client";

/**
 * Configure a table for realtime updates
 * This is just a utility function to help with debugging realtime issues
 * It calls the enable-realtime edge function
 */
export async function enableRealtimeForTable(tableName: string): Promise<boolean> {
  try {
    // Call the edge function to enable realtime for the given table
    const { error } = await supabase.functions.invoke('enable-realtime', {
      body: { tableName }
    });
    
    if (error) {
      console.error(`Failed to enable realtime for ${tableName}:`, error);
      return false;
    }
    
    console.log(`Successfully enabled realtime for ${tableName}`);
    return true;
  } catch (err) {
    console.error(`Error enabling realtime for ${tableName}:`, err);
    return false;
  }
}

/**
 * Create a unique channel name for a given context
 */
export function generateRealtimeChannelName(context: string, id?: string): string {
  return `${context}-${id || 'global'}-${Date.now()}`;
}
