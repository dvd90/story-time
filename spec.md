Product Specification – “Parent Voice Storytime”

1. Product Goal

Create an application that lets parents:
	1.	Onboard by talking about themselves and their child, approving a transcription, and recording their voice to create a personal voice profile.
	2.	Use that saved voice and personality to let a child enter a room where the app:
	•	Speaks in the parent’s cloned voice
	•	Asks the child what kind of story they want
	•	Generates and narrates a story tailored to the child’s personality and preferences stored in the backend.

LiveKit is used for real-time audio rooms, Clerk for authentication, and Anam for voice cloning.

⸻

2. User Roles
	•	Parent (primary user)
	•	Logs in, completes onboarding, creates voice and personality profile.
	•	Later starts/joins rooms where the system talks to the child in their voice.
	•	Child (listener)
	•	Joins the “story room”.
	•	Answers simple questions (e.g., what story they want).
	•	Listens to the story told in the parent’s voice.
	•	System / Agent
	•	Appears in the room as an automated speaker.
	•	Handles transcription, confirmations, and storytelling.

⸻

3. Scenario 1 – Onboarding Room

3.1 Objective

Allow a new parent to:
	1.	Log in.
	2.	Join a LiveKit onboarding room.
	3.	Speak freely about themselves and their child.
	4.	Approve the transcription of what they said.
	5.	Record a clean voice sample to create a voice ID via Anam.
	6.	Save a parent–child profile and voice profile in the backend.

This creates the base data for future story sessions.

⸻

3.2 High-Level Flow
	1.	Login
	•	Parent logs in using Clerk.
	•	If this is the first time, the app detects no existing parent profile and starts onboarding.
	2.	Join onboarding room
	•	Parent is placed in a LiveKit room dedicated to onboarding.
	•	The system/agent (in any neutral voice) greets the parent and explains:
	•	“Please tell me about you and your child: names, age, interests, bedtime habits, etc.”
	3.	Parent talks about child and parent
	•	Parent speaks freely for ~30–60 seconds.
	•	System listens and transcribes the speech in real time.
	4.	Transcription review & approval
	•	After the parent finishes:
	•	The app shows the transcribed text to the parent.
	•	Parent can:
	•	Approve the text, or
	•	Cancel and repeat the “talk about your child” step (once more, for hackathon scope).
	•	Once approved, this text is saved as the raw description of the parent and child.
	5.	Record voice sample for cloning
	•	The app tells the parent:
	•	“Now we’ll record a clean sample of your voice so we can read stories in your voice.”
	•	Parent records a short script (e.g. reading a suggested text or speaking naturally again).
	•	After recording:
	•	The app confirms the recording was captured successfully.
	6.	Create voice ID via Anam
	•	The recorded voice sample is sent to Anam.
	•	The system creates a voice profile tied to this parent, containing:
	•	Provider (Anam)
	•	Returned voice identifier from Anam
	•	Human-readable label (e.g., “Default parent voice”).
	7.	Save parent & child profile
	•	System stores:
	•	Parent name
	•	Child name
	•	Child age (if mentioned or asked separately)
	•	Raw transcription text
	•	Optional personality summary (a condensed description derived from the transcription)
	•	Voice profile reference
	8.	Onboarding completion
	•	Parent sees a confirmation screen:
	•	“Your voice and your child’s profile are ready. Next time, we’ll read stories in your voice.”
	•	The onboarding scenario ends here.

⸻

3.3 Functional Requirements (Scenario 1)
	•	The system must:
	1.	Require a logged-in parent via Clerk before onboarding.
	2.	Provide a LiveKit room where the system listens to the parent’s audio.
	3.	Transcribe the parent’s description and show it in text form for approval.
	4.	Allow the parent to accept or redo the transcription step at least once.
	5.	Capture a clean voice recording separate from the initial description.
	6.	Send this recording to Anam and receive a voice identifier.
	7.	Store:
	•	Parent details
	•	Child details
	•	Approved transcription
	•	Voice identifier
	8.	Mark onboarding as “complete” for this user so it’s not repeated on every login.

⸻

4. Scenario 2 – Story Room

4.1 Objective

Allow a returning parent/child to:
	1.	Log in.
	2.	Enter a LiveKit story room with the parent’s cloned voice.
	3.	Have the system (in the parent’s voice) ask the child what story they want.
	4.	Use the saved personality and the child’s answer to generate a story.
	5.	Narrate the story in the parent’s voice.

⸻

4.2 High-Level Flow
	1.	Login and profile detection
	•	Parent logs in again using Clerk.
	•	The system looks up their existing parent profile and voice profile.
	•	If no profile exists, the user is redirected to onboarding (Scenario 1).
	2.	Create or join a story room
	•	Parent (or child, with the parent’s help) starts “Story time”.
	•	The system creates a LiveKit room and joins an agent that uses the parent’s voice.
	•	The interface shows:
	•	Parent’s name
	•	Child’s name
	•	Optional avatar representing the parent.
	3.	System greets the child in the parent’s voice
	•	The agent speaks using the saved voice:
	•	“Hi [ChildName], it’s [ParentName]. What kind of story would you like tonight?”
	4.	Child answers
	•	The child answers out loud (or via button options if needed).
	•	The system listens and transcribes the child’s response.
	•	From this response, it extracts the desired story theme (for example: “dinosaurs”, “space”, “princess and dragon”).
	5.	Use backend personality and theme to prepare story
	•	The system sends to the backend:
	•	Parent profile (including parent/child names and personality summary).
	•	Child’s requested theme.
	•	Backend generates a story based on:
	•	Child’s personality and interests from onboarding.
	•	Requested story theme.
	•	The story should be:
	•	Age-appropriate.
	•	Use the child’s name.
	•	Approximately 40 seconds of narration or more.
	•	Can be internally split into multiple segments for narration.
	6.	System narrates the story in the parent’s voice
	•	The story text is converted to audio using the parent’s voice profile.
	•	The agent in the LiveKit room plays the story segments sequentially.
	•	From the child’s point of view, it feels like:
	•	“[ParentName] is talking and telling the story” even if the parent is not actively speaking.
	7.	End of session
	•	After the story ends, the agent closes with a short message in the parent’s voice:
	•	“The story is over. Good night, [ChildName].”
	•	The room can then be closed or kept open for another story.

⸻

4.3 Functional Requirements (Scenario 2)
	•	The system must:
	1.	Identify the logged-in parent and load their existing parent profile and voice profile.
	2.	Refuse to start a story room if no onboarding data exists (require completion of Scenario 1).
	3.	Create a LiveKit room with an automated agent that uses the parent’s voice.
	4.	Ask the child what kind of story they want, out loud, in the parent’s voice.
	5.	Capture and transcribe the child’s response.
	6.	Interpret the response to determine a story theme (at least basic keyword extraction).
	7.	Generate a story that uses:
	•	The story theme.
	•	The child’s name.
	•	The parent/child personality data from the backend.
	8.	Narrate the story fully in the parent’s voice through the LiveKit room.
	9.	Achieve at least one full story of around 40 seconds of narration in the demo.

⸻

5. Shared Requirements Across Both Scenarios
	•	Authentication
	•	All critical actions (onboarding, story start) require a logged-in user via Clerk.
	•	Persistence
	•	Parent profile, child profile, personality, and voice ID must be stored and re-used.
	•	Voice identity
	•	The same parent must get the same voice in every future story session.
	•	User experience
	•	All key screens should:
	•	Clearly explain what the user (parent or child) should do now.
	•	Provide confirmation when an important step is complete (e.g., voice recorded, transcription saved).
	•	Demo readiness
	•	The system must support a full, smooth path:
	•	New user → onboarding room → voice/profile saved
	•	Same user → story room → child chooses → story generated → story narrated in parent’s voice.

⸻

If you want, I can now turn this into a one-page PRD or a checklist version just for “what must be done by hackathon end” so you can print it and stick it on the table.