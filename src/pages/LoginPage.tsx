import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, Link } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { ShieldCheck, Loader2 } from 'lucide-react';

// --- STYLES FOR SPATIAL UI ---
const spatialStyles = `
  /* BASE (LIGHT MODE) */
  .glass-card {
    background: rgba(255, 255, 255, 0.65);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.6);
    box-shadow: 
      0 4px 24px -1px rgba(0, 0, 0, 0.05),
      inset 0 0 20px rgba(255, 255, 255, 0.5);
  }

  /* DARK MODE OVERRIDES */
  .dark .glass-card {
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  }

  /* INPUT FIELDS GLASS STYLE */
  .glass-input {
    background: rgba(255, 255, 255, 0.5);
    border: 1px solid rgba(0, 0, 0, 0.1);
    transition: all 0.2s;
  }
  .glass-input:focus {
    background: rgba(255, 255, 255, 0.8);
    border-color: #10b981; /* Emerald-500 */
    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
  }
  .dark .glass-input {
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
  }
  .dark .glass-input:focus {
    background: rgba(0, 0, 0, 0.4);
    border-color: #10b981;
  }

  /* Background Grid Pattern */
  .spatial-grid {
    background-image: 
      linear-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 0, 0, 0.03) 1px, transparent 1px);
    background-size: 40px 40px;
    mask-image: radial-gradient(circle at center, black 60%, transparent 100%);
  }
  .dark .spatial-grid {
    background-image: 
      linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  }
`;

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();

  // FIX: Force theme check on mount to prevent reverting to light mode on reload
  useEffect(() => {
    // Check for common theme keys used by shadcn/vite themes
    const theme = localStorage.getItem('vite-ui-theme') || localStorage.getItem('theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (theme === 'dark' || (!theme && systemDark)) {
      document.documentElement.classList.add('dark');
    } else {
      // Optional: Explicitly remove if light, though usually default
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const signInWithEmailOrUsername = async () => {
    setLoading(true);

    try {
      let email = identifier;

      // If user entered username, fetch email
      if (!identifier.includes('@')) {
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', identifier)
          .single();

        if (error || !data) {
          throw new Error('Username not found');
        }

        // Note: This requires admin/service_role to work in some setups, 
        // ensuring your RLS allows reading emails if not using admin api
        // or asking user for email directly is safer. 
        // Assuming current setup works for you:
        const { data: userData } = await supabase.auth.admin.getUserById(
          data.id
        );

        email = userData?.user?.email ?? '';
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({ title: 'Welcome back 👋' });
      navigate('/dashboard');
    } catch (err: any) {
      toast({
        title: 'Login failed',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <style>{spatialStyles}</style>

      {/* BACKGROUND AMBIENCE */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-200/40 dark:bg-emerald-900/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-normal" />
         <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-200/40 dark:bg-blue-900/10 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-normal" />
         <div className="absolute inset-0 spatial-grid opacity-60 dark:opacity-30" />
      </div>

      <div className="w-full max-w-md mx-4 relative z-10">
        <div className="glass-card p-6 sm:p-8 rounded-2xl border border-white/20 shadow-xl backdrop-blur-xl">
          
          {/* HEADER */}
          <div className="flex flex-col items-center mb-8 space-y-2">
            <div className="h-12 w-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg mb-2">
              <ShieldCheck className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome Back</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Sign in to continue to Expenzo</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-4">
                <Input
                placeholder="Email or Username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="glass-input h-11" 
                />

                <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass-input h-11"
                />

                <Button
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
                onClick={signInWithEmailOrUsername}
                disabled={loading}
                >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {loading ? 'Signing In...' : 'Sign In'}
                </Button>
            </div>

            <div className="flex items-center gap-3 py-2">
                <div className="h-px bg-gray-300 dark:bg-white/10 flex-1" />
                <span className="text-xs text-gray-500 font-medium">OR</span>
                <div className="h-px bg-gray-300 dark:bg-white/10 flex-1" />
            </div>

            <Button
                variant="outline"
                className="w-full flex gap-2 h-11 glass-input hover:bg-white/50 dark:hover:bg-white/10 border-gray-300 dark:border-white/10"
                onClick={signInWithGoogle}
            >
                <FcGoogle size={20} />
                <span className="text-gray-700 dark:text-gray-200">Continue with Google</span>
            </Button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
                Don't have an account?{' '}
                <Link to="/signup" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
                    Sign up
                </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}