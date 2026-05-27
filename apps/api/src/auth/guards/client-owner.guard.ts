import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common'
import { ClientAccessService } from '../client-access.service'
import type { ClientPortalRequest } from './client-auth.guard'

@Injectable()
export class ClientOwnerGuard implements CanActivate {
  constructor(private readonly clientAccess: ClientAccessService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<ClientPortalRequest>()
    const client = request.clientUser
    if (!client) {
      throw new ForbiddenException('Client authentication required')
    }
    if (!this.clientAccess.canManageOrgTeam(client)) {
      throw new ForbiddenException('Organization owner access required')
    }
    return true
  }
}
