import { Container } from "@/app/components/ui/Container";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy - KnowledgeLog",
  description:
    "Explanation of the specific cookies used by KnowledgeLog, primarily for authentication and essential site functionality.",
};

export default function CookiesPage() {
  return (
    <div className="bg-background min-h-screen pt-24 pb-20">
      <Container className="max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-8">
          Cookie Policy
        </h1>
        <p className="text-zinc-400 mb-12 text-lg">
          Last Updated: February 2nd, 2026
        </p>

        <div className="prose prose-invert prose-zinc max-w-none">
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">
              1. What Are Cookies?
            </h2>
            <p className="text-zinc-300 leading-relaxed mb-4">
              Cookies are small text files placed on your device by websites you
              visit. They are widely used to make websites work more efficiently
              and to provide information to the owners of the site. At
              KnowledgeLog, we keep our use of cookies to a strict minimum,
              focusing on functionality rather than tracking.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">
              2. Cookies We Use
            </h2>
            <p className="text-zinc-300 leading-relaxed mb-4">
              We primarily use cookies for{" "}
              <strong>Essential Functionality</strong>. Here is a breakdown:
            </p>

            <div className="space-y-6">
              <div className="bg-zinc-900 border border-white/5 p-6 rounded-xl">
                <h3 className="text-xl font-bold text-white mb-2 text-accent">
                  Essential / Strictly Necessary
                </h3>
                <p className="text-zinc-300 mb-4">
                  These cookies are required for the website to function. They
                  cannot be switched off.
                </p>
                <ul className="list-disc pl-6 space-y-2 text-zinc-400 text-sm">
                  <li>
                    <strong className="text-white">
                      next-auth.session-token
                    </strong>
                    : Used by our authentication system to keep you logged in
                    securely.
                  </li>
                  <li>
                    <strong className="text-white">next-auth.csrf-token</strong>
                    : Used to prevent Cross-Site Request Forgery (CSRF) attacks,
                    protecting your account.
                  </li>
                  <li>
                    <strong className="text-white">
                      next-auth.callback-url
                    </strong>
                    : Redirects you to the correct page after you log in.
                  </li>
                </ul>
              </div>

              <div className="bg-zinc-900 border border-white/5 p-6 rounded-xl">
                <h3 className="text-xl font-bold text-white mb-2">
                  Performance & Analytics (Optional)
                </h3>
                <p className="text-zinc-300 mb-4">
                  We verify site traffic to understand which articles are
                  popular. We do not use invasive ad-tracking pixels.
                </p>
                <ul className="list-disc pl-6 space-y-2 text-zinc-400 text-sm">
                  <li>
                    <strong className="text-white">_vercel_insights</strong>:
                    Anonymous analytics provided by our hosting platform to
                    measure site speed and visitor counts.
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">
              3. Managing Cookies
            </h2>
            <p className="text-zinc-300 leading-relaxed mb-4">
              Most web browsers allow some control of most cookies through the
              browser settings. To find out more about cookies, including how to
              see what cookies have been set and how to manage and delete them,
              visit{" "}
              <a
                href="https://www.aboutcookies.org"
                target="_blank"
                className="text-accent hover:underline"
              >
                www.aboutcookies.org
              </a>{" "}
              or{" "}
              <a
                href="https://www.allaboutcookies.org"
                target="_blank"
                className="text-accent hover:underline"
              >
                www.allaboutcookies.org
              </a>
              .
            </p>
            <p className="text-zinc-300 leading-relaxed">
              Please note: Deleting the <strong>next-auth.session-token</strong>{" "}
              cookie will log you out of your account immediately.
            </p>
          </section>

          <section className="border-t border-white/10 pt-8 mt-12">
            <h2 className="text-xl font-bold text-white mb-2">Questions?</h2>
            <p className="text-zinc-400">
              If you have any questions about our use of cookies, please email:
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
