import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { APP_NAME, SITE_URL } from '@/lib/constants';

const RegistrationSuccess = () => (
  <main className="min-h-screen bg-background flex items-center justify-center px-6">
    <section className="w-full max-w-lg text-center section-reveal">
      <div className="w-16 h-16 rounded-2xl bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] mx-auto mb-6 flex items-center justify-center">
        <CheckCircle2 className="w-9 h-9" />
      </div>
      <h1 className="text-3xl font-bold mb-3">Registration successful</h1>
      <p className="text-muted-foreground leading-relaxed mb-8">
        Your {APP_NAME} account has been created. Please verify your email, then sign in to continue at {SITE_URL.replace('https://', '')}.
      </p>
      <Link to="/login" className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold">
        Continue to Sign In <ArrowRight className="w-4 h-4" />
      </Link>
    </section>
  </main>
);

export default RegistrationSuccess;
