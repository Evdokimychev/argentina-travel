import ContactsPageClient from "@/components/contacts/ContactsPageClient";
import { fetchSiteContact } from "@/lib/site-settings-server";

export default async function ContactsPage() {
  const contact = await fetchSiteContact();

  return (
    <ContactsPageClient
      contactPageIntro={contact.contactPageIntro}
      whatsAppUrl={contact.whatsAppUrl}
      supportEmail={contact.supportEmail}
    />
  );
}
