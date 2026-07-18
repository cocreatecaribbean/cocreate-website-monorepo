/** Named people from the CoCreate About / corporate RAG knowledge base. */
export type TeamMember = {
  name: string
  role: string
}

/** Public-facing named roster — use for SITE FACTS and keep in sync with site-pages.md. */
export const teamRoster: readonly TeamMember[] = [
  { name: 'Tashan Hendricks', role: 'Founder & Managing Director' },
  { name: 'Andene Kirlew', role: 'Finance Manager & Company Secretary' },
  { name: 'Adrian Campbell', role: 'Strategy & Creative Director' },
  { name: 'Eric Williams', role: 'Creative & Experiential Consultant' },
  { name: 'Tahirah Scott-Anderson', role: 'Client Services & Project Management' },
  { name: 'Patrick Traile', role: 'Digital & Art Director' },
  { name: 'Natalia Long', role: 'Business Development Manager' },
  { name: 'Kristin Lewis', role: 'Investor Relations Consultant' },
  { name: 'Angella Phillips', role: 'Project Manager' },
  { name: 'Sade Hylton', role: 'Senior Graphic Designer' },
  { name: 'Daniel Brown', role: 'Motion Designer' },
  { name: 'Andrew Astwood', role: 'Editor' },
] as const

export const COMPANY_IDENTITY = {
  legalName: 'CoCreate Caribbean',
  alsoKnownAs: 'CCL',
  incorporated: 'October 2020',
  base: 'Jamaica / the Caribbean',
  summary:
    'A creative agency that bridges Caribbean brands and their audiences through strategic storytelling, innovative design, and immersive digital experiences.',
} as const

export function formatTeamRosterLines(): string {
  return teamRoster.map((member) => `- ${member.name}: ${member.role}`).join('\n')
}
