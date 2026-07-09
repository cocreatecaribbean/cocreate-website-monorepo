import { Prisma } from '@cocreate/database'
import { mergeSoftDeleteScope } from './tenant-context'

const SOFT_DELETE_MODELS = new Set(['Organization', 'User', 'ClientProject'])

const READ_OPERATIONS = new Set([
  'findMany',
  'findFirst',
  'findFirstOrThrow',
  'count',
  'aggregate',
  'groupBy',
])

export function softDeleteExtension() {
  return Prisma.defineExtension({
    name: 'softDelete',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (SOFT_DELETE_MODELS.has(model) && READ_OPERATIONS.has(operation)) {
            return query(mergeSoftDeleteScope(model, args as { where?: Record<string, unknown> }))
          }
          return query(args)
        },
      },
    },
  })
}

export async function softDeleteById(
  prisma: { [key: string]: { update: (args: unknown) => Promise<unknown> } },
  model: 'organization' | 'user' | 'clientProject',
  id: string,
) {
  return prisma[model].update({
    where: { id },
    data: { deletedAt: new Date() },
  })
}
