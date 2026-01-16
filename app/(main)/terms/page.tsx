import { Container } from "@/app/components/ui/Container";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use - KnowledgeLog",
  description:
    "Read our Terms of Use to understand the rules and regulations for using KnowledgeLog.",
};

export default function TermsPage() {
  return (
    <div className="bg-background min-h-screen pt-24 pb-20">
      <Container className="max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-8">
          Terms of Use
        </h1>
        <p className="text-zinc-400 mb-12 text-lg">
          Last Updated: January 1, 2026
        </p>

        <div className="prose prose-invert prose-zinc max-w-none">
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">
              1. Agreement to Terms
            </h2>
            <p className="text-zinc-300 leading-relaxed mb-4">
              These Terms of Use constitute a legally binding agreement made
              between you, whether personally or on behalf of an entity (“you”)
              and KnowledgeLog (“we,” “us” or “our”), concerning your access to
              and use of the KnowledgeLog website as well as any other media
              form, media channel, mobile website or mobile application related,
              linked, or otherwise connected thereto (collectively, the “Site”).
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">
              2. Intellectual Property Rights
            </h2>
            <p className="text-zinc-300 leading-relaxed mb-4">
              Unless otherwise indicated, the Site is our proprietary property
              and all source code, databases, functionality, software, website
              designs, audio, video, text, photographs, and graphics on the Site
              (collectively, the “Content”) and the trademarks, service marks,
              and logos contained therein (the “Marks”) are owned or controlled
              by us or licensed to us, and are protected by copyright and
              trademark laws.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">
              3. User Representations
            </h2>
            <p className="text-zinc-300 leading-relaxed mb-4">
              By using the Site, you represent and warrant that: (1) all
              registration information you submit will be true, accurate,
              current, and complete; (2) you will maintain the accuracy of such
              information and promptly update such registration information as
              necessary; (3) you have the legal capacity and you agree to comply
              with these Terms of Use.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">
              4. Prohibited Activities
            </h2>
            <p className="text-zinc-300 leading-relaxed mb-4">
              You may not access or use the Site for any purpose other than that
              for which we make the Site available. The Site may not be used in
              connection with any commercial endeavors except those that are
              specifically endorsed or approved by us.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">
              5. Disclaimer
            </h2>
            <p className="text-zinc-300 leading-relaxed mb-4">
              The site is provided on an as-is and as-available basis. You agree
              that your use of the site and our services will be at your sole
              risk. To the fullest extent permitted by law, we disclaim all
              warranties, express or implied, in connection with the site and
              your use thereof.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">
              6. Contact Us
            </h2>
            <p className="text-zinc-300 leading-relaxed mb-4">
              In order to resolve a complaint regarding the Site or to receive
              further information regarding use of the Site, please contact us
              at:{" "}
              <a
                href="mailto:legal@knowledgelog.com"
                className="text-accent underline"
              >
                legal@knowledgelog.com
              </a>
            </p>
          </section>
        </div>
      </Container>
    </div>
  );
}
