import { unstable_cache } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import type { NewsItem } from "@/lib/content/catalog";
import { PUBLIC_REVALIDATE_SECONDS } from "@/lib/content/public-cache";
import { mapNews, newsDetailColumns, newsListColumns } from "@/lib/content/remote";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createPublicSupabase } from "@/lib/supabase/server";

async function fetchPublicNews(): Promise<NewsItem[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = createPublicSupabase();
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("news")
      .select(newsListColumns)
      .eq("status", "published")
      .order("published_at", { ascending: false });
    if (error || !data) return [];
    return data.map((row) => mapNews(row as Record<string, unknown>));
  } catch (error) {
    unstable_rethrow(error);
    return [];
  }
}

export const loadPublicNews = unstable_cache(fetchPublicNews, ["public-news"], {
  revalidate: PUBLIC_REVALIDATE_SECONDS,
  tags: ["public-news"],
});

async function fetchPublicNewsItem(slug: string): Promise<NewsItem | null> {
  if (!isSupabaseConfigured() || !slug) return null;
  try {
    const supabase = createPublicSupabase();
    if (!supabase) return null;
    const { data, error } = await supabase
      .from("news")
      .select(newsDetailColumns)
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (error || !data) return null;
    return mapNews(data as Record<string, unknown>);
  } catch (error) {
    unstable_rethrow(error);
    return null;
  }
}

export const loadPublicNewsItem = unstable_cache(fetchPublicNewsItem, ["public-news-item"], {
  revalidate: PUBLIC_REVALIDATE_SECONDS,
  tags: ["public-news"],
});
