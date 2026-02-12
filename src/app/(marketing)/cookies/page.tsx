import { Metadata } from "next"
import { LegalLayout } from "@/components/legal/legal-layout"

export const metadata: Metadata = {
  title: "Cookie Policy - TaxFolio",
  description: "Learn how TaxFolio uses cookies and similar technologies on our website and services.",
}

export default function CookiePolicyPage() {
  return (
    <LegalLayout title="Cookie Policy" lastUpdated="30 December 2024">
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">1. Introduction</h2>
        <p className="text-zinc-300 mb-4">
          This Cookie Policy explains how TaxFolio (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) uses cookies and similar tracking technologies when you visit our website and use our services.
        </p>
        <p className="text-zinc-300">
          By using TaxFolio, you consent to our use of cookies in accordance with this policy. You can manage your cookie preferences as described below.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">2. What Are Cookies?</h2>
        <p className="text-zinc-300 mb-4">
          Cookies are small text files that are stored on your device (computer, tablet, or mobile phone) when you visit a website. They are widely used to make websites work more efficiently and to provide information to website owners.
        </p>
        <p className="text-zinc-300">
          Cookies can be &quot;persistent&quot; (remaining on your device until they expire or you delete them) or &quot;session&quot; cookies (deleted when you close your browser). They can be set by the website you&apos;re visiting (&quot;first-party cookies&quot;) or by third parties (&quot;third-party cookies&quot;).
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">3. How We Use Cookies</h2>
        <p className="text-zinc-300 mb-4">We use cookies for the following purposes:</p>

        <h3 className="text-lg font-medium text-white mb-3 mt-6">3.1 Essential Cookies (Strictly Necessary)</h3>
        <p className="text-zinc-300 mb-4">
          These cookies are required for the website to function properly. They cannot be disabled. They include:
        </p>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-zinc-300 text-sm">
            <thead>
              <tr className="border-b border-zinc-700">
                <th className="text-left py-2 pr-4 font-medium text-white">Cookie Name</th>
                <th className="text-left py-2 pr-4 font-medium text-white">Purpose</th>
                <th className="text-left py-2 font-medium text-white">Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-zinc-800">
                <td className="py-2 pr-4">sb-access-token</td>
                <td className="py-2 pr-4">Authentication session</td>
                <td className="py-2">Session</td>
              </tr>
              <tr className="border-b border-zinc-800">
                <td className="py-2 pr-4">sb-refresh-token</td>
                <td className="py-2 pr-4">Authentication refresh</td>
                <td className="py-2">7 days</td>
              </tr>
              <tr className="border-b border-zinc-800">
                <td className="py-2 pr-4">__stripe_mid</td>
                <td className="py-2 pr-4">Stripe fraud prevention</td>
                <td className="py-2">1 year</td>
              </tr>
              <tr className="border-b border-zinc-800">
                <td className="py-2 pr-4">__stripe_sid</td>
                <td className="py-2 pr-4">Stripe session</td>
                <td className="py-2">30 minutes</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">cookie_consent</td>
                <td className="py-2 pr-4">Stores your cookie preferences</td>
                <td className="py-2">1 year</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-lg font-medium text-white mb-3 mt-6">3.2 Functional Cookies</h3>
        <p className="text-zinc-300 mb-4">
          These cookies enhance functionality and personalisation. They may be set by us or third parties. If you disable them, some features may not work properly.
        </p>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-zinc-300 text-sm">
            <thead>
              <tr className="border-b border-zinc-700">
                <th className="text-left py-2 pr-4 font-medium text-white">Cookie Name</th>
                <th className="text-left py-2 pr-4 font-medium text-white">Purpose</th>
                <th className="text-left py-2 font-medium text-white">Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-zinc-800">
                <td className="py-2 pr-4">theme</td>
                <td className="py-2 pr-4">Remembers dark/light mode preference</td>
                <td className="py-2">1 year</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">locale</td>
                <td className="py-2 pr-4">Remembers language preference</td>
                <td className="py-2">1 year</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-lg font-medium text-white mb-3 mt-6">3.3 Analytics Cookies</h3>
        <p className="text-zinc-300 mb-4">
          These cookies help us understand how visitors use our website by collecting and reporting information anonymously. This helps us improve our services.
        </p>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-zinc-300 text-sm">
            <thead>
              <tr className="border-b border-zinc-700">
                <th className="text-left py-2 pr-4 font-medium text-white">Cookie Name</th>
                <th className="text-left py-2 pr-4 font-medium text-white">Provider</th>
                <th className="text-left py-2 pr-4 font-medium text-white">Purpose</th>
                <th className="text-left py-2 font-medium text-white">Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-zinc-800">
                <td className="py-2 pr-4">_ga</td>
                <td className="py-2 pr-4">Google Analytics</td>
                <td className="py-2 pr-4">Distinguishes users</td>
                <td className="py-2">2 years</td>
              </tr>
              <tr className="border-b border-zinc-800">
                <td className="py-2 pr-4">_ga_*</td>
                <td className="py-2 pr-4">Google Analytics</td>
                <td className="py-2 pr-4">Persists session state</td>
                <td className="py-2">2 years</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">_gid</td>
                <td className="py-2 pr-4">Google Analytics</td>
                <td className="py-2 pr-4">Distinguishes users</td>
                <td className="py-2">24 hours</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-lg font-medium text-white mb-3 mt-6">3.4 Marketing Cookies</h3>
        <p className="text-zinc-300 mb-4">
          These cookies may be set by our advertising partners to build a profile of your interests and show you relevant adverts on other sites. They do not directly store personal information but uniquely identify your browser and device.
        </p>
        <p className="text-zinc-300">
          Currently, TaxFolio does not use marketing cookies. If this changes, we will update this policy and obtain your consent where required.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">4. Third-Party Cookies</h2>
        <p className="text-zinc-300 mb-4">
          Some cookies are placed by third-party services that appear on our pages. We do not control these cookies. The third parties include:
        </p>
        <ul className="list-disc list-inside text-zinc-300 space-y-2">
          <li><strong>Stripe</strong> - Payment processing and fraud prevention</li>
          <li><strong>Google Analytics</strong> - Website analytics (if enabled)</li>
          <li><strong>TrueLayer</strong> - Open Banking connection (during bank linking only)</li>
        </ul>
        <p className="text-zinc-300 mt-4">
          Please refer to each provider&apos;s privacy policy for more information about their cookies.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">5. Similar Technologies</h2>
        <p className="text-zinc-300 mb-4">
          In addition to cookies, we may use similar technologies:
        </p>
        <ul className="list-disc list-inside text-zinc-300 space-y-2">
          <li><strong>Local Storage:</strong> Stores data in your browser for a better user experience (e.g., remembering form inputs)</li>
          <li><strong>Session Storage:</strong> Temporary storage that is cleared when you close your browser</li>
          <li><strong>Pixels/Web Beacons:</strong> Small images that help us understand how you interact with emails and our website</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">6. Managing Your Cookie Preferences</h2>
        <p className="text-zinc-300 mb-4">
          You can control and manage cookies in several ways:
        </p>

        <h3 className="text-lg font-medium text-white mb-3 mt-6">6.1 Cookie Consent Banner</h3>
        <p className="text-zinc-300 mb-4">
          When you first visit TaxFolio, you will see a cookie consent banner. You can choose to accept all cookies or customise your preferences. You can change your preferences at any time by clicking &quot;Cookie Settings&quot; in the footer.
        </p>

        <h3 className="text-lg font-medium text-white mb-3 mt-6">6.2 Browser Settings</h3>
        <p className="text-zinc-300 mb-4">
          Most browsers allow you to manage cookies through their settings. You can:
        </p>
        <ul className="list-disc list-inside text-zinc-300 space-y-2 mb-4">
          <li>Block all cookies</li>
          <li>Block third-party cookies only</li>
          <li>Delete cookies when you close your browser</li>
          <li>Clear all cookies manually</li>
        </ul>
        <p className="text-zinc-300 mb-4">
          Please note that blocking essential cookies will prevent you from using TaxFolio.
        </p>
        <p className="text-zinc-300 mb-4">
          For more information on managing cookies in your browser:
        </p>
        <ul className="list-disc list-inside text-zinc-300 space-y-2">
          <li>Chrome: support.google.com/chrome/answer/95647</li>
          <li>Firefox: support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer</li>
          <li>Safari: support.apple.com/guide/safari/manage-cookies-sfri11471</li>
          <li>Edge: support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge</li>
        </ul>

        <h3 className="text-lg font-medium text-white mb-3 mt-6">6.3 Opt-Out Tools</h3>
        <p className="text-zinc-300">
          For Google Analytics, you can install the Google Analytics Opt-out Browser Add-on: tools.google.com/dlpage/gaoptout
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">7. Legal Basis for Using Cookies</h2>
        <p className="text-zinc-300 mb-4">
          Under UK GDPR and the Privacy and Electronic Communications Regulations (PECR):
        </p>
        <ul className="list-disc list-inside text-zinc-300 space-y-2">
          <li><strong>Strictly Necessary Cookies:</strong> Do not require consent as they are essential for the service</li>
          <li><strong>Other Cookies:</strong> Require your consent before we set them</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">8. Updates to This Policy</h2>
        <p className="text-zinc-300">
          We may update this Cookie Policy to reflect changes in our practices or for legal, operational, or regulatory reasons. We will post any changes on this page and update the &quot;Last updated&quot; date. We encourage you to review this policy periodically.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-white mb-4">9. Contact Us</h2>
        <p className="text-zinc-300 mb-4">
          If you have questions about our use of cookies, please contact us:
        </p>
        <p className="text-zinc-300">
          Email: privacy@taxfolio.uk
        </p>
      </section>
    </LegalLayout>
  )
}
