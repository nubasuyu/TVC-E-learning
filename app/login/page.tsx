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
  
  // State for password visibility
  const [showPassword, setShowPassword] = useState(false);

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
        // CLEAR FIELDS IMMEDIATELY ON SUCCESSFUL LOGIN
        setEmail('');
        setPassword('');
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
          // CLEAR FIELDS IMMEDIATELY ON SUCCESSFUL SIGNUP
          setName('');
          setEmail('');
          setPassword('');
          setRole('STUDENT');
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
        
        {/* Logo and Motto */}
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
                autoComplete="off"
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
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-virtue-orange focus:border-virtue-orange outline-none transition-all"
              placeholder="student@virtuecollege.com"
            />
          </div>

          {/* Password with Show/Hide Toggle */}
          <div>
            <label className="block text-sm font-medium text-virtue-brown mb-1">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required
                autoComplete="new-password"
                className="w-full border border-gray-300 rounded-lg p-3 pr-10 focus:ring-2 focus:ring-virtue-orange focus:border-virtue-orange outline-none transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-virtue-orange transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
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