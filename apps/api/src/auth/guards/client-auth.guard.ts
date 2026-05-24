import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import type { Request } from 'express'
import { AuthService } from '../auth.service'

export type ClientPortalRequest = Request & {
  clientUser?: Awaited<ReturnType<AuthService['requireClient']>>
}

@Injectable()
export class ClientAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<ClientPortalRequest>()
    const bearer = request.headers.authorization

    if (!bearer?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Client authentication required')
    }

    request.clientUser = await this.authService.requireClient(bearer.slice(7))
    return true
  }
}
