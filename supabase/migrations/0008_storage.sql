-- 0008_storage.sql
-- Storage buckets for merchant-uploaded imagery (deal photos, logos, covers).
-- Public read (images appear on public deal/business pages); authenticated write.

insert into storage.buckets (id, name, public)
values ('deal-images', 'deal-images', true)
on conflict (id) do nothing;

-- Public can read objects in this bucket.
create policy "deal-images public read"
  on storage.objects for select
  using (bucket_id = 'deal-images');

-- Any authenticated user (merchants) can upload/update/remove in this bucket.
-- Files are namespaced by business id in the path by the app; tightening this to
-- per-owner paths can come later.
create policy "deal-images authenticated insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'deal-images');

create policy "deal-images authenticated update"
  on storage.objects for update to authenticated
  using (bucket_id = 'deal-images');

create policy "deal-images authenticated delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'deal-images');
