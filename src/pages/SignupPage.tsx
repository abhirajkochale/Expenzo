import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, ShieldCheck, User, Mail, Lock } from 'lucide-react';

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

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const signUp = async () => {
    if (!email || !password || !username) {
      toast({ title: "Missing fields", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);
      
      // 1. Create Auth User & Attach Metadata
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username, // Saves to raw_user_meta_data
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // 2. Create Profile Entry (Fail-safe)
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          username: username,
          email: email, 
          role: 'user'
        });

        if (profileError) {
          console.error("Profile creation error:", profileError);
          // We don't stop the flow here because Auth succeeded
        }

        toast({ title: 'Account created! 🎉', description: "Welcome to Expenzo." });
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast({ title: "Signup Failed", description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <style>{spatialStyles}</style>

      {/* BACKGROUND AMBIENCE */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-200/40 dark:bg-purple-900/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-normal" />
         <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-200/40 dark:bg-emerald-900/10 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-normal" />
         <div className="absolute inset-0 spatial-grid opacity-60 dark:opacity-30" />
      </div>

      <div className="w-full max-w-md mx-4 relative z-10">
        <div className="glass-card p-6 sm:p-8 rounded-2xl border border-white/20 shadow-xl backdrop-blur-xl">
          
          {/* HEADER */}
          <div className="flex flex-col items-center mb-8 space-y-2">
            <div className="h-12 w-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg mb-2">
              <ShieldCheck className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Account</h1>
            <p className="text-sm text-center text-gray-500 dark:text-gray-400">Start your financial journey with Expenzo</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="glass-input pl-9 h-11"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input pl-9 h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input pl-9 h-11"
                />
              </div>
            </div>

            <Button 
                className="w-full h-11 mt-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]" 
                onClick={signUp} 
                disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {loading ? 'Creating Account...' : 'Sign Up'}
            </Button>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Already have an account?{' '}
                <Link to="/login" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
                    Login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}