import { useEffect, useState } from "react";
import { BatteryCharging, GaugeCircle, Signal } from "lucide-react";

import { useFaultStore } from "@/entities/fault/model/fault-store";
import { useRobotStore, type TopicKey } from "@/entities/robot/model/robot-store";
import { useGamepadStore } from "@/features/gamepad/model/gamepad-store";
import { useRosConnectStore } from "@/features/ros-connect/model/ros-connect-store";
import { robotConfig } from "@/shared/config/robot";
import { deriveBatteryState } from "@/shared/lib/ros/adapters";
import { formatAge, formatPercent, formatVoltage } from "@/shared/lib/format";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent } from "@/shared/ui/card";
import { Progress } from "@/shared/ui/progress";

const topicLabels: Record<TopicKey, string> = {
  odom: "odom",
  imu: "imu",
  voltage: "voltage",
  current: "current",
  controlStatus: "control",
  recorderStatus: "recorder",
};

function getTopicVariant(lastSeenAt: number, timeoutMs: number) {
  if (!lastSeenAt) {
    return "neutral" as const;
  }
  return Date.now() - lastSeenAt <= timeoutMs ? ("success" as const) : ("warning" as const);
}

export function StatusOverview() {
  const [now, setNow] = useState(Date.now());
  const telemetry = useRobotStore((state) => state.telemetry);
  const topicSeenAt = useRobotStore((state) => state.topicSeenAt);
  const fault = useFaultStore((state) => state.summary);
  const gamepad = useGamepadStore((state) => state.snapshot);
  const connectionStatus = useRosConnectStore((state) => state.status);
  const battery = deriveBatteryState(telemetry.batteryVoltage);
  const topicSummary = (["odom", "current", "controlStatus", "recorderStatus"] as TopicKey[]).map((topic) => ({
    topic,
    label: topicLabels[topic],
    seenAt: topicSeenAt[topic],
    timeoutMs: robotConfig.topicFreshness[topic],
  }));

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="grid gap-4 xl:grid-cols-4">
      <Card>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Connection</div>
            <Signal className="h-4 w-4 text-primary" />
          </div>
          <Badge variant={connectionStatus === "connected" ? "success" : connectionStatus === "error" ? "danger" : "info"}>
            {connectionStatus}
          </Badge>
          <p className="text-sm text-muted-foreground">rosbridge 与 CSV API 通过同一控制台统一管理。</p>
          <div className="grid grid-cols-2 gap-2">
            {topicSummary.map((item) => (
              <div key={item.topic} className="rounded-2xl border border-border/70 bg-background/65 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{item.label}</span>
                  <Badge variant={getTopicVariant(item.seenAt, item.timeoutMs)}>{item.seenAt ? "live" : "waiting"}</Badge>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">{formatAge(item.seenAt, now)}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Battery</div>
            <BatteryCharging className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-semibold">{formatVoltage(telemetry.batteryVoltage)}</div>
          <Progress value={battery.level * 100} />
          <div className="text-sm text-muted-foreground">
            {battery.label} · {formatPercent(battery.level)}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Control Status</div>
            <GaugeCircle className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-semibold">{telemetry.controlStatus}</div>
          <p className="text-sm text-muted-foreground">
            输入优先级: Touch / Gamepad / Keyboard
            <br />
            control topic: {formatAge(topicSeenAt.controlStatus, now)}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Fault / Gamepad</div>
            <Badge variant={gamepad.connected ? "info" : "neutral"}>{gamepad.connected ? "Gamepad Ready" : "No Gamepad"}</Badge>
          </div>
          <div className="text-2xl font-semibold">{fault.label}</div>
          <p className="text-sm text-muted-foreground">{fault.advice}</p>
        </CardContent>
      </Card>
    </div>
  );
}
