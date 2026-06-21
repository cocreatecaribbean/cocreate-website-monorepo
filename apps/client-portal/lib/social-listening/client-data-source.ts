'use client'

import type { SocialListeningDataSource } from './data-source'
import {
  createListeningSetup,
  fetchSocialListeningAnalyticsWithStatus,
  fetchSocialListeningCompare,
  fetchSocialListeningSnapshotDates,
} from './fetch-analytics-client'
import {
  downloadSocialListeningReport,
  fetchReportTemplates,
} from './fetch-reports'

export const clientSocialListeningDataSource: SocialListeningDataSource = {
  fetchAnalyticsWithStatus: fetchSocialListeningAnalyticsWithStatus,
  fetchSnapshotDates: fetchSocialListeningSnapshotDates,
  fetchCompare: fetchSocialListeningCompare,
  fetchReportTemplates,
  downloadReport: downloadSocialListeningReport,
  createListeningSetup,
}
