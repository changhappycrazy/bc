import { createClient } from '@supabase/supabase-js';
 
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
 
async function sync() {
  // 板橋在 Cafenomad 被歸類在 taipei 城市下
  const res = await fetch('https://cafenomad.tw/api/v1.2/cafes/taipei');
  const nomadCafes = await res.json();
  const banqiao = nomadCafes.filter((c: any) => c.address?.includes('板橋'));
 
  console.log(`Cafenomad 板橋共 ${banqiao.length} 筆`);
 
  const { data: myCafes } = await supabase.from('cafes').select('id, name, address, tags');
  console.log(`我的資料庫共 ${myCafes?.length} 筆`);
 
  for (const mine of myCafes || []) {
    const myAddr = mine.address?.slice(0, 5) || '';
 
    const match = banqiao.find((n: any) => {
      if (myAddr && n.address?.includes(myAddr)) return true;
      const myKey = mine.name.replace(/[a-zA-Z\s.!]/g, '').slice(0, 2);
      if (myKey && n.name?.includes(myKey)) return true;
      return false;
    });
 
    if (!match) {
      console.log(`❌ 找不到對應：${mine.name}`);
      continue;
    }
 
    // 保留原有 tags，加入新的
    const newTags = new Set<string>(mine.tags || []);
 
    if (match.mrt?.trim())           newTags.add('近捷運站');
    if (match.socket === 'yes')      {} // 用 has_outlet 欄位處理，不放 tags
    if (match.tasty >= 4.5)          newTags.add('精品咖啡');
    // 手沖咖啡 Cafenomad API 沒有直接欄位，跳過，需手動補
 
    await supabase.from('cafes').update({
      has_outlet: match.socket === 'yes',
      is_no_time_limit: match.limited_time === 'no',
      hours: match.open_time || null,
      tags: Array.from(newTags),
    }).eq('id', mine.id);
 
    console.log(`✅ 更新：${mine.name} ← ${match.name} | tags: ${Array.from(newTags).join(', ')}`);
  }
 
  console.log('同步完成！');
}
 
sync();
 