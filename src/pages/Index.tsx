import { Link } from 'react-router-dom';
import { APP_NAME, APP_TAGLINE } from '@/lib/constants';
import { ArrowRight, Shield, Zap, CreditCard, Users, Clock, Wallet, Globe, TrendingUp, Smartphone, Lock, CheckCircle2, Send, BarChart3 } from 'lucide-react';
import heroBanner from '@/assets/hero-banner.jpg';
import internationalImg from '@/assets/international-payments.jpg';
import virtualCardImg from '@/assets/virtual-card.jpg';
import teamImg from '@/assets/team-payments.jpg';

const Index = () => {
  const features = [
    { icon: Users, title: 'Batch Payments', desc: 'Pay all your staff at once with a single click. Upload CSV or add manually.', color: 'text-[hsl(var(--info))]', bg: 'bg-[hsl(var(--info))]/10' },
    { icon: Clock, title: 'Auto Scheduling', desc: 'Set pay dates and forget. Payments run automatically every cycle.', color: 'text-[hsl(var(--warning))]', bg: 'bg-[hsl(var(--warning))]/10' },
    { icon: CreditCard, title: 'Virtual Cards', desc: 'Create virtual Naira & Dollar cards for online payments and subscriptions.', color: 'text-[hsl(var(--purple))]', bg: 'bg-[hsl(var(--purple))]/10' },
    { icon: Wallet, title: 'Virtual Account', desc: 'Get a dedicated Nigerian virtual account in your business name.', color: 'text-[hsl(var(--success))]', bg: 'bg-[hsl(var(--success))]/10' },
    { icon: Globe, title: 'International Payments', desc: 'Send and receive money across borders. Support for USD, GBP, EUR, and more.', color: 'text-[hsl(var(--teal))]', bg: 'bg-[hsl(var(--teal))]/10' },
    { icon: Lock, title: 'Secure & Compliant', desc: 'BVN-verified accounts with bank-grade encryption and security.', color: 'text-primary', bg: 'bg-primary/10' },
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
      <nav className="absolute top-0 left-0 right-0 z-20 page-container flex items-center justify-between py-5">
        <span className="text-xl font-bold text-primary-foreground drop-shadow-lg">{APP_NAME}</span>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors">Sign In</Link>
          <Link to="/register" className="bg-accent text-accent-foreground px-5 py-2.5 rounded-lg text-sm font-medium inline-flex items-center gap-2 hover:opacity-90 transition-all">
            Get Started <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* Hero Section - Image Led */}
      <section className="relative min-h-[90vh] flex items-center">
        <div className="absolute inset-0">
          <img src={heroBanner} alt="Doxawise payment dashboard" width={1920} height={1080} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[hsl(222,62%,12%)/0.92] via-[hsl(222,62%,18%)/0.85] to-[hsl(262,60%,20%)/0.7]" />
        </div>
        <div className="relative z-10 page-container pt-24 pb-20">
          <div className="max-w-2xl section-reveal">
            <div className="inline-flex items-center gap-2 bg-accent/20 text-accent text-sm font-medium px-4 py-1.5 rounded-full mb-6 backdrop-blur-sm border border-accent/30">
              <Shield className="w-4 h-4" />
              Nigeria's Smart Payment Platform
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.08] mb-6 text-primary-foreground">
              {APP_TAGLINE}
            </h1>
            <p className="text-lg text-primary-foreground/80 max-w-xl leading-relaxed mb-8">
              Automate salary disbursement, create virtual cards, send international payments, and manage your workforce payroll — all from one secure platform.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/register" className="bg-accent text-accent-foreground px-8 py-3.5 rounded-xl text-base font-semibold inline-flex items-center gap-2 hover:opacity-90 transition-all shadow-lg">
                Create Free Account <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/login" className="px-8 py-3.5 rounded-xl text-base font-medium border border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 transition-colors backdrop-blur-sm">
                Sign In
              </Link>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-8 text-sm text-primary-foreground/70">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-accent" /> 0.3% fee, max ₦1,000</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-accent" /> We never hold your money</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-accent" /> Instant transfers</span>
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
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Powerful tools built for Nigerian businesses to automate payroll, manage funds, and scale operations globally.</p>
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

      {/* Virtual Cards Section - Image Led */}
      <section className="relative overflow-hidden">
        <div className="grid lg:grid-cols-2">
          <div className="relative h-64 lg:h-auto">
            <img src={virtualCardImg} alt="Virtual debit card" width={1280} height={720} loading="lazy" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-background lg:to-transparent" />
          </div>
          <div className="flex items-center p-8 sm:p-12 lg:p-16">
            <div className="section-reveal">
              <div className="inline-flex items-center gap-2 badge-purple mb-4">
                <CreditCard className="w-3.5 h-3.5" /> Virtual Cards
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Create virtual cards in seconds</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Generate Naira or Dollar virtual cards instantly. Use them for online subscriptions, international purchases, and team spending management.
              </p>
              <ul className="space-y-3 mb-8">
                {['NGN & USD card options', 'Fund, block & terminate anytime', 'Secure online payments'].map(item => (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-[hsl(var(--success))] shrink-0" /> {item}
                  </li>
                ))}
              </ul>
              <Link to="/register" className="btn-gradient px-6 py-3 rounded-xl text-sm font-semibold inline-flex items-center gap-2">
                Get Your Card <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* International Payments - Image Led */}
      <section className="relative overflow-hidden">
        <div className="grid lg:grid-cols-2">
          <div className="flex items-center p-8 sm:p-12 lg:p-16 order-2 lg:order-1">
            <div className="section-reveal">
              <div className="inline-flex items-center gap-2 badge-info mb-4">
                <Globe className="w-3.5 h-3.5" /> International Payments
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Send money across borders</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Transfer funds internationally with competitive exchange rates. Send money to the US, UK, Europe, and across Africa directly from your Doxawise wallet.
              </p>
              <ul className="space-y-3 mb-8">
                {['Support for USD, GBP, EUR, GHS & more', 'Real-time exchange rates', 'Receive from anywhere in the world'].map(item => (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-[hsl(var(--success))] shrink-0" /> {item}
                  </li>
                ))}
              </ul>
              <Link to="/register" className="btn-primary px-6 py-3 rounded-xl text-sm font-semibold inline-flex items-center gap-2">
                Start Sending <Send className="w-4 h-4" />
              </Link>
            </div>
          </div>
          <div className="relative h-64 lg:h-auto order-1 lg:order-2">
            <img src={internationalImg} alt="International payments globe" width={1280} height={720} loading="lazy" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-l from-transparent to-background lg:to-transparent" />
          </div>
        </div>
      </section>

      {/* Team Payments - Image Led */}
      <section className="relative">
        <div className="absolute inset-0">
          <img src={teamImg} alt="Team receiving payments" width={1280} height={720} loading="lazy" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[hsl(222,62%,10%)/0.9] to-[hsl(222,62%,10%)/0.7]" />
        </div>
        <div className="relative z-10 page-container py-20 sm:py-28">
          <div className="max-w-xl section-reveal">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-primary-foreground">Pay your entire team with one click</h2>
            <p className="text-lg text-primary-foreground/80 leading-relaxed mb-8">
              Add your staff, set their salaries and bank details, then process batch payments instantly. Everyone gets paid simultaneously.
            </p>
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { icon: Users, label: 'Batch Pay', value: '100+ staff' },
                { icon: Zap, label: 'Speed', value: '<3 seconds' },
                { icon: BarChart3, label: 'Tracking', value: 'Real-time' },
              ].map(item => (
                <div key={item.label} className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-4 border border-primary-foreground/10 text-center">
                  <item.icon className="w-5 h-5 text-accent mx-auto mb-2" />
                  <p className="text-xs text-primary-foreground/60">{item.label}</p>
                  <p className="text-sm font-bold text-primary-foreground">{item.value}</p>
                </div>
              ))}
            </div>
            <Link to="/register" className="bg-accent text-accent-foreground px-8 py-3.5 rounded-xl text-base font-semibold inline-flex items-center gap-2 hover:opacity-90 transition-all">
              Start Paying Your Team <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
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
          <Link to="/register" className="bg-accent text-accent-foreground px-8 py-3.5 rounded-xl text-base font-semibold inline-flex items-center gap-2 hover:opacity-90 transition-all shadow-lg">
            Get Started Now <ArrowRight className="w-5 h-5" />
          </Link>
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
                <p>International Transfers</p>
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
