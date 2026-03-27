"""Tests for health metrics behavior."""

from app.core.metrics import RequestMetrics


def test_health_ignores_client_errors_for_degradation() -> None:
    metrics = RequestMetrics()

    metrics.record_request(200)
    metrics.record_request(404)

    payload = metrics.to_dict()

    assert payload["total_requests"] == 2
    assert payload["error_count"] == 0
    assert payload["error_rate_percent"] == 0.0
    assert payload["status"] == "healthy"


def test_health_needs_minimum_samples_before_degraded() -> None:
    metrics = RequestMetrics()

    # 5xx responses should not mark degraded until minimum sample size is reached.
    for _ in range(RequestMetrics.MIN_REQUESTS_FOR_HEALTH_EVAL - 1):
        metrics.record_request(500)

    payload = metrics.to_dict()

    assert payload["total_requests"] == RequestMetrics.MIN_REQUESTS_FOR_HEALTH_EVAL - 1
    assert payload["error_count"] == RequestMetrics.MIN_REQUESTS_FOR_HEALTH_EVAL - 1
    assert payload["error_rate_percent"] == 100.0
    assert payload["status"] == "healthy"


def test_health_degraded_after_threshold_with_enough_samples() -> None:
    metrics = RequestMetrics()

    # 20 requests with 2 server errors = 10%, should be degraded.
    for _ in range(18):
        metrics.record_request(200)
    for _ in range(2):
        metrics.record_request(500)

    payload = metrics.to_dict()

    assert payload["total_requests"] == 20
    assert payload["error_count"] == 2
    assert payload["error_rate_percent"] == 10.0
    assert payload["status"] == "degraded"
