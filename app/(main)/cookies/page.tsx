import { Container } from "@/app/components/ui/Container";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy - KnowledgeLog",
  description:
    "Learn about how KnowledgeLog uses cookies and similar technologies.",
};

export default function CookiesPage() {
  return (
    <div className="bg-background min-h-screen pt-24 pb-20">
      <Container className="max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-8">
          Cookie Policy
        </h1>
        <p className="text-zinc-400 mb-12 text-lg">
          Last Updated: January 1, 2026
        </p>

        <div className="prose prose-invert prose-zinc max-w-none">
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">
              1. Use of Cookies
            </h2>
            <p className="text-zinc-300 leading-relaxed mb-4">
              A "cookie" is a string of information which assigns you a unique
              identification that a website stores on your computer. Your
              browser then provides that unique identification to use each time
              you submit a query to the Site. We use cookies on the Site to,
              among other things, keep track of services you have used, record
              registration information, record your user preferences, keep you
              logged into the Site, facilitate purchase procedures, and track
              the pages you visit. Cookies help us understand how the Site is
              being used and improve your user experience.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">
              2. Types of Cookies
            </h2>
            <p className="text-zinc-300 leading-relaxed mb-4">
              The following types of cookies may be used when you visit the
              Site:
            </p>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Advertising Cookies
                </h3>
                <p className="text-zinc-300">
                  Advertisers and ad servers may place cookies on your computer
                  to display advertisements that are most likely to be of
                  interest to you. These cookies allow advertisers and ad
                  servers to gather information about your visits to the Site
                  and other websites, alternate the ads sent to a specific
                  computer, and track how often an ad has been viewed and by
                  whom.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Analytics Cookies
                </h3>
                <p className="text-zinc-300">
                  Analytics cookies monitor how users reached the Site, and how
                  they interact with and move around once on the Site. These
                  cookies let us know what features on the Site are working the
                  best and what features on the Site can be improved.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Personalization Cookies
                </h3>
                <p className="text-zinc-300">
                  Personalization cookies are used to recognize repeat visitors
                  to the Site. We use these cookies to record your browsing
                  history, the pages you have visited, and your settings and
                  preferences each time you visit the Site.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Security Cookies
                </h3>
                <p className="text-zinc-300">
                  Security cookies help identify and prevent security risks. We
                  use these cookies to authenticate users and protect user data
                  from unauthorized parties.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">
              3. Control of Cookies
            </h2>
            <p className="text-zinc-300 leading-relaxed mb-4">
              Most browsers are set to accept cookies by default. However, you
              can remove or reject cookies in your browser’s settings. Please be
              aware that such action could affect the availability and
              functionality of the Site.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">
              4. Privacy Policy
            </h2>
            <p className="text-zinc-300 leading-relaxed mb-4">
              For more information about how we use information collected by
              cookies and other tracking technologies, please refer to our{" "}
              <Link href="/privacy" className="text-accent hover:underline">
                Privacy Policy
              </Link>{" "}
              posted on the Site. This Cookie Policy is part of and is
              incorporated into our Privacy Policy. By using the Site, you agree
              to be bound by this Cookie Policy and our Privacy Policy.
            </p>
          </section>
        </div>
      </Container>
    </div>
  );
}
