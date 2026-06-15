-- Buat bucket penyimpanan baru bernama "dokumen"
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'dokumen', 
  'dokumen', 
  true, 
  52428800, -- 50MB
  array['image/png', 'image/jpeg', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- Atur kebijakan (policies) untuk bucket "dokumen"

-- Izinkan publik untuk melihat/mengunduh file (karena public=true, tapi tetap butuh policy SELECT)
create policy "Izinkan akses publik ke dokumen" 
on storage.objects for select 
using ( bucket_id = 'dokumen' );

-- Izinkan pengguna terautentikasi untuk mengunggah file baru
create policy "Izinkan pengguna terautentikasi unggah dokumen" 
on storage.objects for insert 
to authenticated
with check ( bucket_id = 'dokumen' );

-- Izinkan pengguna terautentikasi untuk memperbarui file mereka (jika ada)
create policy "Izinkan pengguna terautentikasi perbarui dokumen" 
on storage.objects for update 
to authenticated
using ( bucket_id = 'dokumen' );

-- Izinkan pengguna terautentikasi untuk menghapus file mereka
create policy "Izinkan pengguna terautentikasi hapus dokumen" 
on storage.objects for delete
to authenticated
using ( bucket_id = 'dokumen' );
