// scripts/seed-from-csv.ts
// 執行：npx tsx scripts/seed-from-csv.ts

import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://pebefzfioeqxxszlrruv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlYmVmemZpb2VxeHhzemxycnV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczOTQ3ODUsImV4cCI6MjA5Mjk3MDc4NX0.D0WS9J4kYetchE7qv6XwUyAulIP6rBQh6W9peGiaqgQ';

function extractCoords(url: string) {
  const m = url?.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (!m) return null;
  return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
}

function extractPlaceId(url: string) {
  const m = url?.match(/!19s(ChIJ[^?&!]+)/);
  return m ? m[1] : null;
}

function cleanName(raw: string) {
  return raw.split('｜')[0].split('|')[0].trim();
}

function cleanReviews(val: string) {
  if (!val) return null;
  const n = parseInt(val.replace(/[()（）,，\s]/g, ''));
  return isNaN(n) ? null : n;
}

function cleanRating(val: string) {
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

function cleanImage(val: string) {
  if (!val || val === 'nan') return null;
  return val.replace(/w\d+-h\d+/, 'w400-h300');
}

function cleanHours(val: string) {
  if (!val) return null;
  return val.replace('· 開始營業時間：', '開始 ').replace('· 打烊時間：', '打烊 ').trim();
}

function parseCSV(filepath: string): Record<string, string>[] {
  const content = fs.readFileSync(filepath, 'utf-8');
  const lines = content.split('\n').filter(Boolean);
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map(line => {
    const cols: string[] = [];
    let inQuote = false, current = '';
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; continue; }
      if (ch === ',' && !inQuote) { cols.push(current); current = ''; continue; }
      current += ch;
    }
    cols.push(current);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = (cols[i] || '').trim(); });
    return row;
  });
}

async function main() {
  const csvPath = path.join(process.cwd(), 'scripts', 'google0503.csv');
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ 找不到 ${csvPath}`);
    console.error('請把 google0503.csv 放到 scripts/ 資料夾裡');
    process.exit(1);
  }

  console.log('📂 讀取 CSV...');
  const rows = parseCSV(csvPath);
  const seenIds = new Set<string>();
  const cafes: any[] = [];

  for (const r of rows) {
    const rawName = r['店名'];
    if (!rawName || rawName === 'nan') continue;
    const coords = extractCoords(r['導航'] || '');
    if (!coords) continue;
    const placeId = extractPlaceId(r['導航'] || '');
    if (placeId && seenIds.has(placeId)) continue;
    if (placeId) seenIds.add(placeId);

    const fullName = rawName.trim();
    cafes.push({
      name: cleanName(rawName),
      full_name: fullName,
      address: r['地址（完成）'] || null,
      lat: coords.lat,
      lng: coords.lng,
      rating: cleanRating(r['評分']),
      review_count: cleanReviews(r['評論數']),
      price_range: r['消費金額'] || null,
      hours: cleanHours(r['營業時間']),
      image_url: cleanImage(r['首圖']),
      google_maps_url: r['導航'] || null,
      place_id: placeId,
      delivery: r['ah5Ghc 3']?.trim() === '外送',
      tags: [],
      wifi: null,
      has_outlet: null,
      is_quiet: null,
      is_pet_friendly: (fullName.includes('寵物') || fullName.toLowerCase().includes('pet')) ? true : null,
      is_no_time_limit: fullName.includes('不限時') ? true : null,
      phone: null,
      website: null,
    });
  }

  console.log(`✅ 處理完成：${cafes.length} 筆`);
  console.log('\n📋 前 2 筆預覽：');
  cafes.slice(0, 2).forEach(c => console.log(JSON.stringify(c, null, 2)));

  console.log(`\n💾 寫入 Supabase...`);
  const res = await fetch(`${SUPABASE_URL}/rest/v1/cafes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Prefer': 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(cafes),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase 錯誤：${err}`);
  }

  console.log('🎉 全部完成！去 Supabase Table Editor 確認資料！');
}

main().catch(e => { console.error('❌', e); process.exit(1); });