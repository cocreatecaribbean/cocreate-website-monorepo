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

  it('includes named team roster including Patrick Traile', () => {
    const prompt = getAssistantSystemPrompt('marketing')
    expect(prompt).toContain('Patrick Traile')
    expect(prompt).toContain('Digital & Art Director')
    expect(prompt).toContain('Tashan Hendricks')
    expect(prompt).toContain('October 2020')
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
  })
})
