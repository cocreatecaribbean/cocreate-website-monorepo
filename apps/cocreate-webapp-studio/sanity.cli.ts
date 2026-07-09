import {defineCliConfig} from 'sanity/cli'
import {dataset, projectId} from './env'

export default defineCliConfig({
  api: {
    projectId,
    dataset,
  },
  deployment: {
    /**
     * Disabled locally so dev uses the installed sanity version (avoids blank
     * studio when local packages differ from the auto-update runtime).
     */
    autoUpdates: false,
  },
})
