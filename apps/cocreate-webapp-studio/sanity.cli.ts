import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: '5ix7h4ht',
    dataset: 'production'
  },
  deployment: {
    /**
     * Disabled locally so dev uses the installed sanity version (avoids blank
     * studio when local packages differ from the auto-update runtime).
     */
    autoUpdates: false,
  }
})
