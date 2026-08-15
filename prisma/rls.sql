-- Optional. Do not run this if the app uses Prisma with the database password
-- (the postgres role bypasses RLS). Enable only after switching to Supabase Auth
-- with the anon key from the browser.
alter table "Profile" enable row level security;
alter table "Court" enable row level security;
alter table "TimeSlot" enable row level security;
alter table "Booking" enable row level security;
alter table "Payment" enable row level security;
alter table "ClubSettings" enable row level security;

create policy "public read courts" on "Court" for select using (true);
create policy "public read slots" on "TimeSlot" for select using (true);

create policy "own profile" on "Profile" for select using (auth.uid() = id);
create policy "own bookings" on "Booking" for select using (auth.uid() = "userId");
create policy "insert own bookings" on "Booking" for insert with check (auth.uid() = "userId");
create policy "update own bookings" on "Booking" for update using (auth.uid() = "userId");

create policy "admin all profile" on "Profile" for all using (
  exists (select 1 from "Profile" p where p.id = auth.uid() and p.role = 'ADMIN')
);
create policy "admin all booking" on "Booking" for all using (
  exists (select 1 from "Profile" p where p.id = auth.uid() and p.role = 'ADMIN')
);
create policy "admin all court" on "Court" for all using (
  exists (select 1 from "Profile" p where p.id = auth.uid() and p.role = 'ADMIN')
);
create policy "admin all slot" on "TimeSlot" for all using (
  exists (select 1 from "Profile" p where p.id = auth.uid() and p.role = 'ADMIN')
);
