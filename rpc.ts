import { Rpc } from "@opencode/plugin/rpc"

export type UsageWindow = {
  used_percent: number
  limit_window_seconds: number
  reset_at: number
}

export type UsageResult = { windows: UsageWindow[] }

export const Usage = Rpc.define({
  id: "opencode-openai-usage",
  events: {},
  methods: {
    get: {
      input: { type: "object", additionalProperties: false },
      output: {
        type: "object",
        properties: {
          windows: {
            type: "array",
            items: {
              type: "object",
              properties: {
                used_percent: { type: "number" },
                limit_window_seconds: { type: "number" },
                reset_at: { type: "number" },
              },
              required: ["used_percent", "limit_window_seconds", "reset_at"],
              additionalProperties: false,
            },
          },
        },
        required: ["windows"],
        additionalProperties: false,
      },
    },
  },
})
