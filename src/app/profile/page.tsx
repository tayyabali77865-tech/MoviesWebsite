import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { User, Film } from 'lucide-react';

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/login?callbackUrl=/profile');

  const user = session.user;
  const isAdmin = (user as { role?: string }).role === 'admin';

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="min-h-screen pt-24 pb-12 px-4">
        <div className="max-w-xl mx-auto">
          <div className="bg-surface-800 rounded-xl border border-white/10 p-8">
            <div className="flex items-center gap-4 mb-6">
              {user.image ? (
                <img
                  src={user.image}
                  alt=""
                  className="w-20 h-20 rounded-full object-cover border-2 border-red-500/50"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-surface-600 flex items-center justify-center">
                  <User className="w-10 h-10 text-gray-500" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-white">{user.name || 'User'}</h1>
                <p className="text-gray-400">{user.email || 'No email'}</p>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-2 mt-2 text-red-500 hover:underline text-sm"
                  >
                    <Film className="w-4 h-4" /> Admin panel
                  </Link>
                )}
              </div>
            </div>
            <div className="space-y-2 text-sm text-gray-400">
              <p>Signed in with your account. Use the site to browse and watch content.</p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
