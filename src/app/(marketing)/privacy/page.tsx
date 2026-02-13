import { Metadata } from "next"
import { LegalLayout } from "@/components/legal/legal-layout"

export const metadata: Metadata = {
  title: "Privacy Policy - TaxFolio",
  description: "Learn how TaxFolio collects, uses, and protects your personal data in compliance with GDPR and UK DPA 2018.",
}

export default function PrivacyPolicyPage() {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated="30 December 2024">
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">1. Introduction</h2>
        <p className="text-zinc-300 mb-4">
          TaxFolio (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered UK self-assessment tax tool.
        </p>
        <p className="text-zinc-300 mb-4">
          We comply with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018 (UK DPA 2018). This policy applies to all users of our services.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">2. Data Controller</h2>
        <p className="text-zinc-300 mb-4">
          TaxFolio is the data controller responsible for your personal data. For any questions about this policy or our data practices, contact us at:
        </p>
        <p className="text-zinc-300">
          Email: privacy@taxfolio.uk
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">3. Information We Collect</h2>

        <h3 className="text-lg font-medium text-white mb-3 mt-6">3.1 Information You Provide</h3>
        <ul className="list-disc list-inside text-zinc-300 space-y-2 mb-4">
          <li>Account information (name, email address, password)</li>
          <li>Tax-related information you manually enter</li>
          <li>Communication preferences</li>
          <li>Support correspondence</li>
        </ul>

        <h3 className="text-lg font-medium text-white mb-3 mt-6">3.2 Financial Data via Open Banking (TrueLayer)</h3>
        <p className="text-zinc-300 mb-4">
          When you connect your bank accounts through our Open Banking integration powered by TrueLayer, we access:
        </p>
        <ul className="list-disc list-inside text-zinc-300 space-y-2 mb-4">
          <li>Account information (account type, institution name, account balances)</li>
          <li>Transaction data (date, amount, merchant name, category)</li>
          <li>Account holder name for verification purposes</li>
        </ul>
        <p className="text-zinc-300 mb-4">
          We only access data necessary to provide our tax categorisation services. We do not access your bank login credentials - TrueLayer handles authentication securely. You can revoke access at any time through your TaxFolio settings or directly with your bank.
        </p>

        <h3 className="text-lg font-medium text-white mb-3 mt-6">3.3 Payment Information (Stripe)</h3>
        <p className="text-zinc-300 mb-4">
          Payment processing is handled by Stripe. We do not store your full payment card details. Stripe provides us with:
        </p>
        <ul className="list-disc list-inside text-zinc-300 space-y-2 mb-4">
          <li>Last four digits of your card</li>
          <li>Card type and expiry date</li>
          <li>Billing address</li>
          <li>Transaction history with TaxFolio</li>
        </ul>

        <h3 className="text-lg font-medium text-white mb-3 mt-6">3.4 Automatically Collected Information</h3>
        <ul className="list-disc list-inside text-zinc-300 space-y-2">
          <li>Device information (browser type, operating system)</li>
          <li>IP address and approximate location</li>
          <li>Usage data (pages visited, features used, time spent)</li>
          <li>Cookies and similar technologies (see our Cookie Policy)</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">4. How We Use Your Information</h2>
        <p className="text-zinc-300 mb-4">We use your information for the following purposes:</p>

        <h3 className="text-lg font-medium text-white mb-3 mt-6">4.1 To Provide Our Services (Legal Basis: Contract)</h3>
        <ul className="list-disc list-inside text-zinc-300 space-y-2 mb-4">
          <li>Create and manage your account</li>
          <li>Connect to your bank accounts via Open Banking</li>
          <li>Categorise transactions for tax purposes using AI</li>
          <li>Generate tax summaries and reports</li>
          <li>Process payments for premium features</li>
        </ul>

        <h3 className="text-lg font-medium text-white mb-3 mt-6">4.2 To Improve Our Services (Legal Basis: Legitimate Interest)</h3>
        <ul className="list-disc list-inside text-zinc-300 space-y-2 mb-4">
          <li>Analyse usage patterns to improve features</li>
          <li>Train and improve our AI categorisation models (using anonymised data only)</li>
          <li>Troubleshoot technical issues</li>
          <li>Conduct research and development</li>
        </ul>

        <h3 className="text-lg font-medium text-white mb-3 mt-6">4.3 To Communicate With You (Legal Basis: Contract/Consent)</h3>
        <ul className="list-disc list-inside text-zinc-300 space-y-2 mb-4">
          <li>Send service-related notifications</li>
          <li>Provide customer support</li>
          <li>Send marketing communications (with your consent)</li>
          <li>Notify you of changes to our services or policies</li>
        </ul>

        <h3 className="text-lg font-medium text-white mb-3 mt-6">4.4 For Legal and Security Purposes (Legal Basis: Legal Obligation/Legitimate Interest)</h3>
        <ul className="list-disc list-inside text-zinc-300 space-y-2">
          <li>Comply with legal obligations</li>
          <li>Prevent fraud and abuse</li>
          <li>Enforce our terms of service</li>
          <li>Protect the rights and safety of users</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">5. Data Sharing and Third Parties</h2>
        <p className="text-zinc-300 mb-4">We share your data with the following categories of recipients:</p>

        <h3 className="text-lg font-medium text-white mb-3 mt-6">5.1 Service Providers</h3>
        <ul className="list-disc list-inside text-zinc-300 space-y-2 mb-4">
          <li><strong>TrueLayer Ltd.</strong> - Open Banking connectivity (processes bank connection data)</li>
          <li><strong>Stripe Inc.</strong> - Payment processing (processes payment data)</li>
          <li><strong>Supabase Inc.</strong> - Database and authentication services</li>
          <li><strong>Anthropic</strong> - AI processing for transaction categorisation (see Section 5.2 below)</li>
          <li><strong>Vercel Inc.</strong> - Hosting and infrastructure</li>
        </ul>
        <p className="text-zinc-300 mb-4">
          All service providers are bound by data processing agreements and are required to protect your data in accordance with GDPR requirements.
        </p>

        <h3 className="text-lg font-medium text-white mb-3 mt-6">5.2 AI Processing and Anthropic</h3>
        <p className="text-zinc-300 mb-4">
          TaxFolio uses generative AI (Anthropic&apos;s Claude) to suggest tax categories for your bank transactions and to generate financial insights. Here is how your data is processed:
        </p>
        <ul className="list-disc list-inside text-zinc-300 space-y-2 mb-4">
          <li><strong>What data is sent to Anthropic:</strong> Transaction descriptions, amounts, dates, and merchant names. We do not send your name, bank account numbers, or other directly identifying information.</li>
          <li><strong>How it is processed:</strong> Anthropic&apos;s AI model analyses transaction data to suggest the most likely HMRC tax category (e.g., office costs, travel expenses, turnover). Results are returned to TaxFolio and presented as suggestions for your review.</li>
          <li><strong>Data retention by Anthropic:</strong> We use Anthropic&apos;s API with zero data retention — your transaction data is not stored by Anthropic after processing and is not used to train their models.</li>
          <li><strong>Limitations:</strong> AI categorisations are suggestions only and may contain errors. You are responsible for reviewing and confirming all categorisations before they are used in any HMRC submission.</li>
          <li><strong>Your control:</strong> You can override any AI suggestion at any time. No data is submitted to HMRC without your explicit confirmation.</li>
        </ul>

        <h3 className="text-lg font-medium text-white mb-3 mt-6">5.3 Legal Requirements</h3>
        <p className="text-zinc-300 mb-4">
          We may disclose your information if required by law, court order, or government request, or if we believe disclosure is necessary to protect our rights, your safety, or the safety of others.
        </p>

        <h3 className="text-lg font-medium text-white mb-3 mt-6">5.4 Business Transfers</h3>
        <p className="text-zinc-300">
          In the event of a merger, acquisition, or sale of assets, your data may be transferred to the acquiring entity. We will notify you of any such change and your choices regarding your data.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">6. International Data Transfers</h2>
        <p className="text-zinc-300 mb-4">
          Some of our service providers are based outside the UK. When we transfer your data internationally, we ensure appropriate safeguards are in place:
        </p>
        <ul className="list-disc list-inside text-zinc-300 space-y-2">
          <li>Transfers to countries with an adequacy decision from the UK Government</li>
          <li>Standard Contractual Clauses approved by the UK ICO</li>
          <li>Binding Corporate Rules where applicable</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">7. Data Retention</h2>
        <p className="text-zinc-300 mb-4">We retain your data for as long as necessary to:</p>
        <ul className="list-disc list-inside text-zinc-300 space-y-2 mb-4">
          <li>Provide our services to you</li>
          <li>Comply with legal obligations (tax records must be kept for 6 years)</li>
          <li>Resolve disputes and enforce agreements</li>
        </ul>
        <p className="text-zinc-300 mb-4">Specific retention periods:</p>
        <ul className="list-disc list-inside text-zinc-300 space-y-2">
          <li>Account data: Until account deletion, plus 30 days for backups</li>
          <li>Transaction data: 6 years from the relevant tax year end (HMRC requirement)</li>
          <li>Payment records: 7 years (legal requirement)</li>
          <li>Usage analytics: 26 months</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">8. Your Rights</h2>
        <p className="text-zinc-300 mb-4">Under UK GDPR, you have the following rights:</p>
        <ul className="list-disc list-inside text-zinc-300 space-y-2 mb-4">
          <li><strong>Right of Access</strong> - Request a copy of your personal data</li>
          <li><strong>Right to Rectification</strong> - Request correction of inaccurate data</li>
          <li><strong>Right to Erasure</strong> - Request deletion of your data (subject to legal retention requirements)</li>
          <li><strong>Right to Restrict Processing</strong> - Request limitation of how we use your data</li>
          <li><strong>Right to Data Portability</strong> - Receive your data in a machine-readable format</li>
          <li><strong>Right to Object</strong> - Object to processing based on legitimate interests or for marketing</li>
          <li><strong>Right to Withdraw Consent</strong> - Withdraw consent at any time for processing based on consent</li>
        </ul>
        <p className="text-zinc-300 mb-4">
          To exercise any of these rights, contact us at privacy@taxfolio.uk. We will respond within one month.
        </p>
        <p className="text-zinc-300">
          You also have the right to lodge a complaint with the Information Commissioner&apos;s Office (ICO) at ico.org.uk if you believe your data protection rights have been violated.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">9. Data Security</h2>
        <p className="text-zinc-300 mb-4">We implement appropriate technical and organisational measures to protect your data:</p>
        <ul className="list-disc list-inside text-zinc-300 space-y-2">
          <li>Encryption of data in transit (TLS 1.3) and at rest (AES-256)</li>
          <li>Secure authentication with password hashing and optional two-factor authentication</li>
          <li>Regular security assessments and penetration testing</li>
          <li>Access controls and employee training</li>
          <li>Incident response procedures</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">10. Children&apos;s Privacy</h2>
        <p className="text-zinc-300">
          TaxFolio is not intended for use by individuals under 18 years of age. We do not knowingly collect personal data from children. If you believe we have collected data from a child, please contact us immediately.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">11. Changes to This Policy</h2>
        <p className="text-zinc-300">
          We may update this Privacy Policy from time to time. We will notify you of material changes by email or through a prominent notice on our website. Your continued use of TaxFolio after changes take effect constitutes acceptance of the updated policy.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">12. Contact Us</h2>
        <p className="text-zinc-300 mb-4">
          If you have questions about this Privacy Policy or our data practices, please contact us:
        </p>
        <p className="text-zinc-300">
          Email: privacy@taxfolio.uk
        </p>
      </section>
    </LegalLayout>
  )
}
