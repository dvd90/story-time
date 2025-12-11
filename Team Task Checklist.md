Hackathon – Team Task Checklist
Dev A – Backend & Glue
Phase 1 (0:00–0:45)
- Init backend project (Node/Express or FastAPI).
- Create POST /api/onboarding (store parentName, childName, chosenVoice).
- Create POST /api/story/start (accept mode, return mock story text).
- Create POST /api/story/audio-chunks (accept storyText, return split chunks).
Phase 2 (0:45–2:00)
- Integrate story logic functions (from Dev C) into /api/story/start.
- Use (parentName, childName) when calling story generator.
- Make /api/story/audio-chunks ready for Dev D (just returns chunks).
Phase 3 (2:00–3:00)
- Wire voice selection: store chosenVoiceId in memory.
- Pass voiceId into /api/story/audio-chunks response.
- Fix integration bugs between frontend ↔ backend ↔ LiveKit.
Dev B – Frontend & Avatar
Phase 1 (0:00–0:45)
- Init simple frontend (React or HTML+JS).
- Build onboarding form.
- Generate Avatar button → show image + parent name.
- Start Story button → call /api/story/start.
Phase 2 (0:45–2:00)
- Add story mode selection (Predefined | Generated | Previous).
- Display story-in-progress screen.
- Create layout with avatar + speaking indicator.
Phase 3 (2:00–3:00)
- Show LiveKit view with avatar.
- Animate 'speaking' icon.
- UI polish (colors, fonts, remove debug).
Dev C – Story Logic & LLM
Phase 1 (0:00–0:45)
- Implement story functions: generate, predefined, previous.
- Ensure story ≈ 40 seconds (3 paragraphs).
Phase 2 (0:45–2:00)
- Replace generateStoryFromScratch with real LLM call.
- Include parent + child names in prompt.
- Make story easily chunkable (split by blank lines).
Phase 3 (2:00–3:00)
- Tune story prompts.
- Add simple 'Question:' line after paragraph 1.
- Adjust content if audio timing is off.
Dev D – LiveKit, STT/TTS, ElevenLabs
Phase 1 (0:00–0:45)
- Set up LiveKit room + simple client.
- Make agent/bot play static audio.
Phase 2 (0:45–2:00)
- Integrate ElevenLabs / LiveKit TTS.
- Implement playStory(): fetch chunks → TTS → stream audio.
Phase 3 (2:00–3:00)
- Map frontend-selected voices to real voice IDs.
- Ensure 40+ seconds continuous story audio.
- Fix timing gaps, volume issues, or fallback TTS handling.