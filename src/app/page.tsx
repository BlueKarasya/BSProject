'use client';
import { useWorkspace } from '@/lib/use-workspace';
import { Workspace } from '@/components/workspace';
export default function Page(){const w=useWorkspace();if(!w.hydrated)return <main className="loading-page">워크스페이스를 준비하고 있습니다…</main>;return <Workspace {...w}/>;}
