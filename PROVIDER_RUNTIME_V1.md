# LearnByRP Provider Runtime v1

## Goal

The learner flow must not care whether a turn is handled by Gemini, OpenAI Realtime, a local OpenAI-compatible model, or a future on-device model.

The runtime separates three jobs:

1. **Listen** — speech-to-text / microphone transport.
2. **Think** — roleplay conversation and structured model work.
3. **Speak** — character text-to-speech.

A provider may implement one or more jobs, but the UI never imports a vendor SDK.

## Runtime flow

```text
selected target language
        |
        v
Native voice input (today)
expo-speech-recognition
        |
        v
ConversationProvider
  auto
   |---- OpenAI Realtime text session
   |       |
   |       `---- failure -> HTTP provider
   |
   `---- HTTP actor route
             |
             `---- structured provider
                    Gemini
                    OpenAI-compatible local/self-hosted
                    deterministic fallback
        |
        v
character reply text
        |
        v
speech output policy
   |---- server TTS provider (Gemini today)
   `---- failure/offline -> native OS TTS
                            exact target locale first
                            enhanced voice preferred
                            base-language fallback
```

Scene truth and the evidence ledger remain outside model providers. A model can propose dialogue or actions; it does not own the authoritative scene reducer or learning evidence.

## Client contracts

### Conversation

`ConversationProvider` exposes `respond(turn)`, optional `connect()`, optional `cancel()`, and `dispose()`.

`LiveSessionView` creates it through `createConversationProvider()` and never calls Gemini or OpenAI directly.

### Voice

`VoiceTransport` exposes capture, playback and lifecycle events. The current implementation is `NativeVoiceTransport`, created through `createVoiceTransport()`.

This is the seam for a later local Whisper/whisper.cpp recognizer, platform PCM recorder, OpenAI WebRTC full-duplex adapter, Gemini Live raw-PCM adapter, or fully on-device speech stack.

## OpenAI Realtime

The app never receives a normal OpenAI API key.

1. Client asks the LearnByRP server for `POST /api/realtime/session`.
2. Server uses `OPENAI_API_KEY` to mint a short-lived Realtime client secret.
3. Client opens a persistent Realtime WebSocket session.
4. Native speech recognition supplies text turns.
5. Realtime returns structured text for the existing actor contract.
6. If Realtime cannot connect or fails during a turn, that session switches to the normal HTTP provider and continues.

This v1 deliberately uses Realtime as a **stateful text conversation brain**, not as raw microphone transport. The current Expo Go stack does not provide the production raw PCM/WebRTC bridge needed for a robust full-duplex implementation. The `ConversationProvider` / `VoiceTransport` split means adding that adapter later does not require rewriting learner screens.

## Gemini TTS

Character speech uses `POST /api/speech/synthesize`. Gemini is currently the cloud speech adapter.

The TTS request keeps character text verbatim and places pace, style and locale direction in speech metadata. The client preserves the returned MIME type when playing provider audio.

If cloud TTS is unavailable, slow, or returns an error, the roleplay turn is not failed. The already-generated character text is spoken with the native fallback.

## Native language adaptation

`resolveSpeechLocale()` maps target languages to locale defaults:

| Target | Default locale |
| --- | --- |
| Spanish | es-ES |
| French | fr-FR |
| German | de-DE |
| Italian | it-IT |
| Japanese | ja-JP |
| Dutch | nl-BE |
| English | en-GB |

For native TTS, LearnByRP enumerates installed device voices and scores exact locale first, then base language, enhanced quality, local/on-device service, and finally OS default.

An explicit locale can later override the default (for example `fr-BE`, `nl-NL`, `es-MX`) without changing the transport. The same locale is used for native speech recognition.

## Local models

Configure a server-side OpenAI-compatible model:

```env
STRUCTURED_PROVIDER=openai-compatible
OPENAI_COMPATIBLE_BASE_URL=http://127.0.0.1:1234/v1
OPENAI_COMPATIBLE_MODEL=my-local-model
```

The server calls `/chat/completions` using the same structured JSON contract as the Gemini adapter. An API key is optional.

This is server-to-provider traffic. If LearnByRP's API server is deployed in the cloud, `127.0.0.1` means the cloud host, not the user's laptop. A local model must run beside the API server, be reachable over an allowed private network, or later be implemented as an on-device provider.

## Fallback policy

| Job | Preferred | Fallback |
| --- | --- | --- |
| speech input | target-locale native STT | typed input |
| roleplay conversation | OpenAI Realtime when available/configured | HTTP conversation provider |
| HTTP structured actor | configured structured model | deterministic actor |
| coach/assessment | configured structured model | bounded deterministic/local logic where supported |
| character TTS | configured server speech provider | target-locale native OS voice |

Provider failure must never erase a learner turn, convert silence/network failure into a lapse, bypass the scene reducer, mark assisted evidence as unassisted, or expose a long-lived provider secret to the client.

## Adding another provider

Implement the smallest relevant contract instead of editing the UI:

- conversation model -> `ConversationProvider`
- native/local capture/playback -> `VoiceTransport`
- server JSON model -> `StructuredJsonProvider`
- server speech model -> `SpeechProvider`

Then register it in the appropriate factory/runtime descriptor and add capability/fallback tests.
