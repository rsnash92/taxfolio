import { Metadata } from "next"
import { LegalLayout } from "@/components/legal/legal-layout"

export const metadata: Metadata = {
  title: "Security - TaxFolio",
  description: "TaxFolio security policy, vulnerability disclosure, and how we protect your data.",
}

export default function SecurityPage() {
  return (
    <LegalLayout title="Security" lastUpdated="11 February 2025">
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">1. Our Commitment</h2>
        <p className="text-zinc-300 mb-4">
          TaxFolio takes the security of your financial data seriously. We handle sensitive tax
          and banking information and are committed to protecting it through industry-standard
          security practices.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">2. Data Protection</h2>
        <ul className="list-disc list-inside text-zinc-300 space-y-2 mb-4">
          <li>All data is encrypted in transit using TLS 1.2+</li>
          <li>Data at rest is encrypted using AES-256</li>
          <li>Authentication is handled via Supabase Auth with support for two-factor authentication (2FA)</li>
          <li>HMRC API access uses OAuth 2.0 with short-lived tokens that are refreshed automatically</li>
          <li>Open Banking connections via TrueLayer use OAuth 2.0 with time-limited access tokens</li>
          <li>We never store your HMRC or bank passwords</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">3. HMRC Compliance</h2>
        <p className="text-zinc-300 mb-4">
          TaxFolio complies with HMRC&apos;s fraud prevention requirements for Making Tax Digital.
          We collect and transmit device information headers as required by HMRC on all API
          submissions. These headers help HMRC detect and prevent fraudulent tax submissions.
        </p>
        <p className="text-zinc-300 mb-4">
          For details on what data is collected, see our{" "}
          <a href="/privacy" className="text-[#00e3ec] hover:underline">Privacy Policy</a>.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">4. Infrastructure</h2>
        <ul className="list-disc list-inside text-zinc-300 space-y-2 mb-4">
          <li>Hosted on Vercel with automatic DDoS protection</li>
          <li>Database hosted on Supabase (AWS eu-west-2, London) with Row Level Security (RLS)</li>
          <li>No direct database access from the client — all operations go through authenticated API routes</li>
          <li>Environment secrets are stored in Vercel&apos;s encrypted environment variable store</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">5. Vulnerability Disclosure</h2>
        <p className="text-zinc-300 mb-4">
          If you believe you have found a security vulnerability in TaxFolio, we encourage
          responsible disclosure. Please report it to us so we can address it promptly.
        </p>
        <p className="text-zinc-300 mb-4">
          <strong className="text-white">Email:</strong>{" "}
          <a href="mailto:security@taxfolio.uk" className="text-[#00e3ec] hover:underline">
            security@taxfolio.uk
          </a>
        </p>
        <p className="text-zinc-300 mb-4">
          When reporting a vulnerability, please include:
        </p>
        <ul className="list-disc list-inside text-zinc-300 space-y-2 mb-4">
          <li>A description of the vulnerability and its potential impact</li>
          <li>Steps to reproduce the issue</li>
          <li>Any relevant screenshots or proof-of-concept code</li>
        </ul>
        <p className="text-zinc-300 mb-4">
          We will acknowledge your report within 48 hours and aim to provide an initial
          assessment within 5 business days.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">6. Contact</h2>
        <p className="text-zinc-300 mb-4">
          For security concerns:{" "}
          <a href="mailto:security@taxfolio.uk" className="text-[#00e3ec] hover:underline">
            security@taxfolio.uk
          </a>
        </p>
        <p className="text-zinc-300 mb-4">
          For general support:{" "}
          <a href="mailto:support@taxfolio.uk" className="text-[#00e3ec] hover:underline">
            support@taxfolio.uk
          </a>
        </p>
        <p className="text-zinc-300">
          Our security.txt file is available at{" "}
          <a href="/.well-known/security.txt" className="text-[#00e3ec] hover:underline">
            /.well-known/security.txt
          </a>
        </p>
      </section>
    </LegalLayout>
  )
}
