"""
Expo Push Notification sender.
Docs: https://docs.expo.dev/push-notifications/sending-notifications/

Sends notifications in chunks of 100 (Expo server limit).
Failures are logged and swallowed so they never break the main request flow.
"""

import logging
from typing import Any

import httpx

logger = logging.getLogger(__name__)

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"
_CHUNK_SIZE = 100
_VALID_PREFIXES = ("ExponentPushToken[", "ExpoPushToken[")


def _is_valid_expo_token(token: str) -> bool:
    return any(token.startswith(prefix) for prefix in _VALID_PREFIXES)


def _chunk(lst: list, size: int):
    for i in range(0, len(lst), size):
        yield lst[i : i + size]


async def send_expo_push(
    tokens: list[str],
    title: str,
    body: str,
    data: dict[str, Any] | None = None,
) -> None:
    """Fire-and-forget Expo push to a list of Expo push tokens."""
    valid_tokens = [t for t in tokens if _is_valid_expo_token(t)]
    if not valid_tokens:
        return

    messages = [
        {
            "to": token,
            "title": title,
            "body": body,
            "sound": "default",
            **({"data": data} if data else {}),
        }
        for token in valid_tokens
    ]

    async with httpx.AsyncClient(timeout=10.0) as client:
        for chunk in _chunk(messages, _CHUNK_SIZE):
            try:
                response = await client.post(
                    EXPO_PUSH_URL,
                    json=chunk,
                    headers={
                        "Accept": "application/json",
                        "Accept-Encoding": "gzip, deflate",
                        "Content-Type": "application/json",
                    },
                )
                if response.status_code >= 400:
                    logger.warning(
                        "Expo push API returned %s: %s",
                        response.status_code,
                        response.text[:200],
                    )
            except Exception as exc:
                # Push failure must never crash the booking/availability flow
                logger.error("Expo push send error: %s", exc)
