from __future__ import annotations

import json
import threading
import time

import rospy
from nav_msgs.msg import Odometry
from sensor_msgs.msg import Imu
from std_msgs.msg import Float32, Float32MultiArray, String

from agent.schemas import RecorderRuntimeStatus


class TelemetryCache(object):
    def __init__(self):
        self._lock = threading.Lock()
        self._snapshot = {
            "odom": {
                "linear_x": 0.0,
                "linear_y": 0.0,
                "angular_z": 0.0,
                "position_x": 0.0,
                "position_y": 0.0,
            },
            "imu": {
                "gx": 0.0,
                "gy": 0.0,
                "gz": 0.0,
                "ax": 0.0,
                "ay": 0.0,
                "az": 0.0,
            },
            "voltage": 0.0,
            "currents": [0.0, 0.0, 0.0],
            "control_status": {"status": "idle"},
            "updated_at": time.time(),
        }
        self._recorder_status = RecorderRuntimeStatus()
        self._topic_seen = {}

        rospy.Subscriber("/odom", Odometry, self._odom_callback)
        rospy.Subscriber("/imu", Imu, self._imu_callback)
        rospy.Subscriber("/PowerVoltage", Float32, self._voltage_callback)
        rospy.Subscriber("/current_data", Float32MultiArray, self._current_callback)
        rospy.Subscriber("/web/control_status", String, self._control_status_callback)
        rospy.Subscriber("/web/data_collect/status", String, self._recorder_status_callback)

    def _mark_seen(self, topic_name):
        self._topic_seen[topic_name] = time.time()

    def _odom_callback(self, msg):
        with self._lock:
            self._snapshot["odom"] = {
                "linear_x": float(msg.twist.twist.linear.x),
                "linear_y": float(msg.twist.twist.linear.y),
                "angular_z": float(msg.twist.twist.angular.z),
                "position_x": float(msg.pose.pose.position.x),
                "position_y": float(msg.pose.pose.position.y),
            }
            self._snapshot["updated_at"] = time.time()
        self._mark_seen("/odom")

    def _imu_callback(self, msg):
        with self._lock:
            self._snapshot["imu"] = {
                "gx": float(msg.angular_velocity.x),
                "gy": float(msg.angular_velocity.y),
                "gz": float(msg.angular_velocity.z),
                "ax": float(msg.linear_acceleration.x),
                "ay": float(msg.linear_acceleration.y),
                "az": float(msg.linear_acceleration.z),
            }
            self._snapshot["updated_at"] = time.time()
        self._mark_seen("/imu")

    def _voltage_callback(self, msg):
        with self._lock:
            self._snapshot["voltage"] = float(msg.data)
            self._snapshot["updated_at"] = time.time()
        self._mark_seen("/PowerVoltage")

    def _current_callback(self, msg):
        values = list(msg.data or [])
        with self._lock:
            self._snapshot["currents"] = [
                float(values[0] if len(values) > 0 else 0.0),
                float(values[1] if len(values) > 1 else 0.0),
                float(values[2] if len(values) > 2 else 0.0),
            ]
            self._snapshot["updated_at"] = time.time()
        self._mark_seen("/current_data")

    def _control_status_callback(self, msg):
        raw = msg.data or ""
        parsed = {"status": str(raw)}
        try:
            payload = json.loads(raw)
            if isinstance(payload, dict):
                parsed = payload
        except Exception:
            pass
        with self._lock:
            self._snapshot["control_status"] = parsed
            self._snapshot["updated_at"] = time.time()
        self._mark_seen("/web/control_status")

    def _recorder_status_callback(self, msg):
        raw = msg.data or "{}"
        payload = {}
        try:
            payload = json.loads(raw)
        except Exception:
            payload = {}
        with self._lock:
            self._recorder_status = RecorderRuntimeStatus(
                state=str(payload.get("state", "idle")),
                count=int(payload.get("count", 0) or 0),
                duration=float(payload.get("duration", 0.0) or 0.0),
                rate=float(payload.get("rate", 0.0) or 0.0),
                file=str(payload.get("file", "") or ""),
                output_dir=str(payload.get("output_dir", "") or ""),
            )
            self._snapshot["updated_at"] = time.time()
        self._mark_seen("/web/data_collect/status")

    def get_snapshot(self):
        with self._lock:
            return json.loads(json.dumps(self._snapshot))

    def get_recorder_status(self):
        with self._lock:
            return RecorderRuntimeStatus(**self._recorder_status.dict())

    def get_topic_seen(self):
        return dict(self._topic_seen)

