import { createClient } from "@supabase/supabase-js";
import { drizzle } from "drizzle-orm/supabase";
import * as schema from "./schema";

// Create Supabase client with service role key for server-side operations
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Create drizzle instance
export const db = drizzle(supabase, { schema });

export * from "./schema";
