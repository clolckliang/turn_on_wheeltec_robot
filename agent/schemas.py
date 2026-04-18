from __future__ import annotations

from typing import Any, Dict, List, Optional, TypedDict

try:
    from pydantic import BaseModel, Field
except ImportError:
    raise RuntimeError("pydantic is required for the agent subsystem")


class ExperimentFile(BaseModel):
    file_name: str
    display_name: Optional[str] = None
    label: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    summary: Optional[str] = None
    mtime: float
    size: int
    metadata_path: Optional[str] = None


class ExperimentContext(BaseModel):
    is_recording: bool
    current_experiment_name: Optional[str] = None
    current_experiment_label: Optional[str] = None
    current_file_name: Optional[str] = None
    current_started_at: Optional[float] = None
    last_exported_file: Optional[str] = None
    recent_files: List[ExperimentFile] = Field(default_factory=list)
    last_summary: Optional[str] = None


class RecorderRuntimeStatus(BaseModel):
    state: str = "idle"
    count: int = 0
    duration: float = 0.0
    rate: float = 0.0
    file: str = ""
    output_dir: str = ""


class ToolResult(BaseModel):
    success: bool
    action: str
    message: str
    file_name: Optional[str] = None
    experiment_name: Optional[str] = None
    label: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    summary: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    warnings: List[str] = Field(default_factory=list)


class SamplingAssistantResponse(BaseModel):
    action: str
    success: bool
    current_recording: bool
    file_name: Optional[str] = None
    experiment_name: Optional[str] = None
    label: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    summary: Optional[str] = None
    warnings: List[str] = Field(default_factory=list)
    next_suggestions: List[str] = Field(default_factory=list)
    human_summary: str
    metadata: Dict[str, Any] = Field(default_factory=dict)


class AgentInvokeRequest(BaseModel):
    role: str
    message: str
    context: Dict[str, Any] = Field(default_factory=dict)


class SamplingAssistantState(TypedDict, total=False):
    request_id: str
    user_input: str
    parsed_intent: Optional[str]
    target_file: Optional[str]
    requested_name: Optional[str]
    requested_label: Optional[str]
    requested_limit: Optional[int]
    context: ExperimentContext
    tool_outputs: Dict[str, Any]
    warnings: List[str]
    response: Optional[Dict[str, Any]]

