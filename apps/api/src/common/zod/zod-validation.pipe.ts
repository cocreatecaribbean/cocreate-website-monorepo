import {
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common'
import type { ZodType } from 'zod'

function formatZodError(error: { issues: Array<{ path: PropertyKey[]; message: string }> }) {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : ''
      return `${path}${issue.message}`
    })
    .join('; ')
}

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodType) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value)
    if (!result.success) {
      throw new BadRequestException(formatZodError(result.error))
    }
    return result.data
  }
}

@Injectable()
export class ZodQueryPipe implements PipeTransform {
  constructor(private readonly schema: ZodType) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value ?? {})
    if (!result.success) {
      throw new BadRequestException(formatZodError(result.error))
    }
    return result.data
  }
}

export function zodBody<T extends ZodType>(schema: T) {
  return new ZodValidationPipe(schema)
}

export function zodQuery<T extends ZodType>(schema: T) {
  return new ZodQueryPipe(schema)
}
