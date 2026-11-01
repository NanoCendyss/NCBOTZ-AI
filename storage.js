import { createClient } from '@supabase/supabase-js'

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)

function unwrap({ data, error }) {
  if (error) throw new Error(error.message)
  return data
}

export async function listConversations() {
  return unwrap(
    await supabase
      .from('conversations')
      .select('id, title, created_at')
      .order('created_at', { ascending: false }),
  )
}

export async function createConversation(title) {
  return unwrap(
    await supabase
      .from('conversations')
      .insert({ title })
      .select('id, title, created_at')
      .single(),
  )
}

export async function deleteConversation(id) {
  unwrap(await supabase.from('conversations').delete().eq('id', id))
}

export async function listMessages(conversationId) {
  return unwrap(
    await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true }),
  )
}

export async function addMessage(conversationId, role, content) {
  unwrap(await supabase.from('messages').insert({ conversation_id: conversationId, role, content }))
}
