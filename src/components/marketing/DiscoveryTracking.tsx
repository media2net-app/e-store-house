'use client';
import {useEffect} from 'react';
import {trackCommerce} from '@/lib/marketing';
export default function DiscoveryTracking({searched, count}: {searched:boolean; count:number}) {
 useEffect(() => { if(searched) trackCommerce(count ? 'search_results' : 'search_no_results', {result_count:count}); }, [searched,count]);
 return null;
}
