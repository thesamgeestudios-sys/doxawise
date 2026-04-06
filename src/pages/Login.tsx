import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import PasswordInput from '@/components/PasswordInput';
import { APP_NAME } from '@/lib/constants';
import { toast } from 'sonner';
import { Loader2, ArrowRight } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }

    const userId = data.user?.id;

    if (userId) {
      const { data: roles, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .limit(1);

      setLoading(false);

      if (roleError) {
        toast.error(roleError.message);
        return;
      }

      navigate(roles && roles.length > 0 ? '/admin' : '/dashboard');
      return;
    }

    setLoading(false);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full border-2 border-primary-foreground/30" />
          <div className="absolute bottom-32 right-16 w-96 h-96 rounded-full border border-primary-foreground/20" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-primary-foreground/5" />
        </div>
        <div className="relative z-10 max-w-md text-primary-foreground section-reveal">
          <h1 className="text-4xl font-bold mb-6 leading-[1.1]">{APP_NAME}</h1>
          <p className="text-lg opacity-90 leading-relaxed">
            The smartest way to process batch payments for your Nigerian business. Pay your team on time, every time.
          </p>
          <div className="mt-12 space-y-4 text-sm opacity-80">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-accent" />
              <span>Automated salary disbursement</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-accent" />
              <span>Virtual account via Flutterwave</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-accent" />
              <span>BVN-verified registration</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md section-reveal">
          <div className="lg:hidden mb-8">
            <h1 className="text-2xl font-bold text-primary">{APP_NAME}</h1>
          </div>
          <h2 className="text-2xl font-bold mb-2">Welcome back</h2>
          <p className="text-muted-foreground mb-8">Sign in to manage your payments</p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="input-field w-full"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">Password</label>
              <PasswordInput
                id="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-semibold hover:underline">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
