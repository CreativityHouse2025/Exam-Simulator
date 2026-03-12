import { supabaseClient } from "../_lib/supabaseClient.js";

export async function GET(request: Request) {
  const output = await supabaseClient.from('testing').select()
  return new Response(
    JSON.stringify({ message: output }),
    {
      headers: { "content-type": "application/json" }
    }
  );
}