import { getAdminCenterSystemPrompt } from '@/lib/assistant/prompts'
import { formatAdminCenterProductFacts } from '@/lib/assistant/product-facts'

describe('Admin Center assistant prompts', () => {
  it('includes PRODUCT FACTS with Get Help and Project Center', () => {
    const facts = formatAdminCenterProductFacts()
    expect(facts).toContain('Get Help')
    expect(facts).toContain('/messages')
    expect(facts).toContain('Project Center')
    expect(facts).toContain('/project-center')
  })

  it('embeds PRODUCT FACTS and optional CURRENT LOCATION', () => {
    const prompt = getAdminCenterSystemPrompt(undefined, {
      pathname: '/messages',
      search: '?organizationId=abc',
    })
    expect(prompt).toContain('PRODUCT FACTS')
    expect(prompt).toContain('Get Help')
    expect(prompt).toContain('CURRENT LOCATION')
    expect(prompt).toContain('/messages')
  })

  it('includes retrieved context when provided', () => {
    const prompt = getAdminCenterSystemPrompt('## Team\n- Super admins invite admins')
    expect(prompt).toContain('RETRIEVED CONTEXT:')
    expect(prompt).toContain('Super admins invite admins')
  })
})
