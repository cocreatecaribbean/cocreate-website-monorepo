import {
  firstNameFromDisplayName,
  getClientPortalSystemPrompt,
} from '@/lib/assistant/prompts'
import { formatClientPortalProductFacts } from '@/lib/assistant/product-facts'

describe('Client Portal assistant prompts', () => {
  it('includes PRODUCT FACTS with Get Help, Project updates, and PAGE LINKS', () => {
    const facts = formatClientPortalProductFacts()
    expect(facts).toContain('Get Help')
    expect(facts).toContain('Project updates')
    expect(facts).toContain('Control Center')
    expect(facts).toContain('menu on the left')
    expect(facts).toContain('top of the portal workspace')
    expect(facts).toContain('PAGE LINKS')
    expect(facts).toContain('[Team](/?ccView=team)')
    expect(facts).toContain('[Get Help](/?ccView=messages)')
    expect(facts).toContain('[Social Listening](/?tab=social-listening)')
    expect(facts).toContain(
      '[Mentions](/?tab=social-listening&view=mentions)',
    )
    expect(facts).toContain('two messaging places')
    expect(facts).toContain('never assume')
    expect(facts).toContain('users must NEVER see')
    expect(facts).toMatch(/Wrong:.*ccView/)
    expect(facts).toContain('/?ccView=social-listening')
  })

  it('embeds PRODUCT FACTS, UI nav rules, and CURRENT LOCATION', () => {
    const prompt = getClientPortalSystemPrompt(undefined, {
      pathname: '/',
      ccView: 'projects',
      tab: 'control-center',
    })
    expect(prompt).toContain('PRODUCT FACTS')
    expect(prompt).toContain('Get Help')
    expect(prompt).toContain('Project updates')
    expect(prompt).toContain('CURRENT LOCATION')
    expect(prompt).toContain('Control Center')
    expect(prompt).toContain('Projects')
    expect(prompt).toContain('top of the portal workspace')
    expect(prompt).toContain('numbered list')
    expect(prompt).toContain('Never show paths, query strings')
    expect(prompt).toContain('[Team](/?ccView=team)')
    expect(prompt).toContain('**Get Help** vs **Project updates**')
    expect(prompt).toContain(
      'Never say Social Listening is an item in the Control Center left menu',
    )
    expect(prompt).toContain('do not only push Get Help')
    expect(prompt).not.toMatch(/suggest Get Help \(\/\?ccView=/)
  })

  it('names Social Listening location and Mentions view when on that tab', () => {
    const prompt = getClientPortalSystemPrompt(undefined, {
      pathname: '/',
      tab: 'social-listening',
      slView: 'mentions',
    })
    expect(prompt).toContain('CURRENT LOCATION')
    expect(prompt).toContain('Social Listening')
    expect(prompt).toContain('Mentions')
    expect(prompt).toContain('[Social Listening](/?tab=social-listening)')
    expect(prompt).toContain(
      '[Mentions](/?tab=social-listening&view=mentions)',
    )
  })

  it('includes CURRENT CONTEXT with date/time and general-knowledge rules', () => {
    const prompt = getClientPortalSystemPrompt()
    expect(prompt).toContain('CURRENT CONTEXT')
    expect(prompt).toContain('America/Jamaica')
    expect(prompt).toContain(String(new Date().getFullYear()))
    expect(prompt).toContain('ordinary general knowledge')
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
