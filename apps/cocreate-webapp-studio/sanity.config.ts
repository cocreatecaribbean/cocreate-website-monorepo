import {createElement} from 'react'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {presentationTool} from 'sanity/presentation'
import {muxInput} from 'sanity-plugin-mux-input'
import {schemaTypes} from './schemaTypes'
import {structure} from './structure'
import {dataset, previewOrigin, projectId} from './env'
import {StudioNavbar} from './components/StudioNavbar'
import {mainDocuments, presentationLocations} from './presentation/resolve'

export default defineConfig({
  name: 'default',
  title: `CoCreate — ${dataset}`,

  projectId,
  dataset,

  plugins: [
    structureTool({structure}),
    presentationTool({
      previewUrl: {
        initial: `${previewOrigin}/work`,
        previewMode: {
          enable: '/api/draft',
          disable: '/api/draft/disable',
        },
      },
      allowOrigins: [previewOrigin],
      resolve: {
        mainDocuments,
        locations: presentationLocations,
      },
    }),
    muxInput(),
    visionTool(),
  ],

  schema: {
    types: schemaTypes,
  },

  studio: {
    components: {
      navbar: (props) => createElement(StudioNavbar, {...props, dataset}),
    },
  },
})
