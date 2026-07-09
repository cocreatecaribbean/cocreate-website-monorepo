import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import type { ClientPortalRequest } from '../auth/guards/client-auth.guard'
import { tenantContext } from './tenant-context'

/**
 * Sets AsyncLocalStorage tenant context for client-portal requests so Prisma
 * extensions can auto-scope organizationId on tenant-scoped models.
 */
@Injectable()
export class TenantScopeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<ClientPortalRequest>()
    const organizationId = request.clientUser?.organization?.id

    if (!organizationId) {
      return next.handle()
    }

    return new Observable((subscriber) => {
      tenantContext.run(organizationId, () => {
        next.handle().subscribe({
          next: (value) => subscriber.next(value),
          error: (err) => subscriber.error(err),
          complete: () => subscriber.complete(),
        })
      })
    })
  }
}
