import { Metadata } from "next"
import { LegalLayout } from "@/components/legal/legal-layout"

export const metadata: Metadata = {
  title: "Terms of Service - TaxFolio",
  description: "Read the terms and conditions governing your use of TaxFolio's AI-powered tax preparation services.",
}

export default function TermsOfServicePage() {
  return (
    <LegalLayout title="Terms of Service" lastUpdated="30 December 2024">
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">1. Introduction</h2>
        <p className="text-zinc-300 mb-4">
          Welcome to TaxFolio. These Terms of Service (&quot;Terms&quot;) govern your access to and use of TaxFolio&apos;s website, applications, and services (collectively, the &quot;Service&quot;).
        </p>
        <p className="text-zinc-300 mb-4">
          By creating an account or using our Service, you agree to be bound by these Terms. If you do not agree to these Terms, you may not use the Service.
        </p>
        <p className="text-zinc-300">
          TaxFolio is operated by TaxFolio Ltd, a company registered in England and Wales.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">2. Service Description</h2>
        <p className="text-zinc-300 mb-4">
          TaxFolio provides an AI-powered platform to help UK freelancers and self-employed individuals:
        </p>
        <ul className="list-disc list-inside text-zinc-300 space-y-2 mb-4">
          <li>Connect bank accounts via Open Banking to import transactions</li>
          <li>Automatically categorise transactions for tax purposes using artificial intelligence</li>
          <li>Track income and expenses</li>
          <li>Generate tax summaries and reports</li>
          <li>Prepare for HMRC Self Assessment submissions</li>
        </ul>
        <p className="text-zinc-300 font-semibold">
          Important: TaxFolio is a tax preparation tool, not a tax advisory service. We do not provide tax, legal, or financial advice. You are responsible for the accuracy of your tax returns and should consult a qualified tax professional for advice specific to your circumstances.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">3. Eligibility</h2>
        <p className="text-zinc-300 mb-4">To use TaxFolio, you must:</p>
        <ul className="list-disc list-inside text-zinc-300 space-y-2">
          <li>Be at least 18 years of age</li>
          <li>Be a UK tax resident or have UK tax obligations</li>
          <li>Have the legal capacity to enter into binding contracts</li>
          <li>Provide accurate and complete registration information</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">4. Account Registration and Security</h2>
        <p className="text-zinc-300 mb-4">
          You must create an account to use TaxFolio. When creating an account, you agree to:
        </p>
        <ul className="list-disc list-inside text-zinc-300 space-y-2 mb-4">
          <li>Provide accurate, current, and complete information</li>
          <li>Maintain and update your information as needed</li>
          <li>Keep your password secure and confidential</li>
          <li>Notify us immediately of any unauthorised access to your account</li>
          <li>Accept responsibility for all activities under your account</li>
        </ul>
        <p className="text-zinc-300">
          We reserve the right to suspend or terminate accounts that violate these Terms or contain inaccurate information.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">5. Open Banking and TrueLayer</h2>
        <p className="text-zinc-300 mb-4">
          TaxFolio uses TrueLayer Ltd. to connect to your bank accounts via Open Banking. By using this feature, you:
        </p>
        <ul className="list-disc list-inside text-zinc-300 space-y-2 mb-4">
          <li>Authorise TrueLayer to access your bank account information on your behalf</li>
          <li>Acknowledge that TrueLayer&apos;s services are subject to TrueLayer&apos;s own terms and privacy policy</li>
          <li>Understand that we receive transaction and account data, not your bank login credentials</li>
          <li>Can revoke access at any time through your TaxFolio settings or directly with your bank</li>
        </ul>
        <p className="text-zinc-300">
          We are not responsible for the availability or accuracy of data provided through TrueLayer or any issues with TrueLayer&apos;s services.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">6. Subscription and Payments</h2>

        <h3 className="text-lg font-medium text-white mb-3 mt-6">6.1 Free and Paid Plans</h3>
        <p className="text-zinc-300 mb-4">
          TaxFolio offers both free and paid subscription plans. Features available depend on your subscription tier. Details of pricing and features are available on our website.
        </p>

        <h3 className="text-lg font-medium text-white mb-3 mt-6">6.2 Payment Processing</h3>
        <p className="text-zinc-300 mb-4">
          Payments are processed securely through Stripe. By subscribing to a paid plan, you authorise us to charge your payment method for the subscription fees. You agree to Stripe&apos;s terms of service for payment processing.
        </p>

        <h3 className="text-lg font-medium text-white mb-3 mt-6">6.3 Billing</h3>
        <ul className="list-disc list-inside text-zinc-300 space-y-2 mb-4">
          <li>Subscriptions are billed in advance on a monthly or annual basis</li>
          <li>Prices are in GBP and include VAT where applicable</li>
          <li>Subscriptions automatically renew unless cancelled before the renewal date</li>
          <li>We may change prices with 30 days&apos; notice</li>
        </ul>

        <h3 className="text-lg font-medium text-white mb-3 mt-6">6.4 Refunds</h3>
        <p className="text-zinc-300">
          Annual subscriptions may be refunded within 14 days of purchase if you have not substantially used the Service. Monthly subscriptions are non-refundable. Contact support@taxfolio.uk for refund requests.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">7. Acceptable Use</h2>
        <p className="text-zinc-300 mb-4">You agree not to:</p>
        <ul className="list-disc list-inside text-zinc-300 space-y-2">
          <li>Use the Service for any unlawful purpose or in violation of any laws</li>
          <li>Submit false, misleading, or fraudulent information</li>
          <li>Attempt to gain unauthorised access to our systems or other users&apos; accounts</li>
          <li>Interfere with or disrupt the Service or its infrastructure</li>
          <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
          <li>Use automated systems to access the Service without permission</li>
          <li>Share your account credentials with third parties</li>
          <li>Use the Service to commit tax fraud or evasion</li>
          <li>Resell, sublicense, or commercially exploit the Service</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">8. Intellectual Property</h2>
        <p className="text-zinc-300 mb-4">
          The Service, including its design, features, content, and underlying technology, is owned by TaxFolio and protected by intellectual property laws. You are granted a limited, non-exclusive, non-transferable licence to use the Service for its intended purpose.
        </p>
        <p className="text-zinc-300">
          You retain ownership of your data. By using the Service, you grant us a licence to use your data as necessary to provide and improve the Service, subject to our Privacy Policy.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">9. AI-Generated Content</h2>
        <p className="text-zinc-300 mb-4">
          TaxFolio uses generative artificial intelligence (Anthropic&apos;s Claude) to categorise transactions and generate tax-related insights. You acknowledge that:
        </p>
        <ul className="list-disc list-inside text-zinc-300 space-y-2 mb-4">
          <li>AI categorisations are <strong>suggestions only</strong> and may not always be accurate — AI can produce incorrect or made-up information (&quot;hallucinations&quot;)</li>
          <li>You are responsible for reviewing and verifying all AI-suggested categorisations before they are used in any HMRC submission</li>
          <li>AI-generated content does not constitute tax, legal, or financial advice</li>
          <li>You should consult a qualified tax professional for advice specific to your circumstances, particularly for complex tax situations</li>
          <li>We continuously work to improve accuracy but cannot guarantee error-free results</li>
          <li>It is your responsibility to ensure that your tax returns and HMRC submissions are accurate, regardless of AI involvement</li>
        </ul>
        <p className="text-zinc-300 mb-4">
          For details on what data is processed by AI and how, see Section 5.2 of our{" "}
          <a href="/privacy" className="text-[#00e3ec] hover:underline">Privacy Policy</a>.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">10. Disclaimer of Warranties</h2>
        <p className="text-zinc-300 mb-4">
          THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
        </p>
        <ul className="list-disc list-inside text-zinc-300 space-y-2 mb-4">
          <li>MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE</li>
          <li>ACCURACY, RELIABILITY, OR COMPLETENESS OF CONTENT</li>
          <li>UNINTERRUPTED OR ERROR-FREE OPERATION</li>
          <li>SECURITY OR FREEDOM FROM VIRUSES</li>
        </ul>
        <p className="text-zinc-300">
          We do not warrant that the Service will meet your specific requirements or that any errors will be corrected.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">11. Limitation of Liability</h2>
        <p className="text-zinc-300 mb-4">
          TO THE MAXIMUM EXTENT PERMITTED BY LAW:
        </p>
        <ul className="list-disc list-inside text-zinc-300 space-y-2 mb-4">
          <li>TAXFOLIO SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES</li>
          <li>OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM</li>
          <li>WE ARE NOT LIABLE FOR ANY TAX PENALTIES, INTEREST, OR ADDITIONAL TAX OWED TO HMRC</li>
          <li>WE ARE NOT RESPONSIBLE FOR DECISIONS MADE BASED ON SERVICE OUTPUT</li>
        </ul>
        <p className="text-zinc-300">
          Nothing in these Terms excludes or limits our liability for death or personal injury caused by negligence, fraud, or any other liability that cannot be excluded by law.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">12. Indemnification</h2>
        <p className="text-zinc-300">
          You agree to indemnify and hold harmless TaxFolio, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from your use of the Service, violation of these Terms, or infringement of any third-party rights.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">13. Termination</h2>
        <p className="text-zinc-300 mb-4">
          You may cancel your account at any time through your account settings or by contacting support.
        </p>
        <p className="text-zinc-300 mb-4">
          We may suspend or terminate your account if you:
        </p>
        <ul className="list-disc list-inside text-zinc-300 space-y-2 mb-4">
          <li>Violate these Terms</li>
          <li>Engage in fraudulent or illegal activity</li>
          <li>Fail to pay subscription fees</li>
          <li>Provide false information</li>
        </ul>
        <p className="text-zinc-300">
          Upon termination, you may request export of your data within 30 days. After this period, we may delete your data in accordance with our Privacy Policy and legal retention requirements.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">14. Changes to Terms</h2>
        <p className="text-zinc-300">
          We may modify these Terms at any time. Material changes will be notified via email or prominent notice on the Service at least 30 days before taking effect. Your continued use after changes take effect constitutes acceptance of the new Terms. If you do not agree to the changes, you must stop using the Service.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">15. Governing Law and Disputes</h2>
        <p className="text-zinc-300 mb-4">
          These Terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.
        </p>
        <p className="text-zinc-300">
          For EU consumers: You may also be entitled to bring proceedings in your country of residence and benefit from mandatory consumer protection provisions of your local law.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">16. General Provisions</h2>
        <ul className="list-disc list-inside text-zinc-300 space-y-2">
          <li><strong>Entire Agreement:</strong> These Terms, together with our Privacy Policy and Cookie Policy, constitute the entire agreement between you and TaxFolio.</li>
          <li><strong>Severability:</strong> If any provision is found unenforceable, the remaining provisions remain in effect.</li>
          <li><strong>Waiver:</strong> Failure to enforce any right does not constitute a waiver of that right.</li>
          <li><strong>Assignment:</strong> You may not assign these Terms. We may assign them to any successor entity.</li>
          <li><strong>Force Majeure:</strong> We are not liable for delays or failures due to circumstances beyond our reasonable control.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">17. Contact Us</h2>
        <p className="text-zinc-300 mb-4">
          For questions about these Terms, please contact us:
        </p>
        <p className="text-zinc-300 mb-2">
          Email: legal@taxfolio.uk
        </p>
        <p className="text-zinc-300">
          Support: support@taxfolio.uk
        </p>
      </section>
    </LegalLayout>
  )
}
