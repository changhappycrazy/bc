// 這個檔案只有 route.ts 在用
// 實際資料來源是 Supabase（由 sync-cafenomad.ts 定期同步）
 
export interface NomadCafe {
  id: string;
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  wifi: number;
  seat: number;
  quiet: number;
  tasty: number;
  cheap: number;
  socket: 'yes' | 'maybe' | 'no' | '';
  limited_time: 'yes' | 'maybe' | 'no' | '';
  open_time: string;
  mrt: string;
  url: string;
  tags: string[];
}
 
function generateTags(cafe: any): string[] {
  const tags: string[] = [];
  if (cafe.quiet >= 4)            tags.push('安靜');
  if (cafe.wifi >= 4)             tags.push('免費WiFi');
  if (cafe.seat >= 4)             tags.push('通常有位');
  if (cafe.cheap >= 4)            tags.push('價格親民');
  if (cafe.socket === 'yes')      tags.push('有插座');
  if (cafe.socket === 'maybe')    tags.push('部分插座');
  if (cafe.limited_time === 'no') tags.push('不限時');
  if (cafe.mrt?.trim())           tags.push('近捷運站');
  if (cafe.tasty >= 4.5)          tags.push('精品咖啡');
  return tags;
}
 
export async function getBanqiaoCafes(): Promise<NomadCafe[]> {
  const res = await fetch('https://cafenomad.tw/api/v1.2/cafes/taipei', {
    next: { revalidate: 86400 }
  });
  const cafes = await res.json();
 
  return cafes
    .filter((c: any) => c.address?.includes('板橋'))
    .map((c: any) => ({ ...c, tags: generateTags(c) }));
}
 