-- ==========================================
-- SCRIPT FULL SETUP DATABASE: ICE CREAM POS
-- ==========================================

-- 1. Hapus Tabel Lama jika ada (Mereset database agar fresh)
DROP TABLE IF EXISTS public.transaction_items CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. Mengaktifkan ekstensi crypto untuk pembuatan Hash Password
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 3. Membuat Tabel Struktur
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES auth.users(id),
  total_amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'qris')),
  status TEXT DEFAULT 'completed',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL,
  price_at_time NUMERIC NOT NULL
);

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'staff', 'user')) DEFAULT 'user',
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Trigger Role & Nama Profil Mendaftar
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, name)
  VALUES (
    NEW.id,
    CASE WHEN NEW.email ILIKE '%admin%' THEN 'admin' ELSE 'user' END,
    NEW.raw_user_meta_data->>'name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. By-pass Security Sementara
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 6. Insert Mock Data: Es Krim
INSERT INTO public.products (name, price, image_url) VALUES 
('Cone Coklat Klasik', 15000, 'https://images.unsplash.com/photo-1557142046-c704a3adf8ac?w=500&q=80'),
('Sundae Strawberry', 20000, 'https://images.unsplash.com/photo-1553177595-4de2bb0842b9?w=500&q=80'),
('Sorbet Mangga', 18000, 'https://images.unsplash.com/photo-1570197780862-2f3b9e49635b?w=500&q=80'),
('Matcha Float', 25000, 'https://images.unsplash.com/photo-1563805042-7684c8a9e9cb?w=500&q=80'),
('Es Krim Vanilla Oreo', 22000, 'https://images.unsplash.com/photo-1497034825429-22a92611a61c?w=500&q=80'),
('Popsicle Buah Naga', 12000, 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500&q=80');

-- 7. CLEANUP AKUN ERROR
-- Menghapus sisa akun manual yang membuat Supabase 500 Error
DELETE FROM auth.users WHERE email IN ('admin@ice.com', 'abdul@ice.com');

-- PENTING: Login untuk Admin dan Staff sekarang akan dibuat SECARA OTOMATIS 
-- melalui website aplikasi Next.js (Auto-Register) saat pertama kali login.
-- Jangan meng-insert manual ke tabel auth.users!
