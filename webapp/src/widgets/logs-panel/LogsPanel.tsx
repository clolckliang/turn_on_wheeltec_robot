import { TerminalSquare } from "lucide-react";

import { useRobotStore } from "@/entities/robot/model/robot-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

export function LogsPanel() {
  const logs = useRobotStore((state) => state.logs);
  const alertLogs = logs.filter((log) => log.level !== "info").slice(-3).reverse();

  const toneClass = (level: string) => {
    switch (level) {
      case "error":
        return "text-red-300";
      case "warning":
        return "text-amber-300";
      default:
        return "text-slate-200";
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div>
          <CardDescription>浏览器端连接与控制日志</CardDescription>
          <CardTitle className="mt-1">Logs & Alerts</CardTitle>
        </div>
        <TerminalSquare className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          {alertLogs.length === 0 ? (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
              当前没有活跃告警，关键链路处于可监控状态。
            </div>
          ) : null}
          {alertLogs.map((log) => (
            <div key={`alert-${log.id}`} className="rounded-2xl border border-border/70 bg-background/65 px-4 py-3">
              <div className={toneClass(log.level)}>
                <div className="text-xs uppercase tracking-[0.16em]">{log.level}</div>
                <div className="mt-2 text-sm">{log.message}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="max-h-72 space-y-2 overflow-auto rounded-3xl border border-border/70 bg-slate-950 p-4 font-mono text-xs text-slate-200">
          {logs.length === 0 ? <p>等待日志输出...</p> : null}
          {logs
            .slice()
            .reverse()
            .map((log) => (
              <div key={log.id} className={toneClass(log.level)}>
                [{new Date(log.timestamp).toLocaleTimeString("zh-CN", { hour12: false })}] [{log.level}] {log.message}
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
