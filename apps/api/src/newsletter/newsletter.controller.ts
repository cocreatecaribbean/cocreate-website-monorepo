import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
  BadRequestException,
} from '@nestjs/common'
import type { Response } from 'express'
import {
  SubscribeNewsletterSchema,
  type SubscribeNewsletterInput,
} from '@cocreate/api-contracts/v1/requests/newsletter'
import { zodBody } from '../common/zod/zod-validation.pipe'
import { NewsletterService } from './newsletter.service'

@Controller({ path: 'newsletter', version: '1' })
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @Post('subscribe')
  async subscribe(
    @Body(zodBody(SubscribeNewsletterSchema)) body: SubscribeNewsletterInput,
  ) {
    if (body.website) {
      throw new BadRequestException('Invalid request')
    }
    return this.newsletterService.subscribe(body.email)
  }

  @Get('confirm')
  async confirm(@Query('token') token: string, @Res() res: Response) {
    const redirectUrl = await this.newsletterService.confirm(token ?? '')
    res.redirect(302, redirectUrl)
  }
}
