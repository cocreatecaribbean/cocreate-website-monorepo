import { contactInfo } from '@/site-info/contact-page-data'
import { getAssistantSystemPrompt } from '@/lib/assistant/prompts'

describe('getAssistantSystemPrompt (marketing)', () => {
  it('includes contact phone and email in SITE FACTS without retrieval', () => {
    const prompt = getAssistantSystemPrompt('marketing')
    expect(prompt).toContain(contactInfo.phone)
    expect(prompt).toContain(contactInfo.email)
    expect(prompt).toContain('/contact')
    expect(prompt).toMatch(/SITE FACTS/i)
  })

  it('includes CURRENT CONTEXT with date/time and general-knowledge rules', () => {
    const prompt = getAssistantSystemPrompt('marketing')
    expect(prompt).toContain('CURRENT CONTEXT')
    expect(prompt).toContain('America/Jamaica')
    expect(prompt).toContain(String(new Date().getFullYear()))
    expect(prompt).toContain('ordinary general knowledge')
  })

  it('includes named team roster including Patrick Traile', () => {
    const prompt = getAssistantSystemPrompt('marketing')
    expect(prompt).toContain('Patrick Traile')
    expect(prompt).toContain('Digital & Art Director')
    expect(prompt).toContain('Tashan Hendricks')
    expect(prompt).toContain('October 2020')
  })

  it('includes format rules, PAGE LINKS, and label-only link coaching', () => {
    const prompt = getAssistantSystemPrompt('marketing')
    expect(prompt).toContain('numbered list')
    expect(prompt).toContain('No code fences')
    expect(prompt).toContain('main nav')
    expect(prompt).toContain('PAGE LINKS')
    expect(prompt).toContain('[Contact](/contact)')
    expect(prompt).toContain('[About](/about)')
    expect(prompt).toContain('[Work](/work)')
    expect(prompt).toContain('[Home](/)')
    expect(prompt).toContain('users must NEVER see')
    expect(prompt).toContain('only see the highlighted clickable label')
    expect(prompt).toContain('main nav → [Contact](/contact)')
    expect(prompt).not.toMatch(/Contact page: \/contact/)
  })

  it('keeps contact and team facts when retrieved context is present', () => {
    const prompt = getAssistantSystemPrompt(
      'marketing',
      'CoCreate Caribbean was founded as a creative agency.',
    )
    expect(prompt).toContain(contactInfo.phone)
    expect(prompt).toContain(contactInfo.email)
    expect(prompt).toContain('Patrick Traile')
    expect(prompt).toContain('RETRIEVED CONTEXT:')
    expect(prompt).toMatch(/use SITE FACTS above first/i)
    expect(prompt).toMatch(/Named team list in SITE FACTS first/i)
    expect(prompt).toContain('opening [Contact](/contact) from the main nav')
  })
})
