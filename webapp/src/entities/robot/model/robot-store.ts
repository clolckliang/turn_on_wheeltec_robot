import { create } from "zustand";

import { robotConfig } from "@/shared/config/robot";
import { createTelemetrySnapshot } from "@/shared/lib/ros/adapters";
import type { LogEntry } from "@/shared/types/log";
import type { CurrentSample, TelemetrySnapshot, VelocitySample } from "@/shared/types/telemetry";

export type TopicKey = keyof typeof robotConfig.topicFreshness;

interface RobotState {
  telemetry: TelemetrySnapshot;
  velocityHistory: VelocitySample[];
  currentHistory: CurrentSample[];
  topicSeenAt: Record<TopicKey, number>;
  logs: LogEntry[];
  patchTelemetry: (patch: Partial<TelemetrySnapshot>) => void;
  appendVelocitySample: (sample: VelocitySample) => void;
  appendCurrentSample: (sample: CurrentSample) => void;
  markTopicSeen: (topic: TopicKey, timestamp?: number) => void;
  appendLog: (entry: Omit<LogEntry, "id" | "timestamp">) => void;
}

function appendBounded<T>(items: T[], item: T) {
  return [...items.slice(-(robotConfig.chartLength - 1)), item];
}

export const useRobotStore = create<RobotState>((set) => ({
  telemetry: createTelemetrySnapshot(),
  velocityHistory: [],
  currentHistory: [],
  topicSeenAt: {
    odom: 0,
    imu: 0,
    voltage: 0,
    current: 0,
    controlStatus: 0,
    recorderStatus: 0,
  },
  logs: [],
  patchTelemetry: (patch) =>
    set((state) => ({
      telemetry: {
        ...state.telemetry,
        ...patch,
      },
    })),
  appendVelocitySample: (sample) =>
    set((state) => ({
      velocityHistory: appendBounded(state.velocityHistory, sample),
    })),
  appendCurrentSample: (sample) =>
    set((state) => ({
      currentHistory: appendBounded(state.currentHistory, sample),
    })),
  markTopicSeen: (topic, timestamp = Date.now()) =>
    set((state) => ({
      topicSeenAt: {
        ...state.topicSeenAt,
        [topic]: timestamp,
      },
    })),
  appendLog: (entry) =>
    set((state) => ({
      logs: appendBounded(state.logs, {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        ...entry,
      }),
    })),
}));
