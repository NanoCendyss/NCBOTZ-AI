/*
# Create chat history tables (single-tenant, no sign-in)

1. New Tables
- `conversations`: one row per chat thread shown in the sidebar.
  - `id` (uuid, primary key)
  - `title` (text, not null, defaults to "Percakapan baru")
  - `created_at` (timestamptz)
- `messages`: every user and assistant message inside a conversation.
  - `id` (uuid, primary key)
  - `conversation_id` (uuid, references conversations, deleted together with the conversation)
  - `role` (text, either 'user' or 'assistant')
  - `content` (text, not null)
  - `created_at` (timestamptz)

2. Security
- Row level security is enabled on both tables.
- The app has no sign-in screen, so requests run as the anonymous role. Both tables grant and allow SELECT, INSERT, UPDATE and DELETE to `anon` and `authenticated`.
- This is intentional for this version; anyone who has the app's public key can read these rows.

3. Notes
- Indexes on `messages.conversation_id` and `messages.created_at` keep conversation loading fast.
*/

CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'Percakapan baru',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON messages (conversation_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages (created_at);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON conversations TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON messages TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_conversations" ON conversations;
CREATE POLICY "anon_select_conversations" ON conversations FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_conversations" ON conversations;
CREATE POLICY "anon_insert_conversations" ON conversations FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_conversations" ON conversations;
CREATE POLICY "anon_update_conversations" ON conversations FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_conversations" ON conversations;
CREATE POLICY "anon_delete_conversations" ON conversations FOR DELETE
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_messages" ON messages;
CREATE POLICY "anon_select_messages" ON messages FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_messages" ON messages;
CREATE POLICY "anon_insert_messages" ON messages FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_messages" ON messages;
CREATE POLICY "anon_update_messages" ON messages FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_messages" ON messages;
CREATE POLICY "anon_delete_messages" ON messages FOR DELETE
TO anon, authenticated USING (true);
