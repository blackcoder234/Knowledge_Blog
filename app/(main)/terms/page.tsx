import { Container } from "@/app/components/ui/Container";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use | KnowledgeLog",
  description:
    "Terms outlining the rules for using KnowledgeLog, including content ownership, user conduct, and liability disclaimers.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsPage() {
  return (
    <div className="bg-background min-h-screen pt-24 pb-20">
      <Container className="max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-8">
          Terms of Use
        </h1>
        <p className="text-zinc-400 mb-12 text-lg">
          Last Updated: February 2nd, 2026
        </p>

        <div className="prose prose-invert prose-zinc max-w-none">
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="text-zinc-300 leading-relaxed mb-4">
              By accessing and using <strong>knowledgelog.blog</strong> (the
              "Site"), you accept and agree to be bound by the terms and
              provision of this agreement. In addition, when using this Site's
              particular services, you shall be subject to any posted guidelines
              or rules applicable to such services.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">
              2. Intellectual Property
            </h2>
            <p className="text-zinc-300 leading-relaxed mb-4">
              <strong>Our Content:</strong> All content published on this Site,
              including articles, images, logos, graphics, and code, is the
              intellectual property of KnowledgeLog (or its licensors) and is
              protected by copyright laws. You may not republish, sell, rent, or
              sub-license material from the website without our explicit written
              permission.
            </p>
            <p className="text-zinc-300 leading-relaxed">
              <strong>Your License to Us:</strong> By posting comments or
              submitting content to the Site, you grant KnowledgeLog a
              non-exclusive, royalty-free license to use, reproduce, and edit
              your comments in the context of the discussion threads.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">
              3. User Conduct
            </h2>
            <p className="text-zinc-300 leading-relaxed mb-4">
              If you create an account or post comments, you are responsible for
              maintaining the security of your account and for all activities
              that occur under it. You agree NOT to use the Site to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-zinc-300">
              <li>
                Upload or distribute content that is unlawful, defamatory,
                harassing, abusive, fraudulent, or obscene.
              </li>
              <li>Upload viruses or malicious code.</li>
              <li>
                Attempt to gain unauthorized access to our servers or user
                accounts.
              </li>
              <li>Engage in spamming or excessive commercial promotion.</li>
            </ul>
            <p className="text-zinc-300 leading-relaxed mt-4">
              We reserve the right to{" "}
              <strong>terminate or suspend access</strong> to our service
              immediately, without prior notice or liability, for any reason
              whatsoever, including without limitation if you breach the Terms.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">
              4. Disclaimer of Warranties
            </h2>
            <p className="text-zinc-300 leading-relaxed mb-4">
              The Site is provided on an "AS IS" and "AS AVAILABLE" basis.
              KnowledgeLog makes no representations or warranties of any kind,
              express or implied, as to the operation of the Site or the
              information, content, materials, or products included on this
              Site. You expressly agree that your use of this Site is at your
              sole risk.
            </p>
            <p className="text-zinc-300 leading-relaxed">
              While we strive for accuracy in our editorial content, we do not
              guarantee that all information is complete, accurate, or
              up-to-date.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">
              5. Limitation of Liability
            </h2>
            <p className="text-zinc-300 leading-relaxed mb-4">
              In no event shall KnowledgeLog, nor its directors, employees,
              partners, agents, suppliers, or affiliates, be liable for any
              indirect, incidental, special, consequential or punitive damages,
              including without limitation, loss of profits, data, use,
              goodwill, or other intangible losses, resulting from (i) your
              access to or use of or inability to access or use the Service;
              (ii) any conduct or content of any third party on the Service.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">
              6. Governing Law
            </h2>
            <p className="text-zinc-300 leading-relaxed mb-4">
              These Terms shall be governed and construed in accordance with the
              laws of India, without regard to its conflict of law provisions.
            </p>
          </section>

          <section className="border-t border-white/10 pt-8 mt-12">
            <h2 className="text-xl font-bold text-white mb-2">Legal Contact</h2>
            <p className="text-zinc-400">
              For any legal concerns or notices, please reach out to:
            </p>
            <a
              href="mailto:contact.knowledgelog@gmail.com"
              className="text-2xl md:text-3xl font-serif text-accent hover:text-white transition-colors mt-4 inline-block"
            >
              contact.knowledgelog@gmail.com
            </a>
          </section>
        </div>
      </Container>
    </div>
  );
}
