import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import PasswordInput from '@/components/PasswordInput';
import { APP_NAME } from '@/lib/constants';
import { toast } from 'sonner';
import { Loader2, ArrowRight, Building2 } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    businessName: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bvn: '',
    password: '',
    confirmPassword: '',
    agreedToTerms: false,
  });

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.bvn && (form.bvn.length !== 11 || !/^\d+$/.test(form.bvn))) {
      toast.error('BVN must be exactly 11 digits');
      return;
    }
    if (!form.agreedToTerms) {
      toast.error('You must agree to the Terms & Conditions');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          business_name: form.businessName,
          first_name: form.firstName,
          last_name: form.lastName,
          phone: form.phone,
          bvn: form.bvn,
        },
      },
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Registration successful! Please check your email to verify your account.');
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-primary relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-80 h-80 rounded-full border-2 border-primary-foreground/20" />
          <div className="absolute bottom-20 left-10 w-64 h-64 rounded-full bg-primary-foreground/5" />
        </div>
        <div className="relative z-10 max-w-md text-primary-foreground section-reveal">
          <Building2 className="w-12 h-12 mb-6 text-accent" />
          <h1 className="text-4xl font-bold mb-4 leading-[1.1]">Start processing payments in minutes</h1>
          <p className="text-lg opacity-90 leading-relaxed mb-8">
            Register your business, verify your BVN, and get a virtual account number instantly.
          </p>
          <div className="bg-primary-foreground/10 rounded-xl p-6 backdrop-blur-sm">
            <h3 className="font-semibold mb-3">Terms & Fee Disclosure</h3>
            <ul className="space-y-2 text-sm opacity-90">
              <li>• 0.3% fee per transaction, capped at ₦1,000</li>
              <li>• We do not hold your money — funds are processed via Flutterwave</li>
              <li>• All transfers carry your registered business name</li>
              <li>• BVN verification required for compliance</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-lg section-reveal">
          <div className="lg:hidden mb-6">
            <h1 className="text-2xl font-bold text-primary">{APP_NAME}</h1>
          </div>
          <h2 className="text-2xl font-bold mb-2">Create your account</h2>
          <p className="text-muted-foreground mb-8">Fill in your business and personal details</p>

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2">Business / Company Name</label>
              <input value={form.businessName} onChange={update('businessName')} required placeholder="Acme Nigeria Ltd" className="input-field w-full" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">First Name</label>
                <input value={form.firstName} onChange={update('firstName')} required placeholder="Chinedu" className="input-field w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Last Name</label>
                <input value={form.lastName} onChange={update('lastName')} required placeholder="Okafor" className="input-field w-full" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <input type="email" value={form.email} onChange={update('email')} required placeholder="you@company.com" className="input-field w-full" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Phone Number</label>
              <input type="tel" value={form.phone} onChange={update('phone')} required placeholder="08012345678" className="input-field w-full" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">BVN (Bank Verification Number)</label>
              <input value={form.bvn} onChange={update('bvn')} required maxLength={11} placeholder="11-digit BVN" className="input-field w-full" />
              <p className="text-xs text-muted-foreground mt-1">Your BVN will be verified during registration</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <PasswordInput value={form.password} onChange={update('password')} placeholder="Min 8 characters" required minLength={8} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Confirm Password</label>
              <PasswordInput value={form.confirmPassword} onChange={update('confirmPassword')} placeholder="Confirm password" required minLength={8} />
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={form.agreedToTerms} onChange={update('agreedToTerms')} className="mt-1 w-4 h-4 rounded border-input accent-primary" />
              <span className="text-sm text-muted-foreground">
                I agree to the <Link to="/terms" className="text-primary font-medium hover:underline">Terms & Conditions</Link> and acknowledge the transaction fee of 0.3% (max ₦1,000) per transfer. I understand that {APP_NAME} does not hold my funds.
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Create Account <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
