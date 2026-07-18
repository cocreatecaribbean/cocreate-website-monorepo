import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { resolveOpenAiApiKey } from '@cocreate/ai-core/models'

@Injectable()
export class AiConfigService implements OnModuleInit {
  private readonly logger = new Logger(AiConfigService.name)

  onModuleInit() {
    this.logger.log(
      resolveOpenAiApiKey()
        ? 'AI summaries enabled (OpenAI)'
        : 'AI summaries disabled — set OPENAI_API_KEY in Doppler',
    )
  }
}
