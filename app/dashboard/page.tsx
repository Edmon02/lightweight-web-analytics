import { Suspense } from 'react';
import { cookies } from 'next/headers';
import Link from 'next/link';
import DashboardContent from './components/DashboardContent';
import LoginForm from './components/LoginForm';

// Check if user is authenticated
function isAuthenticated() {
  const cookieStore = cookies();
  return !!cookieStore.get('lwa_auth');
}

export default function DashboardPage() {
  const authenticated = isAuthenticated();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">
            Lightweight Web Analytics
          </h1>
          {authenticated && (
            <div className="flex space-x-4">
              <Link 
                href="/dashboard" 
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-900 hover:bg-gray-100"
              >
                Dashboard
              </Link>
              <Link 
                href="/dashboard/settings" 
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-900 hover:bg-gray-100"
              >
                Settings
              </Link>
            </div>
          )}
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {authenticated ? (
          <Suspense fallback={<div>Loading dashboard data...</div>}>
            <DashboardContent />
          </Suspense>
        ) : (
          <div className="bg-white shadow rounded-lg p-6 max-w-md mx-auto">
            <h2 className="text-lg font-medium mb-4">Login to Dashboard</h2>
            <LoginForm />
          </div>
        )}
      </main>
      
      <footer className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 border-t border-gray-200">
        <p className="text-center text-sm text-gray-500">
          Lightweight Web Analytics - A privacy-focused, self-hosted analytics solution
        </p>
      </footer>
    </div>
  );
}
