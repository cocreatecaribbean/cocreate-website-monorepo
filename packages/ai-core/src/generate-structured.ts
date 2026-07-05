import { generateObject, type LanguageModel } from 'ai'
import type { z } from 'zod'
import { getChatModel } from './models'

export async function generateStructured<T extends z.ZodType>(options: {
  schema: T
  system: string
  prompt: string
  model?: LanguageModel
}): Promise<z.infer<T>> {
  const { object } = await generateObject({
    model: options.model ?? getChatModel(),
    schema: options.schema,
    system: options.system,
    prompt: options.prompt,
  })
  return object as z.infer<T>
}
