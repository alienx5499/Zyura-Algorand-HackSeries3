import ContactUs1 from "@/components/mvpblocks/contact-us-1";
import { ZyuraFooter } from "@/components/ui/zyura-footer";

export function LandingContactSection() {
  return (
    <>
      <section
        id="contact"
        data-section="contact"
        className="w-full bg-black py-10 md:py-12 px-4 relative overflow-hidden"
      >
        <div className="container mx-auto">
          <div className="text-center mb-10 md:mb-12">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white via-neutral-100 to-neutral-400 relative z-30">
              Get in Touch
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-b from-purple-400 via-pink-400 to-cyan-400">
                Contact Us
              </span>
            </h2>
            <p className="text-lg md:text-xl text-neutral-300 max-w-3xl mx-auto">
              Ready to experience instant, automated flight delay protection?
              Get in touch to learn more about ZYURA or become a partner.
            </p>
          </div>
        </div>
        <ContactUs1 />
      </section>

      <section id="footer" className="relative bg-black py-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <ZyuraFooter />
        </div>
      </section>
    </>
  );
}
