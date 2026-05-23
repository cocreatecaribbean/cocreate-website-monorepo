import { Injectable } from '@nestjs/common'

@Injectable()
export class AppService {
  getRoot() {
    return {
      name: 'CoCreate API',
      status: 'ok',
    }
  }
}
