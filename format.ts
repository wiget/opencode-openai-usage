import type { UsageWindow } from "./rpc"

export function windowLabel(seconds: number) {
  if (seconds >= 86400) return `${Math.round(seconds / 86400)}d`
  if (seconds >= 3600) return `${Math.round(seconds / 3600)}h`
  return `${Math.max(1, Math.round(seconds / 60))}m`
}

export function remainingPercent(usedPercent: number) {
  return Math.round(100 - Math.min(100, Math.max(0, usedPercent)))
}

function filledHalves(remaining: number | null, width: number) {
  if (remaining === null || !Number.isFinite(remaining)) return 0
  return Math.round(Math.min(100, Math.max(0, remaining)) * width * 2 / 100)
}

export function usageBar(remaining: number, width = 10) {
  const halves = filledHalves(remaining, width)
  const filled = Math.floor(halves / 2)
  const half = halves % 2
  return "█".repeat(filled) + (half ? "▌" : "") + "░".repeat(width - filled - half)
}

export function stackedBar(primary: number | null, weekly: number | null, width = 10) {
  const top = filledHalves(primary, width)
  const bottom = filledHalves(weekly, width)
  // Each cell has two horizontal steps in each half-row. Both bars share a fill color.
  const quadrants = [
    [" ", "▖", "▄"],
    ["▘", "▌", "▙"],
    ["▀", "▛", "█"],
  ]
  return Array.from({ length: width }, (_, index) => {
    const upper = Math.min(2, Math.max(0, top - index * 2))
    const lower = Math.min(2, Math.max(0, bottom - index * 2))
    return quadrants[upper][lower]
  }).join("")
}

export function footerWindows(windows: UsageWindow[]) {
  return {
    primary: windows.find((window) => window.limit_window_seconds < 86400),
    weekly: windows.find((window) => window.limit_window_seconds >= 86400),
  }
}

export function resetText(resetAt: number, now = Date.now()) {
  if (!Number.isFinite(resetAt) || resetAt <= 0) return "Reset time unavailable"
  const difference = resetAt * 1000 - now
  if (difference <= 0) return "Reset pending refresh"

  const minutes = Math.ceil(difference / 60_000)
  if (minutes >= 1440) return `Resets in ${Math.floor(minutes / 1440)}d ${Math.floor(minutes % 1440 / 60)}h`
  if (minutes >= 60) return `Resets in ${Math.floor(minutes / 60)}h ${minutes % 60}m`
  return `Resets in ${minutes}m`
}

export function footerText(windows: UsageWindow[], stale = false) {
  if (windows.length === 0) return "OpenAI usage unavailable"
  const { primary } = footerWindows(windows)
  const window = primary ?? windows[0]
  return `${primary ? "" : `${windowLabel(window.limit_window_seconds)} `}${remainingPercent(window.used_percent)}%${stale ? " (stale)" : ""}`
}
