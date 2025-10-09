// Vercel Serverless Function: /api/aggregate
// Aggregates items from (a) Newsdata.io, (b) RSS feeds, and (c) Instagram Graph API (Business Discovery).
// Environment variables to set in Vercel Project Settings → Environment Variables:
//   NEWSDATA_API_KEY         (optional)
//   RSS_URLS                 (optional, comma-separated)
//   IG_ACCESS_TOKEN          (optional; requires app review & business account)
//   IG_BUSINESS_ACCOUNT_ID   (optional; your IG business account id for Business Discovery)
//   IG_USERNAMES             (optional; comma-separated target IG usernames that are Business/Creator)
//
// NOTE: Instagram data access is subject to Meta's policies and permissions. Use official APIs only.

import Parser from 'rss-parser';

const parser = new Parser();

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const lang = url.searchParams.get("lang") || "en";
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);
    const wantNewsdata = url.searchParams.get("newsdata") !== "0";
    const wantRSS = url.searchParams.get("rss") !== "0";
    const wantIG = url.searchParams.get("ig") !== "0";

    const tasks = [];

    if (wantNewsdata && process.env.NEWSDATA_API_KEY) {
      tasks.push(fetchNewsdata(lang, limit));
    }
    if (wantRSS && process.env.RSS_URLS) {
      tasks.push(fetchAllRSS(process.env.RSS_URLS.split(',').map(s => s.trim()).filter(Boolean), limit));
    }
    if (wantIG && process.env.IG_ACCESS_TOKEN && process.env.IG_BUSINESS_ACCOUNT_ID && process.env.IG_USERNAMES) {
      tasks.push(fetchInstagram(process.env.IG_BUSINESS_ACCOUNT_ID, process.env.IG_USERNAMES.split(',').map(s => s.trim()).filter(Boolean), process.env.IG_ACCESS_TOKEN, limit));
    }

    const results = await Promise.allSettled(tasks);
    const items = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);

    // Sort by timestamp desc
    items.sort((a, b) => (new Date(b.ts).getTime() || 0) - (new Date(a.ts).getTime() || 0));

    // Limit total items
    const out = items.slice(0, limit);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(200).send(JSON.stringify(out));
  } catch (err) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).send(String(err?.message || err));
  }
}

async function fetchNewsdata(lang, limit) {
  const base = 'https://newsdata.io/api/1/news';
  const q = new URLSearchParams({
    apikey: process.env.NEWSDATA_API_KEY,
    language: lang,
    // Blend politics + business + world
    category: 'politics,world,business',
    size: String(Math.min(limit, 50))
  });
  const url = `${base}?${q.toString()}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error('newsdata.io error ' + r.status);
  const data = await r.json();
  const results = data.results || [];
  return results.map(x => ({
    title: x.title || 'Untitled',
    url: x.link || x.url || '#',
    source: x.source_id || domainFromUrl(x.link || x.url) || 'newsdata',
    ts: x.pubDate || x.pub_date || x.date || new Date().toISOString(),
    type: 'news'
  }));
}

async function fetchAllRSS(urls, limit) {
  const tasks = urls.map(async (u) => {
    try {
      const feed = await parser.parseURL(u);
      const source = feed?.title || domainFromUrl(u) || 'rss';
      return (feed.items || []).slice(0, Math.ceil(limit / urls.length) + 2).map(it => ({
        title: it.title || 'Untitled',
        url: it.link || '#',
        source,
        ts: it.isoDate || it.pubDate || new Date().toISOString(),
        type: 'rss'
      }));
    } catch (e) {
      return [];
    }
  });
  const arr = await Promise.all(tasks);
  return arr.flat();
}

async function fetchInstagram(businessAccountId, usernames, accessToken, limit) {
  // Business Discovery: requires the target account to be Business/Creator and your app to have permissions.
  // We request a few latest media from each username.
  const items = [];
  for (const username of usernames) {
    const fields = `business_discovery.username(${username}){name,username,media.limit(5){caption,permalink,timestamp,media_type,media_url}}`;
    const url = `https://graph.facebook.com/v20.0/${businessAccountId}?fields=${encodeURIComponent(fields)}&access_token=${encodeURIComponent(accessToken)}`;
    const r = await fetch(url);
    if (!r.ok) { continue; }
    const data = await r.json();
    const bd = data?.business_discovery;
    const src = bd?.username || username;
    const media = bd?.media?.data || [];
    for (const m of media) {
      if (!m?.permalink) continue;
      items.push({
        title: trimCaption(m.caption) || `[Instagram] ${src}`,
        url: m.permalink,
        source: `Instagram • ${src}`,
        ts: m.timestamp || new Date().toISOString(),
        type: 'instagram'
      });
    }
  }
  // keep up to limit
  return items.slice(0, limit);
}

function trimCaption(caption) {
  if (!caption) return '';
  const s = caption.replace(/\s+/g, ' ').trim();
  return s.length > 140 ? s.slice(0, 137) + '…' : s;
}

function domainFromUrl(u) {
  try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; }
}