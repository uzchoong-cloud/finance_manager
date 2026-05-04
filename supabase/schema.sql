-- ============================================================
-- Finance Manager — Supabase Schema
-- Run this entire file in Supabase SQL Editor (once)
-- ============================================================

-- ── Profiles (extends auth.users) ───────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id      uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username text UNIQUE NOT NULL,
  role    text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own profile read"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Own profile update"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ── Auto-create profile on signup ───────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, username, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Transactions ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.transactions (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type        text NOT NULL CHECK (type IN ('income', 'expense')),
  amount      numeric(15,2) NOT NULL CHECK (amount > 0),
  category    text NOT NULL,
  description text NOT NULL,
  date        date NOT NULL,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own transactions"
  ON public.transactions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Stock Holdings ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.stock_holdings (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ticker                text NOT NULL,
  name                  text NOT NULL,
  shares                numeric(20,6) NOT NULL CHECK (shares > 0),
  average_cost_per_share numeric(15,6) NOT NULL CHECK (average_cost_per_share > 0),
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now(),
  UNIQUE(user_id, ticker)
);

ALTER TABLE public.stock_holdings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own holdings"
  ON public.stock_holdings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Stock Transactions ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.stock_transactions (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  holding_id      uuid REFERENCES public.stock_holdings(id) ON DELETE CASCADE NOT NULL,
  ticker          text NOT NULL,
  type            text NOT NULL CHECK (type IN ('buy', 'sell')),
  shares          numeric(20,6) NOT NULL CHECK (shares > 0),
  price_per_share numeric(15,6) NOT NULL CHECK (price_per_share > 0),
  date            date NOT NULL,
  notes           text,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE public.stock_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own stock transactions"
  ON public.stock_transactions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Categories ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.categories (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  key         text NOT NULL,
  label       text NOT NULL,
  color       text NOT NULL DEFAULT '#64748b',
  sort_order  int  NOT NULL DEFAULT 0,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(user_id, key)
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own categories"
  ON public.categories FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
