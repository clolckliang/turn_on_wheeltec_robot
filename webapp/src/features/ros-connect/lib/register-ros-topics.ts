import { useFaultStore } from "@/entities/fault/model/fault-store";
import { useRobotStore } from "@/entities/robot/model/robot-store";
import { useRecorderStore } from "@/features/recorder/model/recorder-store";
import { robotConfig } from "@/shared/config/robot";
import {
  adaptControlStatusMessage,
  adaptCurrentMessage,
  adaptImuMessage,
  adaptOdometryMessage,
  adaptRecorderStatusMessage,
  adaptVoltageMessage,
} from "@/shared/lib/ros/adapters";
import { rosClient } from "@/shared/lib/ros/client";

function refreshFaultSummary() {
  useFaultStore.getState().refreshFaultSummary(useRobotStore.getState().telemetry);
}

export function registerRosTopics() {
  const patchTelemetry = useRobotStore.getState().patchTelemetry;
  const appendCurrentSample = useRobotStore.getState().appendCurrentSample;
  const appendVelocitySample = useRobotStore.getState().appendVelocitySample;
  const markTopicSeen = useRobotStore.getState().markTopicSeen;
  const appendLog = useRobotStore.getState().appendLog;
  const setRecorderStatus = useRecorderStore.getState().setStatus;
  let previousRecorderState = useRecorderStore.getState().status.state;

  const cleanups = [
    rosClient.subscribe(robotConfig.topics.voltage.name, robotConfig.topics.voltage.type, (message) => {
      markTopicSeen("voltage");
      patchTelemetry(adaptVoltageMessage(message as Record<string, unknown>));
      refreshFaultSummary();
    }),
    rosClient.subscribe(robotConfig.topics.current.name, robotConfig.topics.current.type, (message) => {
      markTopicSeen("current");
      const adapted = adaptCurrentMessage(message as Record<string, unknown>);
      patchTelemetry(adapted.telemetry);
      appendCurrentSample(adapted.sample);
      refreshFaultSummary();
    }),
    rosClient.subscribe(robotConfig.topics.imu.name, robotConfig.topics.imu.type, (message) => {
      markTopicSeen("imu");
      patchTelemetry(adaptImuMessage(message as Record<string, unknown>));
      refreshFaultSummary();
    }),
    rosClient.subscribe(robotConfig.topics.odom.name, robotConfig.topics.odom.type, (message) => {
      markTopicSeen("odom");
      const adapted = adaptOdometryMessage(message as Record<string, unknown>);
      patchTelemetry(adapted.telemetry);
      appendVelocitySample(adapted.sample);
      refreshFaultSummary();
    }),
    rosClient.subscribe(robotConfig.topics.controlStatus.name, robotConfig.topics.controlStatus.type, (message) => {
      markTopicSeen("controlStatus");
      patchTelemetry(adaptControlStatusMessage(message as Record<string, unknown>));
      refreshFaultSummary();
    }),
    rosClient.subscribe(robotConfig.topics.recorderStatus.name, robotConfig.topics.recorderStatus.type, (message) => {
      markTopicSeen("recorderStatus");
      const nextStatus = adaptRecorderStatusMessage(message as Record<string, unknown>);
      setRecorderStatus(nextStatus);

      if (nextStatus.state !== previousRecorderState) {
        appendLog({
          level: nextStatus.state === "idle" ? "warning" : "info",
          message: `Recorder state -> ${nextStatus.state}${nextStatus.file ? ` (${nextStatus.file})` : ""}`,
        });
        previousRecorderState = nextStatus.state;
      }
    }),
  ];

  return () => cleanups.forEach((cleanup) => cleanup?.());
}
