import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {muxInput} from 'sanity-plugin-mux-input'
import {schemaTypes} from './schemaTypes'
import {structure} from './structure'

export default defineConfig({
  name: 'default',
  title: 'cocreate-webapp-studio',

  projectId: '5ix7h4ht',
  dataset: 'production',

  plugins: [structureTool({structure}), muxInput(), visionTool()],

  schema: {
    types: schemaTypes,
  },
})
