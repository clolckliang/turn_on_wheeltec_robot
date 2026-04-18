export type RecorderState = "idle" | "recording" | "processing";
export type RecorderCommand = "start" | "stop";

export interface RecorderStatus {
  state: RecorderState;
  count: number;
  duration: number;
  rate: number;
  file: string;
  outputDir: string;
}

export interface PendingRecorderCommand {
  command: RecorderCommand;
  sentAt: number;
  timedOut: boolean;
}

export interface RecordedFile {
  name: string;
  size: number;
  mtime: number;
}
