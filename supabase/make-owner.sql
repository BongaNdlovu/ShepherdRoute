-- Run this after you sign up in the app if you want your login to access
-- the ShepherdRoute owner admin dashboard at /admin.
--
-- Replace the email below with the email you used on /signup.

insert into public.app_admins (user_id)
select id
from auth.users
where email = 'your-email@example.com'
on conflict (user_id) do nothing;
