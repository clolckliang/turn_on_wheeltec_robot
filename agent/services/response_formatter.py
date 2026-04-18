from __future__ import annotations


def success_payload(result):
    return {
        "status": "ok",
        "result": result,
        "display": {
            "title": result.get("action", "experiment_assistant"),
            "summary": result.get("human_summary", ""),
            "bullets": list(result.get("next_suggestions") or []),
        },
    }


def error_payload(message, warnings=None):
    return {
        "status": "error",
        "error": message,
        "warnings": warnings or [],
        "display": {
            "title": "experiment_assistant",
            "summary": message,
            "bullets": list(warnings or []),
        },
    }
