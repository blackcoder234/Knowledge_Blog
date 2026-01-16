import { Container } from "@/app/components/ui/Container";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - KnowledgeLog",
  description:
    "Comprehensive details on how KnowledgeLog collects, stores, and protects user data, including Google Auth, newsletter subscriptions, and analytics.",
};

export default function PrivacyPage() {
  return (
    <div className="bg-background min-h-screen pt-24 pb-20">
      <Container className="max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-8">
          Privacy Policy
        </h1>
        <p className="text-zinc-400 mb-12 text-lg">
          Last Updated: February 2nd, 2026
        </p>

        <div className="prose prose-invert prose-zinc max-w-none">
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">
              1. Introduction
            </h2>
            <p className="text-zinc-300 leading-relaxed mb-4">
              At KnowledgeLog, we prioritize the privacy and security of our
              readers. This Privacy Policy outlines the types of personal
              information we collect, how it is used, and the steps we take to
              safeguard it. By accessing <strong>knowledgelog.blog</strong>, you
              agree to the practices described in this policy.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">
              2. Information We Collect
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">
                  A. Information You Voluntarily Provide
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-zinc-300">
                  <li>
                    <strong>Newsletter Subscription:</strong> When you subscribe
                    to our weekly digest, we collect your email address to send
                    you updates. We do not sell this list to third parties.
                  </li>
                  <li>
                    <strong>User Accounts:</strong> If you sign in via Google
                    Authentication (NextAuth), we collect your name, email
                    address, and profile picture to create your user profile and
                    facilitate features like commenting and bookmarking.
                  </li>
                  <li>
                    <strong>Communications:</strong> If you contact us directly
                    via our contact form, we collect your name, email, and the
                    contents of your message.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-2">
                  B. Information Collected Automatically
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-zinc-300">
                  <li>
                    <strong>Log Data:</strong> Like most websites, we collect
                    log files that include IP addresses, browser type, ISP,
                    date/time stamps, and referring pages. This helps us analyze
                    trends and improve site performance.
                  </li>
                  <li>
                    <strong>Cookies:</strong> We use cookies to maintain your
                    session (if logged in) and to remember your preferences. See
                    our{" "}
                    <Link
                      href="/cookies"
                      className="text-accent hover:underline"
                    >
                      Cookie Policy
                    </Link>{" "}
                    for more details.
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">
              3. How We Use Your Information
            </h2>
            <p className="text-zinc-300 leading-relaxed mb-4">
              We use the collected data for the following specific purposes:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-zinc-300">
              <li>To provide, operate, and maintain knowledgelog.blog.</li>
              <li>
                To improve user experience by analyzing how you use our website.
              </li>
              <li>
                To communicate with you, specifically via our newsletter (if
                subscribed) or to respond to inquiries.
              </li>
              <li>To prevent fraud and ensure the security of our platform.</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">
              4. Third-Party Services & Data Sharing
            </h2>
            <p className="text-zinc-300 leading-relaxed mb-4">
              We rely on trusted third-party providers to run our services. We
              ensure these partners adhere to strict data protection standards:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-zinc-300">
              <li>
                <strong>Google (OAuth):</strong> Used for secure authentication.
                Their privacy policy applies to your Google account data.
              </li>
              <li>
                <strong>MongoDB (Database):</strong> Used to securely store user
                profiles, comments, and post data.
              </li>
              <li>
                <strong>Vercel (Hosting):</strong> Our infrastructure provider
                processing web requests.
              </li>
            </ul>
            <p className="text-zinc-300 leading-relaxed mt-4">
              We <strong>never</strong> sell your personal data to advertisers
              or data brokers.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">
              5. Data Retention & Deletion
            </h2>
            <p className="text-zinc-300 leading-relaxed mb-4">
              We retain your personal information only for as long as is
              necessary to fulfill the purposes outlined in this Privacy Policy.
            </p>
            <p className="text-zinc-300 leading-relaxed">
              <strong>Right to Forget:</strong> You may request the deletion of
              your account and associated data (comments, profile info) at any
              time by contacting us at{" "}
              <a
                href="mailto:privacy@knowledgelog.blog"
                className="text-accent underline"
              >
                privacy@knowledgelog.blog
              </a>
              . We will process your request within 30 days.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">
              6. Children's Privacy
            </h2>
            <p className="text-zinc-300 leading-relaxed mb-4">
              KnowledgeLog does not knowingly collect any Personal Identifiable
              Information from children under the age of 13. If you think that
              your child provided this kind of information on our website, we
              strongly encourage you to contact us immediately, and we will do
              our best efforts to promptly remove such information.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">
              7. Changes to This Policy
            </h2>
            <p className="text-zinc-300 leading-relaxed mb-4">
              We may update our Privacy Policy from time to time. We will notify
              you of any changes by posting the new Privacy Policy on this page
              and updating the "Last Updated" date.
            </p>
          </section>

          <section className="border-t border-white/10 pt-8 mt-12">
            <h2 className="text-xl font-bold text-white mb-2">Contact Us</h2>
            <p className="text-zinc-400">
              If you have any questions about this Privacy Policy, please
              contact us at:
            </p>
            <a
              href="mailto:legal@knowledgelog.blog"
              className="text-2xl md:text-3xl font-serif text-accent hover:text-white transition-colors mt-4 inline-block"
            >
              legal@knowledgelog.blog
            </a>
          </section>
        </div>
      </Container>
    </div>
  );
}
