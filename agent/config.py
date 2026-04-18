import os


class AgentConfig(object):
    def __init__(self, package_root, data_dir):
        self.package_root = package_root
        self.data_dir = data_dir
        self.openai_api_key = os.getenv("OPENAI_API_KEY", "").strip()
        self.openai_model = os.getenv("OPENAI_MODEL", "gpt-4o-mini").strip()
        self.recorder_command_topic = "/web/data_collect/command"
        self.recorder_status_topic = "/web/data_collect/status"
        self.control_status_topic = "/web/control_status"
        self.download_route_prefix = "/api/data/download/"
        self.summary_sample_limit = int(os.getenv("EXPERIMENT_SUMMARY_SAMPLE_LIMIT", "500"))
        self.recorder_command_timeout = float(os.getenv("EXPERIMENT_RECORDER_TIMEOUT", "5.0"))


def build_agent_config(package_root, data_dir):
    return AgentConfig(package_root=package_root, data_dir=data_dir)
