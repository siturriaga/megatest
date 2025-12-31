'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, googleProvider, db } from './firebase';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Shield, Zap, Users, BarChart3, Lock, ArrowRight, LogOut } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        
        // =====================
        // CHECK SCHOOL_ID BEFORE REDIRECT
        // =====================
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const userData = userSnap.data();
            
            // Only redirect if user has school_id OR is SuperAdmin
            if (userData.school_id || userData.role === 'super_admin') {
              router.push('/dashboard');
              return;
            }
          }
          
          // No school_id - stay on login page to complete onboarding
          // They'll see the sign out button and can go through consent flow
          setLoading(false);
          
        } catch (err) {
          console.error('Error checking user status:', err);
          setLoading(false);
        }
        
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });
    return () => unsub();
  }, [router]);

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      
      // After sign in, check if user needs onboarding
      const userRef = doc(db, 'users', result.user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.school_id || userData.role === 'super_admin') {
          router.push('/dashboard');
        } else {
          // Needs to complete onboarding - dashboard will show consent/school flow
          router.push('/dashboard');
        }
      } else {
        // New user - dashboard will show consent flow
        router.push('/dashboard');
      }
      
    } catch (err) {
      console.error('Sign in error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled. Please try again.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('This domain is not authorized. Please add it to Firebase Console → Authentication → Settings → Authorized domains.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error: Unable to reach Google servers. Check your internet connection, disable any ad blockers or VPNs, and try again.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Pop-up blocked. Please allow pop-ups for this site and try again.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        setError('Sign-in cancelled. Please try again.');
      } else {
        setError(`Sign-in failed: ${err.message || 'Unknown error'}. Please try again.`);
      }
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setLoading(false);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-white/50 text-sm">Checking authentication...</p>
        <button 
          onClick={handleSignOut}
          className="mt-4 px-4 py-2 text-red-400 text-sm hover:text-red-300 flex items-center gap-2"
        >
          <LogOut size={14} />
          Force Sign Out
        </button>
      </div>
    );
  }

  // Show "Continue to Dashboard" if user is logged in but needs onboarding
  if (currentUser) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center gap-6 p-6">
        <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-2xl flex items-center justify-center font-black text-4xl shadow-lg shadow-emerald-500/30">
          S
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-black text-white mb-2">Welcome Back!</h2>
          <p className="text-white/50 text-sm">Signed in as {currentUser.email}</p>
        </div>
        
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-black rounded-2xl flex items-center justify-center gap-3 hover:opacity-90 transition-all shadow-lg"
          >
            Continue to Dashboard
            <ArrowRight size={18} />
          </button>
          
          <button
            onClick={handleSignOut}
            className="w-full py-3 bg-red-500/10 text-red-400 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-red-500/20 transition-all"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
        
        <p className="text-white/30 text-xs mt-4">
          You'll need to complete setup if this is your first time.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-xl flex items-center justify-center font-black text-2xl shadow-lg shadow-emerald-500/20">
              S
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">STRIDE</h1>
              <p className="text-xs text-white/40 font-medium">School Management System</p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Side - Hero */}
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm font-medium">
                  <Zap size={14} className="text-amber-400" />
                  <span>Real-time classroom management</span>
                </div>
                
                <h2 className="text-5xl lg:text-6xl font-black leading-tight">
                  The Future of
                  <span className="bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent"> Hall Passes</span>
                </h2>
                
                <p className="text-xl text-white/60 leading-relaxed max-w-lg">
                  Digital passes, behavioral tracking, house points, and real-time analytics. 
                  All in one beautiful dashboard built for modern educators.
                </p>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: <Shield size={20} />, label: 'Conflict Detection', desc: 'Auto-block risky passes' },
                  { icon: <Users size={20} />, label: 'House System', desc: 'Gamified incentives' },
                  { icon: <BarChart3 size={20} />, label: 'MTSS Reports', desc: 'Intervention tracking' },
                  { icon: <Lock size={20} />, label: 'Lockdown Mode', desc: 'Instant safety protocol' },
                ].map((feature, i) => (
                  <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center text-blue-400 mb-3 group-hover:scale-110 transition-transform">
                      {feature.icon}
                    </div>
                    <div className="font-bold text-sm">{feature.label}</div>
                    <div className="text-xs text-white/40">{feature.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side - Login Card */}
            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-md">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 shadow-2xl">
                  <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-2xl flex items-center justify-center font-black text-4xl mx-auto mb-4 shadow-lg shadow-emerald-500/30">
                      S
                    </div>
                    <h3 className="text-2xl font-black">Welcome to STRIDE</h3>
                    <p className="text-white/50 text-sm mt-2">Sign in with your school account</p>
                  </div>

                  {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleGoogleSignIn}
                    disabled={signingIn}
                    className="w-full py-4 bg-white text-slate-900 font-black rounded-2xl flex items-center justify-center gap-3 hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    {signingIn ? (
                      <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Sign in with Google
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>

                  <div className="mt-6 text-center">
                    <p className="text-xs text-white/30">
                      Authorized for <span className="text-white/50">@dadeschools.net</span> accounts
                    </p>
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="mt-6 flex items-center justify-center gap-6 text-white/30 text-xs">
                  <div className="flex items-center gap-2">
                    <Lock size={12} />
                    <span>FERPA Compliant</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield size={12} />
                    <span>256-bit SSL</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="p-6 text-center text-white/30 text-xs">
          © {new Date().getFullYear()} STRIDE School Management System. Built for educators.
        </footer>
      </div>
    </div>
  );
}
