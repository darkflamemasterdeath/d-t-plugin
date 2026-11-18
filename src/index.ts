import type { Context } from '@deepseek-ai/cordis'
import Schema from '@deepseek-ai/schemastery'
import { defineTool } from '@deepseek-ai/dsh-tools'

/** Cordis plugin name shown on the fiber. */
export const name = 'hello-plugin'

/** Wait until the tool registry is available. */
export const inject = ['tools']

/** Greeting phrase and how many times the tool repeats it. */
export interface Config {
  greeting: string
  repeat: number
}

/** Validated configuration. Missing fields receive the schema defaults. */
export const Config: Schema<Config> = Schema.object({
  greeting: Schema.string().default('Hello'),
  repeat: Schema.number().default(1),
})

/**
 * Log the active greeting, then register `greet`.
 * @param ctx - plugin context.
 * @param config - validated configuration for this instance.
 */
export function apply(ctx: Context, config: Config): void {
  const repeat = normalizeRepeat(config.repeat)

  ctx.effect(() => {
    console.log(`[hello-plugin] ${config.greeting}`)
    return () => {
      console.log(`[hello-plugin] ${config.greeting} unloaded`)
    }
  })

  ctx.tools.register(defineTool({
    name: 'greet',
    description: 'Greet someone using the hello plugin phrase.',
    parameters: {
      name: { type: 'string', required: true, description: 'The name to greet' },
    },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: value }],
    },
    async execute(args) {
      const line = `${config.greeting}, ${args.name}!`
      return Array.from({ length: repeat }, () => line).join('\n')
    },
  }))
}

/**
 * Keep the repeated greeting within a small range.
 * @param value - configured repeat count.
 * @returns an integer from 1 to 5.
 */
function normalizeRepeat(value: number): number {
  if (!Number.isFinite(value)) return 1
  return Math.min(5, Math.max(1, Math.trunc(value)))
}
