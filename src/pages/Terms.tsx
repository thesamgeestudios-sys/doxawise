import { Link } from 'react-router-dom';
import { APP_NAME } from '@/lib/constants';
import { ArrowLeft } from 'lucide-react';

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="page-container py-12 max-w-3xl">
        <Link to="/register" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Registration
        </Link>

        <h1 className="text-3xl font-bold mb-2 section-reveal">{APP_NAME} Terms & Conditions</h1>
        <p className="text-muted-foreground mb-8 section-reveal stagger-1">Last updated: March 2026</p>

        <div className="prose prose-sm max-w-none space-y-6 section-reveal stagger-2">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. About {APP_NAME}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {APP_NAME} is a payment processing platform that enables Nigerian businesses to schedule and process batch payments to employees and vendors. {APP_NAME} is <strong>not a bank</strong> and does not hold customer funds. All financial transactions are processed through Flutterwave's secure, CBN-licensed infrastructure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Registration & Verification</h2>
            <p className="text-muted-foreground leading-relaxed">
              Users must provide a valid Bank Verification Number (BVN) during registration. BVN verification is performed through authorized channels to comply with Nigerian financial regulations. A virtual account number will be assigned to each verified user via Flutterwave.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Transaction Fees</h2>
            <p className="text-muted-foreground leading-relaxed">
              A processing fee of <strong>0.3%</strong> of the transaction amount applies to all transfers, <strong>capped at a maximum of ₦1,000</strong> per transaction. This fee is deducted at the time of transfer processing.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Fund Handling</h2>
            <p className="text-muted-foreground leading-relaxed">
              {APP_NAME} does not hold, store, or manage user funds. All funds are processed directly through Flutterwave. Users fund their virtual accounts and {APP_NAME} facilitates the transfer of funds to designated recipients. All transfers carry the user's registered business name.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Payment Processing</h2>
            <p className="text-muted-foreground leading-relaxed">
              Scheduled payments are processed from the user's wallet balance. If the balance is insufficient, {APP_NAME} will attempt to charge the user's default tokenized card. If both methods fail, the payment will be marked as failed and the user will be notified.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Card Tokenization</h2>
            <p className="text-muted-foreground leading-relaxed">
              Card tokenization is handled by Flutterwave. {APP_NAME} does not store full card details. Tokenized card references are used solely for processing authorized transactions when wallet balance is insufficient.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Data Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              User data, including BVN and business information, is stored securely and used only for identity verification and payment processing. We comply with the Nigeria Data Protection Regulation (NDPR).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              {APP_NAME} is not liable for failed transactions due to incorrect account details provided by users, insufficient funds, or issues with Flutterwave's infrastructure. Users are responsible for verifying recipient account details before scheduling payments.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Terms;
