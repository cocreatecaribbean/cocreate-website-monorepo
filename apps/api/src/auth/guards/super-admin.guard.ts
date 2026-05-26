import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { AdminRequest } from './admin-auth.guard'
import { isSuperAdminRole } from '../admin-roles'

@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AdminRequest>()
    if (request.adminUser && isSuperAdminRole(request.adminUser.role)) {
      return true
    }

    const expected = this.config.get<string>('ADMIN_API_KEY')
    const provided = request.headers['x-admin-key']
    if (expected && typeof provided === 'string' && provided === expected) {
      return true
    }

    throw new ForbiddenException('Super admin access required')
  }
}
