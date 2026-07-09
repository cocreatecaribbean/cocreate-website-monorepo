import { Prisma } from '@cocreate/database'
import { mergeTenantScope, TENANT_SCOPED_MODELS } from './tenant-context'

const READ_OPERATIONS = new Set([
  'findMany',
  'findFirst',
  'findFirstOrThrow',
  'count',
  'aggregate',
  'groupBy',
])

const SCOPED_WRITE_OPERATIONS = new Set(['updateMany', 'deleteMany'])

export function tenantScopeExtension(getOrganizationId: () => string | undefined) {
  return Prisma.defineExtension({
    name: 'tenantScope',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!TENANT_SCOPED_MODELS.has(model)) {
            return query(args)
          }

          if (READ_OPERATIONS.has(operation) || SCOPED_WRITE_OPERATIONS.has(operation)) {
            return query(
              mergeTenantScope(
                getOrganizationId(),
                model,
                args as { where?: Record<string, unknown> },
              ),
            )
          }

          return query(args)
        },
      },
    },
  })
}
