import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common'
import { ClientAccessService } from '../client-access.service'
import type { ClientPortalRequest } from './client-auth.guard'

@Injectable()
export class ClientTeamHubGuard implements CanActivate {
  constructor(private readonly clientAccess: ClientAccessService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<ClientPortalRequest>()
    const client = request.clientUser
    if (!client) {
      throw new ForbiddenException('Client authentication required')
    }
    if (!this.clientAccess.canAccessTeamHub(client)) {
      throw new ForbiddenException('Team access requires admin role')
    }
    return true
  }
}
