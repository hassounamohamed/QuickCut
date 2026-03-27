"""
Simple health check and metrics endpoint.
"""

import time
from datetime import datetime


class RequestMetrics:
    """Track request metrics for monitoring."""

    MIN_REQUESTS_FOR_HEALTH_EVAL = 20
    MAX_ERROR_RATE_PERCENT = 10.0

    def __init__(self):
        self.request_count = 0
        self.error_count = 0
        self.start_time = time.time()

    def record_request(self, status_code: int):
        """Record a request.

        Health degradation only tracks server-side failures (5xx),
        since 4xx responses are usually client input/auth issues.
        """
        self.request_count += 1
        if status_code >= 500:
            self.error_count += 1

    def uptime_seconds(self) -> float:
        """Get uptime in seconds."""
        return time.time() - self.start_time

    def error_rate(self) -> float:
        """Get error rate percentage."""
        if self.request_count == 0:
            return 0.0
        return (self.error_count / self.request_count) * 100

    def to_dict(self):
        """Export metrics as dictionary."""
        error_rate = self.error_rate()
        enough_samples = self.request_count >= self.MIN_REQUESTS_FOR_HEALTH_EVAL

        return {
            "timestamp": datetime.utcnow().isoformat(),
            "uptime_seconds": round(self.uptime_seconds(), 2),
            "total_requests": self.request_count,
            "error_count": self.error_count,
            "error_rate_percent": round(error_rate, 2),
            "status": "degraded"
            if enough_samples and error_rate >= self.MAX_ERROR_RATE_PERCENT
            else "healthy",
        }


# Global metrics instance
metrics = RequestMetrics()
