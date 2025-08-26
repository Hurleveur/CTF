-- Add unique constraint to ensure one project per user
ALTER TABLE public.user_projects 
ADD CONSTRAINT user_projects_one_per_user UNIQUE (user_id);
