import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  const lastUpdated = "February 2, 2026";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Link href="/" data-testid="link-privacy-back">
          <span className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white mb-8">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </span>
        </Link>

        <h1 className="font-display text-4xl tracking-[-0.02em] text-white mt-6 mb-2" data-testid="text-privacy-title">
          Privacy Policy
        </h1>
        <p className="text-sm text-white/50 mb-10">Last updated: {lastUpdated}</p>

        <div className="space-y-8 text-white/80 text-[15px] leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Introduction</h2>
            <p>
              Welcome to Afrokaviar ("we," "our," or "us"). We are committed to protecting your privacy and ensuring 
              the security of your personal information. This Privacy Policy explains how we collect, use, disclose, 
              and safeguard your information when you use our platform — a premium Afro-futurist culture operating 
              system for the African diaspora.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Information We Collect</h2>
            <p className="mb-3">We collect information in the following ways:</p>
            <h3 className="text-lg font-medium text-white/90 mb-2">Account Information</h3>
            <p className="mb-3">
              When you create an account using social login (Google, Apple, or X), we collect:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
              <li>Your name (first and last name)</li>
              <li>Email address</li>
              <li>Profile picture (if provided by the social login provider)</li>
              <li>Unique identifier from the authentication provider</li>
            </ul>

            <h3 className="text-lg font-medium text-white/90 mb-2">Usage Information</h3>
            <p>
              We automatically collect information about how you interact with our platform, including:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Channels and content you watch or listen to</li>
              <li>Songs you purchase, favorite, or react to</li>
              <li>Library items and playback progress</li>
              <li>Device information and browser type</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. How We Use Your Information</h2>
            <p className="mb-3">We use the information we collect to:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Create and manage your account</li>
              <li>Process purchases and maintain your music library</li>
              <li>Provide access to TV channels, radio stations, and live events</li>
              <li>Personalize your experience and remember your preferences</li>
              <li>Communicate with you about your account and transactions</li>
              <li>Improve our platform and develop new features</li>
              <li>Ensure the security and integrity of our services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Payment Information</h2>
            <p>
              When you make purchases (such as buying songs at $1 each or subscribing to library storage at $5/month), 
              your payment is processed securely through Stripe. We do not store your full credit card number or 
              payment details on our servers. Stripe's privacy policy governs the collection and use of your 
              payment information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Data Storage and Security</h2>
            <p>
              Your data is stored securely using industry-standard encryption and security measures. We use 
              PostgreSQL databases with encrypted connections and secure cloud storage for uploaded content. 
              We implement appropriate technical and organizational measures to protect your personal information 
              against unauthorized access, alteration, disclosure, or destruction.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Sharing Your Information</h2>
            <p className="mb-3">We do not sell your personal information. We may share your information with:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Service Providers:</strong> Third parties who help us operate our platform (payment processors, hosting providers)</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Your Rights and Choices</h2>
            <p className="mb-3">You have the right to:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your account and associated data</li>
              <li>Opt out of marketing communications</li>
              <li>Export your data in a portable format</li>
            </ul>
            <p className="mt-3">
              To exercise these rights, please contact us at privacy@afrokaviar.com.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Cookies and Analytics</h2>
            <p>
              We use cookies and similar technologies to maintain your session, remember your preferences, 
              and analyze how our platform is used. We use analytics services to understand user behavior 
              and improve our services. You can control cookie preferences through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Children's Privacy</h2>
            <p>
              Afrokaviar is not intended for children under the age of 13. We do not knowingly collect 
              personal information from children under 13. If you believe we have collected information 
              from a child under 13, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. International Users</h2>
            <p>
              If you are accessing our platform from outside the United States, please be aware that your 
              information may be transferred to, stored, and processed in the United States or other countries 
              where our servers are located. By using our platform, you consent to this transfer.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any material changes 
              by posting the new Privacy Policy on this page and updating the "Last updated" date. We encourage 
              you to review this Privacy Policy periodically.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">12. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy or our data practices, please contact us at:
            </p>
            <p className="mt-3">
              <strong className="text-white">Afrokaviar</strong><br />
              Email: privacy@afrokaviar.com
            </p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-white/10 text-center text-sm text-white/40">
          <p>&copy; {new Date().getFullYear()} Afrokaviar. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
