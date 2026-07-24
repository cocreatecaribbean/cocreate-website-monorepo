import { blockContent } from './blockContent'
import { client } from './client'
import { aboutPage } from './aboutPage'
import { aboutTestimonial } from './aboutTestimonial'
import { landingPage } from './landingPage'
import { articleSeries, filmContent, podcastSeries } from './originalContent'
import { original } from './original'
import { originalEpisode } from './originalEpisode'
import { originalMedia } from './originalMedia'
import { projectMedia } from './projectMedia'
import {
  impactCallout,
  mediaBanner,
  mediaPair,
  projectOverview,
  shareBar,
  textAndMedia,
} from './projectSections'
import { workPage } from './workPage'
import { workProject } from './workProject'

export const schemaTypes = [
  blockContent,
  client,
  projectMedia,
  projectOverview,
  mediaPair,
  impactCallout,
  textAndMedia,
  mediaBanner,
  shareBar,
  workProject,
  workPage,
  aboutTestimonial,
  aboutPage,
  originalMedia,
  podcastSeries,
  filmContent,
  articleSeries,
  originalEpisode,
  original,
  landingPage,
]
