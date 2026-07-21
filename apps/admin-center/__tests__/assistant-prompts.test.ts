import { getAdminCenterSystemPrompt } from '@/lib/assistant/prompts'
import { formatAdminCenterProductFacts } from '@/lib/assistant/product-facts'

describe('Admin Center assistant prompts', () => {
  it('includes PRODUCT FACTS with Get Help, Project Center, and PAGE LINKS', () => {
    const facts = formatAdminCenterProductFacts()
    expect(facts).toContain('Get Help')
    expect(facts).toContain('Project Center')
    expect(facts).toContain('sidebar on the left')
    expect(facts).toContain('PAGE LINKS')
    expect(facts).toContain('[Team](/team)')
    expect(facts).toContain('[Get Help](/messages)')
    expect(facts).toContain('users must NEVER see')
    expect(facts).not.toMatch(/Get Help \(\/messages\)/)
  })

  it('embeds PRODUCT FACTS, UI nav rules, and optional CURRENT LOCATION', () => {
    const prompt = getAdminCenterSystemPrompt(undefined, {
      pathname: '/messages',
      search: '?organizationId=abc',
    })
    expect(prompt).toContain('PRODUCT FACTS')
    expect(prompt).toContain('Get Help')
    expect(prompt).toContain('CURRENT LOCATION')
    expect(prompt).toContain('/messages')
    expect(prompt).toContain('numbered list')
    expect(prompt).toContain('only see the highlighted clickable label')
    expect(prompt).toContain('Never show paths, query strings')
    expect(prompt).toContain('sidebar on the left')
    expect(prompt).toContain('[Team](/team)')
    expect(prompt).not.toMatch(/suggest Get Help \(\/messages\)/)
  })

  it('includes CURRENT CONTEXT with date/time and general-knowledge rules', () => {
    const prompt = getAdminCenterSystemPrompt()
    expect(prompt).toContain('CURRENT CONTEXT')
    expect(prompt).toContain('America/Jamaica')
    expect(prompt).toContain(String(new Date().getFullYear()))
    expect(prompt).toContain('ordinary general knowledge')
  })

  it('includes retrieved context when provided', () => {
    const prompt = getAdminCenterSystemPrompt('## Team\n- Super admins invite admins')
    expect(prompt).toContain('RETRIEVED CONTEXT:')
    expect(prompt).toContain('Super admins invite admins')
  })
})
