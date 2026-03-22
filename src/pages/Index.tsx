import { Link } from 'react-router-dom';
import { APP_NAME, APP_TAGLINE } from '@/lib/constants';
import { ArrowRight, Shield, Zap, CreditCard, Users, Clock, CheckCircle2 } from 'lucide-react';

const Index = () => {
  const features = [
    { icon: Users, title: 'Batch Payments', desc: 'Pay all your staff at once with a single click. Upload CSV or add manually.' },
    { icon: Clock, title: 'Auto Scheduling', desc: 'Set pay dates and forget. Payments run automatically every cycle.' },
    { icon: CreditCard, title: 'Virtual Account', desc: 'Get a dedicated Nigerian virtual account number via Flutterwave.' },
    { icon: Shield, title: 'BVN Verified', desc: 'Every user is BVN-verified for secure, compliant transactions.' },
    { icon: Zap, title: 'Instant Processing', desc: 'Payments processed in real-time through Flutterwave infrastructure.' },
    { icon: CheckCircle2, title: 'Card Fallback', desc: 'If wallet is low, your tokenized card is charged automatically.' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="page-container flex items-center justify-between py-5">
        <span className="text-xl font-bold text-primary">{APP_NAME}</span>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Sign In</Link>
          <Link to="/register" className="btn-primary px-5 py-2.5 rounded-lg text-sm font-medium inline-flex items-center gap-2">
            Get Started <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="page-container pt-16 pb-24 sm:pt-24 sm:pb-32">
        <div className="max-w-2xl section-reveal">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <Shield className="w-4 h-4" />
            CBN-Compliant Payment Processing
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.08] mb-6">{APP_TAGLINE}</h1>
          <p className="text-lg text-muted-foreground max-w-xl leading-relaxed mb-8">
            Automate salary disbursement, schedule payments, and manage your workforce payroll — all from one platform. Powered by Flutterwave.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/register" className="btn-primary px-8 py-3.5 rounded-xl text-base font-semibold inline-flex items-center gap-2">
              Create Free Account <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/terms" className="px-8 py-3.5 rounded-xl text-base font-medium border hover:bg-muted transition-colors">
              View Terms
            </Link>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-8 text-sm text-muted-foreground">
            <span>✓ 0.3% fee, max ₦1,000</span>
            <span>✓ We never hold your money</span>
            <span>✓ BVN-verified accounts</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="page-container pb-24 sm:pb-32">
        <h2 className="text-2xl sm:text-3xl font-bold mb-12 section-reveal">Everything you need to process payments</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={f.title} className={`stat-card section-reveal stagger-${Math.min(i + 1, 4)}`}>
              <f.icon className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary text-primary-foreground">
        <div className="page-container py-16 sm:py-20 text-center section-reveal">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Ready to streamline your payroll?</h2>
          <p className="text-lg opacity-80 mb-8 max-w-lg mx-auto">Join businesses across Nigeria using {APP_NAME} for automated, secure batch payment processing.</p>
          <Link to="/register" className="btn-accent px-8 py-3.5 rounded-xl text-base font-semibold inline-flex items-center gap-2">
            Get Started Now <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="page-container py-8 text-center text-sm text-muted-foreground">
        <p>© 2026 {APP_NAME}. Payment processing powered by Flutterwave. {APP_NAME} is not a bank.</p>
        <Link to="/terms" className="text-primary hover:underline mt-2 inline-block">Terms & Conditions</Link>
      </footer>
    </div>
  );
};

export default Index;
