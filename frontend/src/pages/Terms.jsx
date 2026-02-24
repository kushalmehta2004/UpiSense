import { Link } from 'react-router-dom';
import { LandingNav } from '../components/landing/LandingNav';
import { Footer } from '../components/landing/Footer';
import { colors } from '../theme';

const MINT = '#00D4A0';

function Section({ title, children }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-semibold mb-4" style={{ fontFamily: 'Clash Display, sans-serif', color: colors.text }}>
        {title}
      </h2>
      <div className="text-sm leading-relaxed" style={{ color: colors.textSecondary }}>
        {children}
      </div>
    </section>
  );
}

export function Terms() {
  return (
    <div className="min-h-screen" style={{ background: colors.pageBg }}>
      <LandingNav />
      <main className="pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <h1
            className="text-4xl font-bold tracking-tight mb-2"
            style={{ fontFamily: 'Clash Display, sans-serif', color: colors.text }}
          >
            Terms of Service
          </h1>
          <p className="text-sm mb-12" style={{ color: colors.textSecondary }}>
            Last updated: 2026. By using UpiSense you agree to these terms.
          </p>

          <Section title="1. The Service">
            <p>
              UpiSense provides an expense tracking service. We are NOT a bank, financial institution, payment processor, or financial advisor.
              Transaction data shown on UpiSense is for informational purposes only and is not a substitute for official bank statements.
            </p>
          </Section>

          <Section title="2. Eligibility">
            <ul className="list-disc pl-5 space-y-1">
              <li>Must be 18 or older</li>
              <li>Must be an Indian resident or citizen with UPI access</li>
              <li>One account per person</li>
              <li>Must provide accurate information</li>
            </ul>
          </Section>

          <Section title="3. Acceptable Use">
            <p className="font-medium mb-1" style={{ color: colors.text }}>You MAY:</p>
            <ul className="list-disc pl-5 space-y-1 mb-4">
              <li>Forward your own UPI notifications to UpiSense</li>
              <li>Log your own cash payments via WhatsApp</li>
              <li>Track IOUs between yourself and others</li>
              <li>View, export, and use your own transaction data</li>
            </ul>
            <p className="font-medium mb-1" style={{ color: colors.text }}>You MAY NOT:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Forward UPI notifications that do not belong to you</li>
              <li>Forward notifications on behalf of another person without their knowledge</li>
              <li>Use UpiSense for money laundering, tax evasion, or any illegal activity</li>
              <li>Reverse-engineer, scrape, or extract data beyond your own account</li>
              <li>Share account credentials</li>
              <li>Use bots or scripts to interact with the WhatsApp bot or dashboard</li>
              <li>Attempt to circumvent free plan transaction limits</li>
            </ul>
          </Section>

          <Section title="4. AI Accuracy Disclaimer">
            <p>
              UpiSense uses AI to parse and categorize UPI notifications and natural language messages. While we target above 85% accuracy, we do not guarantee that every transaction will be correctly parsed or categorized. You are responsible for verifying the accuracy of data on your dashboard against your official bank records. UpiSense data is NOT a substitute for bank statements.
            </p>
          </Section>

          <Section title="5. WhatsApp Usage">
            <p>
              By signing up, you consent to receive WhatsApp messages from UpiSense including transaction confirmations, weekly reports, budget alerts, and account notifications. Reply STOP at any time to unsubscribe from non-essential messages.
            </p>
          </Section>

          <Section title="6. Subscription and Billing (for when paid plans are live)">
            <ul className="list-disc pl-5 space-y-1">
              <li>All prices in INR inclusive of 18% GST</li>
              <li>Subscriptions auto-renew monthly unless cancelled before renewal</li>
              <li>No refunds for partial months</li>
              <li>Cancellations take effect at end of current billing period</li>
              <li>30 days notice for price changes</li>
            </ul>
          </Section>

          <Section title="7. Refund Policy">
            <p>
              UpiSense subscriptions are digital services. No refunds are issued for partial subscription periods. If you cancel, your Pro access continues until the end of the current billing period. Upon termination, your data is deleted within 30 days. Termination does not entitle you to a refund of prepaid fees.
            </p>
          </Section>

          <Section title="8. Data Accuracy">
            <p>
              Same as AI disclaimer above — UpiSense is informational only. Verify against your bank statements.
            </p>
          </Section>

          <Section title="9. Service Availability">
            <p>
              We target 99% monthly uptime but do not guarantee uninterrupted service. We are not liable for losses from downtime.
            </p>
          </Section>

          <Section title="10. Limitation of Liability">
            <p>
              To the maximum extent permitted by Indian law, UpiSense is not liable for indirect or consequential damages, financial loss, or decisions made based on UpiSense data. Total liability capped at subscription fees paid in the 3 months prior to any claim.
            </p>
          </Section>

          <Section title="11. Termination">
            <ul className="list-disc pl-5 space-y-1">
              <li>You may delete your account anytime via Settings or by emailing support@upisense.app</li>
              <li>We may suspend accounts that violate these Terms</li>
              <li>Data deleted within 30 days of termination</li>
            </ul>
          </Section>

          <Section title="12. Governing Law">
            <p>
              Laws of India. Disputes first attempted via good-faith negotiation. If unresolved within 30 days, subject to courts of <span className="px-1.5 py-0.5 rounded font-medium" style={{ background: '#FEF08A', color: '#000' }}>Mumbai</span>, India.
            </p>
          </Section>

          <Section title="13. Contact">
            <p>
              support@upisense.app · privacy@upisense.app · legal@upisense.app
            </p>
          </Section>

          <p className="mt-12 text-sm" style={{ color: colors.textSecondary }}>
            <Link to="/privacy" className="font-medium hover:opacity-90" style={{ color: MINT }}>Privacy Policy</Link>
            {' · '}
            <Link to="/contact" className="font-medium hover:opacity-90" style={{ color: MINT }}>Contact</Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
