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

export const MEETING_SUMMARY_PROMPT = `Generate a SHORT meeting summary. This is a SUMMARY — not minutes, not a detailed report, not a structured MoM. Do NOT output section headings. Do NOT output bullet-point lists. Do NOT output a structured document.

# Meeting Snapshot
- Title: (or "Not mentioned")
- Date/Time: (or "Not mentioned")
- Participants: (or "Speaker 1, Speaker 2")
- Purpose: 1 sentence

# Summary
Write 4–6 plain sentences total. Cover what was discussed, key decisions, and next steps in a short paragraph someone can read in 10 seconds.

Rules:
- Maximum 6 sentences
- No subheadings inside Summary
- No bullet points
- No task lists
- No ## headings anywhere in the output
- If you need to mention a task, weave it into a sentence`;

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

export const MEETING_MINUTES_PROMPT = `Generate structured Minutes of Meeting (MoM). This is NOT a summary. This is a full structured document with ## section headings and bullet points. Do NOT write a short paragraph. Do NOT write a summary. Do NOT skip any section.

---

## Executive Summary
- 3–4 bullet points explaining: why the meeting was held, what was mainly discussed, what was achieved

---

## Meeting Details
- Meeting Title: (or "Not specified")
- Date: (or "Not specified")
- Time: (or "Not specified")
- Duration: (or "Not specified")
- Venue/Platform: (or "Not specified")
- Conducted By: (or "Not specified")

---

## Agenda
- Bullet point each main topic discussed

---

## Attendees
- List each participant on its own line (use "Speaker 1", etc., if names are missing)

---

## Key Discussion Points
- One subheading per topic (### Topic Name)
- Under each subheading, 3–5 bullet points covering what was discussed, key opinions, concerns, and outcomes
- Each bullet must be one line

---

## Roles & Responsibilities (if applicable)
- Role: Name — one-line responsibility description

---

## Decisions Made
- One bullet per decision, clear and direct

---

## Tasks
- [Owner: Name/Unassigned, Deadline: Date/Not specified] Task description

---

## Next Steps
- One bullet per follow-up item

---

## Conclusion
- 1–2 bullet points summarizing how the meeting ended

---

### Rules:
- Every section MUST use ## headings and bullet points — no paragraphs, no prose, no multi-sentence blocks
- Do NOT write a summary — this is a full structured MoM document
- Do NOT add information not in the transcript
- If something is missing, write "Not specified"
- Keep every bullet to one line where possible`;

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
