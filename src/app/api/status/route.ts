import { NextResponse } from 'next/server';
import { connectionFlags } from '@/lib/server-env';
export const dynamic='force-dynamic';
export async function GET(){return NextResponse.json(connectionFlags(),{headers:{'Cache-Control':'no-store'}});}
