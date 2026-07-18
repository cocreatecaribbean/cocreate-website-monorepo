import { getClientPortalSystemPrompt } from '@/lib/assistant/prompts'
import { formatClientPortalProductFacts } from '@/lib/assistant/product-facts'

describe('Client Portal assistant prompts', () => {
  it('includes PRODUCT FACTS with Get Help', () => {
    const facts = formatClientPortalProductFacts()
    expect(facts).toContain('Get Help')
    expect(facts).toContain('/?ccView=messages')
    expect(facts).toContain('Control Center')
  })

  it('embeds PRODUCT FACTS and CURRENT LOCATION', () => {
    const prompt = getClientPortalSystemPrompt(undefined, {
      pathname: '/',
      ccView: 'projects',
      tab: 'control-center',
    })
    expect(prompt).toContain('PRODUCT FACTS')
    expect(prompt).toContain('Get Help')
    expect(prompt).toContain('CURRENT LOCATION')
    expect(prompt).toContain('projects')
  })
})
