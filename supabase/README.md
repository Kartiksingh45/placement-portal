# Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Copy the project URL and anon key (Project Settings → API) into `.env` at the repo root:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=xxxx
   ```
3. Run `migrations/0001_init.sql` against the project — either paste it into the SQL editor in the
   Supabase dashboard, or, if you have the Supabase CLI linked to the project, run:
   ```
   supabase db push
   ```
4. Email confirmation is on by default for new Supabase projects. For local testing you can turn it
   off under Authentication → Providers → Email → "Confirm email", so signup logs the user in
   immediately instead of waiting on a confirmation email.
