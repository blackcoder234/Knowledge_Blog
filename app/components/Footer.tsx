import Link from "next/link";
import { Container } from "./ui/Container";
import dbConnect from "@/lib/db";
import Setting from "@/models/Setting";

export const Footer = async () => {
  let siteTitle = "KnowledgeLog";
  let siteTagline =
    "An independent publication dedicated to clear thinking and diverse ideas.";
  let socialLinks: any = {};

  try {
    await dbConnect();
    const settings = await Setting.find({
      key: {
        $in: [
          "site_title",
          "site_tagline",
          "social_twitter",
          "social_github",
          "social_linkedin",
          "social_facebook",
          "social_instagram",
        ],
      },
    });

    settings.forEach((s) => {
      if (s.key === "site_title" && s.value) siteTitle = s.value;
      if (s.key === "site_tagline" && s.value) siteTagline = s.value;
      if (s.key.startsWith("social_") && s.value) {
        socialLinks[s.key] = s.value;
      }
    });
  } catch (err) {
    console.error("Footer fetch error", err);
  }

  return (
    <footer className="border-t border-white/10 bg-black pt-16 pb-8">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="flex flex-col gap-4">
            <Link
              href="/"
              className="text-2xl font-serif font-bold tracking-tight text-white mb-2"
            >
              {siteTitle}
            </Link>
            <p className="text-sm text-muted leading-relaxed">{siteTagline}</p>
            <div className="flex gap-4 mt-2">
              {socialLinks.social_twitter && (
                <a
                  href={socialLinks.social_twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted hover:text-white transition-colors"
                  aria-label="Twitter"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
              )}
              {socialLinks.social_github && (
                <a
                  href={socialLinks.social_github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted hover:text-white transition-colors"
                  aria-label="GitHub"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
              )}
              {socialLinks.social_facebook && (
                <a
                  href={socialLinks.social_facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted hover:text-white transition-colors"
                  aria-label="Facebook"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fillRule="evenodd"
                      d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
              )}
              {socialLinks.social_instagram && (
                <a
                  href={socialLinks.social_instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted hover:text-white transition-colors"
                  aria-label="Instagram"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772 4.902 4.902 0 011.772-1.153c.636-.247 1.363-.416 2.427-.465C9.673 2.013 10.03 2 12.315 2zm-1.087 1.778c-2.519 0-2.839.009-3.833.054-1.002.046-1.547.207-1.92.351-.497.192-.85.421-1.222.793a3.266 3.266 0 00-.793 1.222c-.144.373-.305.918-.351 1.92-.045.994-.055 1.314-.055 3.832v.22c0 2.519.009 2.839.054 3.833.046 1.002.207 1.547.351 1.92.192.497.421.85.793 1.222.372.372.825.601 1.222.793.373.144.918.305 1.92.351.994.045 1.314.055 3.832.055h.22c2.519 0 2.839-.009 3.833-.054 1.002-.046 1.547-.207 1.92-.351.497-.192.85-.421 1.222-.793.372-.372.601-.825.793-1.222.144-.373.305-.918.351-1.92.045-.994.055-1.314.055-3.832v-.22c0-2.519-.009-2.839-.054-3.833-.046-1.002-.207-1.547-.351-1.92-.192-.497-.421-.85-.793-1.222a3.266 3.266 0 00-1.222-.793c-.373-.144-.918-.305-1.92-.351-1.007-.045-1.327-.055-3.872-.055zm.812 4.416a5.356 5.356 0 110 10.712 5.356 5.356 0 010-10.712zm0 1.779a3.578 3.578 0 100 7.155 3.578 3.578 0 000-7.155zm5.333-3.97a1.189 1.189 0 110 2.378 1.189 1.189 0 010-2.378z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
              )}
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h4 className="font-bold text-white mb-6">Read</h4>
            <ul className="flex flex-col gap-3 text-sm text-muted">
              <li>
                <Link
                  href="/blog"
                  className="hover:text-accent transition-colors"
                >
                  Latest Articles
                </Link>
              </li>
              <li>
                <Link
                  href="/blog?filter=featured"
                  className="hover:text-accent transition-colors"
                >
                  Featured Essays
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="hover:text-accent transition-colors"
                >
                  Our Mission
                </Link>
              </li>
              <li>
                <Link
                  href="/archive"
                  className="hover:text-accent transition-colors"
                >
                  The Archive
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-6">Topics</h4>
            <ul className="flex flex-col gap-3 text-sm text-muted">
              <li>
                <Link
                  href="/blog?genre=Science"
                  className="hover:text-accent transition-colors"
                >
                  Science
                </Link>
              </li>
              <li>
                <Link
                  href="/blog?genre=Technology"
                  className="hover:text-accent transition-colors"
                >
                  Technology
                </Link>
              </li>
              <li>
                <Link
                  href="/blog?genre=Culture"
                  className="hover:text-accent transition-colors"
                >
                  Culture
                </Link>
              </li>
              <li>
                <Link
                  href="/blog?genre=Philosophy"
                  className="hover:text-accent transition-colors"
                >
                  Philosophy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-6">About</h4>
            <ul className="flex flex-col gap-3 text-sm text-muted">
              <li>
                <Link
                  href="/about"
                  className="hover:text-accent transition-colors"
                >
                  Who We Are
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-accent transition-colors"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-accent transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="hover:text-accent transition-colors"
                >
                  Terms of Use
                </Link>
              </li>
              <li>
                <Link
                  href="/cookies"
                  className="hover:text-accent transition-colors"
                >
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between border-t border-white/10 pt-8 text-xs text-muted">
          <p>
            &copy; {new Date().getFullYear()} KnowledgeLog. All rights reserved.
          </p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <Link
              href="/feed.xml"
              className="hover:text-white transition-colors"
            >
              RSS
            </Link>
            <Link
              href="/sitemap.xml"
              className="hover:text-white transition-colors"
            >
              Sitemap
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
};
