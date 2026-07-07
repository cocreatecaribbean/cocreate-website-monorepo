import ContactForm from '@/components/contact/contact-form'
import ContactPageHeader from '@/components/contact/contact-page-header'

export default function ContactPage() {
  return (
    <main className="min-h-svh overflow-x-clip pb-20 md:pb-28">
      <ContactPageHeader />
      <section className="mx-auto w-[88svw] max-w-[1320px]">
        <ContactForm />
      </section>
    </main>
  )
}
