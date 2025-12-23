import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://geharakoaoyjmfjvfrwx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlaGFyYWtvYW95am1manZmcnd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzNzQ0NzMsImV4cCI6MjA4MTk1MDQ3M30.nI50_EAhya7bp92vg_uSmvCGSbpfYIFkWQSKW-2c-tQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
