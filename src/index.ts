import { existsSync } from 'node:fs'
import { appendFile, mkdir } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import type { Context } from '@deepseek-ai/cordis'
import type { AccountClientMetadata } from '@deepseek-ai/dsh-deepseek-account'
import type { ToolExecution, ToolExecutionResult } from '@deepseek-ai/dsh-tools'

/** Cordis plugin name shown on the fiber. */
export const name = 'hello-plugin'

/** Wait until tool execution events are available. */
export const inject = ['tools']

const RESULT_LIMIT = 8000

/**
 * Record each finished tool call in a Markdown file on the desktop.
 * @param ctx - plugin context.
 */
export function apply(ctx: Context): void {
  const file = desktopLogPath()
  let pending = Promise.resolve()

  ctx.on('tools/result', (exec, result) => {
    pending = pending.then(async () => {
      const actor = await currentUser(ctx)
      await writeEntry(file, renderEntry(exec, result, actor))
    }).catch((error: unknown) => {
      console.error('[hello-plugin] failed to write tool log', error)
    })
  })
}

/**
 * Desktop path for the log. Prefers the real Desktop folder when OneDrive relocated it.
 * @returns absolute Markdown path.
 */
function desktopLogPath(): string {
  const home = homedir()
  const desktop = [join(home, 'Desktop'), join(home, 'OneDrive', 'Desktop')].find(directory => existsSync(directory))
  return join(desktop ?? join(home, 'Desktop'), 'tool-results.md')
}

/**
 * Name or masked contact of the DeepSeek account signed in on this host.
 * @param ctx - plugin context that may provide `deepseekAccount`.
 * @returns a display name, or `未登录` when no account can be read.
 */
async function currentUser(ctx: Context): Promise<string> {
  const account = ctx.get('deepseekAccount')
  if (account === undefined) return '未登录'
  try {
    const profile = await account.getProfile(clientMetadata())
    if (profile?.status !== 'ready') return '未登录'
    return profile.value.name || profile.value.contact || '已登录'
  } catch (error) {
    console.error('[hello-plugin] failed to read the signed-in account', error)
    return '未登录'
  }
}

/** Identity sent with the profile query. The host turns the locale into its wire form.
 * @returns client metadata for this process.
 */
function clientMetadata(): AccountClientMetadata {
  return {
    version: '0.1.0',
    locale: 'zh-CN',
    timezoneOffsetSeconds: -new Date().getTimezoneOffset() * 60,
  }
}

/**
 * Format one finished call.
 * @param exec - the call that finished.
 * @param result - its final outcome.
 * @param actor - signed-in account name for this call.
 * @returns one Markdown section.
 */
function renderEntry(exec: ToolExecution, result: ToolExecutionResult, actor: string): string {
  const when = new Date().toLocaleString('zh-CN', { hour12: false })
  const agent = exec.agent?.id ?? '未知'
  const outcome = result.isError ? '失败' : '成功'
  const body = fence(clip(resultText(result)))
  return [
    `## ${when}`,
    '',
    `- 执行人: ${actor}`,
    `- 会话: ${agent}`,
    `- 工具: ${exec.name}`,
    `- 结果: ${outcome}`,
    '',
    body,
    '',
  ].join('\n')
}

/**
 * Model-facing text of a tool result.
 * @param result - the finished outcome.
 * @returns joined text blocks, or the error message.
 */
function resultText(result: ToolExecutionResult): string {
  const text = result.content.flatMap(block => block.type === 'text' ? [block.text] : []).join('\n')
  if (text !== '') return text
  return result.isError ? result.error.message : ''
}

/**
 * Keep one result from growing without a bound.
 * @param text - raw result text.
 * @returns text no longer than {@link RESULT_LIMIT} characters.
 */
function clip(text: string): string {
  if (text.length <= RESULT_LIMIT) return text
  return `${text.slice(0, RESULT_LIMIT)}\n…(已截断)`
}

/**
 * Wrap text so a result that contains fences cannot close the block early.
 * @param text - result text.
 * @returns a fenced Markdown block.
 */
function fence(text: string): string {
  const marker = text.includes('```') ? '````' : '```'
  return `${marker}\n${text}\n${marker}`
}

/**
 * Append one section, creating the file and its directory on first use.
 * @param file - destination path.
 * @param entry - Markdown section.
 */
async function writeEntry(file: string, entry: string): Promise<void> {
  await mkdir(dirname(file), { recursive: true })
  await appendFile(file, entry, 'utf8')
}
