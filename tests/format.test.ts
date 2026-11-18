import assert from "node:assert/strict"
import test from "node:test"
import { footerText, footerWindows, remainingPercent, resetText, stackedBar, usageBar, windowLabel } from "../format.ts"

test("percentages report remaining capacity and stay within bounds", () => {
  assert.equal(remainingPercent(9), 91)
  assert.equal(remainingPercent(32), 68)
  assert.equal(remainingPercent(0), 100)
  assert.equal(remainingPercent(100), 0)
  assert.equal(remainingPercent(-10), 100)
  assert.equal(remainingPercent(110), 0)
  assert.equal(remainingPercent(32.4), 68)
})

test("Unicode bars show remaining capacity at fixed widths", () => {
  assert.equal(usageBar(0), "░".repeat(10))
  assert.equal(usageBar(50), "█████░░░░░")
  assert.equal(usageBar(100), "█".repeat(10))
  assert.equal(usageBar(91, 10), "█████████░")
  assert.equal(usageBar(68, 10), "███████░░░")
  assert.equal(usageBar(65), "██████▌░░░")
  assert.equal(usageBar(5), "▌░░░░░░░░░")
  assert.equal(usageBar(95), "█████████▌")
  assert.equal(usageBar(-10), "░".repeat(10))
  assert.equal(usageBar(110), "█".repeat(10))
})

test("both stacked bars represent every 5% step independently in ten columns", () => {
  const shapes: Record<string, [number, number]> = {
    " ": [0, 0], "▖": [0, 1], "▄": [0, 2],
    "▘": [1, 0], "▌": [1, 1], "▙": [1, 2],
    "▀": [2, 0], "▛": [2, 1], "█": [2, 2],
  }
  for (let primary = 0; primary <= 100; primary += 5) {
    const sidebar = usageBar(primary)
    assert.equal(sidebar.length, 10)
    const halves = [...sidebar].reduce((total, cell) => total + (cell === "█" ? 2 : cell === "▌" ? 1 : 0), 0)
    assert.equal(halves, primary / 5)
    for (let weekly = 0; weekly <= 100; weekly += 5) {
      const cells = stackedBar(primary, weekly)
      assert.equal(cells.length, 10)
      const [top, bottom] = [...cells].reduce(([upper, lower], cell) => {
        const [a, b] = shapes[cell]
        return [upper + a, lower + b]
      }, [0, 0])
      assert.equal(top, primary / 5)
      assert.equal(bottom, weekly / 5)
    }
  }
})

test("quadrants handle partial, empty, full, missing and out-of-range windows", () => {
  assert.equal(stackedBar(91, 68), "███████▀▀ ")
  assert.equal(stackedBar(65, 60), "██████▘   ")
  assert.equal(stackedBar(60, 65), "██████▖   ")
  assert.equal(stackedBar(65, 65), "██████▌   ")
  assert.equal(stackedBar(65, 70), "██████▙   ")
  assert.equal(stackedBar(70, 65), "██████▛   ")
  assert.equal(stackedBar(0, 100, 1), "▄")
  assert.equal(stackedBar(100, 0, 1), "▀")
  assert.equal(stackedBar(null, 100, 1), "▄")
  assert.equal(stackedBar(null, null, 1), " ")
  assert.equal(stackedBar(-10, 110, 1), "▄")
  assert.equal(stackedBar(Number.NaN, Number.POSITIVE_INFINITY), " ".repeat(10))
})

test("window labels follow the provider's reported durations", () => {
  assert.equal(windowLabel(300), "5m")
  assert.equal(windowLabel(18000), "5h")
  assert.equal(windowLabel(86400), "1d")
  assert.equal(windowLabel(604800), "7d")
  assert.equal(windowLabel(2592000), "30d")
})

test("reset countdowns use hours/minutes or days/hours", () => {
  const now = 1_800_000_000_000
  const after = (seconds: number) => (now + seconds * 1000) / 1000
  assert.equal(resetText(after(4 * 3600 + 35 * 60), now), "Resets in 4h 35m")
  assert.equal(resetText(after(5 * 86400 + 3 * 3600), now), "Resets in 5d 3h")
  assert.equal(resetText(after(60), now), "Resets in 1m")
  assert.equal(resetText(after(1), now), "Resets in 1m")
  assert.equal(resetText(after(0), now), "Reset pending refresh")
  assert.equal(resetText(after(-60), now), "Reset pending refresh")
  assert.equal(resetText(0, now), "Reset time unavailable")
  assert.equal(resetText(Number.NaN, now), "Reset time unavailable")
})

test("the compact footer labels the primary percentage without repeating sidebar details", () => {
  const windows = [
    { used_percent: 9, limit_window_seconds: 18000, reset_at: 1_800_000_000 },
    { used_percent: 32, limit_window_seconds: 604800, reset_at: 1_800_500_000 },
  ]
  const expected = "91%"
  assert.equal(footerText(windows), expected)
  assert.equal(footerText(windows, true), `${expected} (stale)`)
  assert.equal(footerText([]), "OpenAI usage unavailable")
  assert.equal(footerText([windows[1]]), "7d 68%")
  assert.doesNotMatch(footerText(windows), /reset|GPT/i)
  assert.deepEqual(footerWindows(windows), { primary: windows[0], weekly: windows[1] })
  assert.deepEqual(footerWindows([windows[1]]), { primary: undefined, weekly: windows[1] })
})
