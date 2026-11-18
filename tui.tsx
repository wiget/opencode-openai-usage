/** @jsxImportSource @opentui/solid */
import { Plugin } from "@opencode/plugin/tui"
import { createSignal, For, Show } from "solid-js"
import { footerText, footerWindows, remainingPercent, resetText, stackedBar, usageBar, windowLabel } from "./format"
import { Usage, type UsageResult, type UsageWindow } from "./rpc"

export default Plugin.define({
  id: "opencode-openai-usage",
  setup(ctx) {
    const [windows, setWindows] = createSignal<UsageWindow[]>([])
    const [unavailable, setUnavailable] = createSignal(false)
    const [now, setNow] = createSignal(Date.now())
    const controller = new AbortController()
    const usage = ctx.client.rpc(Usage)
    let refreshing = false

    async function refresh() {
      if (refreshing || controller.signal.aborted) return
      refreshing = true
      try {
        const result = await usage.get({}, {
          location: ctx.location ?? ctx.data.location.default(),
          signal: controller.signal,
        })
        if (controller.signal.aborted) return
        setWindows((result as UsageResult).windows)
        setUnavailable(false)
      } catch {
        if (!controller.signal.aborted) setUnavailable(true)
      } finally {
        refreshing = false
      }
    }

    const visible = () => windows().length > 0 || unavailable()
    const color = (remaining: number | null) => unavailable() || remaining === null ? ctx.theme.text.muted
      : remaining <= 10 ? ctx.theme.text.feedback.error.base
      : remaining <= 25 ? ctx.theme.text.feedback.warning.base
      : ctx.theme.text.feedback.success.base
    const primary = () => footerWindows(windows()).primary
    const weekly = () => footerWindows(windows()).weekly
    const primaryRemaining = () => {
      const window = primary()
      return window ? remainingPercent(window.used_percent) : null
    }
    const weeklyRemaining = () => {
      const window = weekly()
      return window ? remainingPercent(window.used_percent) : null
    }
    const footerRemaining = () => Math.min(
      primaryRemaining() ?? 100,
      weeklyRemaining() ?? 100,
    )
    const Footer = () => (
      <Show when={visible()}>
        <Show when={windows().length > 0} fallback={<text fg={ctx.theme.text.muted}>OpenAI usage unavailable</text>}>
          <box flexDirection="row" flexShrink={0}>
            <text fg={ctx.theme.text.base}>OpenAI </text>
            <text fg={color(footerRemaining())} bg={ctx.theme.background.raised.base}>
              {stackedBar(primaryRemaining(), weeklyRemaining())}
            </text>
            <text fg={color(footerRemaining())}>
              {` ${footerText(windows(), unavailable())}`}
            </text>
          </box>
        </Show>
      </Show>
    )

    ctx.ui.slot({ append: "prompt.footer.status", render: Footer })
    ctx.ui.slot({ append: "home.footer.status", render: Footer })
    ctx.ui.slot({
      append: "sidebar.content",
      render: () => (
        <Show when={visible()}>
          <box flexDirection="column" marginTop={1}>
            <text fg={ctx.theme.text.base}>{`OpenAI${unavailable() && windows().length > 0 ? " (stale)" : ""}`}</text>
            <Show when={windows().length > 0} fallback={<text fg={ctx.theme.text.muted}>Usage unavailable</text>}>
              <For each={windows()}>
                {(item) => (
                  <box flexDirection="column" marginTop={1}>
                    <text fg={ctx.theme.text.muted}>{`${windowLabel(item.limit_window_seconds)} window`}</text>
                    <text fg={color(remainingPercent(item.used_percent))}>
                      {`${usageBar(remainingPercent(item.used_percent))} ${remainingPercent(item.used_percent)}% left`}
                    </text>
                    <text fg={ctx.theme.text.muted}>{resetText(item.reset_at, now())}</text>
                  </box>
                )}
              </For>
            </Show>
          </box>
        </Show>
      ),
    })

    void refresh()
    const timer = setInterval(() => void refresh(), 60_000)
    const clock = setInterval(() => setNow(Date.now()), 30_000)
    return () => {
      clearInterval(timer)
      clearInterval(clock)
      controller.abort()
    }
  },
})
