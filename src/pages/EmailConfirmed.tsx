import { Link } from 'react-router-dom';
import { APP_NAME } from '@/lib/constants';
import { CheckCircle2, ArrowRight } from 'lucide-react';

const EmailConfirmed = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="text-center max-w-md section-reveal">
        <div className="w-20 h-20 rounded-full bg-[hsl(var(--success))]/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-[hsl(var(--success))]" />
        </div>
        <h1 className="text-3xl font-bold mb-3">Email Confirmed!</h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Your email has been successfully verified. You can now log in to your <strong>{APP_NAME}</strong> account and start processing payments.
        </p>
        <Link
          to="/login"
          className="btn-primary px-8 py-3.5 rounded-xl text-base font-semibold inline-flex items-center gap-2"
        >
          Go to Login <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
};

export default EmailConfirmed;
