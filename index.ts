import { Plugin } from "@opencode/plugin"
import { Usage, type UsageResult, type UsageWindow } from "./rpc"

export default Plugin.define({
  id: "opencode-openai-usage",
  async setup(ctx) {
    let cached: { accountID: string; time: number; usage: UsageResult } | undefined

    await ctx.rpc.register(Usage, {
      get: async (_, { signal }) => {
        const connection = await ctx.integration.connection.active("openai")
        const auth = connection ? await ctx.integration.connection.resolve(connection) : undefined
        if (auth?.type !== "oauth") return { windows: [] }

        const payload = JSON.parse(Buffer.from(auth.access.split(".")[1], "base64url").toString())
        const accountID = payload["https://api.openai.com/auth"]?.chatgpt_account_id
        if (typeof accountID !== "string") return { windows: [] }
        if (cached?.accountID === accountID && Date.now() - cached.time < 60_000) return cached.usage

        const response = await fetch("https://chatgpt.com/backend-api/wham/usage", {
          headers: {
            Authorization: `Bearer ${auth.access}`,
            "ChatGPT-Account-Id": accountID,
          },
          signal: AbortSignal.any([signal, AbortSignal.timeout(10_000)]),
        })
        if (!response.ok) throw new Error(`ChatGPT usage request failed (${response.status})`)

        const body = (await response.json()) as {
          rate_limit?: { primary_window?: UsageWindow | null; secondary_window?: UsageWindow | null }
        }
        const windows = [body.rate_limit?.primary_window, body.rate_limit?.secondary_window].filter(
          (item): item is UsageWindow =>
            item != null &&
            Number.isFinite(item.used_percent) &&
            Number.isFinite(item.limit_window_seconds) &&
            Number.isFinite(item.reset_at),
        ).map(({ used_percent, limit_window_seconds, reset_at }) => ({
          used_percent, limit_window_seconds, reset_at,
        }))
        const usage = { windows }
        cached = { accountID, time: Date.now(), usage }
        return usage
      },
    })
  },
})
