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
import { NewsletterService } from './newsletter.service'
import { SubscribeNewsletterDto } from './dto/subscribe.dto'

@Controller({ path: 'newsletter', version: '1' })
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @Post('subscribe')
  async subscribe(@Body() body: SubscribeNewsletterDto) {
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
