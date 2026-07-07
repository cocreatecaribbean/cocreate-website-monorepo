import * as fonts from '@/styles/fonts'
import InPageAnchorLink from '@/components/legal/in-page-anchor-link'
import LegalPageHashScroll from '@/components/legal/legal-page-hash-scroll'
import {
  COOKIE_POLICY_SECTION,
  PRIVACY_POLICY_SECTIONS,
  type PrivacyPolicySection,
} from '@/site-info/privacy-policy-content'

function PolicySection({ section }: { section: PrivacyPolicySection }) {
  return (
    <section id={section.id} className="scroll-mt-28">
      <h2
        className={`text-2xl text-chambray sm:text-3xl ${fonts.bricolage_grot700.className}`}
      >
        {section.title}
      </h2>
      <div className="mt-4 space-y-4">
        {section.paragraphs.map((paragraph, index) => (
          <p
            key={`${section.title}-${index}`}
            className={`text-base leading-relaxed text-neutral-700 sm:text-[1.05rem] ${fonts.bricolage_grot400.className}`}
          >
            {paragraph}
          </p>
        ))}
      </div>
    </section>
  )
}

export default function LegalPage() {
  return (
    <main className="min-h-svh overflow-x-clip pb-20 md:pb-28">
      <LegalPageHashScroll />
      <div className="mx-auto w-[88svw] max-w-[1320px] pt-[calc(9svh+4.25rem)] sm:pt-[calc(9svh+4.75rem)] min-[1024px]:pt-[calc(8svh+5rem)]">
        <p className={`text-xs font-medium uppercase tracking-[0.2em] text-sanmarino ${fonts.bricolage_grot600.className}`}>
          Legal
        </p>
        <h1
          className={`mt-3 bg-linear-to-r from-chambray via-sanmarino to-casablanca bg-clip-text text-3xl text-transparent sm:text-4xl ${fonts.alkatra600.className}`}
        >
          Privacy &amp; Cookies
        </h1>
        <p
          className={`mt-4 max-w-2xl text-base leading-relaxed text-neutral-600 ${fonts.bricolage_grot400.className}`}
        >
          How CoCreate Caribbean handles your information and cookie preferences on this site.
        </p>

        <nav
          aria-label="On this page"
          className={`mt-8 flex flex-wrap gap-4 text-sm ${fonts.bricolage_grot600.className}`}
        >
          {PRIVACY_POLICY_SECTIONS.map((section) =>
            section.id ? (
              <InPageAnchorLink
                key={section.id}
                href={`#${section.id}`}
                className="text-sanmarino underline-offset-2 hover:text-chambray hover:underline"
              >
                {section.title}
              </InPageAnchorLink>
            ) : null,
          )}
          <InPageAnchorLink
            href="#cookies"
            className="text-sanmarino underline-offset-2 hover:text-chambray hover:underline"
          >
            Cookies
          </InPageAnchorLink>
        </nav>

        <div className="mt-12 space-y-14 border-t border-chambray/10 pt-12">
          {PRIVACY_POLICY_SECTIONS.map((section) => (
            <PolicySection key={section.title} section={section} />
          ))}
          <PolicySection section={COOKIE_POLICY_SECTION} />
        </div>
      </div>
    </main>
  )
}
