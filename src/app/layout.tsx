import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'미팅노트 | 고객 미팅 워크스페이스',description:'회의록과 제안서를 하나의 흐름으로 관리합니다.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ko"><body>{children}</body></html>}
