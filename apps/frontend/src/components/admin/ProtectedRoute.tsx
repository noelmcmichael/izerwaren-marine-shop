'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import AdminLayout from './AdminLayout';
import { useAuth } from './AuthProvider';
import { config } from '@/lib/config';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, getIdToken } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      // Development mode bypass
      if (
        config.environment === 'development' &&
        config.firebase.devMode
      ) {
        setIsAuthorized(true);
        setAuthLoading(false);
        return;
      }

      if (loading) return;

      if (!user) {
        router.push('/admin/login');
        return;
      }

      try {
        // Get ID token and verify admin privileges
        const token = await getIdToken();
        if (!token) {
          router.push('/admin/login');
          return;
        }

        // Check admin privileges with backend
        const response = await fetch('/api/admin/auth/verify', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          setIsAuthorized(true);
        } else {
          console.error('Admin verification failed');
          router.push('/admin/login?error=unauthorized');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/admin/login?error=auth_failed');
      } finally {
        setAuthLoading(false);
      }
    }

    checkAuth();
  }, [user, loading, getIdToken, router]);

  if (loading || authLoading) {
    return (
      <div className='min-h-screen bg-gray-100 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className='min-h-screen bg-gray-100 flex items-center justify-center'>
        <div className='text-center'>
          <p className='text-gray-600'>Redirecting...</p>
        </div>
      </div>
    );
  }

  return <AdminLayout>{children}</AdminLayout>;
}
