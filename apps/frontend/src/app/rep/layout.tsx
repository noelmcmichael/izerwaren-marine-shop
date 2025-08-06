import AuthProvider from '@/components/admin/AuthProvider';

export default function RepRootLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
