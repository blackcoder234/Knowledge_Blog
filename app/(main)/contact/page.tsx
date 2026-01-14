import { Container } from "../../components/ui/Container";
import { ContactForm } from "../../components/ContactForm";
import { FAQ } from "../../components/FAQ";

export default function ContactPage() {
  return (
    <div className="bg-background min-h-screen pt-24 pb-20">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 mb-32">
          {/* Left Column: Contact Info */}
          <div className="flex flex-col justify-center">
            <div className="mb-8 inline-block rounded-full border border-accent/20 bg-accent/5 px-4 py-1 text-sm font-medium text-accent">
              Let's Connect
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Get in Touch with <br /> the <span className="text-accent">Future</span>
            </h1>
            
            <p className="text-lg text-muted mb-12 max-w-md leading-relaxed">
              Have a question about our research? Want to collaborate on a project? 
              Or just want to say hello? We'd love to hear from you.
            </p>

            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-accent">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Chat to us</h3>
                  <p className="text-muted mb-2 text-sm">Our friendly team is here to help.</p>
                  <a href="mailto:hello@futuretech.com" className="text-white hover:text-accent font-medium transition-colors">hello@futuretech.com</a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-accent">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Visit us</h3>
                  <p className="text-muted mb-2 text-sm">Come say hello at our office HQ.</p>
                  <p className="text-white">100 Future Way, Tech City, TC 90210</p>
                </div>
              </div>

               <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-accent">
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                    </svg>
                </div>
                 <div>
                  <h3 className="text-lg font-bold text-white mb-1">Socials</h3>
                  <div className="flex gap-4 mt-2">
                    {['Twitter', 'LinkedIn', 'Instagram'].map((social) => (
                        <a key={social} href="#" className="text-sm font-medium text-muted hover:text-accent underline decoration-accent/50 underline-offset-4 transition-colors">
                            {social}
                        </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="bg-card rounded-2xl border border-white/5 p-6 md:p-10 shadow-2xl shadow-black/50">
            <ContactForm />
          </div>
        </div>

        {/* FAQ Section */}
        <FAQ />
      </Container>
    </div>
  );
}
