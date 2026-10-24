import ContactLink from "@/components/layout/ContactLink";
import BackButton from "@/components/layout/BackButton";

export const metadata = {
  title: "Privacy Policy — YouWorship",
  description:
    "How YouWorship collects, uses, and protects your information.",
};

const sections = [
  {
    title: "Information We Collect",
    body: "YouWorship is a worship music platform. We only collect the information you choose to share with us, such as your name and email address when you create an account, send feedback, or request a song. We also collect limited technical information (such as your device type and browser) so the site works correctly.",
  },
  {
    title: "How We Use Your Information",
    body: "Your information is used to provide and improve the service — for example, to save your favorites and playlists, to respond to your requests and feedback, to keep the platform safe and working properly, and to understand how visitors use the site. We do not sell your personal information to anyone.",
  },
  {
    title: "Cookies & Advertising",
    body: "We use cookies and basic analytics to understand how visitors use the site so we can improve it. If we display advertisements, we may use third-party advertising services (such as Google AdSense) that use cookies or similar technologies to serve ads and measure their performance. These advertising partners may use cookies to show ads based on your visits to this and other websites. You can opt out of personalised advertising from Google by visiting Google Ads Settings, and you can control cookies in your browser settings at any time.",
  },
  {
    title: "Third-Party Services",
    body: "YouWorship uses third-party services such as YouTube, Google, and Firebase. These services have their own privacy policies and terms.",
  },
  {
    title: "Google User Data & Limited Use",
    body: "When you sign in with Google, we access basic profile information such as your name, email address, and profile photo, solely to create and manage your YouWorship account. YouWorship's use and transfer of information received from Google APIs adheres to the Google API Services User Data Policy, including the Limited Use requirements. We do not use this data for advertising, and we do not share it with third parties except as necessary to provide YouWorship's core features.",
  },
  {
    title: "Data Security",
    body: "We take reasonable steps to protect your information from loss, misuse, and unauthorised access. No method of transmission over the internet is completely secure, so we cannot guarantee absolute security.",
  },
  {
    title: "Data Retention",
    body: "We retain your account information for as long as your account is active. If you delete your account, we remove your personal information within a reasonable time, except where we are required to retain certain data for legal or security purposes.",
  },
  {
    title: "Your Rights & Choices",
    body: "You can contact us at any time to ask what information we hold about you, or to ask us to update or delete it. You can also manage or delete your account directly from the app.",
  },
  {
    title: "Changes to This Policy",
    body: "We may update this Privacy Policy from time to time to reflect changes in our practices or for legal reasons. If we make significant changes, we will update the 'Last updated' date above and, where appropriate, notify you within the app.",
  },
  {
    title: "Children's Privacy",
    body: "YouWorship is a family-friendly worship platform. We do not knowingly collect personal information from children under 13 (or under 16 in regions where a higher age applies, such as the EU/UK). If you believe a child has provided us with personal information, please contact us and we will delete it.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
      {/* Top bar with back button */}
      <div className="sticky top-0 z-30 flex items-center gap-3 px-6 md:px-8 py-3 bg-canvas/95 backdrop-blur-md border-b border-line/35">
        <BackButton />
        <span className="text-xs font-bold text-muted uppercase tracking-wider">
          Privacy Policy
        </span>
      </div>

      <div className="px-6 md:px-8 py-10 max-w-3xl mx-auto">
        <h1 className="text-2xl font-black text-title tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-xs text-muted mt-1">
          Last updated: August 15, 2026
        </p>

        <p className="text-sm text-muted leading-relaxed mt-8">
          This policy explains in plain words what information YouWorship
          collects, how it is used, and the choices you have.
        </p>

        <div className="mt-8 space-y-8">
          {sections.map(({ title, body }) => (
            <section
              key={title}
              id={title === "Third-Party Services" ? "third-party" : undefined}
            >
              <h2 className="text-base font-bold text-title">{title}</h2>
              <p className="text-sm text-muted leading-relaxed mt-2">{body}</p>
            </section>
          ))}
        </div>

        <section id="contact" className="mt-12 pt-8 border-t border-line/40">
          <h2 className="text-base font-bold text-title">Contact Us</h2>
          <p className="text-sm text-muted leading-relaxed mt-2">
            Questions about this policy or your data? Use the{" "}
            <ContactLink className="text-handle hover:text-title underline underline-offset-2 transition-colors cursor-pointer" />{" "}
            form in the app, and we will respond as soon as we can.
          </p>
        </section>

        <section id="copyright" className="mt-12 pt-8 border-t border-line/40">
          <h2 className="text-base font-bold text-title">Copyright</h2>
          <p className="text-sm text-muted leading-relaxed mt-2">
            © {new Date().getFullYear()} YouWorship. All rights reserved. All
            songs, lyrics, artwork, and content on this platform remain the
            property of their respective owners and are shared here for
            worship purposes.
          </p>
        </section>
      </div>

    </div>
  );
}
