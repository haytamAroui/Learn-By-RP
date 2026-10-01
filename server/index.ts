import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import cors from 'cors';
// Shared with the client: one matching implementation, so the offline fallback
// cannot be more generous than the deterministic client core.
import { matchPhraseInText } from '../src/features/learning/matching';
import { COMMUNICATIVE_SKILLS_CATALOG } from '../src/data/missions';
import { allowedSkillsForMission } from '../src/features/learning/skillMembership';
// Scene director + action reducer, mounted under /v1.
import { roleplayRouter } from './roleplay/routes';

dotenv.config();

const app = express();

// The Expo client runs from a different origin (Metro, a dev server, or a
// standalone build), so allow the API to be called cross-origin.
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Server-side Gemini client
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    })
  : null;

console.log(`[Server] Gemini API Key present: ${Boolean(apiKey)}`);

/**
 * Health check
 */
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(apiKey),
    timestamp: new Date().toISOString()
  });
});

/**
 * 1. Actor Response (Conversational Character)
 * Compact instruction packet: character role, bounded knowledge, short spoken turns (1-2 sentences).
 */
app.post('/api/actor/respond', async (req: Request, res: Response) => {
  try {
    const {
      character,
      setting,
      learnerGoal,
      sceneFacts,
      mode,
      recentPassages,
      userMessage,
      targetLanguage = 'Spanish',
      explanationLanguage = 'English'
    } = req.body;

    if (!userMessage || typeof userMessage !== 'string') {
      res.status(400).json({ error: 'userMessage is required' });
      return;
    }

    if (!ai) {
      // Offline / fallback intelligent actor
      const fallbackReply = generateFallbackActorReply(character?.name, userMessage, sceneFacts, targetLanguage);
      res.json(fallbackReply);
      return;
    }

    const conversationHistory = (recentPassages || [])
      .map((p: any) => `${p.speaker === 'user' ? 'Learner' : character?.name || 'Character'}: ${p.text}`)
      .join('\n');

    const systemInstruction = `You are roleplaying as ${character?.name || 'a character'} (${character?.role || 'assistant'}).
Setting: ${setting || 'A neighborhood café'}.
Learner Goal: ${learnerGoal || 'Order a coffee drink'}.
Mode: ${mode || 'guided'}.
Language: You MUST speak exclusively in authentic, natural ${targetLanguage}.
Character Persona & Boundaries:
- Style: ${character?.voiceStyle || 'Warm, patient, colloquial'}
- Knowledge Boundaries: ${(character?.knowledgeBoundary || []).join('; ')}
- Current Scene Facts: ${JSON.stringify(sceneFacts || {})}

RULES:
1. Speak 1 to 2 short sentences ONLY. Natural spoken conversation, not a monologue.
2. Ask one simple follow-up question or confirm their request.
3. Stay strictly in character! NEVER act like an AI tutor or grammar teacher unless explicitly in guided mode correcting a breakdown.
4. If the learner asks for an unavailable item (e.g. oat milk is out), politely inform them and offer available alternatives (e.g. almond milk or whole milk).
5. Output your response as a valid JSON object matching this structure:
{
  "replyText": "your spoken line in ${targetLanguage}",
  "meaning": "${explanationLanguage} translation of what you just said",
  "proposedAction": null or {"name": "confirm_order_item" | "offer_alternative" | "confirm_takeaway" | "complete_scene", "payload": {}}
}`;

    const prompt = `Recent conversation:
${conversationHistory}
Learner: "${userMessage}"

Respond in character as ${character?.name || 'Character'} in ${targetLanguage}:`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.7
      }
    });

    const text = response.text || '';
    try {
      const parsed = JSON.parse(text);
      res.json(parsed);
    } catch {
      res.json({
        replyText: text.replace(/[{}"]/g, '').trim(),
        meaning: 'Character response',
        proposedAction: null
      });
    }
  } catch (err: any) {
    console.error('Error in /api/actor/respond:', err);
    const { character, userMessage = '', sceneFacts, targetLanguage = 'Spanish' } = req.body || {};
    const fallbackReply = generateFallbackActorReply(character?.name, userMessage, sceneFacts, targetLanguage);
    res.json(fallbackReply);
  }
});

/**
 * 2. Scene truth lives in the roleplay router under /v1/voice/sessions/:id/scene.
 *
 * The old /api/scene/action endpoint applied a four-case switch with no
 * allowlist, no preconditions, no revision check and no actionId, so a duplicate
 * request applied twice and a stale one silently overwrote newer state. Scene
 * transitions now go through the reducer in src/features/roleplay/sceneReducer,
 * which returns a reason and the still-permissible options on rejection.
 */

// 3. Coach Hint Ladder (Separate Private Coach Surface)
// Ladder: intent_hint -> partial_form -> full_form -> explanation
app.post('/api/coach/hint', async (req: Request, res: Response) => {
  try {
    const {
      step = 'intent_hint',
      targetLanguage = 'Spanish',
      explanationLanguage = 'English',
      characterName = 'the character',
      lastAssistantLine = '',
      learnerGoal = 'Order a drink'
    } = req.body;

    if (!ai) {
      const fallbackHints: Record<string, string> = {
        intent_hint: `Try telling ${characterName} what you would like to drink, or ask if they have a plant milk.`,
        partial_form: `Start with: "Un café con..." or "¿Tiene leche de...?"`,
        full_form: `Say: "Un café con leche, por favor." or "¿Tiene leche de avena?"`,
        explanation: `${characterName} asked what you want. In Spain, "para llevar" means takeaway.`
      };
      res.json({ hint: fallbackHints[step] || fallbackHints.intent_hint });
      return;
    }

    const systemInstruction = `You are a warm, concise language coach.
Learner Goal: ${learnerGoal}.
The character just said: "${lastAssistantLine}".
Target Language: ${targetLanguage}.
Explanation Language: ${explanationLanguage}.
Requested Hint Step: "${step}".
- 'intent_hint': Give a 1-sentence strategic guidance about WHAT to communicate (do NOT reveal the exact foreign words).
- 'partial_form': Give a sentence starter or partial grammar scaffold (e.g. "Start with: 'Quisiera...'").
- 'full_form': Give a natural, complete sentence example in ${targetLanguage} with ${explanationLanguage} translation.
- 'explanation': Explain what ${characterName} said, clarifying cultural or vocabulary nuance in 2 sentences.

Keep your response direct, friendly, and under 35 words. Return JSON: {"hint": "..."}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Provide step '${step}' hint:`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.4
      }
    });

    const parsed = JSON.parse(response.text || '{"hint": "Try stating your request clearly."}');
    res.json(parsed);
  } catch (err: any) {
    console.error('Error in /api/coach/hint:', err);
    res.json({ hint: 'Try expressing what you would like in a simple sentence.' });
  }
});

/**
 * 4. Bounded Structured Assessment (Recap / Evidence Extractor)
 * Extracts quotes from user transcript and matches to candidate useful phrases.
 */
app.post('/api/assessment', async (req: Request, res: Response) => {
  try {
    const { sessionId, attemptId, passages = [], usefulPhrases = [], language = 'es', missionId } = req.body;

    const userPassages = passages.filter((p: any) => p.speaker === 'user');
    if (userPassages.length === 0) {
      res.json({
        schemaVersion: 2,
        sessionId,
        attemptId,
        taskOutcome: 'unknown',
        outcomeReasoning: 'No learner speech recorded in this session.',
        items: [],
        skillItems: [],
        actionableFeedback: ['Try speaking a greeting or placing an order next time.']
      });
      return;
    }

    if (!ai) {
      res.json(generateDeterministicAssessment(sessionId, attemptId, userPassages, usefulPhrases));
      return;
    }

    const transcriptDump = passages
      .map((p: any) => `[ID: ${p.id} | Rev: ${p.revisionKey} | Speaker: ${p.speaker}]: "${p.text}"`)
      .join('\n');

    const prompt = `Analyze this conversation transcript for a language learner.
Target Useful Phrases to look for:
${JSON.stringify(usefulPhrases, null, 2)}

Communicative skills this mission may evidence (the ONLY skillIds you may propose):
${JSON.stringify(allowedSkillsForMission(missionId), null, 2)}

Full Transcript:
${transcriptDump}

Extract phrases the LEARNER actually used. You propose; the client validates.
Rules:
1. "quote" must be a verbatim substring of a passage whose Speaker is "user". Never quote the assistant.
2. "sourcePassageId" and "sourceRevision" must be copied from that passage's [ID] and [Rev].
3. "candidateItemId" must come from the provided useful phrases. If nothing matches, omit the item entirely rather than inventing an id.
4. Only include an item you are confident the learner produced. Equivalent wording is acceptable; a passing mention of the topic is not.
5. If the evidence is thin, return fewer items or none. An empty list is a valid, honest answer.
6. Do NOT assess ability, level, grammar quality, or personality. You are extracting evidence, not grading.
7. "retrievalProposal": propose "unknown". Retrieval is derived on the client from the support-exposure ledger, which you cannot see.
8. taskOutcome: "achieved" | "partial" | "not_achieved" | "unknown". Use "unknown" when the transcript does not settle it.
9. "skillItems" credit communicative SKILLS, not phrases. Only propose a skillId listed below.
10. The same quote rules apply: verbatim from a learner passage, with that passage's ID and revision.
11. Do not propose a skill merely because its topic was mentioned. The learner must have performed it.
12. Do not report failures. A failed cold attempt is derived deterministically on the client from taskOutcome, not by you.

Return JSON matching:
{
  "schemaVersion": 2,
  "sessionId": "${sessionId}",
  "attemptId": "${attemptId}",
  "taskOutcome": "achieved",
  "outcomeReasoning": "One neutral sentence, or an empty string if unknown.",
  "items": [
    {
      "candidateItemId": "phrase.es...",
      "candidateForm": "Clean standard form",
      "meaning": "English meaning",
      "quote": "Verbatim substring from the learner's own passage",
      "sourcePassageId": "passage ID where quote occurred",
      "sourceRevision": "revision key of passage",
      "modality": "spoken",
      "retrievalProposal": "unknown"
    }
  ],
  "skillItems": [
    {
      "skillId": "one of the ids listed above",
      "quote": "Verbatim substring from the learner's own passage showing the skill performed",
      "sourcePassageId": "passage ID where quote occurred",
      "sourceRevision": "revision key of passage",
      "modality": "spoken",
      "retrievalProposal": "unknown"
    }
  ],
  "actionableFeedback": ["at most 2 short, actionable notes"]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (err: any) {
    console.error('Error in /api/assessment, falling back to deterministic receipt:', err);
    const { sessionId = 'session', attemptId = 'attempt-1', passages = [], usefulPhrases = [] } = req.body || {};
    const userPassages = (passages || []).filter((p: any) => p.speaker === 'user');
    res.json(generateDeterministicAssessment(sessionId, attemptId, userPassages, usefulPhrases));
  }
});

function generateDeterministicAssessment(
  sessionId: string,
  attemptId: string,
  userPassages: any[],
  usefulPhrases: any[]
) {
  const candidateItems: any[] = [];

  for (const phrase of usefulPhrases) {
    for (const passage of userPassages) {
      if (!passage?.text) continue;

      const match = matchPhraseInText(phrase.form, passage.text);

      // Ambiguous overlap is reported as a count, never as evidence. The client
      // decides what to do with it; the server does not claim a match.
      if (match.verdict === 'ambiguous') {
        continue;
      }
      if (match.verdict === 'none') continue;

      candidateItems.push({
        itemId: phrase.id,
        candidateItemId: phrase.id,
        candidateForm: phrase.form,
        meaning: phrase.meaning,
        quote: match.matchedText || passage.text,
        sourcePassageId: passage.id,
        sourceRevision: passage.revisionKey || 'rev-1',
        modality: passage.modality || 'spoken',
        // The client derives retrieval from the exposure ledger; proposing it
        // here would be a claim the server cannot verify.
        retrievalProposal: 'unknown'
      });
    }
  }

  return {
    schemaVersion: 2,
    sessionId,
    attemptId,
    taskOutcome: candidateItems.length > 0 ? 'achieved' : 'unknown',
    outcomeReasoning:
      'Matched against your recorded speech transcript. Independent recall is confirmed on your device from the support ledger, not here.',
    items: candidateItems,
    // The offline path proposes no skills. Skill evidence requires a grounded quote
    // from a learner passage, and phrase matching is not grounds for a claim about
    // a capability. Empty here means "not asserted", which is honest.
    skillItems: [],
    actionableFeedback: [
      'Great job speaking spontaneously in the scene.',
      'Keep reviewing phrases due on the Progress tab to build multi-context recall.'
    ]
  };
}

/**
 * 5. Gemini TTS (Natural Character Voice)
 */
app.post('/api/tts', async (req: Request, res: Response) => {
  try {
    const { text, voiceName = 'Puck', speed = 1.0 } = req.body;

    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'text is required' });
      return;
    }

    if (!ai) {
      res.status(503).json({ error: 'Gemini TTS unavailable without API key' });
      return;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: speed < 0.9 ? `Speak slowly and clearly: ${text}` : text,
              speechMetadata: {
                style: 'Natural conversational speaker'
              }
            }
          ]
        }
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName }
          }
        }
      }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      res.json({
        audioBase64: base64Audio,
        mimeType: 'audio/wav'
      });
    } else {
      res.status(500).json({ error: 'No audio returned' });
    }
  } catch (err: any) {
    console.error('Error in /api/tts:', err);
    res.status(500).json({ error: err.message || 'TTS generation failed' });
  }
});

function generateFallbackActorReply(
  characterName: string = 'Mateo',
  userMessage: string = '',
  sceneFacts: any = {},
  targetLanguage: string = 'Spanish'
) {
  const lower = userMessage.toLowerCase();
  const lang = (targetLanguage || '').toLowerCase();

  // 1. French Characters
  if (characterName === 'Laurent' || lang.includes('french') || lang === 'fr') {
    if (lower.includes('croissant') || lower.includes('chocolat') || lower.includes('café') || lower.includes('cafe')) {
      return {
        replyText: 'Très bon choix ! Notre croissant est tout chaud sorti du four. Avec ceci ?',
        meaning: 'Very good choice! Our croissant is warm fresh out of the oven. Anything else with this?',
        proposedAction: { name: 'confirm_order_item', payload: { item: 'croissant et café crème' } }
      };
    }
    if (lower.includes('combien') || lower.includes('prix') || lower.includes('carte')) {
      return {
        replyText: 'Ça vous fait trois euros cinquante au total. Vous réglez par carte ou en espèces ?',
        meaning: 'That comes to three euros fifty in total. Are you paying by card or cash?',
        proposedAction: { name: 'complete_scene', payload: {} }
      };
    }
    return {
      replyText: 'Bonjour ! Bienvenue à la boulangerie. Qu’est-ce qui vous ferait plaisir ce matin ?',
      meaning: 'Good morning! Welcome to the bakery. What would you like this morning?',
      proposedAction: null
    };
  }

  if (characterName === 'Camille') {
    if (lower.includes('gorge') || lower.includes('mal') || lower.includes('toux') || lower.includes('pastille')) {
      return {
        replyText: 'Pour la gorge, je vous conseille ces pastilles au miel et citron. Elles ne font pas dormir et calment vite.',
        meaning: 'For the throat, I recommend these honey-lemon pastilles. They do not cause drowsiness and soothe quickly.',
        proposedAction: { name: 'offer_alternative', payload: { item: 'pastilles sans somnolence' } }
      };
    }
    if (lower.includes('combien de fois') || lower.includes('posologie') || lower.includes('jour')) {
      return {
        replyText: 'Vous pouvez en sucer une toutes les quatre heures, jusqu’à six pastilles par jour maximum.',
        meaning: 'You can suck one every four hours, up to six lozenges a day maximum.',
        proposedAction: null
      };
    }
    return {
      replyText: 'Bonjour, bienvenue à la pharmacie. Qu’avez-vous comme symptômes ?',
      meaning: 'Good morning, welcome to the pharmacy. What symptoms do you have?',
      proposedAction: null
    };
  }

  if (characterName === 'Pierre') {
    if (lower.includes('ticket') || lower.includes('carnet') || lower.includes('navigo')) {
      return {
        replyText: 'Voici le carnet de dix trajets sur passe Navigo Easy. Ça fait dix-sept euros trente-cinq.',
        meaning: 'Here is the ten-ride pack on the Navigo Easy pass. That comes to seventeen thirty-five.',
        proposedAction: { name: 'confirm_order_item', payload: { item: 'carnet 10 tickets' } }
      };
    }
    if (lower.includes('montparnasse') || lower.includes('direction') || lower.includes('ligne')) {
      return {
        replyText: 'Prenez la ligne quatre juste en face, direction Bagneux, et descendez directement à Montparnasse.',
        meaning: 'Take Line 4 right across, direction Bagneux, and get off directly at Montparnasse.',
        proposedAction: null
      };
    }
    return {
      replyText: 'Bonjour ! Besoin d’un titre de transport ou d’une indication dans le quartier ?',
      meaning: 'Hello! Need a transit ticket or directions in the neighborhood?',
      proposedAction: null
    };
  }

  if (characterName === 'Sophie') {
    if (lower.includes('terrasse') || lower.includes('table') || lower.includes('deux')) {
      return {
        replyText: 'Parfait ! J’ai une jolie table pour deux en terrasse près des plantes. Suivez-moi !',
        meaning: 'Perfect! I have a lovely table for two on the terrace near the plants. Follow me!',
        proposedAction: { name: 'confirm_order_item', payload: { table: 'terrasse' } }
      };
    }
    if (lower.includes('recommandez') || lower.includes('plat') || lower.includes('jour')) {
      return {
        replyText: 'Ce soir, notre magret de canard au miel et romarin est tout simplement exceptionnel.',
        meaning: 'Tonight, our duck breast with honey and rosemary is simply exceptional.',
        proposedAction: null
      };
    }
    return {
      replyText: 'Bonsoir ! Bienvenue au Bistro. Vous souhaitez dîner en terrasse ou à l’intérieur ?',
      meaning: 'Good evening! Welcome to the Bistro. Would you like to dine on the terrace or inside?',
      proposedAction: null
    };
  }

  // 2. German Characters
  if (characterName === 'Klara' || lang.includes('german') || lang === 'de') {
    if (lower.includes('brötchen') || lower.includes('kaffee') || lower.includes('broetchen')) {
      return {
        replyText: 'Sehr gerne! Zwei frische Schrippen und der Kaffee zum Mitnehmen. Möchten Sie Hafermilch dazu?',
        meaning: 'With pleasure! Two fresh rolls and coffee to go. Would you like oat milk with that?',
        proposedAction: { name: 'confirm_order_item', payload: { item: 'Brötchen und Kaffee' } }
      };
    }
    if (lower.includes('karte') || lower.includes('zahlen') || lower.includes('kostet')) {
      return {
        replyText: 'Das macht zusammen vier Euro fünfzig. Kartenzahlung geht natürlich ab jedem Betrag!',
        meaning: 'That is four euros fifty altogether. Card payment works for any amount of course!',
        proposedAction: { name: 'complete_scene', payload: {} }
      };
    }
    return {
      replyText: 'Guten Morgen! Herzlich willkommen in der Bäckerei. Was darf es heute Schönes sein?',
      meaning: 'Good morning! Welcome to the bakery. What can I get for you today?',
      proposedAction: null
    };
  }

  if (characterName === 'Stefan') {
    if (lower.includes('heuschnupfen') || lower.includes('allergie') || lower.includes('augen') || lower.includes('müde')) {
      return {
        replyText: 'Gegen die Allergie habe ich diese Loratadin-Tabletten. Sie machen nicht müde und wirken den ganzen Tag.',
        meaning: 'For the allergy I have these Loratadine tablets. They do not cause drowsiness and work all day.',
        proposedAction: { name: 'offer_alternative', payload: { item: 'Allergietabletten' } }
      };
    }
    if (lower.includes('wie oft') || lower.includes('nehmen') || lower.includes('tag')) {
      return {
        replyText: 'Nehmen Sie einfach eine Tablette täglich abends mit etwas Wasser ein.',
        meaning: 'Simply take one tablet daily in the evening with some water.',
        proposedAction: null
      };
    }
    return {
      replyText: 'Guten Tag! Willkommen in der Apotheke. Welche Beschwerden haben Sie denn?',
      meaning: 'Good day! Welcome to the pharmacy. What symptoms do you have?',
      proposedAction: null
    };
  }

  if (characterName === 'Lukas') {
    if (lower.includes('tageskarte') || lower.includes('ticket') || lower.includes('bereich ab')) {
      return {
        replyText: 'Hier ist die 24-Stunden-Karte für den Tarifbereich AB für neun Euro neunzig.',
        meaning: 'Here is the 24-hour ticket for tariff zone AB for nine euros ninety.',
        proposedAction: { name: 'confirm_order_item', payload: { item: 'Tageskarte AB' } }
      };
    }
    if (lower.includes('alexanderplatz') || lower.includes('gleis') || lower.includes('u-bahn')) {
      return {
        replyText: 'Zum Alexanderplatz nehmen Sie die U8 von Gleis zwei Richtung Wittenau. Sechs Stationen.',
        meaning: 'To Alexanderplatz take the U8 from platform two toward Wittenau. Six stops.',
        proposedAction: null
      };
    }
    return {
      replyText: 'Hallo! Kann ich Ihnen bei der Fahrkarte oder der Verbindung behilflich sein?',
      meaning: 'Hello! Can I help you with a ticket or connection?',
      proposedAction: null
    };
  }

  if (characterName === 'Hannah') {
    if (lower.includes('tisch') || lower.includes('garten') || lower.includes('zwei')) {
      return {
        replyText: 'Sehr gerne! Unter der Kastanie im Biergarten haben wir noch einen wunderschönen Tisch für zwei.',
        meaning: 'With pleasure! Under the chestnut tree in the beer garden we have a wonderful table for two.',
        proposedAction: { name: 'confirm_order_item', payload: { table: 'Biergarten' } }
      };
    }
    if (lower.includes('empfehlen') || lower.includes('spezialität') || lower.includes('spargel')) {
      return {
        replyText: 'Ich empfehle heute unsere hausgemachten Allgäuer Kässpätzle oder den frischen Stangenspargel.',
        meaning: 'Today I recommend our homemade cheese spaetzle or the fresh asparagus.',
        proposedAction: null
      };
    }
    return {
      replyText: 'Guten Abend! Willkommen im Gasthaus. Suchen Sie einen schönen Platz zum Abendessen?',
      meaning: 'Good evening! Welcome to the tavern. Are you looking for a nice spot for dinner?',
      proposedAction: null
    };
  }

  // 3. Italian Characters
  if (characterName === 'Gianni' || lang.includes('italian') || lang === 'it') {
    if (lower.includes('caffè') || lower.includes('caffe') || lower.includes('cornetto')) {
      return {
        replyText: 'Subito! Un bell’espresso caldo e un cornetto fragrante. Ti porto anche un goccetto d’acqua frizzante?',
        meaning: 'Right away! A nice hot espresso and a fragrant croissant. Shall I bring you sparkling water too?',
        proposedAction: { name: 'confirm_order_item', payload: { item: 'espresso e cornetto' } }
      };
    }
    if (lower.includes('quanto') || lower.includes('conto') || lower.includes('pago')) {
      return {
        replyText: 'Sono due euro e venti al banco. Grazie mille e buona giornata!',
        meaning: 'That is two twenty at the counter. Thank you very much and have a great day!',
        proposedAction: { name: 'complete_scene', payload: {} }
      };
    }
    return {
      replyText: 'Buongiorno! Benvenuto al bar. Cosa ti preparo di buono oggi?',
      meaning: 'Good morning! Welcome to the bar. What good things can I make for you today?',
      proposedAction: null
    };
  }

  if (characterName === 'Marco') {
    if (lower.includes('pisa') || lower.includes('biglietto') || lower.includes('regionale')) {
      return {
        replyText: 'Ecco a te il biglietto regionale per Pisa Centrale: sono otto euro e novanta. Ricordati di convalidarlo!',
        meaning: 'Here is the regional ticket to Pisa Centrale: eight ninety. Remember to validate it!',
        proposedAction: { name: 'confirm_order_item', payload: { item: 'biglietto per Pisa' } }
      };
    }
    if (lower.includes('binario') || lower.includes('treno') || lower.includes('parte')) {
      return {
        replyText: 'Il treno delle dieci e ventotto parte dal binario sei. Trovi la convalidatrice gialla prima dei cancelli.',
        meaning: 'The 10:28 train departs from platform six. You find the yellow validation machine before the gates.',
        proposedAction: null
      };
    }
    return {
      replyText: 'Buongiorno! Biglietti regionali o informazioni sui treni?',
      meaning: 'Good morning! Regional tickets or train information?',
      proposedAction: null
    };
  }

  // 4. Japanese Characters
  if (characterName === 'Kenji' || lang.includes('japanese') || lang === 'ja') {
    if (lower.includes('温め') || lower.includes('atatamete') || lower.includes('bento') || lower.includes('お弁当')) {
      return {
        replyText: 'かしこまりました！お弁当温めますね。少々お待ちください。レジ袋はいかがなさいますか？',
        meaning: 'Certainly! I will warm up the bento. Please wait a moment. Would you like a bag?',
        proposedAction: { name: 'confirm_order_item', payload: { item: 'bento heated' } }
      };
    }
    if (lower.includes('suica') || lower.includes('結構') || lower.includes('kekkou') || lower.includes('会計')) {
      return {
        replyText: 'ありがとうございます！Suicaでお支払いですね。タッチをお願いします。',
        meaning: 'Thank you very much! Paying by Suica. Please tap your card.',
        proposedAction: { name: 'complete_scene', payload: {} }
      };
    }
    return {
      replyText: 'いらっしゃいませ！温かいお弁当やドリンクはいかがでしょうか？',
      meaning: 'Welcome! How about a warm bento or drinks today?',
      proposedAction: null
    };
  }

  if (characterName === 'Aoi') {
    if (lower.includes('頭痛') || lower.includes('zutsuu') || lower.includes('薬') || lower.includes('眠く')) {
      return {
        replyText: '頭痛ですね。こちらのイブプロフェンのお薬は眠くなる成分が入っておらず、胃にも優しいですよ。',
        meaning: 'A headache. This ibuprofen medicine does not contain drowsy ingredients and is gentle on the stomach.',
        proposedAction: { name: 'offer_alternative', payload: { item: 'zutsuu-yaku' } }
      };
    }
    if (lower.includes('食後') || lower.includes('何錠') || lower.includes('飲み方')) {
      return {
        replyText: '一回二錠、なるべく空腹時を避けて食後に水で服用してくださいね。お大事に！',
        meaning: 'Take two tablets per dose after meals with water, avoiding an empty stomach. Take care!',
        proposedAction: null
      };
    }
    return {
      replyText: 'こんにちは！薬局へようこそ。どのような症状でお困りですか？',
      meaning: 'Hello! Welcome to the pharmacy. What kind of symptoms are troubling you?',
      proposedAction: null
    };
  }

  if (characterName === 'Tanaka-san') {
    if (lower.includes('suica') || lower.includes('チャージ') || lower.includes('chaaji')) {
      return {
        replyText: 'Suicaのチャージはあちらのピンク色の券売機か、こちらの窓口でも現金でチャージできますよ。',
        meaning: 'You can charge your Suica at the pink ticket machines over there, or with cash right here at this window.',
        proposedAction: null
      };
    }
    if (lower.includes('東京駅') || lower.includes('tokyo') || lower.includes('何番線') || lower.includes('nanban')) {
      return {
        replyText: '東京駅へは十番線の山手線内回りにご乗車ください。約十二分で到着します。',
        meaning: 'For Tokyo Station, please board the Yamanote line inner loop on Platform 10. It arrives in about 12 minutes.',
        proposedAction: { name: 'confirm_order_item', payload: { platform: '10' } }
      };
    }
    return {
      replyText: 'いらっしゃいませ！JR日暮里駅です。電車の乗り換えや乗車券のご案内をいたします。',
      meaning: 'Welcome! This is JR Nippori Station. I can assist with train transfers and tickets.',
      proposedAction: null
    };
  }

  if (characterName === 'Hiroshi') {
    if (lower.includes('カウンター') || lower.includes('kauntaa') || lower.includes('二人') || lower.includes('seki')) {
      return {
        replyText: 'いらっしゃい！二人ね、ちょうどカウンターの角が空いてるよ。どうぞ座って！',
        meaning: 'Welcome! Two people, right? The corner of the counter is open. Please have a seat!',
        proposedAction: { name: 'confirm_order_item', payload: { table: 'counter' } }
      };
    }
    if (lower.includes('おすすめ') || lower.includes('osusume') || lower.includes('焼き鳥')) {
      return {
        replyText: '今日のおすすめはねぎまの塩焼きと、炭火で焼いた椎茸だよ。香ばしくてうまいよ！',
        meaning: 'Today’s recommendation is salted negima (chicken and scallion) and charcoal-grilled shiitake mushrooms. Savory and delicious!',
        proposedAction: null
      };
    }
    if (lower.includes('会計') || lower.includes('okaikei') || lower.includes('ごちそう')) {
      return {
        replyText: '毎度ありがとう！合計で三千二百円ね。またいつでも寄ってちょうだい！',
        meaning: 'Thank you as always! That comes to 3,200 yen in total. Come drop by again anytime!',
        proposedAction: { name: 'complete_scene', payload: {} }
      };
    }
    return {
      replyText: 'いらっしゃい！居酒屋まるへようこそ！喉乾いたかい？まずはお飲み物から聞こうか！',
      meaning: 'Welcome! Welcome to Izakaya Maru! Are you thirsty? Let me start with your drinks!',
      proposedAction: null
    };
  }

  // 5. Spanish Characters
  if (characterName === 'Javier') {
    if (lower.includes('diez') || lower.includes('tarjeta') || lower.includes('viajes') || lower.includes('ticket')) {
      return {
        replyText: 'La tarjeta Multi cuesta dos euros cincuenta, más doce con veinte por los diez viajes. ¿Pagas con tarjeta?',
        meaning: 'The Multi card costs two fifty, plus twelve twenty for the ten rides. Paying with card?',
        proposedAction: { name: 'confirm_order_item', payload: { item: 'tarjeta de diez viajes' } }
      };
    }
    if (lower.includes('atocha') || lower.includes('andén') || lower.includes('anden') || lower.includes('plataforma')) {
      return {
        replyText: 'Para Atocha tienes que bajar al andén uno, línea uno en dirección Valdecarros. Son cuatro paradas.',
        meaning: 'For Atocha you have to go down to platform one, line one toward Valdecarros. It is four stops.',
        proposedAction: null
      };
    }
    return {
      replyText: '¡Hola! ¿En qué puedo ayudarte con el metro hoy?',
      meaning: 'Hello! How can I help you with the metro today?',
      proposedAction: null
    };
  }

  if (characterName === 'Elena') {
    if (lower.includes('alergia') || lower.includes('ojos') || lower.includes('pican') || lower.includes('nariz')) {
      return {
        replyText: 'Para la alergia tengo estas pastillas de cetirizina. No dan sueño y se toma una al día por la mañana.',
        meaning: 'For allergies I have these cetirizine tablets. They do not cause drowsiness, take one a day in the morning.',
        proposedAction: { name: 'offer_alternative', payload: { item: 'antihistamínico sin sueño' } }
      };
    }
    return {
      replyText: 'Buenos días, bienvenido a la farmacia. ¿Qué síntomas tienes?',
      meaning: 'Good morning, welcome to the pharmacy. What symptoms do you have?',
      proposedAction: null
    };
  }

  if (characterName === 'Andrés') {
    if (lower.includes('terraza') || lower.includes('mesa') || lower.includes('dos')) {
      return {
        replyText: '¡Por supuesto! Tenemos una mesa libre en la terraza cerca de los olivos. ¿Desean algo de beber mientras miran la carta?',
        meaning: 'Of course! We have an open table on the terrace near the olive trees. Would you like something to drink while looking at the menu?',
        proposedAction: { name: 'confirm_order_item', payload: { table: 'terraza' } }
      };
    }
    if (lower.includes('recomienda') || lower.includes('especial') || lower.includes('tapa')) {
      return {
        replyText: 'Les recomiendo las croquetas caseras y el solomillo ibérico. Todo fresco del día.',
        meaning: 'I recommend the homemade croquettes and the Iberian sirloin. Everything is fresh today.',
        proposedAction: null
      };
    }
    return {
      replyText: 'Buenas noches, bienvenidos a La Terraza. ¿Tienen reserva o buscan mesa?',
      meaning: 'Good evening, welcome to La Terraza. Do you have a reservation or are you looking for a table?',
      proposedAction: null
    };
  }

  if (lower.includes('avena') || lower.includes('oat')) {
    return {
      replyText: 'Lo siento, hoy no nos queda leche de avena. Pero tenemos leche de almendra o entera. ¿Te va bien?',
      meaning: 'I am sorry, we have no oat milk left today. But we have almond milk or whole milk. Does that work for you?',
      proposedAction: { name: 'offer_alternative', payload: { alternative: 'leche de almendra' } }
    };
  }
  if (lower.includes('llevar') || lower.includes('takeaway') || lower.includes('go')) {
    return {
      replyText: '¡Marchando para llevar! Son dos euros con cincuenta.',
      meaning: 'Coming right up to go! That will be two euros fifty.',
      proposedAction: { name: 'confirm_takeaway', payload: { takeaway: true } }
    };
  }
  if (lower.includes('cuánto') || lower.includes('precio') || lower.includes('cuenta')) {
    return {
      replyText: 'Son dos euros cincuenta en total. ¿Quieres pagar con tarjeta o en efectivo?',
      meaning: 'It is two euros fifty in total. Would you like to pay with card or cash?',
      proposedAction: { name: 'complete_scene', payload: {} }
    };
  }

  return {
    replyText: `¡Hola! Muy buenos días. ¿Qué te pongo hoy?`,
    meaning: 'Hello! Good morning. What can I get for you today?',
    proposedAction: null
  };
}

/**
 * The Expo client is a separate app, so this process only serves the API.
 * Deploy it anywhere that terminates TLS; the client calls it over HTTPS.
 */
app.use(roleplayRouter);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Mission Coach API listening on http://0.0.0.0:${PORT}`);
  console.log(`Gemini API key present: ${Boolean(apiKey)}`);
});
