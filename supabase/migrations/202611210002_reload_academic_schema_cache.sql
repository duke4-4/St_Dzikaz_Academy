-- Make newly migrated academic tables visible to Supabase's PostgREST API.
notify pgrst, 'reload schema';
