import Link from "next/link";
import type { Metadata } from "next";
import { SectionHeading } from "@/components/portfolio/section-heading";
import { ContactForm } from "@/features/contact/contact-form";
import { getContactInfo } from "@/features/about/queries";

export const metadata: Metadata = {
  title: "Contact",
  description: "Hubungi saya untuk kolaborasi atau pertanyaan.",
};

export default async function ContactPage() {
  const contact = await getContactInfo();

  return (
    <div className="container-editorial py-16">
      <SectionHeading
        index="05 / CONTACT"
        title="Contact"
        lead="Punya proyek atau pertanyaan? Kirim pesan langsung melalui form di bawah ini."
      />

      <div className="grid gap-12 sm:grid-cols-[1fr_1.2fr]">
        <div>
          {contact?.email && (
            <div className="mb-6">
              <h2 className="index-label mb-2">EMAIL</h2>
              <Link href={`mailto:${contact.email}`} className="text-lg underline underline-offset-4">
                {contact.email}
              </Link>
            </div>
          )}
          {contact?.location && (
            <div className="mb-6">
              <h2 className="index-label mb-2">LOCATION</h2>
              <p>{contact.location}</p>
            </div>
          )}
          {contact?.socialLinks && contact.socialLinks.length > 0 && (
            <div>
              <h2 className="index-label mb-2">SOCIAL</h2>
              <ul className="space-y-1">
                {contact.socialLinks.map((link) => (
                  <li key={link.id}>
                    <Link href={link.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                      {link.label} ↗
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <ContactForm />
      </div>
    </div>
  );
}
