import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'ROTA | Smart Crop Rotation Advisor', description: 'Uganda-aware crop rotation decision support for smallholder farmers.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
