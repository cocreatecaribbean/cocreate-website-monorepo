import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { Request } from 'express'
import { AuthService } from '../auth.service'

export type AdminRequest = Request & {
  adminUser?: Awaited<ReturnType<AuthService['requireAdmin']>>
}

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    private readonly config: ConfigService,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AdminRequest>()

    const bearer = request.headers.authorization
    if (bearer?.startsWith('Bearer ')) {
      request.adminUser = await this.authService.requireAdmin(bearer.slice(7))
      return true
    }

    const expected = this.config.get<string>('ADMIN_API_KEY')
    const provided = request.headers['x-admin-key']
    if (expected && typeof provided === 'string' && provided === expected) {
      return true
    }

    throw new UnauthorizedException('Admin authentication required')
  }
}
