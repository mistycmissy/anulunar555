-- Soleyra Veyra Release A - Database schema (Supabase Postgres)
-- Apply in Supabase SQL editor (or your migration runner).

-- pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Minimal users table.
-- If you are using Supabase Auth, you can set users.id = auth.users.id.
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User preferences (Soleyra tuning knobs)
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  tone_preference TEXT DEFAULT 'balanced',
  length_preference TEXT DEFAULT 'medium',
  astro_weight DOUBLE PRECISION DEFAULT 0.5,
  numerology_weight DOUBLE PRECISION DEFAULT 0.5,
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Spiritual profile (astro + numerology summary)
CREATE TABLE IF NOT EXISTS user_spiritual_profile (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  birth_date DATE NOT NULL,
  birth_time TIME,
  birth_place TEXT,
  sun_sign TEXT,
  moon_sign TEXT,
  rising_sign TEXT,
  dominant_element TEXT,
  dominant_mode TEXT,
  life_path INTEGER,
  expression_number INTEGER,
  soul_urge INTEGER,
  personality_number INTEGER,
  birthday_number INTEGER,
  personal_year INTEGER,
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Natal chart raw placements
CREATE TABLE IF NOT EXISTS astro_natal_raw (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  planet TEXT NOT NULL,
  sign TEXT NOT NULL,
  degree NUMERIC NOT NULL,
  house SMALLINT,
  retrograde BOOLEAN DEFAULT false
);

-- Key natal aspects
CREATE TABLE IF NOT EXISTS astro_aspects (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  planet_a TEXT NOT NULL,
  planet_b TEXT NOT NULL,
  aspect_type TEXT NOT NULL,
  orb NUMERIC NOT NULL
);

-- Conversation log
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'conversation_role') THEN
    CREATE TYPE conversation_role AS ENUM ('user', 'assistant');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS conversation_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL,
  role conversation_role NOT NULL,
  message_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sentiment TEXT
);

-- Conversation embeddings (vector memory)
CREATE TABLE IF NOT EXISTS conversation_embeddings (
  id BIGSERIAL PRIMARY KEY,
  conversation_log_id BIGINT NOT NULL REFERENCES conversation_log(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  embedding VECTOR(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback on assistant messages
CREATE TABLE IF NOT EXISTS message_feedback (
  id BIGSERIAL PRIMARY KEY,
  conversation_log_id BIGINT NOT NULL REFERENCES conversation_log(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_conversation_log_user_conv_created
  ON conversation_log(user_id, conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_embeddings_user_created
  ON conversation_embeddings(user_id, created_at DESC);

-- IVFFlat index for vector similarity (create after you have data)
-- You can tune lists based on table size.
-- CREATE INDEX conversation_embeddings_embedding_ivfflat
--   ON conversation_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

