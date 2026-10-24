import ContactLink from "@/components/layout/ContactLink";
import BackButton from "@/components/layout/BackButton";

export const metadata = {
  title: "Terms & Conditions — YouWorship",
  description:
    "The terms and conditions for using the YouWorship platform.",
};

const sections = [
  {
    title: "Acceptance of Terms",
    body: "By using YouWorship, you agree to these terms. If you do not agree with any part of them, please do not use the platform.",
  },
  {
    title: "Using the Service",
    body: "YouWorship is provided for personal, non-commercial worship use. You agree not to misuse the platform, attempt to disrupt it, or use it for anything unlawful.",
  },
  {
    title: "Your Account",
    body: "You are responsible for keeping your account credentials safe and for everything that happens under your account. You can delete your account at any time.",
  },
  {
    title: "Content & Copyright",
    body: "Songs, lyrics, artwork, and other content belong to their respective owners. Please respect copyright and do not redistribute content from this platform without permission.",
  },
  {
    title: "Changes to These Terms",
    body: "We may update these terms from time to time. Continued use of the platform after changes means you accept the updated terms.",
  },
  {
    title: "Contact",
    body: "Questions about these terms? Reach out through the Contact Us form and we will be happy to help.",
  },
];

export default function TermsPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
      {/* Top bar with back button */}
      <div className="sticky top-0 z-30 flex items-center gap-3 px-6 md:px-8 py-3 bg-canvas/95 backdrop-blur-md border-b border-line/35">
        <BackButton />
        <span className="text-xs font-bold text-muted uppercase tracking-wider">
          Terms &amp; Conditions
        </span>
      </div>

      <div className="px-6 md:px-8 py-10 max-w-3xl mx-auto">
        <h1 className="text-2xl font-black text-title tracking-tight">
          Terms &amp; Conditions
        </h1>
        <p className="text-xs text-muted mt-1">
          Last updated: {new Date().getFullYear()}
        </p>

        <p className="text-sm text-muted leading-relaxed mt-8">
          These terms are written in simple, everyday language so everyone can
          understand how YouWorship works.
        </p>

        <div className="mt-8 space-y-8">
          {sections.map(({ title, body }) => (
            <section key={title}>
              <h2 className="text-base font-bold text-title">{title}</h2>
              <p className="text-sm text-muted leading-relaxed mt-2">{body}</p>
            </section>
          ))}

          <section>
            <p className="text-sm text-muted leading-relaxed">
              Questions about these terms?{" "}
              <ContactLink className="text-handle hover:text-title underline underline-offset-2 transition-colors cursor-pointer" />{" "}
              and we will be happy to help.
            </p>
          </section>
        </div>
      </div>

    </div>
  );
}
