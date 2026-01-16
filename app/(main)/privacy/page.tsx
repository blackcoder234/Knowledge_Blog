import { Container } from "@/app/components/ui/Container";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - KnowledgeLog",
  description:
    "Read our Privacy Policy to understand how we collect, use, and protect your data.",
};

export default function PrivacyPage() {
  return (
    <div className="bg-background min-h-screen pt-24 pb-20">
      <Container className="max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-8">
          Privacy Policy
        </h1>
        <p className="text-zinc-400 mb-12 text-lg">
          Last Updated: January 1, 2026
        </p>

        <div className="prose prose-invert prose-zinc max-w-none">
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">
              1. Introduction
            </h2>
            <p className="text-zinc-300 leading-relaxed mb-4">
              Welcome to KnowledgeLog. We respect your privacy and are committed
              to protecting your personal data. This privacy policy will inform
              you as to how we look after your personal data when you visit our
              website (regardless of where you visit it from) and tell you about
              your privacy rights and how the law protects you.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">
              2. The Data We Collect
            </h2>
            <p className="text-zinc-300 leading-relaxed mb-4">
              We may collect, use, store and transfer different kinds of
              personal data about you which we have grouped together follows:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-zinc-300 mb-4">
              <li>
                <strong>Identity Data:</strong> includes first name, last name,
                username or similar identifier.
              </li>
              <li>
                <strong>Contact Data:</strong> includes email address.
              </li>
              <li>
                <strong>Technical Data:</strong> includes internet protocol (IP)
                address, your login data, browser type and version, time zone
                setting and location, browser plug-in types and versions,
                operating system and platform.
              </li>
              <li>
                <strong>Usage Data:</strong> includes information about how you
                use our website, products and services.
              </li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">
              3. How We Use Your Data
            </h2>
            <p className="text-zinc-300 leading-relaxed mb-4">
              We will only use your personal data when the law allows us to.
              Most commonly, we will use your personal data in the following
              circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-zinc-300 mb-4">
              <li>To provide the content and services you request.</li>
              <li>
                To improve our website, products/services, marketing, and
                customer relationships.
              </li>
              <li>To manage your account and subscription.</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">4. Cookies</h2>
            <p className="text-zinc-300 leading-relaxed mb-4">
              You can set your browser to refuse all or some browser cookies, or
              to alert you when websites set or access cookies. If you disable
              or refuse cookies, please note that some parts of this website may
              become inaccessible or not function properly. For more information
              about the cookies we use, please see our{" "}
              <Link href="/cookies" className="text-accent hover:underline">
                Cookie Policy
              </Link>
              .
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">
              5. Data Security
            </h2>
            <p className="text-zinc-300 leading-relaxed mb-4">
              We have put in place appropriate security measures to prevent your
              personal data from being accidentally lost, used or accessed in an
              unauthorized way, altered or disclosed.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">
              6. Contact Us
            </h2>
            <p className="text-zinc-300 leading-relaxed mb-4">
              If you have any questions about this privacy policy or our privacy
              practices, please contact us at:{" "}
              <a
                href="mailto:privacy@knowledgelog.com"
                className="text-accent underline"
              >
                privacy@knowledgelog.com
              </a>
            </p>
          </section>
        </div>
      </Container>
    </div>
  );
}
