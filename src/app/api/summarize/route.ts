import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '60 s'),
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'anonymous';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: '1分間に送信できるのは5件までです。少し待ってからお試しください。' },
      { status: 429 }
    );
  }

  const { url } = await req.json();
  if (!url || !/^https?:\/\//.test(url)) {
    return NextResponse.json({ error: '有効なURLを入力してください' }, { status: 400 });
  }

  let title = '';
  let bodyText = '';

  try {
    const fetchRes = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LinkNoteBot/1.0)' },
      signal: AbortSignal.timeout(12000),
    });
    const html = await fetchRes.text();

    const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
    const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    title = ogTitle?.[1] ?? titleTag?.[1] ?? url;

    bodyText = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 4000);
  } catch {
    return NextResponse.json({ error: '記事の取得に失敗しました' }, { status: 422 });
  }

  const prompt = `以下の記事を読んで、JSON形式で返してください。
{
  "summary": ["1文目", "2文目", "3文目"],
  "tags": ["タグ1", "タグ2", "タグ3"]
}
タイトル: ${title}
本文: ${bodyText}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  });

  const parsed = JSON.parse(completion.choices[0].message.content ?? '{}');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from('articles')
    .insert({ url, title, summary: parsed.summary?.join('\n'), tags: parsed.tags })
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'DB保存に失敗しました' }, { status: 500 });

  return NextResponse.json(data);
}
