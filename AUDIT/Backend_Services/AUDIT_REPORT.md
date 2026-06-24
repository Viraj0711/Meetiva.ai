# Backend Services — Audit Report

**Date:** June 24, 2026
**Module:** Backend Services
**Files Audited:** `services/googleCalendar.ts`, `services/grokMeetingAnalyzer.ts`, `services/meetingStatus.ts`, `services/whisperTranscriber.ts`

---

## 1. Google Calendar Service (`services/googleCalendar.ts`) — 195 lines

### Purpose
Handles Google OAuth 2.0 authentication, token encryption/decryption, and Google Calendar API interactions.

### Key Functions

| Function | Purpose |
|----------|---------|
| `getEncryptionKey()` | Derives AES-256-GCM key from env (hex/base64/utf8) |
| `encryptToken(plainToken)` | Encrypts OAuth tokens with AES-256-GCM |
| `decryptToken(encryptedPayload)` | Decrypts OAuth tokens |
| `getGoogleOAuthClient()` | Creates OAuth2 client from env vars |
| `upsertGoogleTokens(userId, tokens)` | Stores/updates encrypted tokens in DB |
| `getValidGoogleAccessToken(userId)` | Gets valid token, refreshing if expired |
| `getGoogleCalendarClient(userId)` | Creates authenticated Calendar client |
| `getCalendarConnectionStatus(userId)` | Checks connection status |
| `revokeGoogleConnection(userId)` | Revokes token and deletes from DB |

### ✅ Strengths
1. **AES-256-GCM encryption** for stored tokens — Not just base64, but proper authenticated encryption
2. **Flexible key format** — Accepts hex (64 chars), base64 (44 chars), or raw UTF-8 (32 bytes)
3. **Automatic token refresh** — Detects expiry (with 1-minute buffer) and refreshes automatically
4. **Graceful error handling** — Token refresh failure returns null instead of throwing
5. **Proper OAuth state handling** — CSRF protection via state parameter
6. **`upsert` pattern** — Creates or updates tokens atomically

### ⚠️ Issues Found

1. **Encryption key validation is too permissive** — The `getEncryptionKey()` function falls through multiple formats. If a 32-byte string doesn't match hex or base64 patterns, it's treated as raw UTF-8. This could produce weak keys if the env var is set to a short, guessable string.
   - **Recommendation:** Add minimum entropy check or enforce a specific format.

2. **`decryptToken` error handling** — If decryption fails (wrong key, tampered data), it throws an error that propagates up. This could crash requests.
   - **Impact:** If the encryption key changes, all stored tokens become undecryptable, breaking calendar integration for all users.

3. **No token rotation** — Refresh tokens are stored indefinitely. Google may revoke unused refresh tokens.

4. **`revokeGoogleConnection` silently ignores errors** — The `catch` block only logs a warning. If token revocation fails, the DB record is still deleted. This is acceptable behavior, but should be documented.

---

## 2. Grok Meeting Analyzer (`services/grokMeetingAnalyzer.ts`) — 155 lines

### Purpose
Analyzes meeting transcripts using xAI's Grok API to extract summaries, key points, decisions, questions, sentiment, and action items.

### Key Functions

| Function | Purpose |
|----------|---------|
| `analyzeTranscriptWithGrok(transcript)` | Main analysis function |
| `parseJsonResponse(rawContent)` | Handles both direct JSON and markdown-fenced JSON |
| `fallbackFromTranscript(transcript)` | Graceful degradation when parsing fails |

### ✅ Strengths
1. **Structured output schema** — Returns a typed `GrokAnalysisResult` with all required fields
2. **JSON parsing resilience** — Handles both plain JSON and markdown-fenced code blocks
3. **Graceful fallback** — If AI output can't be parsed, falls back to transcript snippet
4. **Priority/Status normalization** — Validates and normalizes priority and status strings
5. **Low temperature (0.2)** — For consistent, deterministic output
6. **Clean system prompt** — Instructs the model to return only valid JSON

### ⚠️ Issues Found

1. **No retry logic** — If the Grok API fails (network error, rate limit), the entire meeting upload fails. Consider adding retry with exponential backoff.

2. **No timeout** — The `fetch()` call has no timeout. If the API hangs, the request hangs indefinitely (Node.js default is no timeout).

3. **`fallbackFromTranscript` returns truncated data** — Uses `transcript.slice(0, 600)` as the executive summary. This is a poor fallback — it's just raw text, not a summary.

4. **No token limit management** — Long transcripts could exceed context window limits. No truncation or chunking strategy is implemented.

5. **Error message contains API response** — `JSON.stringify(payload)` in error messages could leak API details. Acceptable for now if logs are secure.

---

## 3. Whisper Transcriber (`services/whisperTranscriber.ts`) — 82 lines

### Purpose
Transcribes audio/video files using OpenAI's Whisper API.

### Key Functions

| Function | Purpose |
|----------|---------|
| `transcribeWithWhisper(fileBuffer, originalname, mimeType)` | Sends file to Whisper API |
| `isAudioOrVideoFile(originalname)` | Validates file extension |

### Supported Formats
```
mp3, mp4, mpeg, mpga, m4a, wav, webm, ogg, mov, avi, aac
```

### ✅ Strengths
1. **FormData construction** — Properly builds multipart request with correct content types
2. **Size validation** — Checks against Whisper's 25MB hard limit before sending
3. **Extension detection** — Maps file extensions to MIME types, with graceful fallback
4. **Clean error handling** — Specific error messages with HTTP status codes

### ⚠️ Issues Found

1. **No model configuration** — Hardcoded to `whisper-1`. This is fine but should be configurable via env var for future upgrades.

2. **No language detection** — Whisper can detect the language automatically (default behavior), but the transcript doesn't record which language was detected. The stored language is always "en" in the database.

3. **No response_format fallback** — Uses `response_format: 'text'` which returns plain text. If the API changes, this could break. Consider `json` or `verbose_json` for more structured data.

4. **Error response not parsed** — `response.text()` returns the raw body. If the API returns JSON errors, they're embedded in the error string. Consider `response.json()` for structured error handling.

5. **No progress tracking** — Whisper transcription is synchronous (wait for full response). The frontend shows fake progress. This is acceptable but consider streaming responses in the future.

---

## 4. Meeting Status Sync (`services/meetingStatus.ts`) — 32 lines

### Purpose
Syncs meeting status based on action item completion state.

### Logic
- If a meeting has action items AND all are completed → mark meeting as `completed`
- Otherwise → mark meeting as `pending`
- Sets `completedAt` timestamp on first full completion

### ✅ Strengths
- Simple, focused service
- Efficient with parallel queries (Promise.all)
- Only updates if meeting exists (guards against race conditions)

### ⚠️ Issues
1. **Status transition from 'completed' back to 'pending'** — If all action items are completed but a new one is added, the meeting reverts to `pending`. This is correct behavior but could confuse users.
2. **No handling for `failed` status** — The service only toggles between `completed` and `pending`. If a meeting is in `failed` status, action item completion won't change that.

---

## 5. Overall Services Assessment

**Rating: B+ (Good)**

| Service | Rating | Key Strength | Key Concern |
|---------|--------|-------------|-------------|
| Google Calendar | A- | AES-256-GCM encryption | Key validation too permissive |
| Grok Analyzer | B+ | Resilient JSON parsing | No timeout/retry |
| Whisper | B+ | Proper multipart handling | Hardcoded model, no progress |
| Meeting Status | A- | Clean, focused | Limited status coverage |

### Cross-Cutting Recommendations

1. **Add retry + timeout to all external API calls** (both Grok and Whisper)
2. **Implement token limit management** for Grok analysis of long transcripts
3. **Add structured logging** with request IDs for debugging API integrations
4. **Consider async processing** with job queues for long-running transcription/analysis
5. **Add metrics/monitoring** for external API latency and error rates
