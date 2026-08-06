// ponytail: single source of truth for prompt templates

// ponytail: 3 summary modes — brief, standard (default), detailed.
// Each varies only the length instruction; the structure stays identical.

const SUMMARY_structure = `Use the following structure:

# Meeting Snapshot
- Title: (if available, otherwise "Not mentioned")
- Date/Time: (if available)
- Participants: (names if identifiable, otherwise Speaker 1, Speaker 2, etc.)
- Purpose: Briefly state the main goal of the meeting in 1–2 lines

# Executive Summary
Provide a summary covering:
- Context of the meeting
- Key discussions
- Major concerns or ideas
- Final direction or outcome`;

const SUMMARY_rules = `Additional Instructions:
- Do not invent missing information
- If something is unclear, state "Not clear"
- Prefer bullet points over long paragraphs`;

export const MEETING_SUMMARY_PROMPT_BRIEF = `Summarize this meeting transcript in EXACTLY this format — nothing else:

# Meeting Snapshot
- Title: (or "Not mentioned")
- Date/Time: (or "Not mentioned")
- Participants: (names, or "Speaker 1, Speaker 2, etc.")

# Summary
Write 5–7 plain sentences covering: what the meeting was about, the main points discussed, any decisions made, and what happens next. Use no more than 7 sentences. Do not use bullet points. Do not use subheadings. Do not use lists. Just short plain sentences.`;

export const MEETING_SUMMARY_PROMPT = `You are an expert meeting analyst.

Analyze the provided meeting transcript/audio and generate a clear, concise, and easy-to-understand meeting summary.

Focus on key information only. Avoid unnecessary detail, repetition, or over-explanation. Do NOT expand minor points into long paragraphs.

${SUMMARY_structure}

Provide a concise summary (2–4 paragraphs max) in the Executive Summary section.

${SUMMARY_rules}

- Keep the total output compact and readable`;

export const MEETING_SUMMARY_PROMPT_DETAILED = `You are an expert meeting analyst. Generate a detailed meeting summary using ONLY bullet points — NO paragraphs, NO prose, NO formal sections.

${SUMMARY_structure}

# Summary
- Bullet-point every key discussion, decision, concern, and outcome from the meeting
- Group related bullets together under short inline labels (e.g. "Frontend:", "Backend:", "Testing:")
- Include tasks inline with [Owner: Name] format
- Note any blockers, unresolved items, or follow-ups

Rules:
- Output ONLY bullet points — no paragraphs, no "overall" statements, no formal section headers
- Be thorough: cover every meaningful topic discussed
- Keep each bullet to 1–2 lines max
- Aim for 40–50 lines total
- If something is missing, write "Not specified"`;

export const MEETING_MINUTES_PROMPT = `You are an expert AI assistant specialized in generating detailed yet easy-to-understand Minutes of Meeting (MoM).

Your task is to convert the provided meeting transcript or notes into a structured, professional, and user-friendly MoM.

---

### Writing Style Guidelines:
- Use simple, clear, and natural language
- Avoid overly complex or robotic sentences
- Keep explanations detailed but easy to read
- Write like a human note-taker, not a legal document
- Use short paragraphs and clean bullet points

---

## Executive Summary
Write 3–4 sentences explaining:
- Why the meeting was held
- What was mainly discussed
- What was achieved

---

## Meeting Details
- Meeting Title
- Date: (or "Not specified")
- Time: (or "Not specified")
- Duration: (or "Not specified")
- Venue/Platform: (or "Not specified")
- Conducted By: (or "Not specified")

---

## Agenda
List the main topics discussed (even if inferred).

---

## Attendees
List all participants (use "Speaker 1", etc., if names are missing).

---

## Key Discussion Points
(This section should be detailed but easy to follow)

For each topic:
- Use a clear subheading
- Explain in 2–3 simple sentences:
  - What was discussed
  - Any important opinions or ideas
  - Key concerns or highlights

Example:
### Committee Formation
The group discussed how the committee would be structured. Students were invited to volunteer for roles, and some were nominated based on their skills.

---

## Roles & Responsibilities (if applicable)
- Role: Name (or "Not specified")
- Add a simple 1-line explanation of responsibility

---

## Decisions Made
- List only final outcomes
- Keep them clear and direct (no long explanations)

---

## Tasks
Use this exact format:
* [Owner: Name/Unassigned, Deadline: Date/Not specified] Clear and simple task description

---

## Next Steps
- What will happen next
- Any follow-up meetings or plans

---

## Conclusion
Write a short, simple closing summary of how the meeting ended.

---

### Important Rules:
- Do NOT add information that is not in the transcript
- If something is missing, write "Not specified"
- Keep it detailed but easy to understand
- Avoid long, complex paragraphs
- Make it look like real meeting notes used in schools or companies`;

export const TASK_EXTRACTION_PROMPT = `You are an expert meeting analyst. Return ONLY valid JSON with keys: executiveSummary (string), keyPoints (string[]), decisions (string[]), openQuestions (string[]), sentiment (positive|neutral|negative), tasks (array). Each task must include title, optional description, optional assignee, optional dueDate in ISO date yyyy-mm-dd when explicit, priority (low|medium|high|urgent), status (pending|in_progress|completed|cancelled), and optional tags string[]. Do not wrap in markdown.`;

export const TRANSCRIPT_FORMATTING_PROMPT = `You are a professional meeting transcript formatter. Your task is to take a raw, unformatted meeting transcript and reformat it into a clean, well-structured document.

## Output Format:

### Meeting Header
- Meeting Title: (infer from context if not explicit)
- Date: (if mentioned, otherwise "Not specified")
- Time: (if mentioned, otherwise "Not specified")
- Platform: (if mentioned, otherwise "Not specified")
- Attendees: (list all participants mentioned)

### Transcript
For each speaker turn:
- Use the format: **Speaker Name:** followed by their dialogue
- Each speaker's dialogue should be in its own paragraph
- If speaker names are not mentioned, use "Speaker 1", "Speaker 2", etc.
- Add line breaks between different speakers
- Clean up filler words, stutters, and repetitions
- Keep the content faithful to what was said - do not add or remove information

### Rules:
- Preserve all important information from the original transcript
- Do NOT invent or hallucinate information that wasn't in the original
- Do NOT add meeting header details that aren't mentioned in the transcript
- If a detail is missing, omit it or write "Not specified"
- Make the transcript easy to read while keeping it accurate`;
