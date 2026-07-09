# Social Listening — Brand24 live path

## Prerequisites

1. Brand24 / BrandMentions API subscription with API access
2. Per-organization Brand24 project ID (created via setup flow or admin)
3. API environment variables on Railway / production:

```bash
BRAND24_API_KEY=<your-key>
BRAND24_USE_LIVE_API=true
SOCIAL_LISTENING_DEMO_SNAPSHOTS=false
SOCIAL_LISTENING_SNAPSHOT_ENABLED=true
```

## Enabling live data for an organization

1. **Admin Center** → Clients → enable Social Listening subscription
2. Enter a valid **Brand24 project ID** (3–64 chars: letters, numbers, hyphens, underscores)
3. Client completes **New listening setup** (keywords, platforms, date range)
4. Historical backfill captures **monthly** snapshots (last day of each complete calendar month in range); a scheduler on the **1st of each month** captures the previous month going forward

## Verifying ingestion

Check API logs for lines like:

```
Brand24 fetched org=<id> project=<projectId> mentions=<count>
Snapshot captured org=<id> date=YYYY-MM-DD source=brand24 mentions=<count>
```

In the client portal, the data source badge should show **Live · Brand24**. Snapshot `source` in the database should be `brand24`.

## Troubleshooting

| Symptom | Check |
|---------|--------|
| Badge shows "Demo sample" | `BRAND24_USE_LIVE_API`, API key, project ID on org |
| Empty mentions, falls back to mock | Project ID wrong or no mentions in period — logs show `Brand24 empty mentions` |
| Many dates in dropdown | Expected if legacy daily/weekly snapshots exist; new captures are monthly (~3 on setup for 92 days, then 1/month) |
| Cross-org data concern | All queries filter `organizationId` from JWT — never from client input |

## Rate limits

When flipping an existing subscriber to live API, snapshots are captured one at a time during setup backfill. For large org counts, enable live API during a maintenance window and monitor Brand24 API quotas.

## Related

- Entitlement: `Organization.isSocialListeningSubscriber` synced with `SocialListeningSubscription` on admin toggle
- PDF exports: Growth+ plans only (`planIncludesPdfExports`)
