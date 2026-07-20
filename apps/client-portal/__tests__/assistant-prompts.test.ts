import {
  firstNameFromDisplayName,
  getClientPortalSystemPrompt,
} from '@/lib/assistant/prompts'
import { formatClientPortalProductFacts } from '@/lib/assistant/product-facts'

describe('Client Portal assistant prompts', () => {
  it('includes PRODUCT FACTS with Get Help, left-menu navigation, and PAGE LINKS', () => {
    const facts = formatClientPortalProductFacts()
    expect(facts).toContain('Get Help')
    expect(facts).toContain('Control Center')
    expect(facts).toContain('menu on the left')
    expect(facts).toContain('PAGE LINKS')
    expect(facts).toContain('[Team](/?ccView=team)')
    expect(facts).toContain('[Get Help](/?ccView=messages)')
    expect(facts).toContain('users must NEVER see')
    expect(facts).toMatch(/Wrong:.*ccView/)
  })

  it('embeds PRODUCT FACTS, UI nav rules, and CURRENT LOCATION', () => {
    const prompt = getClientPortalSystemPrompt(undefined, {
      pathname: '/',
      ccView: 'projects',
      tab: 'control-center',
    })
    expect(prompt).toContain('PRODUCT FACTS')
    expect(prompt).toContain('Get Help')
    expect(prompt).toContain('CURRENT LOCATION')
    expect(prompt).toContain('projects')
    expect(prompt).toContain('numbered list')
    expect(prompt).toContain('only see the highlighted clickable label')
    expect(prompt).toContain('Never show paths, query strings')
    expect(prompt).toContain('menu on the left')
    expect(prompt).toContain('[Team](/?ccView=team)')
    expect(prompt).not.toMatch(/suggest Get Help \(\/\?ccView=/)
  })

  it('embeds signed-in first name when provided', () => {
    const prompt = getClientPortalSystemPrompt(
      undefined,
      { pathname: '/' },
      { firstName: 'Jordan' },
    )
    expect(prompt).toContain('SIGNED-IN USER: firstName=Jordan')
  })

  it('derives first name from display name', () => {
    expect(firstNameFromDisplayName('Jordan Lee')).toBe('Jordan')
    expect(firstNameFromDisplayName('  Ana  ')).toBe('Ana')
    expect(firstNameFromDisplayName(null)).toBeNull()
    expect(firstNameFromDisplayName('')).toBeNull()
  })
})
