# LearnByRP — Speaking-First Living Curriculum Architecture

**Version:** 1.0  
**Status:** proposal for Master Product Architecture  
**Scope:** complete learning architecture from first launch through Pre-A1/A1 → C1  
**Companion contracts:** `LEARNBYRP_ROLEPLAY_PROGRAM_TODO_V1.md`, `LEARNBYRP_DESIGN_SYSTEM_V4_TODO.md`, Learner Journey V2 Banded Evidence contract  
**Core product thesis:** LearnByRP does not teach a language and then add roleplay. **Roleplay is the learning environment.**

---

# 0. Executive decision

LearnByRP should not compete on:

- having AI conversation;
- generating unlimited dialogues;
- vocabulary lists;
- grammar explanations;
- pronunciation playback;
- avatars;
- speech-to-text;
- text-to-speech;
- generic "practice with AI" prompts.

All of those are becoming commodities. A general AI model can already create millions of conversations.

The defensible product is the system that turns conversation into **a governed learning process**:

> **Goal → living roleplay → meaningful pressure to speak → support only when needed → validated evidence → targeted feedback → retry → transfer → spaced return → harder roleplay.**

The product should feel like entering a world, not opening a course.

The pedagogy can be sophisticated internally while remaining almost invisible to the learner.

The learner should mostly experience:

> **Something is happening. Someone is waiting for me. I need to say something. I can get help if I need it. What I did changes what comes next.**

That is the LearnByRP moat.

---

# 1. The actual problem LearnByRP solves

## 1.1 Conversation is not the scarce resource

AI has made conversation abundant.

A learner can already ask a general model:

> "Pretend you are a waiter and speak Dutch with me."

That can produce an entertaining conversation, but it does not automatically produce a learning system.

An open conversation normally does not know, with trustworthy authority:

- which communicative skill was supposed to appear;
- whether the learner actually got an opportunity to use it;
- whether the learner used it independently;
- whether a visible phrase or model answer invalidated "cold" evidence;
- whether silence was a language failure or simply hesitation;
- whether the next scene is genuine transfer or merely another cosmetic variant;
- what the learner can do across different situations and different days;
- whether a harder task is developmentally appropriate;
- whether a B2 mission contained only an A2 opportunity;
- whether an apparent success came from accessibility accommodation or pedagogical help;
- whether performance improves after a retry;
- whether the skill survives in a new context a week later.

**Conversation generation is cheap. Learning orchestration is not.**

## 1.2 The product problem is speaking activation

Many learners know more language than they can retrieve under conversational pressure.

The bottleneck is often not:

> "Have I seen this vocabulary?"

It is:

> "Can I retrieve useful language, take a turn, keep the exchange alive, repair a problem and accomplish something while another person is waiting?"

LearnByRP therefore optimizes for **meaningful language use**, not content consumption.

The core activation problem is:

> How do we get the learner to take the next meaningful turn without making the experience frightening, fake, passive or dependent on answers being shown first?

---

# 2. Product thesis: the Living Curriculum

The proposed LearnByRP category is:

> **A speaking-first living curriculum delivered through roleplay.**

It combines properties that are usually separated:

| Traditional course | Generic AI conversation | LearnByRP |
|---|---|---|
| Curriculum | Usually none | Hidden reviewed curriculum |
| Real interaction | Limited | Strong |
| Defined tasks | Yes | Yes |
| Consequences/world state | Weak | Bounded + deterministic |
| Speaking from start | Often delayed | Default |
| Help | Pre-taught | Scoped rescue ladder |
| Evidence | Quiz/course completion | Opportunity-linked |
| Transfer | Rarely measured | First-class |
| Retry | Exercise repetition | Pedagogically interpreted |
| Difficulty | Course chapter | Authored + calibrated |
| Longitudinal skill state | Coarse | Skill × channel × band |
| Next activity | Linear chapter | Evidence-driven |
| Native/local variety review | Course dependent | Reviewed content contract |

The product is not "Duolingo plus voice" and not "ChatGPT with characters."

It is closer to:

> **A simulation engine + language coach + longitudinal evidence system + adaptive curriculum.**

---

# 3. Scientific foundation

Research does not provide one magic method for fastest language learning. It does support a set of mechanisms that can be combined into a strong product hypothesis.

Important distinction:

- **Research evidence** tells us which mechanisms are promising.
- **Product design inference** decides how LearnByRP operationalizes those mechanisms.
- **Pilot data** must determine whether LearnByRP itself produces better outcomes than alternatives.

## 3.1 Task-based language learning

A major meta-analysis of task-based language teaching (TBLT) synthesized 52 studies and reported a strong positive overall effect across language-learning outcomes.

The important product implication is not "copy a TBLT textbook."

It is:

> Language practice becomes more meaningful when the learner uses language to accomplish a goal rather than merely display a form.

**LearnByRP implication**

Every mission needs a communicative job:

- order something;
- solve a delivery problem;
- arrange a meeting;
- explain an incident;
- negotiate a solution;
- ask for clarification;
- mediate information;
- persuade;
- disagree appropriately.

The mission goal must be meaningful independently of the grammar being practiced.

## 3.2 Output matters

Swain's output work argued that producing language can contribute to learning by forcing learners to notice gaps, test linguistic hypotheses and reflect on language.

Subsequent empirical work shows that output can promote noticing under some conditions, but output alone does not guarantee acquisition.

**LearnByRP implication**

The learner must regularly produce language rather than only recognize or listen to it.

But LearnByRP must not optimize for raw word count. Production should be tied to:

- a meaningful purpose;
- feedback;
- another attempt;
- future retrieval;
- transfer.

## 3.3 Interaction matters

Interaction research emphasizes negotiation of meaning, clarification and conversational repair as potentially useful conditions for acquisition.

**LearnByRP implication**

A mission should not be a monologue generator.

Characters should create bounded opportunities for the learner to:

- clarify;
- check understanding;
- ask for repetition;
- repair misunderstandings;
- manage turn-taking;
- respond to changed information.

Communication problems become learning opportunities when they are authored safely and interpreted correctly.

## 3.4 Immersion helps, but immersion is not magic

Research comparing classroom, study-abroad and intensive immersion contexts has found meaningful fluency gains in intensive/immersive contexts.

Recent meta-analytic work on study abroad also reports positive average effects on L2 fluency.

But exposure alone is not enough. Study-abroad research repeatedly shows substantial learner and context variation, and duration alone does not reliably explain all learning gains.

**LearnByRP implication**

Do not simulate "being abroad" merely by keeping the interface in the target language.

Instead, engineer the useful properties of immersion:

- repeated need to understand;
- repeated need to respond;
- contextualized language;
- information gaps;
- consequences;
- interaction;
- retrieval under manageable pressure;
- meaningful variation.

## 3.5 Corrective feedback helps, but timing is contextual

Meta-analytic research supports a beneficial overall role for corrective feedback in SLA. Research comparing immediate and delayed feedback is more nuanced; several studies find advantages for immediate feedback in particular learning conditions, while effects vary by target and task.

**LearnByRP implication**

Do not implement the simplistic rule:

> "Never correct during the scene."

Use two feedback paths:

### Flow-preserving feedback
During the roleplay, intervene only when feedback is necessary to keep the communicative event moving or when the learner explicitly requests it.

### Learning feedback
After a meaningful interaction segment, surface the smallest useful correction or alternative that is likely to improve the next attempt.

Then provide an opportunity to use it again.

## 3.6 Task repetition is useful

A 2025 meta-analysis of L2 oral task repetition found positive effects across complexity, accuracy, lexical complexity and fluency, with effect sizes varying by outcome and task conditions.

**LearnByRP implication**

Retry is a core learning mechanic.

But:

> **Retry is not Transfer.**

A retry answers:

> Can the learner perform this communicative job better after experience/feedback?

Transfer answers:

> Can the learner independently use the same capability in a meaningfully different situation?

Both are needed.

## 3.7 Spacing supports retention

A meta-analysis of 48 experiments found medium-to-large benefits of spaced practice for second-language learning, with longer spacing benefiting delayed retention relative to shorter spacing in several conditions.

**LearnByRP implication**

Do not finish a skill because it appeared successfully in one session.

Bring it back:

- later that day when useful;
- on another day;
- in another family;
- in a review-due RP;
- after the learner has had time to forget enough that retrieval becomes meaningful.

## 3.8 Willingness to communicate is a product variable

Meta-analytic research links L2 willingness to communicate with perceived communicative competence, motivation and language anxiety.

This is central to LearnByRP.

A system can contain perfect content but fail if the learner repeatedly avoids opening their mouth.

**LearnByRP implication**

The app must actively engineer willingness to speak:

- low-cost first turn;
- clear role;
- clear purpose;
- no public embarrassment;
- bounded difficulty;
- rescue always available;
- no punishment for using rescue;
- visible improvement;
- familiar recurring contexts;
- predictable session length;
- optional pressure rather than surprise humiliation.

---

# 4. The swimming-pool model

The "language swimming pool" metaphor is useful if it is implemented carefully.

LearnByRP is **not** sink-or-swim.

It is:

> **A swimming pool with lanes, changing depth, a lifeguard, a coach and repeated crossings.**

| Pool metaphor | LearnByRP architecture |
|---|---|
| Water | Target-language interaction |
| Pool | Reviewed roleplay world |
| Lane | Scenario family / communicative task type |
| Depth | Difficulty conditions |
| Swimming | Learner production + interaction |
| Lifeguard | Rescue/support system |
| Coach | Post-task feedback |
| Repeating a length | Retry |
| Another lane | Transfer |
| Deeper water | Band-up / harder conditions |
| Returning another day | Spaced retrieval |
| Open-water test | Novel final/transfer simulation |

The learner should enter the water quickly.

That does **not** mean:

- give no context;
- hide all support;
- force speech after panic;
- classify silence as failure;
- punish help use.

It means:

> Do not make the learner complete a lesson before they are allowed to communicate.

---

# 5. The speaking-first principle

## 5.1 Canonical statement

> **LearnByRP is not a lesson system with roleplay added afterward. Roleplay is the learning environment. Every learner enters a meaningful communicative situation as early as possible. Explanations, examples, vocabulary and grammar support are revealed when they help the learner continue or improve. Help never substitutes for evidence. Progress comes from repeated independent performance and transfer, not from content consumption or mission completion alone.**

## 5.2 Product invariants

1. **Meaningful production begins quickly.**
2. **No mandatory vocabulary or grammar lesson before ordinary RP.**
3. **Help keeps the learner inside the scene.**
4. **Support is recorded.**
5. **Accessibility accommodation is not pedagogical help.**
6. **Scene success is not automatically skill evidence.**
7. **Retry is not Transfer.**
8. **Speaking time is telemetry, not proof of learning.**
9. **Difficulty is authored and later calibrated.**
10. **The AI never decides what the learner "is."**

---

# 6. The minimum viable roleplay is not a conversation

A LearnByRP mission needs more structure than a chat prompt.

## 6.1 Conversation

A generic conversation has:

- an interlocutor;
- a topic;
- turns.

That is not enough.

## 6.2 Roleplay mission

A real LearnByRP mission has:

- a **learner role**;
- an **interlocutor role**;
- a **communicative goal**;
- a **world state**;
- relevant facts known by each side;
- information the learner must discover;
- bounded actions;
- one or more authored skill opportunities;
- conditions that can change;
- consequences;
- an authored completion condition;
- support rules;
- difficulty conditions;
- a scenario-family identity;
- an evidence contract;
- a next-RP relationship.

## 6.3 Mission DNA

Every reviewed mission should answer:

### Situation
Where are we and why are we talking?

### Need
What does the learner need to achieve?

### Friction
What prevents the task from being trivial?

### Opportunities
Which communicative skills can genuinely become necessary?

### Consequences
How does the scene react to what the learner does?

### Rescue
What help is available without replacing the learner?

### Evidence
What may count, at what band and under what support conditions?

### Exit
What ends the scene?

### Next
What should retry, transfer, review or stretch look like?

This Mission DNA is one of the key differences between LearnByRP and an AI chat.

---

# 7. The activation engine: how LearnByRP gets the learner to speak

The biggest UX/pedagogy problem is not generating a good character response.

It is getting the learner to take the next turn.

## 7.1 Time to First Meaningful Speech

Define a product metric:

**TTFMS — Time To First Meaningful Speech**

Measure from mission launch to the learner's first meaningful attempted contribution.

It is not learning evidence by itself.

It is an activation metric.

A strong LearnByRP session should normally avoid:

- long briefing;
- reading ten phrases;
- grammar explanation;
- tutorial carousel;
- selecting lots of options before speaking.

## 7.2 Entry pattern

Default:

```text
Mission card
    ↓
one-sentence context
    ↓
one-sentence learner goal
    ↓
character acts first when natural
    ↓
learner must respond
```

Example:

```text
You are ordering breakfast before work.
Goal: get a coffee and something to eat.

Lotte:
"Goedemorgen. Wat mag het zijn?"
```

The learning starts here.

## 7.3 Beginner entry

A beginner does not need a lesson first.

Possible flow:

```text
8–20 second reviewed model
    ↓
scene starts
    ↓
learner tries
    ↓
rescue available
```

Observe is therefore **an entry support mode**, not a lesson phase.

## 7.4 Intermediate/advanced entry

At B1–C1:

- start colder by default;
- provide optional preparation when the task contract allows it;
- Observe becomes an optional annotated performance rather than a beginner dialogue;
- pressure comes from richer communicative constraints, not from obscure vocabulary.

---

# 8. Rescue: the lifeguard system

The rescue mechanism is essential because speaking activation collapses if the learner expects to become trapped.

The learner must believe:

> "I can try. If I get stuck, I will not drown."

## 8.1 One visible action

The live screen should always have a simple rescue affordance:

> **I'm stuck**

or its localized equivalent.

It opens progressively stronger help without leaving the RP.

## 8.2 Rescue ladder

### R0 — Wait / think
No linguistic content revealed.

### R1 — Communicative intention
Example:

> Ask whether they have another size.

This helps the learner decide what to do but does not reveal the form.

### R2 — Start
Example:

> Hebt u misschien...

Partial production form.

### R3 — Full useful form
Example:

> Hebt u misschien een andere maat?

This is explicit support.

### R4 — Model / listen
The exact phrase can be played.

### R5 — Meaning / slower input
For understanding the character's turn.

The user can stop at any rung.

## 8.3 Evidence consequence

The support ledger must know exactly:

- what was shown;
- what was played;
- what skill it targeted;
- which opportunity it targeted;
- when it occurred.

Then the same successful scene can honestly produce different interpretations:

```text
Learner A:
completed + independent evidence

Learner B:
completed + assisted evidence

Learner C:
completed + no valid target-skill evidence
```

This is a moat.

Generic conversation applications usually collapse these three into "good job."

---

# 9. Feedback architecture

## 9.1 Protect the scene

The main conversation should feel like communication, not continuous correction.

Do not interrupt for every:

- article;
- agreement;
- gender error;
- pronunciation imperfection;
- unnatural phrase.

If the learner's turn works communicatively, the roleplay should normally continue.

## 9.2 Intervene when necessary

Immediate intervention is appropriate when:

- the learner explicitly asks;
- the misunderstanding blocks the scene;
- a safety/regulated-domain boundary requires correction;
- the target challenge is specifically a repair challenge;
- the authored pedagogy requires an immediate prompt.

## 9.3 Post-action feedback

At a natural checkpoint or recap, surface a small number of high-value items.

Recommended default:

- **1 thing that worked**
- **1 thing to improve**
- **1 better formulation when useful**
- **Retry CTA**
- **Transfer CTA when eligible**

Avoid giving the learner ten corrections.

The next attempt is more important than the length of the explanation.

## 9.4 Vocabulary and grammar belong here

Vocabulary and grammar should exist, but they are **support systems around experience**.

Examples:

- "You needed this word twice. Save it?"
- "A useful pattern from this scene"
- "Why the verb moved here"
- "Try this form in the retry"
- "This phrase comes back tomorrow"

This is fundamentally different from:

> Unit 4 — The Perfect Tense

before the learner has needed it.

---

# 10. Retry, variation and transfer

These concepts must remain separate.

## 10.1 Retry

Same communicative job, usually same family.

Purpose:

- reduce planning load;
- incorporate feedback;
- increase fluency;
- improve accuracy;
- recover from a difficult attempt.

Retry is **rehearsal**.

It cannot manufacture transfer credit.

## 10.2 Stretch

Same family, harder conditions.

Examples:

- less planning time;
- natural speech rate;
- another item;
- one additional constraint;
- interruption;
- more turns;
- reduced proactive support.

Stretch tests robustness **inside the family**.

It is not Transfer.

## 10.3 Transfer

Same skill, different reviewed scenario family.

Example:

```text
Skill: request an alternative

Café
    ↓
Bike rental
    ↓
Hotel
```

If the learner can retrieve the communicative ability across families, the claim is stronger than success in three café variants.

## 10.4 Spaced return

A skill should return after time has passed.

The system should deliberately schedule:

```text
today: acquisition / retry
later: new family
later still: review-due cold opportunity
```

The exact spacing policy should remain versioned and calibrated.

---

# 11. A1 → C1: one engine, changing demands

LearnByRP must not become a beginner app.

The same architecture runs across the entire continuum.

## 11.1 Pre-A1 / A1

Roleplay characteristics:

- short turns;
- clear input;
- familiar tasks;
- strong rescue;
- tiny number of communicative goals;
- reviewed model available;
- slow/clear Standard target variety.

The learner still speaks.

## 11.2 A2

Roleplay characteristics:

- follow-up questions;
- substitutions;
- basic repair;
- small complications;
- less support;
- short optional exposure to natural local language.

## 11.3 B1

Roleplay characteristics:

- connected explanation;
- narrating what happened;
- maintaining several turns;
- resolving practical problems;
- natural standard speech;
- more independent planning.

## 11.4 B2

Roleplay characteristics:

- competing constraints;
- alternatives;
- defending a position;
- interruptions;
- less predictable turns;
- light-colloquial input where reviewed;
- optional planning rather than answer scaffolds.

## 11.5 C1

Roleplay characteristics:

- implicit meaning;
- register changes;
- professional/social nuance;
- extended negotiation;
- mediation;
- multiple interlocutors;
- more natural variation;
- ambiguity;
- high information density.

C1 must not mean:

> "Use rare words."

It means more sophisticated communicative control.

---

# 12. Banded evidence architecture

The CEFR band is a property of reviewed content and evidence context, not a global learner label.

## 12.1 Core rule

> **A validated opportunity establishes evidence only for the skill, assessed channel and band that opportunity was authored to observe.**

A B2 mission may contain:

- A2 information request;
- B1 clarification;
- B2 negotiation.

The mission cannot credit all three at B2.

## 12.2 Evidence key

The core projection key becomes:

```text
skillId
× assessedChannel
× evidenceBand
× scenarioFamilyId
```

where `assessedChannel` is:

```text
production | comprehension
```

Delivery modality remains separate:

```text
spoken | typed
```

## 12.3 No downward backfill

C1 evidence does not automatically create:

- B2 Steady;
- B1 Steady;
- A2 Steady;
- A1 Steady.

This is conservative by design.

## 12.4 No learner CEFR identity

Do not show:

> You are B1.

The UI may show:

> B1 scene

and:

> Growing at this challenge level

for a specific skill.

The learner can have uneven frontiers.

---

# 13. Per-skill frontier

A program should not reduce a learner to one current level.

Example internal state:

```text
Ask for clarification
A2: Steady
B1: Growing

Explain a problem
A2: Steady
B1: Supported

Give an opinion with reasons
B1: Steady
B2: Growing
```

The recommendation engine chooses the next RP from these frontiers.

The UI should **not** expose this as a giant analytical dashboard.

Talk still shows one clear next situation.

Progress can reveal more detail when the learner asks.

---

# 14. Entry and placement

Entry support and proficiency are different concepts.

Possible entry modes:

```text
observe_first
guided_first
warmup_first
cold
```

They describe how to start a mission.

They do not label the learner.

## 14.1 Placement

For learners above beginner:

- self-report;
- 2–3 short cold probes;
- probes move up/down;
- result is a per-skill placement hypothesis.

Placement evidence is real observed performance but has restricted authority.

It may choose a starting frontier.

It may not establish:

- Growing;
- Steady;
- Transfer qualification;
- durable band-up.

---

# 15. The living world

The app needs to feel alive.

That does not require a giant RPG.

It requires continuity.

## 15.1 Recurring world

A program can reuse:

- neighbourhoods;
- recurring characters;
- services;
- locations;
- learner goals;
- previously established low-sensitivity facts.

Example Dutch-in-Belgium arc:

```text
You arrive in Brussels
↓
café before work
↓
collect a parcel
↓
ask a neighbour for help
↓
metro disruption
↓
pharmacy question
↓
restaurant with colleague
↓
bike rental
↓
administrative/professional situations
```

The app feels like a life unfolding, while internally the curriculum is selecting skills and opportunities.

## 15.2 Character continuity

Characters can remember permitted continuity facts such as:

- learner alias;
- chosen item;
- previous arrangement;
- recurring appointment context.
Sensitive/personal continuity must remain governed by privacy rules.

Continuity must never become evidence.

## 15.3 Consequences

A mission should respond to decisions.

Examples:

- an unavailable product changes the path;
- missing information causes a follow-up;
- failure to confirm time creates ambiguity;
- accepting one option closes another;
- a misunderstanding requires repair.

Consequences make the roleplay feel real.

But character improvisation never owns world truth. The deterministic scene runtime does.

---

# 16. Dive sessions

A powerful learner-facing mode can be:

> **Dive**

A Dive is a short chain of roleplays organized around a communicative capability.

Recommended target:

**roughly 8–15 minutes**, adaptable to learner preference.

Example:

```text
DIVE: Ask for alternatives

1. Café
2. Bike rental
3. Hotel
4. Optional harder scene
```

A Dive should not be "four random chats."

The system chooses scenes based on:

- current skill frontier;
- transfer requirements;
- recent families;
- review state;
- support history;
- content availability;
- learner preferences.

---

# 17. What vocabulary, grammar and free conversation should become

These features are useful.

They are not the core.

## 17.1 Vocabulary

Vocabulary should be attached to lived experience.

Good:

> "You met `afhaalcode` in the parcel scene."

Better:

> "You needed this twice. Practice it before the next parcel/service RP?"

Vocabulary states can have their own recall schedule.

But vocabulary recall must not masquerade as communicative-skill evidence.

## 17.2 Grammar

Grammar should normally enter through:

1. something the learner tried to say;
2. something that repeatedly caused trouble;
3. a pattern required by an upcoming mission;
4. an optional learner question.

Use micro-explanations.

Then return to speech.

## 17.3 Free conversation

Free conversation can exist as:

- warm-up;
- social sandbox;
- confidence practice;
- target-language hangout.

But it should be clearly separate from the governed progression engine unless a reviewed opportunity contract applies.

Do not turn arbitrary chat into official skill evidence.

---

# 18. Runtime roles

LearnByRP should use AI for what AI is good at and deterministic code for what must remain true.

## 18.1 Program engine

Owns:

- reviewed program;
- learner goal;
- skill frontiers;
- recommendation policy;
- next eligible RP.

No LLM owns final sequencing truth.

## 18.2 Director

Owns:

- authored opportunity timing;
- complications;
- pressure branches;
- completion preparation;
- deterministic scene transitions.

The Director creates a situation in which communication matters.

It does not evaluate learner competence.

## 18.3 Character

LLM/voice actor.

Owns:

- natural wording;
- personality;
- conversational realization;
- bounded improvisation.

Does not own:

- scene facts;
- consequences;
- evidence;
- progression.

## 18.4 Coach

Owns:

- rescue ladder content;
- concise explanations;
- optional feedback rendering.

Every form-revealing support action is scoped and ledgered.

The coach does not choose the next mission.

## 18.5 Assessor

May propose:

> This learner turn appears to demonstrate opportunity X.

It does not persist evidence directly.

## 18.6 Deterministic validator

Checks:

- reviewed skill;
- authored opportunity;
- exact learner passage/revision;
- opportunity lifecycle;
- support state;
- rehearsal state;
- runtime failures;
- band/channel from reviewed content.

Only validator-issued evidence becomes durable learning truth.

## 18.7 Projection engine

Builds:

```text
skill × assessed channel × band
```

states from validated history.

## 18.8 Recommendation engine

Selects the next mission deterministically from reviewed content.

---

# 19. Next-RP policy

Default candidate priority:

1. strict recovery due;
2. review due;
3. Transfer at current frontier;
4. independent practice at frontier;
5. band-up candidate;
6. Stretch;
7. ordinary continuation.

The exact ordering is versioned policy.

The learner may always explore a harder reviewed scene.

Exploration does not rewrite evidence rules.

## 19.1 Content gap

If the engine wants:

```text
skill X
B1
different family
```

and no reviewed mission offers it:

> record a content gap.

Never silently substitute:

- another band;
- another skill;
- same-family cosmetic variant.

---

# 20. Content is part of the moat

The content strategy should not be:

> Generate 100,000 AI conversations.

That creates volume without instructional structure.

The content moat is:

> **reviewed opportunity coverage + family diversity + difficulty calibration + locale authenticity.**

## 20.1 Coverage graph

Generate:

```text
locale
× domain
× scenario family
× communicative skill
× assessed channel
× band
```

CI should report:

- missing transfer partners;
- impossible band jumps;
- missing opportunity bands;
- duplicate IDs;
- weak family coverage;
- missing reviewed locale metadata;
- mission headline-band inconsistency.

## 20.2 Human review

AI may draft.

Humans review:

- situation authenticity;
- language naturalness;
- local variety;
- skill-opportunity semantics;
- what counts;
- what does not count;
- register;
- difficulty hypothesis;
- safety.

## 20.3 Belgian Dutch

For `nl-BE`:

- A1: clear Standard Dutch as naturally used in Belgium;
- A2: assessed standard + optional unscored colloquial exposure;
- B1: natural Standard Belgian Dutch;
- B2: reviewed light-colloquial assessed input may appear;
- C1: broader register/variation.

Native review remains authority.

---

# 21. Difficulty is a hypothesis

A mission can carry authored conditions such as:

- input condition band;
- turn complexity;
- unpredictability;
- interaction pressure;
- planning time;
- interlocutor count;
- register;
- speech rate;
- speech variety;
- assumed familiarity;
- default support.

These values are not scientific truth.

They are author hypotheses.

Pilot data should calibrate them.

Example:

```text
Author says: B1
Pilot:
- 92% independent success
- almost no rescue
- short turns
- low latency
```

Possible conclusion:

> this mission may be too easy for its intended role.

Or:

```text
Author says: A2
Pilot:
- high comprehension failure
- repeated deep rescue
- abandonment
```

Possible conclusion:

> investigate input rate, language, opportunity design or band label.

Never defend a label because a prompt said "make this B1."

---

# 22. The real moat

The product moat is cumulative.

## Layer 1 — Roleplay runtime

A bounded world where:

- things can happen;
- actions have consequences;
- character speech is not world truth.

## Layer 2 — Reviewed scenario taxonomy

A durable model of:

- situation families;
- domains;
- goals;
- interlocutors;
- transfer boundaries.

## Layer 3 — Opportunity graph

The system knows:

- which skill could be demonstrated;
- when the chance existed;
- what nearby behavior does not count.

## Layer 4 — Support truth

The system knows what the learner:

- saw;
- heard;
- requested;
- copied;
- replayed.

This prevents fake independence.

## Layer 5 — Longitudinal evidence

The system builds a history of real demonstrated performance across:

- days;
- families;
- support conditions;
- bands;
- modalities.

## Layer 6 — Adaptive frontier

The next situation is selected from evidence rather than generic AI judgment.

## Layer 7 — Calibrated content

Over time LearnByRP learns empirically:

- which missions are harder;
- which opportunities trigger;
- where learners ask for help;
- where comprehension fails;
- which transfers work.

## Layer 8 — Living continuity

The curriculum feels like a world rather than a set of exercises.

## Layer 9 — Outcome evidence

If pilots demonstrate better transfer or oral performance than generic AI conversation for matched practice time, LearnByRP gains a claim competitors cannot obtain by adding a chat box.

---

# 23. What competitors can copy quickly

Easy to copy:

- "Talk to an AI bartender."
- avatars;
- voice chat;
- XP;
- vocabulary cards;
- grammar summaries;
- generated roleplay prompts;
- CEFR labels;
- daily streaks;
- conversation history.

Harder to copy:

- validated opportunity-linked evidence;
- exact support provenance;
- family-aware transfer;
- per-skill band frontiers;
- content coverage graph;
- reviewed locale variation;
- calibrated difficulty;
- deterministic next-RP policy;
- living scenario continuity;
- longitudinal trial data showing transfer.

Therefore:

> **Do not spend the moat budget on commodity features first.**

---

# 24. Measurement architecture

## 24.1 Activation metrics

These measure whether the app gets learners to speak.

- Time To First Meaningful Speech (TTFMS)
- learner speaking-time share
- learner turn count
- average response-start latency
- mission-start → first rescue rate
- abandonment before first turn

These are telemetry, not competence.

## 24.2 Support metrics

- percentage of turns with support;
- highest rescue rung reached;
- support type;
- repeated support on same target;
- transition from supported to later independent use.

## 24.3 Learning metrics

- independent validated opportunities;
- distinct-family independent evidence;
- independent evidence across days;
- retry improvement;
- delayed retention;
- cross-family transfer;
- review-due recovery;
- band frontier movement.

## 24.4 Interaction-quality metrics

- clarification opportunities taken;
- repair success;
- follow-up turns sustained;
- task completion with/without support;
- comprehension-rescue use;
- meaningful turns per minute.

## 24.5 Emotional/behavioral metrics

Do not infer emotion from voice as learning truth.

Use optional learner-controlled measures:

- "How hard was that?"
- "Did you feel stuck?"
- "Would you try a harder one?"
- session return rate;
- rescue use without abandonment.

---

# 25. The "learn faster" claim

Do not claim:

> "Learn a language faster than normal."

until LearnByRP has evidence.

A defensible early claim is closer to:

> **Spend more of your practice time actually using the language in goal-driven speaking situations.**

Even "more speaking per hour" should be measured against the chosen comparator.

## 25.1 Core product experiment

Compare:

### Condition A
LearnByRP governed roleplay.

### Condition B
Generic AI voice conversation with high-quality roleplay prompts.

Match:

- total practice time;
- language;
- approximate starting proficiency;
- frequency.

Primary outcome should **not** be in-app score.

Use novel, independently assessed tasks.

Possible primary outcome:

> independent performance on unseen transfer roleplays.

Secondary outcomes:

- oral fluency;
- successful communicative repair;
- latency;
- amount of support needed;
- delayed retention;
- willingness to communicate;
- completion/return rate.

Pre-register:

- primary endpoint;
- scoring rubric;
- exclusion criteria;
- analysis;
- required sample size from a power analysis.

Only then earn stronger claims.

---

# 26. UX architecture

The learner should not see the complexity of the engine.

## 26.1 Talk

Primary screen.

Show:

- next situation;
- one-line reason;
- Start;
- optional Dive;
- Try something harder.

Avoid:

- dashboards;
- CEFR charts everywhere;
- dozens of lesson nodes;
- configuration before speaking.

## 26.2 Mission entry

One compact card:

```text
Where:
What is happening:
Your goal:
Start
```

Optional:

- Observe;
- short preparation;
- accessibility settings.

## 26.3 Live RP

Focus:

- character;
- voice;
- learner turn;
- goal;
- one rescue affordance.

Everything else is secondary.

## 26.4 Recap

Answer:

1. What happened?
2. What did you demonstrate?
3. Where did support help?
4. What one thing should improve?
5. Retry or new situation?

No giant score.

No "You are B1."

## 26.5 Progress

Show communicative capabilities in human language.

Examples:

- Ask for clarification
- Explain a problem
- Make an arrangement
- Compare options
- Repair a misunderstanding

Behind each row is the evidence/frontier engine.

---

# 27. Hidden curriculum, visible life

This is the desired product illusion:

### What the learner experiences

> "I am handling real situations."

### What LearnByRP is doing internally

```text
select skill frontier
↓
select reviewed family
↓
select opportunity at exact band
↓
configure task conditions
↓
run bounded scene
↓
scope support
↓
validate evidence
↓
schedule retry/transfer/review
```

The curriculum is real.

It is simply not presented as a traditional course.

This is how LearnByRP can feel alive without becoming pedagogically random.

---

# 28. Architecture diagram

```text
                         LEARNER GOAL
                              │
                              ▼
                    REVIEWED PROGRAM SPACE
                              │
                    ┌─────────┴─────────┐
                    │                   │
             Placement/start      Evidence history
                    │                   │
                    └─────────┬─────────┘
                              ▼
                     PER-SKILL FRONTIERS
                              │
                              ▼
                    NEXT-RP POLICY ENGINE
                              │
                              ▼
                      REVIEWED MISSION
                              │
              ┌───────────────┼────────────────┐
              │               │                │
              ▼               ▼                ▼
         Scene runtime     Character AI    Support/Coach
              │               │                │
              └───────┬───────┴────────┬───────┘
                      │                │
                      ▼                ▼
              Learner interaction   Support ledger
                      │                │
                      └───────┬────────┘
                              ▼
                  Opportunity instances
                              │
                              ▼
                     Assessor proposal
                              │
                              ▼
                  DETERMINISTIC VALIDATOR
                              │
                 ┌────────────┴────────────┐
                 ▼                         ▼
          Skill observations          Strict lapses
                 │                         │
                 └────────────┬────────────┘
                              ▼
                       BAND PROJECTION
                              │
                              ▼
                    RETRY / TRANSFER /
                    REVIEW / BAND-UP
```

---

# 29. First vertical slice

Do not build every language and every band simultaneously.

Recommended first deep slice:

> **Daily life in Belgium — Belgian Dutch — Pre-A1/A1 → B1**

The engine remains architected for C1.

Build depth before breadth.

## 29.1 Initial communicative capabilities

Use a compact set such as:

- ask for information;
- request an alternative;
- ask for repetition;
- ask for clarification;
- check understanding;
- make an arrangement;
- explain a practical problem.

## 29.2 Families

Use several genuinely different situations:

- counter ordering;
- parcel service;
- neighbour coordination;
- public transport;
- equipment rental;
- lodging/check-in;
- dining;
- bounded pharmacy information navigation.

## 29.3 Success criterion

The first vertical slice is successful only if a learner can:

```text
try
→ get help if necessary
→ finish
→ retry better
→ later perform independently
→ use the capability in another family
```

not merely if the voice conversation sounds natural.

---

# 30. Implementation priority

## Phase A — protect learning truth

1. Complete Learner Journey V2 banded opportunity/evidence contract.
2. Preserve validator-only evidence writes.
3. Build per-skill frontiers.
4. Build coverage graph.

## Phase B — speaking activation

5. Redesign mission entry around immediate roleplay.
6. Implement one-tap Rescue.
7. Instrument Time To First Meaningful Speech.
8. Make help remain inside the scene.

## Phase C — learning loop

9. Post-action feedback.
10. Retry.
11. Transfer.
12. Review-due return.
13. Dive sessions.

## Phase D — living world

14. Recurring safe characters/locations.
15. Governed continuity facts.
16. Narrative/program arcs.

## Phase E — content depth

17. Deep `nl-BE` A1→B1.
18. Pilot and calibrate.
19. Add B2.
20. Add social-formal/work domains.
21. Add C1 after review capacity exists.

---

# 31. Non-goals / anti-patterns

Do not make LearnByRP:

- an AI chat with themed prompts;
- a grammar course with a voice button;
- a vocabulary deck with roleplay decorations;
- a CEFR score machine;
- a game where XP replaces evidence;
- a system that says "great job" after every scene;
- a system that calls every successful response independent;
- a system that generates unlimited unreviewed executable scenarios;
- a system that increases difficulty by using obscure vocabulary;
- a system that surprises beginners with humiliation/pressure;
- a system that treats accommodations as cheating/help;
- a system that equates minutes spoken with learning;
- a system whose curriculum is chosen by whichever LLM provider is active.

---

# 32. Acceptance tests for the product concept

The architecture is working only if these are true:

- [ ] A new beginner can enter a real communicative situation before completing a lesson.
- [ ] A learner who gets stuck can recover without leaving the RP.
- [ ] Revealing a full phrase prevents that turn from being called independent.
- [ ] A successful mission can produce zero target-skill evidence.
- [ ] A failed mission can produce zero lapse.
- [ ] Retry never counts as Transfer.
- [ ] Same-family variants never count as Transfer.
- [ ] A B2 mission can produce A2 evidence when the relevant opportunity is authored A2.
- [ ] A C1 observation never silently backfills A1–B2 states.
- [ ] Accessibility slower speech does not weaken production evidence.
- [ ] The next RP is explainable from policy and evidence.
- [ ] Two learners in the same program can receive different next situations.
- [ ] Free conversation cannot silently become official progress.
- [ ] Vocabulary/grammar support returns the learner to communication quickly.
- [ ] The learner sees one next meaningful situation, not an internal curriculum dashboard.
- [ ] The app can measure improvement from attempt → retry → delayed transfer.
- [ ] LearnByRP can be experimentally compared with generic AI voice conversation using novel transfer tasks.

---

# 33. The strategic sentence

If LearnByRP needs one sentence to guide product decisions, use:

> **Don't build a better AI conversation. Build the system that repeatedly creates the right reason to speak, gives the minimum help needed to keep speaking, remembers what the learner truly demonstrated, and turns that evidence into the next real situation.**

That is the distinction between conversation and learning.

That is the distinction between a chatbot and LearnByRP.

---

# 34. Research-to-product evidence map

| Research finding | Confidence/use | LearnByRP design inference |
|---|---|---|
| Task-based language teaching has positive overall evidence | Strong synthesis | Missions are goal-driven tasks |
| Producing language can trigger noticing/hypothesis testing | Foundational + conditional empirical support | Learner must produce, not just consume |
| Interaction/negotiation can create useful learning conditions | Strong theoretical/empirical tradition | Author repair/clarification opportunities |
| Immersion/study abroad often improves fluency | Meta-analytic/supportive | Build dense meaningful interaction |
| Exposure/duration alone is insufficient | Supported | Orchestrate quality, not just minutes |
| Corrective feedback generally helps | Meta-analytic | Provide targeted feedback |
| Feedback timing effects vary | Conditional | Mix in-flow rescue and post-action feedback |
| Task repetition can improve oral performance | Recent meta-analysis | Retry is first-class |
| Spacing improves L2 retention | Meta-analysis | Review across days |
| Anxiety, motivation and perceived competence relate to willingness to communicate | Meta-analyses | Engineer safety, competence and agency |
| CEFR uses action-oriented/social-agent framing and multiple modes | Primary framework | Skills/tasks over global learner labels |

---

# 35. Research references

The sources below support the mechanisms. They do **not** prove that LearnByRP as a product will outperform other systems; that requires LearnByRP-specific trials.

1. **Bryfonski, L. & McKay, T. H. (2019). _TBLT Implementation and Evaluation: A Meta-Analysis_. Language Teaching Research, 23(5), 603–632.**  
   ERIC: https://eric.ed.gov/?id=EJ1225836

2. **Swain, M. (1995). _Three functions of output in second language learning_.** In _Principle and Practice in Applied Linguistics_. Oxford University Press.  
   Bibliographic record: https://cir.nii.ac.jp/crid/1573105975679432192

3. **Izumi, S., Bigelow, M., Fujiwara, M., & Fearnow, S. (1999). _Testing the Output Hypothesis: Effects of Output on Noticing and Second Language Acquisition_. Studies in Second Language Acquisition.**  
   https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/testing-the-output-hypothesis/8437C53035A5FD15BD985463E5428B36

4. **Long, M. H. & Porter, P. A. (1985). _Group Work, Interlanguage Talk, and Second Language Acquisition_. TESOL Quarterly.**  
   https://onlinelibrary.wiley.com/doi/abs/10.2307/3586827

5. **Freed, B. F., Segalowitz, N., & Dewey, D. P. (2004). _Context of Learning and Second Language Fluency in French: Comparing Regular Classroom, Study Abroad, and Intensive Domestic Immersion Programs_. Studies in Second Language Acquisition, 26(2), 275–301.**  
   https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/abs/context-of-learning-and-second-language-fluency-in-french-comparing-regular-classroom-study-abroad-and-intensive-domestic-immersion-programs/9951FAC1116B5300B0173912BA2FE1CD

6. **Li, S. (2010). _The Effectiveness of Corrective Feedback in SLA: A Meta-Analysis_. Language Learning.**  
   https://onlinelibrary.wiley.com/doi/10.1111/j.1467-9922.2010.00561.x

7. **Fu, M. & Li, S. (2022 issue; published online 2020). _The Effects of Immediate and Delayed Corrective Feedback on L2 Development_. Studies in Second Language Acquisition.**  
   https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/abs/effects-of-immediate-and-delayed-corrective-feedback-on-l2-development/B4B2D455749B752BD4F6DD636ACD688F

8. **Li et al. (2016). _The Effects of the Timing of Corrective Feedback on the Acquisition of a New Linguistic Structure_. The Modern Language Journal.**  
   https://onlinelibrary.wiley.com/doi/10.1111/modl.12315

9. **Task repetition and L2 oral performance: A meta-analysis (2025). _System_, 135, 103868.**  
   https://doi.org/10.1016/j.system.2025.103868

10. **Kim, S. K. & Webb, S. (2022). _The Effects of Spaced Practice on Second Language Learning: A Meta-Analysis_. Language Learning, 72(1), 269–319.**  
    https://doi.org/10.1111/lang.12479

11. **Elahi Shirvan, M., Khajavy, G. H., MacIntyre, P. D., & Taherian, T. (2019). _A Meta-analysis of L2 Willingness to Communicate and Its Three High-Evidence Correlates_. Journal of Psycholinguistic Research.**  
    https://pubmed.ncbi.nlm.nih.gov/31342240/

12. **Jin, S. & Lee, H. (2022). _Willingness to Communicate and its High-Evidence Factors: A Meta-Analytic Structural Equation Modeling Approach_. Journal of Language and Social Psychology.**  
    https://doi.org/10.1177/0261927X221092098

13. **Systematic review synthesising the effects of study abroad experience on the development of language fluency (published online 2024). Oxford Review of Education.**  
    https://doi.org/10.1080/03054985.2024.2413109

14. **Güvendir, E., Borràs, J., & Acar Güvendir, M. (2024). _The effects of study abroad on L2 vocabulary development: A meta-analysis_. Study Abroad Research in Second Language Acquisition and International Education, 9(1), 26–51.**  
    https://doi.org/10.1075/sar.22014.bor

15. **Council of Europe. _Common European Framework of Reference for Languages: Learning, Teaching, Assessment — Companion Volume_ (2020).**  
    https://book.coe.int/en/education-and-modern-languages/8150-common-european-framework-of-reference-for-languages-learning-teaching-assessment-companion-volume.html

16. **Council of Europe. _Action-orientation in the classroom_.**  
    https://www.coe.int/en/web/common-european-framework-reference-languages/action-orientation-in-the-classroom

17. **Council of Europe. _Mediation_.**  
    https://www.coe.int/en/web/common-european-framework-reference-languages/mediation

18. **_To talk or not to talk: A review of situational antecedents of willingness to communicate in the second language classroom_ (2018), System 72, 226–239.**  
    https://doi.org/10.1016/j.system.2018.01.003

---

# 36. Research caution
The architecture deliberately avoids several unsupported leaps:

- speaking more does not automatically mean learning more;
- immersion does not automatically produce proficiency;
- one successful performance does not prove durable competence;
- one CEFR-labelled mission does not make the learner that level;
- higher-band performance does not automatically prove every lower band;
- AI feedback is not automatically correct;
- native-like speech is not the universal objective;
- immediate feedback is not universally superior in every context;
- task difficulty cannot be reduced to one scientifically proven scalar;
- an engaging roleplay is not necessarily a valid assessment.

LearnByRP should remain empirical:

> **author → validate → pilot → measure → recalibrate.**

---

# 37. Final product doctrine

## The learner should feel

> "I am living situations in this language."

## The system should know

> "This is a reviewed opportunity for a specific capability under known conditions."

## The coach should do

> "Give the least help that allows the learner to continue."

## The evidence system should ask

> "What did the learner actually demonstrate, independently or with support?"

## The recommendation engine should ask

> "What next roleplay gives the best next opportunity: retry, transfer, review, frontier practice or stretch?"

## The company should measure

> "Are learners becoming better at handling unseen speaking situations with less support over time?"

If those six statements remain true, LearnByRP can be much more than another AI conversation app.

It becomes a **living speaking curriculum**.