import { googleMerchantFeed } from '@/lib/google-merchant-feed';
import { getLiveProducts } from '@/lib/live-products';

export const dynamic = 'force-dynamic';

export async function GET() {
  const products = await getLiveProducts();
  return new Response(googleMerchantFeed(products), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=300',
    },
  });
}
