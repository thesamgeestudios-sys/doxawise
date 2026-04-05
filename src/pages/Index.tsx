import { Link } from 'react-router-dom';
import { APP_NAME, APP_TAGLINE } from '@/lib/constants';
import { ArrowRight, Shield, Zap, CreditCard, Users, Clock, Wallet, Globe, TrendingUp, Smartphone, Lock, CheckCircle2 } from 'lucide-react';

const Index = () => {
  const features = [
    { icon: Users, title: 'Batch Payments', desc: 'Pay all your staff at once with a single click. Upload CSV or add manually.', color: 'text-[hsl(var(--info))]', bg: 'bg-[hsl(var(--info))]/10' },
    { icon: Clock, title: 'Auto Scheduling', desc: 'Set pay dates and forget. Payments run automatically every cycle.', color: 'text-[hsl(var(--warning))]', bg: 'bg-[hsl(var(--warning))]/10' },
    { icon: CreditCard, title: 'Virtual Cards', desc: 'Create virtual Naira & Dollar cards for online payments and subscriptions.', color: 'text-[hsl(var(--purple))]', bg: 'bg-[hsl(var(--purple))]/10' },
    { icon: Wallet, title: 'Virtual Account', desc: 'Get a dedicated Nigerian virtual account in your business name.', color: 'text-[hsl(var(--success))]', bg: 'bg-[hsl(var(--success))]/10' },
    { icon: Zap, title: 'Instant Processing', desc: 'Payments processed in real-time through secure banking infrastructure.', color: 'text-primary', bg: 'bg-primary/10' },
    { icon: Lock, title: 'Secure & Compliant', desc: 'BVN-verified accounts with bank-grade encryption and security.', color: 'text-[hsl(var(--teal))]', bg: 'bg-[hsl(var(--teal))]/10' },
  ];

  const stats = [
    { value: '₦2B+', label: 'Processed' },
    { value: '5,000+', label: 'Businesses' },
    { value: '99.9%', label: 'Uptime' },
    { value: '<3s', label: 'Transfer Speed' },
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navigation */}
      <nav className="page-container flex items-center justify-between py-5 relative z-10">
        <span className="text-xl font-bold text-primary">{APP_NAME}</span>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Sign In</Link>
          <Link to="/register" className="btn-primary px-5 py-2.5 rounded-lg text-sm font-medium inline-flex items-center gap-2">
            Get Started <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="page-container pt-12 pb-20 sm:pt-20 sm:pb-28 relative">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[hsl(var(--purple))]/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
        
        <div className="relative grid lg:grid-cols-2 gap-12 items-center">
          <div className="section-reveal">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              <Shield className="w-4 h-4" />
              Secure Payment Processing
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.08] mb-6">{APP_TAGLINE}</h1>
            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed mb-8">
              Automate salary disbursement, create virtual cards, schedule payments, and manage your workforce payroll — all from one secure platform.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/register" className="btn-gradient px-8 py-3.5 rounded-xl text-base font-semibold inline-flex items-center gap-2">
                Create Free Account <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/login" className="px-8 py-3.5 rounded-xl text-base font-medium border hover:bg-muted transition-colors">
                Sign In
              </Link>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-8 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[hsl(var(--success))]" /> 0.3% fee, max ₦1,000</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[hsl(var(--success))]" /> We never hold your money</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[hsl(var(--success))]" /> Instant transfers</span>
            </div>
          </div>
          
          {/* Hero visual - floating cards */}
          <div className="hidden lg:block relative section-reveal stagger-2">
            <div className="relative w-full h-[420px]">
              {/* Main card */}
              <div className="absolute top-8 left-8 right-8 rounded-2xl p-6 text-primary-foreground gradient-card shadow-2xl" style={{ animation: 'float 6s ease-in-out infinite' }}>
                <p className="text-sm opacity-80 mb-1">Virtual Account</p>
                <p className="text-xl font-bold mb-4">Acme Nigeria Ltd</p>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs opacity-60">Account Number</p>
                    <p className="text-2xl font-bold tracking-wider">7824531098</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs opacity-60">Balance</p>
                    <p className="text-2xl font-bold">₦2,450,000</p>
                  </div>
                </div>
              </div>
              
              {/* Floating card */}
              <div className="absolute bottom-12 right-0 w-72 rounded-xl p-4 bg-card border shadow-xl" style={{ animation: 'float 6s ease-in-out 1s infinite' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[hsl(var(--success))]/10 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-[hsl(var(--success))]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Payment Received</p>
                    <p className="text-xs text-muted-foreground">+₦500,000 • Just now</p>
                  </div>
                </div>
              </div>
              
              {/* Another floating notification */}
              <div className="absolute bottom-0 left-0 w-64 rounded-xl p-4 bg-card border shadow-xl" style={{ animation: 'float 6s ease-in-out 2s infinite' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Batch Salary Paid</p>
                    <p className="text-xs text-muted-foreground">15 staff • ₦4.2M</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-primary/5 border-y">
        <div className="page-container py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <div key={stat.label} className={`text-center section-reveal stagger-${Math.min(i + 1, 4)}`}>
                <p className="text-3xl sm:text-4xl font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="page-container py-20 sm:py-28">
        <div className="text-center mb-16 section-reveal">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Everything you need to process payments</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Powerful tools built for Nigerian businesses to automate payroll, manage funds, and scale operations.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={f.title} className={`card-elevated p-6 group hover:border-primary/30 transition-all section-reveal stagger-${Math.min(i + 1, 4)}`}>
              <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <f.icon className={`w-6 h-6 ${f.color}`} />
              </div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-muted/30">
        <div className="page-container py-20 sm:py-28">
          <div className="text-center mb-16 section-reveal">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Get started in 3 steps</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Create Account', desc: 'Sign up with your business details. BVN verification is optional but recommended.' },
              { step: '02', title: 'Get Virtual Account', desc: 'Receive a dedicated account number in your business name. Fund it via bank transfer.' },
              { step: '03', title: 'Start Paying', desc: 'Add staff, schedule payments, and process transfers instantly from your dashboard.' },
            ].map((item, i) => (
              <div key={item.step} className={`text-center section-reveal stagger-${i + 1}`}>
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">{item.step}</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-card" />
        <div className="page-container py-16 sm:py-20 text-center relative z-10 section-reveal">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-primary-foreground">Ready to streamline your payroll?</h2>
          <p className="text-lg text-primary-foreground/80 mb-8 max-w-lg mx-auto">Join businesses across Nigeria using {APP_NAME} for automated, secure batch payment processing.</p>
          <Link to="/register" className="bg-white text-primary px-8 py-3.5 rounded-xl text-base font-semibold inline-flex items-center gap-2 hover:bg-white/90 transition-colors">
            Get Started Now <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Mobile app section */}
      <section className="page-container py-20 sm:py-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="section-reveal">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">Manage payments on the go</h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Access your {APP_NAME} dashboard from any device. Our responsive platform works perfectly on phones, tablets, and desktops.
            </p>
            <div className="space-y-4">
              {[
                { icon: Smartphone, text: 'Fully responsive on all devices' },
                { icon: Shield, text: 'Bank-grade security & encryption' },
                { icon: Globe, text: 'Access from anywhere in the world' },
              ].map(item => (
                <div key={item.text} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-sm font-medium">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="hidden lg:flex justify-center section-reveal stagger-2">
            <div className="w-72 h-[500px] rounded-3xl bg-card border-2 shadow-2xl p-3 relative">
              <div className="w-full h-full rounded-2xl bg-muted/50 flex items-center justify-center">
                <div className="text-center p-6">
                  <div className="w-16 h-16 rounded-2xl gradient-card flex items-center justify-center mx-auto mb-4">
                    <Wallet className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <p className="font-bold text-lg">{APP_NAME}</p>
                  <p className="text-sm text-muted-foreground mt-1">Mobile Dashboard</p>
                  <div className="mt-6 space-y-3 text-left">
                    <div className="bg-card rounded-lg p-3 border">
                      <p className="text-xs text-muted-foreground">Balance</p>
                      <p className="font-bold">₦2,450,000</p>
                    </div>
                    <div className="bg-card rounded-lg p-3 border flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[hsl(var(--success))]/20 flex items-center justify-center">
                        <CheckCircle2 className="w-3 h-3 text-[hsl(var(--success))]" />
                      </div>
                      <div>
                        <p className="text-xs font-medium">Salary Paid</p>
                        <p className="text-xs text-muted-foreground">15 staff</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t">
        <div className="page-container py-12">
          <div className="grid sm:grid-cols-3 gap-8 mb-8">
            <div>
              <p className="text-xl font-bold text-primary mb-3">{APP_NAME}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">Smart payment processing platform for Nigerian businesses. We never hold your funds.</p>
            </div>
            <div>
              <p className="font-semibold mb-3">Quick Links</p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <Link to="/register" className="block hover:text-foreground transition-colors">Create Account</Link>
                <Link to="/login" className="block hover:text-foreground transition-colors">Sign In</Link>
                <Link to="/terms" className="block hover:text-foreground transition-colors">Terms & Conditions</Link>
              </div>
            </div>
            <div>
              <p className="font-semibold mb-3">Features</p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Batch Payments</p>
                <p>Virtual Cards</p>
                <p>Virtual Accounts</p>
              </div>
            </div>
          </div>
          <div className="border-t pt-6 text-center text-sm text-muted-foreground">
            <p>© 2026 {APP_NAME}. Payment processing powered by secure banking infrastructure. {APP_NAME} is not a bank.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
