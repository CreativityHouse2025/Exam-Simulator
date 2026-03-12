import { withErrorHandler } from "../_lib/middleware/withErrorHandler.js";
import { supabaseClient } from "../_lib/supabaseClient.js";
import { successResponse } from "../_lib/utils/response.js";

export const GET = withErrorHandler(async (request: Request) => {
  const data = (await supabaseClient.from('testing').select()).data;
  return successResponse(data);
});