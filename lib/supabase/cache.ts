import { createClient } from "@/lib/supabase/server"

export async function getCachedData<T>(key: string): Promise<T | null> {
  const supabase = await createClient()

  const { data, error } = await supabase.from("api_cache").select("data, expires_at").eq("cache_key", key).single()

  if (error || !data) {
    console.log(`[v0] Cache miss for key: ${key}`)
    return null
  }

  // Check if expired
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    console.log(`[v0] Cache expired for key: ${key}`)
    return null
  }

  console.log(`[v0] Cache hit for key: ${key}`)
  return data.data as T
}

export async function setCachedData<T>(key: string, value: T, expiresInSeconds: number): Promise<void> {
  const supabase = await createClient()

  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000)

  const { error } = await supabase.from("api_cache").upsert(
    {
      cache_key: key,
      data: value as any,
      updated_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    },
    {
      onConflict: "cache_key",
    },
  )

  if (error) {
    console.error(`[v0] Error setting cache for key ${key}:`, error.message)
  } else {
    console.log(`[v0] Cached data for key: ${key}, expires at: ${expiresAt.toISOString()}`)
  }
}
