import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Terms() {
  const lastUpdated = "February 2, 2026";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Link href="/" data-testid="link-terms-back">
          <span className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white mb-8">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </span>
        </Link>

        <h1 className="font-display text-4xl tracking-[-0.02em] text-white mt-6 mb-2" data-testid="text-terms-title">
          Terms and Conditions
        </h1>
        <p className="text-sm text-white/50 mb-10">Last updated: {lastUpdated}</p>

        <div className="space-y-8 text-white/80 text-[15px] leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Afrokaviar ("the Platform"), you agree to be bound by these Terms and Conditions. 
              If you do not agree to these terms, please do not use our services. These terms constitute a legally 
              binding agreement between you and Afrokaviar.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Description of Services</h2>
            <p className="mb-3">
              Afrokaviar is a premium Afro-futurist culture operating system for the African diaspora, offering:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Radio & TV:</strong> Access to 70+ African radio stations and TV channels</li>
              <li><strong>Music:</strong> Curated music catalogue with songs available for $1 each</li>
              <li><strong>Social:</strong> Public space for collaborators to share and discover music</li>
              <li><strong>Library:</strong> Personal cloud storage for your music collection ($5/month for 50GB)</li>
              <li><strong>Live Events:</strong> Access to upcoming live streaming events and artist premieres</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Account Registration</h2>
            <p className="mb-3">
              To access certain features, you must create an account using social login (Google, Apple, or X/Twitter). 
              By creating an account, you agree to:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Notify us immediately of any unauthorized use</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Purchases and Payments</h2>
            <p className="mb-3">
              All payments are processed securely through Stripe. By making a purchase, you agree to the following:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4 mb-3">
              <li><strong>Song Purchases:</strong> Songs are priced at $1 each. Once purchased, you own a perpetual license to stream and download the song</li>
              <li><strong>Library Storage:</strong> Cloud storage is available at $5 per month for 50GB. Subscription renews automatically unless cancelled</li>
              <li><strong>No Refunds:</strong> Due to the digital nature of our products, all sales are final. Refunds may be considered on a case-by-case basis for technical issues</li>
            </ul>
            <p>
              You agree to pay all applicable fees and taxes. Prices are subject to change with reasonable notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Content and Intellectual Property</h2>
            <p className="mb-3">
              All content on the Platform, including music, videos, graphics, and text, is protected by intellectual 
              property rights. You agree to:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Not reproduce, distribute, or create derivative works without authorization</li>
              <li>Use purchased content only for personal, non-commercial purposes</li>
              <li>Not circumvent any digital rights management or access controls</li>
              <li>Respect the intellectual property rights of artists and content creators</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. User-Generated Content</h2>
            <p className="mb-3">
              When uploading content to the Social or Library sections, you:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Retain ownership of your original content</li>
              <li>Grant Afrokaviar a non-exclusive license to host and display your content</li>
              <li>Warrant that you have the rights to upload and share the content</li>
              <li>Agree not to upload illegal, infringing, or harmful content</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Acceptable Use</h2>
            <p className="mb-3">You agree not to:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Use the Platform for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to any part of the Platform</li>
              <li>Interfere with or disrupt the Platform's operation</li>
              <li>Use automated tools to scrape or collect data</li>
              <li>Impersonate any person or entity</li>
              <li>Upload viruses, malware, or other harmful code</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Streaming and Availability</h2>
            <p>
              Radio and TV channels are sourced from third-party providers. While we strive to ensure availability, 
              we cannot guarantee uninterrupted access to all channels. Channel availability may vary by region, 
              and some channels may become unavailable without notice. We are not responsible for third-party 
              content streamed through the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account at any time for violations of these terms 
              or for any other reason at our discretion. Upon termination, your right to use the Platform will 
              immediately cease. Purchased content licenses may survive termination for personal use.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Disclaimers</h2>
            <p>
              The Platform is provided "as is" without warranties of any kind, either express or implied. We do 
              not warrant that the Platform will be uninterrupted, error-free, or free of harmful components. 
              Your use of the Platform is at your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, Afrokaviar shall not be liable for any indirect, incidental, 
              special, consequential, or punitive damages arising from your use of the Platform. Our total 
              liability shall not exceed the amount you paid to us in the twelve months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">12. Changes to Terms</h2>
            <p>
              We may modify these terms at any time. We will notify you of significant changes by posting the 
              updated terms on the Platform. Your continued use of the Platform after such changes constitutes 
              acceptance of the modified terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">13. Governing Law</h2>
            <p>
              These terms shall be governed by and construed in accordance with applicable laws. Any disputes 
              arising from these terms or your use of the Platform shall be resolved through binding arbitration 
              or in a court of competent jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">14. Contact Information</h2>
            <p>
              If you have any questions about these Terms and Conditions, please contact us through the Platform 
              or visit our website at afrokaviar.com for support options.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 text-sm text-white/50">
          <p>
            By using Afrokaviar, you acknowledge that you have read, understood, and agree to be bound by 
            these Terms and Conditions. Thank you for being part of the Afrokaviar community.
          </p>
        </div>
      </div>
    </div>
  );
}
