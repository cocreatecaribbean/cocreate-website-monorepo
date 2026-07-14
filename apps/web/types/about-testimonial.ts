export type AboutTestimonial = {
  id: string
  name: string
  /** Optional role (e.g. Brand Manager). */
  jobTitle?: string
  company: string
  quote: string
  photoUrl: string
  sortOrder?: number
}
