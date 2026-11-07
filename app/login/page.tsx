'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRedirect = async () => {
    const session = await getSession();
    const userRole = session?.user?.role;
    if (userRole === 'TEACHER' || userRole === 'ADMIN') {
      router.push('/admin');
    } else {
      router.push('/');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isLogin) {
      const result = await signIn('credentials', { redirect: false, email, password });
      if (result?.error) {
        setError('Invalid email or password. (If you just signed up, your account may be pending Admin approval).');
      } else {
        await handleRedirect();
      }
    } else {
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, role }),
        });

        const data = await res.json();
        if (data.error) {
          setError(data.error);
        } else {
          setError('✅ Account created successfully! Please wait for the Admin to approve your account before logging in.');
          setIsLogin(true);
        }
      } catch (err) {
        setError('Network error. Please try again.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-virtue-cream flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-virtue-orange/20">
        
        {/* NEW: Logo and Motto */}
        <div className="text-center mb-8 flex flex-col items-center">
          <img src="/logo.jpg" alt="TVC Logo" className="h-20 w-auto mb-3 drop-shadow-md" />
          <h1 className="text-2xl font-bold text-virtue-brown tracking-tight">The Virtue College</h1>
          <p className="text-[10px] text-virtue-orange font-bold uppercase tracking-wider mt-1">Knowledge Towards Allah's Bliss</p>
          <p className="text-gray-500 mt-4 text-sm">
            {isLogin ? 'Welcome back! Please log in.' : 'Create your account.'}
          </p>
        </div>

        {/* Toggle Buttons */}
        <div className="flex bg-virtue-cream-dark p-1 rounded-lg mb-6">
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError(''); }}
            className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${isLogin ? 'bg-white text-virtue-brown shadow-sm' : 'text-gray-500'}`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(''); }}
            className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${!isLogin ? 'bg-white text-virtue-brown shadow-sm' : 'text-gray-500'}`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name (Signup Only) */}
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-virtue-brown mb-1">Full Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required={!isLogin}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-virtue-orange focus:border-virtue-orange outline-none transition-all"
                placeholder="John Doe"
              />
            </div>
          )}

          {/* Email Address */}
          <div>
            <label className="block text-sm font-medium text-virtue-brown mb-1">Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-virtue-orange focus:border-virtue-orange outline-none transition-all"
              placeholder="student@virtuecollege.com"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-virtue-brown mb-1">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-virtue-orange focus:border-virtue-orange outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          {/* Role Selector for Signup */}
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-virtue-brown mb-1">I am a...</label>
              <select 
                value={role} 
                onChange={(e) => setRole(e.target.value)} 
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-virtue-orange focus:border-virtue-orange outline-none transition-all"
              >
                <option value="STUDENT">Student</option>
                <option value="TEACHER">Teacher</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">Note: All new accounts require Admin approval before you can log in.</p>
            </div>
          )}

          {/* Error/Success Message */}
          {error && (
            <div className={`text-sm p-3 rounded-lg border ${error.includes('✅') ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-virtue-orange text-white py-3 rounded-lg font-bold hover:bg-virtue-orange-light transition-colors disabled:bg-gray-400 shadow-md"
          >
            {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => router.push('/')} 
            className="text-sm text-virtue-brown hover:text-virtue-orange font-medium"
          >
            ← Back to Dashboard without logging in
          </button>
        </div>
      </div>
    </div>
  );
}