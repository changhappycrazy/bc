import { getBanqiaoCafes } from '@/utils/supabase/cafenomad';

export async function GET() {
  const cafes = await getBanqiaoCafes();
  return Response.json(cafes);
}