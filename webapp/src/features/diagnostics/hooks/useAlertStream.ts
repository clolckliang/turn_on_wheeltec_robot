import { useEffect, useRef } from "react";

import { useRobotStore, type TopicKey } from "@/entities/robot/model/robot-store";
import { useGamepadStore } from "@/features/gamepad/model/gamepad-store";
import { useRosConnectStore } from "@/features/ros-connect/model/ros-connect-store";
import { robotConfig } from "@/shared/config/robot";

type StreamState = "waiting" | "live" | "stale";

const monitoredTopics: TopicKey[] = ["odom", "imu", "voltage", "current", "controlStatus", "recorderStatus"];

const topicLabels: Record<TopicKey, string> = {
  odom: "/odom",
  imu: "/imu",
  voltage: "/PowerVoltage",
  current: "/current_data",
  controlStatus: "/web/control_status",
  recorderStatus: "/web/data_collect/status",
};

function getStreamState(topic: TopicKey, lastSeenAt: number, now: number): StreamState {
  if (!lastSeenAt) {
    return "waiting";
  }
  return now - lastSeenAt > robotConfig.topicFreshness[topic] ? "stale" : "live";
}

export function useAlertStream() {
  const appendLog = useRobotStore((state) => state.appendLog);
  const rosStatus = useRosConnectStore((state) => state.status);
  const gamepadConnected = useGamepadStore((state) => state.snapshot.connected);
  const gamepadId = useGamepadStore((state) => state.snapshot.id);

  const previousRosStatus = useRef(rosStatus);
  const previousGamepadConnected = useRef(gamepadConnected);
  const topicStates = useRef<Record<TopicKey, StreamState>>({
    odom: "waiting",
    imu: "waiting",
    voltage: "waiting",
    current: "waiting",
    controlStatus: "waiting",
    recorderStatus: "waiting",
  });

  useEffect(() => {
    if (previousRosStatus.current === rosStatus) {
      return;
    }

    const previous = previousRosStatus.current;
    previousRosStatus.current = rosStatus;

    if (rosStatus === "connected") {
      appendLog({ level: "info", message: `rosbridge connected (from ${previous})` });
      return;
    }

    if (rosStatus === "reconnecting") {
      appendLog({ level: "warning", message: "rosbridge reconnecting, command and telemetry may stall" });
      return;
    }

    if (rosStatus === "error") {
      appendLog({ level: "error", message: "rosbridge error detected, check websocket target and rosbridge service" });
      return;
    }

    if (rosStatus === "disconnected") {
      appendLog({ level: "warning", message: "rosbridge disconnected" });
    }
  }, [appendLog, rosStatus]);

  useEffect(() => {
    if (previousGamepadConnected.current === gamepadConnected) {
      return;
    }

    previousGamepadConnected.current = gamepadConnected;
    appendLog({
      level: gamepadConnected ? "info" : "warning",
      message: gamepadConnected ? `gamepad connected -> ${gamepadId}` : "gamepad disconnected",
    });
  }, [appendLog, gamepadConnected, gamepadId]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = Date.now();
      const { topicSeenAt } = useRobotStore.getState();

      monitoredTopics.forEach((topic) => {
        const nextState = getStreamState(topic, topicSeenAt[topic], now);
        const previousState = topicStates.current[topic];
        if (nextState === previousState) {
          return;
        }

        topicStates.current[topic] = nextState;

        if (previousState === "waiting" && nextState === "live") {
          appendLog({ level: "info", message: `${topicLabels[topic]} stream active` });
          return;
        }

        if (previousState === "stale" && nextState === "live") {
          appendLog({ level: "info", message: `${topicLabels[topic]} stream restored` });
          return;
        }

        if (nextState === "stale") {
          appendLog({
            level: "warning",
            message: `${topicLabels[topic]} stale -> no fresh messages for ${Math.round(robotConfig.topicFreshness[topic] / 1000)}s`,
          });
        }
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [appendLog]);
}
