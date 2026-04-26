import type { SupabaseClient } from '@supabase/supabase-js'

export async function listTasksForUser(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, categories(*), sub_tasks(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return data ?? []
}

export async function deleteTaskForUser(supabase: SupabaseClient, userId: string, taskId: string) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .eq('user_id', userId)

  if (error) {
    throw error
  }
}

export async function getTaskWithRelationsForUser(
  supabase: SupabaseClient,
  userId: string,
  taskId: string
) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, categories(*), sub_tasks(*)')
    .eq('id', taskId)
    .eq('user_id', userId)
    .single()

  if (error) {
    throw error
  }

  return data
}
