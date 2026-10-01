import { UiLanguage } from "../../types";

export interface Translations {
  common: {
    back: string;
    close: string;
    cancel: string;
    save: string;
    confirm: string;
    start: string;
    continue: string;
    finish: string;
    export: string;
    restore: string;
    clear: string;
    delete: string;
    minutes: string;
    level: string;
    you: string;
    character: string;
    speakingWith: string;
    goal: string;
    stretch: string;
    transferPattern: string;
    connectedLoop: string;
    meaning: string;
    help: string;
    retryTurn: string;
    freezeScene: string;
    resumeScene: string;
    endConversation: string;
    hearingYou: string;
    targetPhrase: string;
    yourProduction: string;
    howWasRecall: string;
    listen: string;
    check: string;
    allTrackedVocabulary: string;
    evidence: string;
    /** Lowercase, for counts like "4 situations". */
    contextsLower: string;
    daysLower: string;
    noEvidenceYet: string;
    inferredFromHistory: string;
    reviewDue: string;
    turns: string;
    neededHelp: string;
    recalledClearly: string;
    allDueReviewed: string;
    allDueReviewedDesc: string;
    switchSpeech: string;
    typeInstead: string;
    showAnswer: string;
    translation: string;
    hideTranslation: string;
    showTranslation: string;
  };
  nav: {
    brandTitle: string;
    brandSubtitle: string;
    talk: string;
    missions: string;
    progress: string;
    settingsTooltip: string;
    targetLang: string;
    appLang: string;
  };
  languages: {
    es: string;
    fr: string;
    de: string;
    it: string;
    ja: string;
    en: string;
    nl: string;
  };
  modes: {
    guided: string;
    guidedDesc: string;
    immersion: string;
    immersionDesc: string;
    focused: string;
    focusedDesc: string;
  };
  talk: {
    tagPractice: string;
    tagMode: string;
    heading: string;
    subheading: string;
    startConversation: string;
    spacedRevisit: string;
    practiseDueTitle: string;
    phrasesReadySingle: string;
    phrasesReadyPlural: string;
    allCaughtUp: string;
    reviewButton: string;
    neighborhoodTitle: string;
    neighborhoodHeading: string;
    neighborhoodDesc: string;
    neighborhoodConsequence: string;
    browseAllButton: string;
  };
  missions: {
    heading: string;
    subheading: string;
    searchPlaceholder: string;
    tabCatalog: string;
    tabRoute: string;
    routeSubtitle: string;
    filterAll: string;
    filterCafes: string;
    filterServices: string;
    filterTransit: string;
    filterProblems: string;
    filterSocial: string;
    filterLevel: string;
    briefingButton: string;
    noMissionsFound: string;
  };
  briefing: {
    tag: string;
    withWhom: string;
    primaryGoal: string;
    stretchChallenge: string;
    selectMode: string;
    coldAttemptTitle: string;
    coldAttemptDesc: string;
    previewPhrasesTitle: string;
    previewPhrasesDesc: string;
    usefulPhrasesTitle: string;
    startMissionButton: string;
  };
  live: {
    liveTag: string;
    frozenTag: string;
    pausedTag: string;
    askCoach: string;
    resume: string;
    showMeaning: string;
    hideMeaning: string;
    typeInstead: string;
    typePlaceholder: string;
    send: string;
    listening: string;
    characterSpeaking: string;
    tapToSpeak: string;
    /** R3: a retry is in flight. Must not read as a failure. */
    reconnecting: string;
    /** R3: voice has failed, typed input still works. */
    voiceFailed: string;
    /** R3: recover the connection without losing the transcript. */
    retryConnection: string;
    finishButton: string;
    coachDrawerTitle: string;
    coachStepIntent: string;
    coachStepPartial: string;
    coachStepFull: string;
    coachStepExpl: string;
    coachAsking: string;
  };
  recap: {
    tag: string;
    title: string;
    communicativeOutcome: string;
    turnsCount: string;
    validatedEvidence: string;
    noPhrasesValidated: string;
    unassisted: string;
    assisted: string;
    rehearsal: string;
    quoteLabel: string;
    transcriptTitle: string;
    downloadReceipt: string;
    downloadSuccess: string;
    continueNextMission: string;
  };
  progress: {
    heading: string;
    subheading: string;
    tabPhrases: string;
    tabSkills: string;
    tabHistory: string;
    /**
     * Compact labels for the tab strip.
     *
     * The full names are long enough to truncate at 390px ("Communicative S..."), and
     * a truncated tab label is not a tab label. The short form is what the eye reads;
     * the full name is still what a screen reader announces.
     */
    tabPhrasesShort: string;
    tabSkillsShort: string;
    tabHistoryShort: string;
    readyToPractise: string;
    steadyTitle: string;
    growingTitle: string;
    supportedTitle: string;
    newTitle: string;
    reviewDue: string;
    nextReviewIn: string;
    spokenCount: string;
    typedCount: string;
    resetPhrase: string;
    communicativeSkillsTitle: string;
    samplePatterns: string;
    observedAcross: string;
    sessionReceiptsTitle: string;
    coldAttempt: string;
    assistedAttempt: string;
    viewReceipt: string;
    noReceiptsYet: string;
    disputeEvidence: string;
    hideEvidence: string;
  };
  drill: {
    title: string;
    subtitle: string;
    counter: string;
    howDoYouSay: string;
    revealButton: string;
    rememberedUnassisted: string;
    neededHint: string;
    completeTitle: string;
    completeDesc: string;
    closeButton: string;
  };
  settings: {
    title: string;
    subtitle: string;
    sectionLang: string;
    targetLangLabel: string;
    uiLangLabel: string;
    comfortLabel: string;
    comfortBeginner: string;
    comfortElementary: string;
    comfortIntermediate: string;
    comfortNotSure: string;
    goalLabel: string;
    goalTravel: string;
    goalRelocation: string;
    goalWork: string;
    goalSocial: string;
    goalExplore: string;
    modeLabel: string;
    sectionVoice: string;
    speechSpeedLabel: string;
    speedSlower: string;
    speedNatural: string;
    speedBrisk: string;
    autoPlayLabel: string;
    sectionPrivacy: string;
    privacyDisclosure: string;
    liveVoiceLabel: string;
    liveVoiceDesc: string;
    savedAnalysisLabel: string;
    savedAnalysisDesc: string;
    sectionArchive: string;
    exportArchiveTitle: string;
    exportArchiveDesc: string;
    exportArchiveButton: string;
    restoreArchiveTitle: string;
    restoreArchiveDesc: string;
    restoreArchiveButton: string;
    eraseTitle: string;
    eraseDesc: string;
    eraseConfirm: string;
    eraseButton: string;
    saveButton: string;
  };
}

export const TRANSLATIONS: Record<UiLanguage, Translations> = {
  en: {
    common: {
      back: "Back",
      close: "Close",
      cancel: "Cancel",
      save: "Save preferences",
      confirm: "Confirm",
      start: "Start",
      continue: "Continue",
      finish: "Finish & View Receipt",
      export: "Export",
      restore: "Restore",
      clear: "Clear",
      delete: "Delete",
      minutes: "min",
      level: "Level",
      you: "You",
      character: "Character",
      speakingWith: "Speaking with:",
      goal: "Goal:",
      stretch: "Stretch challenge:",
      transferPattern: "Transfer Pattern:",
      connectedLoop: "Connected loop:",
      meaning: "Meaning:",
      help: "Help",
      retryTurn: "Retry turn",
      freezeScene: "Freeze Scene",
      resumeScene: "Resume Scene",
      endConversation: "End conversation",
      hearingYou: "Hearing you:",
      targetPhrase: "Target Phrase",
      yourProduction: "Your production:",
      howWasRecall: "How was your recall?",
      listen: "Listen",
      check: "Check",
      allTrackedVocabulary: "All Tracked Vocabulary",
      evidence: "Evidence",
      contextsLower: "situations",
      daysLower: "days",
      noEvidenceYet: "No evidence yet",
      inferredFromHistory: "Reconstructed from older records",
      reviewDue: "Review due",
      turns: "turns",
      neededHelp: "Needed help (Review tomorrow)",
      recalledClearly: "Recalled clearly (Extend interval)",
      allDueReviewed: "All Due Phrases Reviewed!",
      allDueReviewedDesc:
        "Phrases have been refreshed with honest evidence in your progress ledger.",
      switchSpeech: "Switch to speech",
      typeInstead: "Type instead",
      showAnswer: "Show answer",
      translation: "Translation",
      hideTranslation: "Hide translation",
      showTranslation: "Show translation",
    },
    nav: {
      brandTitle: "Mission Coach",
      brandSubtitle: "Voice roleplay & grounded evidence",
      talk: "Talk",
      missions: "Missions",
      progress: "Progress",
      settingsTooltip: "Settings & Data Sovereignty",
      targetLang: "Target",
      appLang: "App Language",
    },
    languages: {
      es: "Spanish (Español)",
      fr: "French (Français)",
      de: "German (Deutsch)",
      it: "Italian (Italiano)",
      ja: "Japanese (日本語)",
      en: "English (English)",
      nl: "Dutch (Nederlands)",
    },
    modes: {
      guided: "Guided (Gentle corrections & hints available)",
      guidedDesc:
        "Balanced practice. The character stays in character, but gentle hints are available when stuck.",
      immersion: "Immersion (Target language only)",
      immersionDesc:
        "Target language only. Character responds naturally; help is only given if you request it.",
      focused: "Focused Practice (Targeted drill on due items)",
      focusedDesc:
        "Targeted drill focusing strictly on due phrases and communicative repairs.",
    },
    talk: {
      tagPractice: "Practice",
      tagMode: "Mode",
      heading: "What would you like to speak today?",
      subheading:
        "Step into a situation, speak naturally, and build phrases you will remember.",
      startConversation: "Start conversation",
      spacedRevisit: "Spaced Revisit",
      practiseDueTitle: "Practise phrases due",
      phrasesReadySingle: "phrase ready for review · about 2 minutes",
      phrasesReadyPlural: "phrases ready for review · about {mins} minutes",
      allCaughtUp: "All phrases are up to date! Great consistency.",
      reviewButton: "Review phrases ({count})",
      neighborhoodTitle: "The Neighborhood",
      neighborhoodHeading: "Explore connected episodes",
      neighborhoodDesc:
        "From morning coffee to parcel delivery to neighbors on Calle Mayor.",
      neighborhoodConsequence:
        "Decisions in one scene carry realistic consequences in the next.",
      browseAllButton: "Browse all situations",
    },
    missions: {
      heading: "Mission Situations",
      subheading:
        "Choose a concrete conversation goal. Each mission reuses core communicative patterns.",
      searchPlaceholder: "Search situations, characters, or places...",
      tabCatalog: "Catalog",
      tabRoute: "Connected Route",
      routeSubtitle:
        "Decisions in one scene carry realistic consequences into the next. Each episode exercises and transfers specific communicative patterns to prepare you for spontaneous conversation.",
      filterAll: "All Situations",
      filterCafes: "Cafés & Dining",
      filterServices: "Services & Errands",
      filterTransit: "Transit",
      filterProblems: "Health & Repairs",
      filterSocial: "Social & Neighborhood",
      filterLevel: "Level:",
      briefingButton: "Briefing",
      noMissionsFound: "No situations found matching your filters.",
    },
    briefing: {
      tag: "Mission Briefing",
      withWhom: "You are speaking with:",
      primaryGoal: "Primary Goal:",
      stretchChallenge: "Stretch Challenge:",
      selectMode: "Select Practice Mode",
      coldAttemptTitle: "Cold Attempt (Honest Ledger)",
      coldAttemptDesc:
        "Do not preview useful phrases before starting. Tests spontaneous unassisted retrieval.",
      previewPhrasesTitle: "Preview Phrases (Assisted Retrieval)",
      previewPhrasesDesc:
        "Review useful phrases before speaking. Will mark items as assisted in your ledger.",
      usefulPhrasesTitle: "Useful Phrases in this Scene",
      startMissionButton: "Start Mission Now",
    },
    live: {
      liveTag: "Session Live",
      frozenTag: "Scene Frozen for Coach Advice",
      pausedTag: "Paused",
      askCoach: "Ask Coach (Freeze)",
      resume: "Resume Scene",
      showMeaning: "Show translation line",
      hideMeaning: "Hide translation line",
      typeInstead: "Type instead of speaking",
      typePlaceholder: "Type your response here...",
      send: "Send",
      listening: "Listening to your speech...",
      characterSpeaking: "Character is speaking...",
      reconnecting: "Reconnecting...",
      voiceFailed: "Voice unavailable",
      retryConnection: "Retry connection",
      tapToSpeak: "Tap to speak",
      finishButton: "Finish & View Receipt",
      coachDrawerTitle: "Language Coach Assistance",
      coachStepIntent: "1. Strategic Intent Hint",
      coachStepPartial: "2. Sentence Starter",
      coachStepFull: "3. Complete Model Phrase",
      coachStepExpl: "4. Cultural & Grammar Nuance",
      coachAsking: "Consulting language coach...",
    },
    recap: {
      tag: "Learning Receipt",
      title: "Session Summary",
      communicativeOutcome: "Communicative Outcome",
      turnsCount: "turns exchanged",
      validatedEvidence: "Validated Phrase Evidence",
      noPhrasesValidated:
        "No specific target phrases validated in this session.",
      unassisted: "Unassisted Spontaneous Retrieval",
      assisted: "Assisted Retrieval (Hint / Briefing / Rehearsal)",
      rehearsal: "Rehearsal",
      quoteLabel: "Verified Quote from Your Speech:",
      transcriptTitle: "Conversation Transcript",
      downloadReceipt: "Download Text Receipt (.txt)",
      downloadSuccess: "Receipt downloaded!",
      continueNextMission: "Continue to Next Mission",
    },
    progress: {
      heading: "Grounded Progress",
      subheading:
        "No mystery scores. Progress is shown only when backed by quotes from your actual speech.",
      tabPhrases: "Phrases & Recall",
      tabSkills: "Communicative Skills",
      tabPhrasesShort: "Phrases",
      tabSkillsShort: "Skills",
      tabHistoryShort: "Receipts",
      tabHistory: "Session Receipts",
      readyToPractise: "Ready to practise",
      steadyTitle: "Steady (demonstrated in 2+ independent sessions)",
      growingTitle: "Growing (unassisted retrieval demonstrated)",
      supportedTitle: "Supported (practiced with hints or preview)",
      newTitle: "New (introduced, pending retrieval)",
      reviewDue: "Review due",
      nextReviewIn: "Next review in {days} days",
      spokenCount: "Spoken {count}x",
      typedCount: "Typed {count}x",
      resetPhrase: "Reset phrase recall state",
      communicativeSkillsTitle: "Communicative Skills",
      samplePatterns: "Sample patterns:",
      observedAcross: "Observed across {count} connected scenes",
      sessionReceiptsTitle: "Session Receipts",
      coldAttempt: "Cold Attempt",
      assistedAttempt: "Assisted Attempt",
      viewReceipt: "View Receipt",
      noReceiptsYet:
        "No session receipts recorded yet. Complete your first mission to start your ledger.",
      disputeEvidence: "Dispute quote",
      hideEvidence: "Hide from ledger",
    },
    drill: {
      title: "Due Retrieval Drill",
      subtitle: "Test your spontaneous recall for phrases due today.",
      counter: "Phrase {current} of {total}",
      howDoYouSay: "How do you say in {language}:",
      revealButton: "Reveal phrase & check",
      rememberedUnassisted: "I recalled it unassisted",
      neededHint: "I needed a hint / forgot",
      completeTitle: "Drill Complete!",
      completeDesc:
        "Phrases have been updated in your grounded retrieval ledger.",
      closeButton: "Close Drill",
    },
    settings: {
      title: "Settings",
      subtitle: "Preferences & Data Sovereignty",
      sectionLang: "Language & Learning Context",
      targetLangLabel: "Target Language",
      uiLangLabel: "Interface & Explanation Language",
      comfortLabel: "Comfort Level",
      comfortBeginner: "Beginner (A1 - Starting out)",
      comfortElementary: "Elementary (A2 - Basic conversations)",
      comfortIntermediate: "Intermediate (B1 - Independent)",
      comfortNotSure: "Not sure / Exploring",
      goalLabel: "Primary Practice Goal",
      goalTravel: "Travel & Tourism",
      goalRelocation: "Relocation & Everyday Life",
      goalWork: "Work & Professional",
      goalSocial: "Social & Making Friends",
      goalExplore: "Curiosity & Cultural Exploration",
      modeLabel: "Default Practice Mode",
      sectionVoice: "Voice Playback & Speech Pacing",
      speechSpeedLabel: "Character Speech Speed",
      speedSlower: "0.8x (Patient & Slower for learners)",
      speedNatural: "1.0x (Natural Conversational Speed)",
      speedBrisk: "1.2x (Brisk Native Cadence)",
      autoPlayLabel: "Auto-play character speech",
      sectionPrivacy: "AI Processing & Consent Disclosures",
      privacyDisclosure:
        "Your voice audio is converted to speech to enable natural character dialogue. Transcripts and observations are stored locally on your device in your private ledger.",
      liveVoiceLabel: "Live voice processing",
      liveVoiceDesc:
        "Process spoken input to generate character audio responses.",
      savedAnalysisLabel: "Evidence & recap analysis",
      savedAnalysisDesc:
        "Extract quotes from transcripts to maintain your spaced retrieval progress.",
      sectionArchive: "On-Device Data Archive & Sovereignty",
      exportArchiveTitle: "Export Archive (.json)",
      exportArchiveDesc:
        "Download complete ledger: sessions, quotes, and intervals.",
      exportArchiveButton: "Download Archive",
      restoreArchiveTitle: "Restore Archive (.json)",
      restoreArchiveDesc: "Import previously saved backup into local storage.",
      restoreArchiveButton: "Upload & Restore",
      eraseTitle: "Erase All Learning Data",
      eraseDesc:
        "Permanently wipes all conversation history and resets phrase recall states.",
      eraseConfirm: "Confirm Erase Everything",
      eraseButton: "Clear all local records",
      saveButton: "Save preferences",
    },
  },

  fr: {
    common: {
      back: "Retour",
      close: "Fermer",
      cancel: "Annuler",
      save: "Enregistrer les préférences",
      confirm: "Confirmer",
      start: "Démarrer",
      continue: "Continuer",
      finish: "Terminer et voir le reçu",
      export: "Exporter",
      restore: "Restaurer",
      clear: "Effacer",
      delete: "Supprimer",
      minutes: "min",
      level: "Niveau",
      you: "Vous",
      character: "Personnage",
      speakingWith: "Interlocuteur :",
      goal: "Objectif :",
      stretch: "Défi supplémentaire :",
      transferPattern: "Modèle transféré :",
      connectedLoop: "Boucle connectée :",
      meaning: "Signification :",
      help: "Aide",
      retryTurn: "Recommencer le tour",
      freezeScene: "Geler la scène",
      resumeScene: "Reprendre la scène",
      endConversation: "Terminer la conversation",
      hearingYou: "Je vous entends :",
      targetPhrase: "Expression cible",
      yourProduction: "Votre réponse :",
      howWasRecall: "Comment s’est passé votre rappel ?",
      listen: "Écouter",
      check: "Vérifier",
      allTrackedVocabulary: "Tout le vocabulaire suivi",
      evidence: "Preuves",
      contextsLower: "situations",
      daysLower: "jours",
      noEvidenceYet: "Aucune preuve",
      inferredFromHistory: "Reconstruit à partir d’anciens enregistrements",
      reviewDue: "Revue a venir",
      turns: "tours",
      neededHelp: "Besoin d’aide (Revoir demain)",
      recalledClearly: "Rappel fluide (Espacer l’intervalle)",
      allDueReviewed: "Toutes les expressions dues ont été révisées !",
      allDueReviewedDesc:
        "Les expressions ont été mises à jour avec des preuves concrètes dans votre registre.",
      switchSpeech: "Passer à la voix",
      typeInstead: "Écrire au clavier",
      showAnswer: "Afficher la réponse",
      translation: "Traduction",
      hideTranslation: "Masquer la traduction",
      showTranslation: "Afficher la traduction",
    },
    nav: {
      brandTitle: "Mission Coach",
      brandSubtitle: "Jeu de rôle vocal et preuves authentiques",
      talk: "Parler",
      missions: "Missions",
      progress: "Progrès",
      settingsTooltip: "Paramètres et souveraineté des données",
      targetLang: "Langue cible",
      appLang: "Langue de l’interface",
    },
    languages: {
      es: "Espagnol (Español)",
      fr: "Français (Français)",
      de: "Allemand (Deutsch)",
      it: "Italien (Italiano)",
      ja: "Japonais (日本語)",
      en: "Anglais (English)",
      nl: "Néerlandais (Nederlands)",
    },
    modes: {
      guided: "Guidé (Corrections douces et indices disponibles)",
      guidedDesc:
        "Pratique équilibrée. Le personnage reste dans son rôle, avec des indices discrets en cas de blocage.",
      immersion: "Immersion (Langue cible uniquement)",
      immersionDesc:
        "Langue cible exclusive. Le personnage répond naturellement ; aide uniquement sur demande.",
      focused: "Pratique ciblée (Répétition sur les expressions dues)",
      focusedDesc:
        "Exercices ciblés strictement sur les phrases à réviser et la réparation communicative.",
    },
    talk: {
      tagPractice: "Pratique",
      tagMode: "Mode",
      heading: "Que souhaitez-vous pratiquer aujourd’hui ?",
      subheading:
        "Plongez dans une situation réelle, parlez naturellement et ancrez des expressions mémorables.",
      startConversation: "Démarrer la conversation",
      spacedRevisit: "Révision espacée",
      practiseDueTitle: "Pratiquer les expressions à revoir",
      phrasesReadySingle: "expression prête pour révision · environ 2 minutes",
      phrasesReadyPlural:
        "expressions prêtes pour révision · environ {mins} minutes",
      allCaughtUp:
        "Toutes les expressions sont à jour ! Excellente régularité.",
      reviewButton: "Réviser les expressions ({count})",
      neighborhoodTitle: "Le Quartier",
      neighborhoodHeading: "Explorer les épisodes connectés",
      neighborhoodDesc:
        "Du café du matin à la réception de colis jusqu’aux voisins.",
      neighborhoodConsequence:
        "Les décisions d’une scène entraînent des conséquences réalistes dans la suivante.",
      browseAllButton: "Voir toutes les situations",
    },
    missions: {
      heading: "Situations & Missions",
      subheading:
        "Choisissez un objectif de conversation concret. Chaque mission réutilise des schémas communicatifs clés.",
      searchPlaceholder: "Rechercher des situations, personnages ou lieux...",
      tabCatalog: "Catalogue",
      tabRoute: "Itinéraire connecté",
      routeSubtitle:
        "Les décisions d’une scène influencent la suivante. Chaque épisode entraîne et transfère des compétences communicatives précises.",
      filterAll: "Toutes les situations",
      filterCafes: "Cafés & Restaurants",
      filterServices: "Services & Démarches",
      filterTransit: "Transports",
      filterProblems: "Santé & Réparations",
      filterSocial: "Voisinage & Social",
      filterLevel: "Niveau :",
      briefingButton: "Briefing",
      noMissionsFound: "Aucune situation ne correspond à vos filtres.",
    },
    briefing: {
      tag: "Briefing de mission",
      withWhom: "Vous parlez avec :",
      primaryGoal: "Objectif principal :",
      stretchChallenge: "Défi bonus :",
      selectMode: "Choisir le mode d’entraînement",
      coldAttemptTitle: "Tentative à froid (Registre honnête)",
      coldAttemptDesc:
        "Ne prévisualisez pas les expressions utiles. Évalue votre rappel spontané non assisté.",
      previewPhrasesTitle: "Consulter les expressions (Rappel assisté)",
      previewPhrasesDesc:
        "Lisez les expressions avant de parler. Elles seront enregistrées comme assistées dans votre registre.",
      usefulPhrasesTitle: "Expressions utiles dans cette scène",
      startMissionButton: "Démarrer la mission maintenant",
    },
    live: {
      liveTag: "Session en direct",
      frozenTag: "Scène gelée pour conseil du coach",
      pausedTag: "En pause",
      askCoach: "Demander au coach (Pause)",
      resume: "Reprendre la scène",
      showMeaning: "Afficher la traduction",
      hideMeaning: "Masquer la traduction",
      typeInstead: "Écrire au lieu de parler",
      typePlaceholder: "Écrivez votre réponse ici...",
      send: "Envoyer",
      listening: "Écoute de votre voix...",
      characterSpeaking: "Le personnage parle...",
      reconnecting: "Reconnexion...",
      voiceFailed: "Voix indisponible",
      retryConnection: "Réessayer",
      tapToSpeak: "Appuyez pour parler",
      finishButton: "Terminer et voir le reçu",
      coachDrawerTitle: "Aide du coach linguistique",
      coachStepIntent: "1. Indice d’intention stratégique",
      coachStepPartial: "2. Début de phrase",
      coachStepFull: "3. Phrase modèle complète",
      coachStepExpl: "4. Nuance culturelle et grammaticale",
      coachAsking: "Consultation du coach en cours...",
    },
    recap: {
      tag: "Reçu d’apprentissage",
      title: "Résumé de la session",
      communicativeOutcome: "Résultat communicatif",
      turnsCount: "échanges",
      validatedEvidence: "Preuves textuelles validées",
      noPhrasesValidated:
        "Aucune expression cible spécifique validée lors de cette session.",
      unassisted: "Rappel spontané non assisté",
      assisted: "Rappel assisté (Indice / Briefing / Répétition)",
      rehearsal: "Répétition",
      quoteLabel: "Citation vérifiée de vos propos :",
      transcriptTitle: "Transcription de l’échange",
      downloadReceipt: "Télécharger le reçu texte (.txt)",
      downloadSuccess: "Reçu téléchargé !",
      continueNextMission: "Passer à la mission suivante",
    },
    progress: {
      heading: "Progrès vérifiés",
      subheading:
        "Aucune note mystérieuse. Les progrès ne s’affichent que s’ils sont étayés par des citations de vos propos réels.",
      tabPhrases: "Expressions & Rappel",
      tabSkills: "Compétences communicatives",
      tabPhrasesShort: "Expressions",
      tabSkillsShort: "Compétences",
      tabHistoryShort: "Reçus",
      tabHistory: "Reçus de sessions",
      readyToPractise: "Prêtes à pratiquer",
      steadyTitle: "Acquises (démontrées dans 2+ sessions distinctes)",
      growingTitle: "En progression (rappel non assisté démontré)",
      supportedTitle: "Accompagnées (pratiquées avec indices)",
      newTitle: "Nouvelles (découvertes, en attente de test)",
      reviewDue: "À réviser",
      nextReviewIn: "Prochaine révision dans {days} jours",
      spokenCount: "Parlé {count}x",
      typedCount: "Écrit {count}x",
      resetPhrase: "Réinitialiser l’état de rappel",
      communicativeSkillsTitle: "Compétences communicatives",
      samplePatterns: "Modèles types :",
      observedAcross: "Observé dans {count} scènes connectées",
      sessionReceiptsTitle: "Reçus de session",
      coldAttempt: "Tentative à froid",
      assistedAttempt: "Tentative assistée",
      viewReceipt: "Voir le reçu",
      noReceiptsYet:
        "Aucun reçu de session enregistré. Terminez votre première mission pour commencer votre registre.",
      disputeEvidence: "Contester la citation",
      hideEvidence: "Masquer du registre",
    },
    drill: {
      title: "Exercice de rappel",
      subtitle: "Testez votre rappel spontané des expressions du jour.",
      counter: "Expression {current} sur {total}",
      howDoYouSay: "Comment dites-vous en {language} :",
      revealButton: "Révéler la phrase et vérifier",
      rememberedUnassisted: "Je l’ai trouvée sans aide",
      neededHint: "J’ai eu besoin d’aide / oublié",
      completeTitle: "Exercice terminé !",
      completeDesc:
        "Les intervalles de révision ont été mis à jour dans votre registre.",
      closeButton: "Fermer l’exercice",
    },
    settings: {
      title: "Paramètres",
      subtitle: "Préférences & Souveraineté des données",
      sectionLang: "Langue & Contexte d’apprentissage",
      targetLangLabel: "Langue cible à apprendre",
      uiLangLabel: "Langue de l’interface et explications",
      comfortLabel: "Niveau de confiance",
      comfortBeginner: "Débutant (A1 - Premiers pas)",
      comfortElementary: "Élémentaire (A2 - Conversations simples)",
      comfortIntermediate: "Intermédiaire (B1 - Autonome)",
      comfortNotSure: "Pas sûr / Découverte",
      goalLabel: "Objectif principal",
      goalTravel: "Voyage & Tourisme",
      goalRelocation: "Expatriation & Vie quotidienne",
      goalWork: "Travail & Professionnel",
      goalSocial: "Social & Rencontres",
      goalExplore: "Curiosité & Culture",
      modeLabel: "Mode d’entraînement par défaut",
      sectionVoice: "Voix & Débit de parole",
      speechSpeedLabel: "Vitesse de parole des personnages",
      speedSlower: "0.8x (Patient & Lent pour apprenants)",
      speedNatural: "1.0x (Débit naturel conversationnel)",
      speedBrisk: "1.2x (Cadence native dynamique)",
      autoPlayLabel: "Lecture audio automatique des répliques",
      sectionPrivacy: "Confidentialité & Traitement IA",
      privacyDisclosure:
        "Votre audio vocal est traité pour permettre un dialogue réaliste avec les personnages. Les transcriptions et observations restent stockées localement sur votre appareil.",
      liveVoiceLabel: "Traitement vocal en direct",
      liveVoiceDesc:
        "Traite la parole pour générer les réponses audio des personnages.",
      savedAnalysisLabel: "Analyse des preuves & reçus",
      savedAnalysisDesc:
        "Extrait des citations de vos propos pour tenir à jour votre apprentissage espacé.",
      sectionArchive: "Archive locale & Souveraineté",
      exportArchiveTitle: "Exporter l’archive (.json)",
      exportArchiveDesc:
        "Téléchargez l’intégralité de votre registre : sessions, citations et intervalles.",
      exportArchiveButton: "Télécharger l’archive",
      restoreArchiveTitle: "Restaurer une archive (.json)",
      restoreArchiveDesc:
        "Importez une sauvegarde précédente dans votre stockage local.",
      restoreArchiveButton: "Téléverser & Restaurer",
      eraseTitle: "Effacer toutes les données",
      eraseDesc:
        "Supprime définitivement tout l’historique des conversations et réinitialise les expressions.",
      eraseConfirm: "Confirmer la suppression totale",
      eraseButton: "Effacer les enregistrements locaux",
      saveButton: "Enregistrer les préférences",
    },
  },

  es: {
    common: {
      back: "Atrás",
      close: "Cerrar",
      cancel: "Cancelar",
      save: "Guardar preferencias",
      confirm: "Confirmar",
      start: "Comenzar",
      continue: "Continuar",
      finish: "Terminar y ver recibo",
      export: "Exportar",
      restore: "Restaurar",
      clear: "Borrar",
      delete: "Eliminar",
      minutes: "min",
      level: "Nivel",
      you: "Tú",
      character: "Personaje",
      speakingWith: "Hablas con:",
      goal: "Objetivo:",
      stretch: "Reto adicional:",
      transferPattern: "Patrón transferible:",
      connectedLoop: "Bucle conectado:",
      meaning: "Significado:",
      help: "Ayuda",
      retryTurn: "Reintentar turno",
      freezeScene: "Pausar escena",
      resumeScene: "Reanudar escena",
      endConversation: "Terminar conversación",
      hearingYou: "Escuchándote:",
      targetPhrase: "Frase objetivo",
      yourProduction: "Tu respuesta:",
      howWasRecall: "¿Cómo fue tu recuerdo?",
      listen: "Escuchar",
      check: "Comprobar",
      allTrackedVocabulary: "Todo el vocabulario registrado",
      evidence: "Evidencias",
      contextsLower: "situaciones",
      daysLower: "dias",
      noEvidenceYet: "Sin evidencia todavia",
      inferredFromHistory: "Reconstruido de registros anteriores",
      reviewDue: "Revision pendiente",
      turns: "turnos",
      neededHelp: "Necesité ayuda (Repasar mañana)",
      recalledClearly: "Recordado con claridad (Ampliar intervalo)",
      allDueReviewed: "¡Todas las frases pendientes repasadas!",
      allDueReviewedDesc:
        "Las frases han sido actualizadas con evidencia real en tu registro de progreso.",
      switchSpeech: "Cambiar a voz",
      typeInstead: "Escribir en su lugar",
      showAnswer: "Mostrar respuesta",
      translation: "Traducción",
      hideTranslation: "Ocultar traducción",
      showTranslation: "Mostrar traducción",
    },
    nav: {
      brandTitle: "Mission Coach",
      brandSubtitle: "Juego de rol por voz y evidencias honestas",
      talk: "Hablar",
      missions: "Misiones",
      progress: "Progreso",
      settingsTooltip: "Ajustes y soberanía de datos",
      targetLang: "Idioma objetivo",
      appLang: "Idioma de interfaz",
    },
    languages: {
      es: "Español (Español)",
      fr: "Francés (Français)",
      de: "Alemán (Deutsch)",
      it: "Italiano (Italiano)",
      ja: "Japonés (日本語)",
      en: "Inglés (English)",
      nl: "Holandés (Nederlands)",
    },
    modes: {
      guided: "Guiado (Correcciones suaves y pistas disponibles)",
      guidedDesc:
        "Práctica equilibrada. El personaje actúa de forma natural y dispones de pistas suaves si te bloqueas.",
      immersion: "Inmersión (Solo idioma objetivo)",
      immersionDesc:
        "Idioma objetivo exclusivo. El personaje responde con naturalidad; ayuda solo si la pides.",
      focused: "Práctica enfocada (Repaso estricto de frases pendientes)",
      focusedDesc:
        "Ejercicios centrados exclusivamente en frases pendientes y reparación comunicativa.",
    },
    talk: {
      tagPractice: "Práctica",
      tagMode: "Modo",
      heading: "¿Qué te gustaría hablar hoy?",
      subheading:
        "Adéntrate en una situación real, habla con naturalidad y consolida frases que recordarás.",
      startConversation: "Iniciar conversación",
      spacedRevisit: "Repaso espaciado",
      practiseDueTitle: "Practicar frases pendientes",
      phrasesReadySingle: "frase lista para repaso · aprox. 2 minutos",
      phrasesReadyPlural: "frases listas para repaso · aprox. {mins} minutos",
      allCaughtUp: "¡Todas las frases están al día! Excelente constancia.",
      reviewButton: "Repasar frases ({count})",
      neighborhoodTitle: "El Barrio",
      neighborhoodHeading: "Explorar episodios conectados",
      neighborhoodDesc:
        "Desde el café de la mañana hasta el paquete y los vecinos de Calle Mayor.",
      neighborhoodConsequence:
        "Las decisiones de una escena tienen consecuencias realistas en la siguiente.",
      browseAllButton: "Ver todas las situaciones",
    },
    missions: {
      heading: "Situaciones y Misiones",
      subheading:
        "Elige un objetivo de conversación concreto. Cada misión ejercita patrones comunicativos transferibles.",
      searchPlaceholder: "Buscar situaciones, personajes o lugares...",
      tabCatalog: "Catálogo",
      tabRoute: "Ruta conectada",
      routeSubtitle:
        "Las decisiones en una escena llevan consecuencias a la siguiente. Cada episodio entrena y transfiere patrones concretos.",
      filterAll: "Todas las situaciones",
      filterCafes: "Cafés y Restaurantes",
      filterServices: "Servicios y Gestiones",
      filterTransit: "Transporte",
      filterProblems: "Salud e Imprevistos",
      filterSocial: "Vecinos y Social",
      filterLevel: "Nivel:",
      briefingButton: "Briefing",
      noMissionsFound: "No se encontraron situaciones con estos filtros.",
    },
    briefing: {
      tag: "Briefing de Misión",
      withWhom: "Hablarás con:",
      primaryGoal: "Objetivo principal:",
      stretchChallenge: "Desafío reto:",
      selectMode: "Seleccionar modo de práctica",
      coldAttemptTitle: "Intento en frío (Libro de registro honesto)",
      coldAttemptDesc:
        "No previsualices las frases antes de empezar. Evalúa tu recuperación espontánea sin asistencia.",
      previewPhrasesTitle: "Previsualizar frases (Recuperación asistida)",
      previewPhrasesDesc:
        "Revisa las frases útiles antes de hablar. Quedarán registradas como asistidas en tu libro.",
      usefulPhrasesTitle: "Frases útiles para esta escena",
      startMissionButton: "Comenzar misión ahora",
    },
    live: {
      liveTag: "Sesión en vivo",
      frozenTag: "Escena congelada para consejo",
      pausedTag: "En pausa",
      askCoach: "Preguntar al Coach (Pausar)",
      resume: "Reanudar escena",
      showMeaning: "Mostrar traducción",
      hideMeaning: "Ocultar traducción",
      typeInstead: "Escribir en lugar de hablar",
      typePlaceholder: "Escribe tu respuesta aquí...",
      send: "Enviar",
      listening: "Escuchando tu voz...",
      characterSpeaking: "El personaje está hablando...",
      reconnecting: "Reconectando...",
      voiceFailed: "Voz no disponible",
      retryConnection: "Reintentar",
      tapToSpeak: "Toca para hablar",
      finishButton: "Finalizar y ver recibo",
      coachDrawerTitle: "Asistencia del Coach Lingüístico",
      coachStepIntent: "1. Pista estratégica de intención",
      coachStepPartial: "2. Inicio de frase",
      coachStepFull: "3. Frase modelo completa",
      coachStepExpl: "4. Matiz cultural y gramatical",
      coachAsking: "Consultando al coach...",
    },
    recap: {
      tag: "Recibo de Aprendizaje",
      title: "Resumen de la Sesión",
      communicativeOutcome: "Resultado comunicativo",
      turnsCount: "turnos intercambiados",
      validatedEvidence: "Evidencia textual verificada",
      noPhrasesValidated: "No se validaron frases específicas en esta sesión.",
      unassisted: "Recuperación espontánea sin ayuda",
      assisted: "Recuperación asistida (Pista / Briefing / Ensayo)",
      rehearsal: "Ensayo",
      quoteLabel: "Cita verificada de lo que dijiste:",
      transcriptTitle: "Transcripción de la conversación",
      downloadReceipt: "Descargar recibo en texto (.txt)",
      downloadSuccess: "¡Recibo descargado!",
      continueNextMission: "Continuar a la siguiente misión",
    },
    progress: {
      heading: "Progreso Fundamentado",
      subheading:
        "Sin puntuaciones mágicas. Tu progreso solo se muestra cuando está respaldado por citas de lo que hablaste.",
      tabPhrases: "Frases y Memoria",
      tabSkills: "Habilidades comunicativas",
      tabPhrasesShort: "Frases",
      tabSkillsShort: "Habilidades",
      tabHistoryShort: "Recibos",
      tabHistory: "Recibos de sesión",
      readyToPractise: "Listas para practicar",
      steadyTitle: "Asimiladas (demostradas en 2+ sesiones independientes)",
      growingTitle: "En desarrollo (recuperación sin ayuda demostrada)",
      supportedTitle: "Apoyadas (practicadas con pistas o vista previa)",
      newTitle: "Nuevas (introducidas, pendientes de prueba)",
      reviewDue: "Repaso pendiente",
      nextReviewIn: "Próximo repaso en {days} días",
      spokenCount: "Hablado {count}x",
      typedCount: "Escrito {count}x",
      resetPhrase: "Reiniciar estado de memoria",
      communicativeSkillsTitle: "Habilidades comunicativas",
      samplePatterns: "Patrones de ejemplo:",
      observedAcross: "Observado en {count} escenas conectadas",
      sessionReceiptsTitle: "Recibos de Sesión",
      coldAttempt: "Intento en frío",
      assistedAttempt: "Intento asistido",
      viewReceipt: "Ver recibo",
      noReceiptsYet:
        "Aún no hay recibos guardados. Completa tu primera misión para iniciar tu registro.",
      disputeEvidence: "Disputar cita",
      hideEvidence: "Ocultar del registro",
    },
    drill: {
      title: "Práctica de Recuperación",
      subtitle: "Pon a prueba tu recuerdo espontáneo de las frases del día.",
      counter: "Frase {current} de {total}",
      howDoYouSay: "¿Cómo dices en {language}:",
      revealButton: "Revelar frase y verificar",
      rememberedUnassisted: "La recordé sin ayuda",
      neededHint: "Necesité ayuda / olvidada",
      completeTitle: "¡Práctica completada!",
      completeDesc:
        "Los intervalos de memoria se han actualizado en tu registro.",
      closeButton: "Cerrar práctica",
    },
    settings: {
      title: "Ajustes",
      subtitle: "Preferencias y Soberanía de Datos",
      sectionLang: "Idioma y Contexto de Aprendizaje",
      targetLangLabel: "Idioma que quieres aprender",
      uiLangLabel: "Idioma de interfaz y explicaciones",
      comfortLabel: "Nivel de confianza",
      comfortBeginner: "Principiante (A1 - Primeros pasos)",
      comfortElementary: "Elemental (A2 - Charlas sencillas)",
      comfortIntermediate: "Intermedio (B1 - Independiente)",
      comfortNotSure: "No estoy seguro / Explorando",
      goalLabel: "Objetivo de práctica",
      goalTravel: "Viajes y Turismo",
      goalRelocation: "Mudanza y Vida cotidiana",
      goalWork: "Trabajo y Negocios",
      goalSocial: "Socializar y Amigos",
      goalExplore: "Curiosidad y Cultura",
      modeLabel: "Modo de práctica predeterminado",
      sectionVoice: "Voz y Cadencia de Habla",
      speechSpeedLabel: "Velocidad de habla del personaje",
      speedSlower: "0.8x (Pausado para aprender)",
      speedNatural: "1.0x (Velocidad conversacional natural)",
      speedBrisk: "1.2x (Cadencia nativa ágil)",
      autoPlayLabel: "Reproducir automáticamente el audio del personaje",
      sectionPrivacy: "Privacidad y Procesamiento con IA",
      privacyDisclosure:
        "Tu voz se procesa para permitir diálogos naturales con los personajes. Las transcripciones y evidencias se guardan localmente en tu dispositivo en tu registro privado.",
      liveVoiceLabel: "Procesamiento de voz en vivo",
      liveVoiceDesc:
        "Procesa el audio para generar las réplicas del personaje.",
      savedAnalysisLabel: "Análisis de evidencias y recibos",
      savedAnalysisDesc:
        "Extrae citas de lo que hablaste para calcular tu repaso espaciado.",
      sectionArchive: "Archivo Local y Soberanía",
      exportArchiveTitle: "Exportar archivo (.json)",
      exportArchiveDesc:
        "Descarga tu libro completo: sesiones, citas textuales e intervalos.",
      exportArchiveButton: "Descargar archivo",
      restoreArchiveTitle: "Restaurar archivo (.json)",
      restoreArchiveDesc:
        "Importa una copia de seguridad previa en tu almacenamiento local.",
      restoreArchiveButton: "Subir y Restaurar",
      eraseTitle: "Borrar todos los datos de aprendizaje",
      eraseDesc:
        "Elimina de forma permanente todo el historial y reinicia las frases.",
      eraseConfirm: "Confirmar borrado total",
      eraseButton: "Borrar registros locales",
      saveButton: "Guardar preferencias",
    },
  },

  nl: {
    common: {
      back: "Terug",
      close: "Sluiten",
      cancel: "Annuleren",
      save: "Voorkeuren opslaan",
      confirm: "Bevestigen",
      start: "Starten",
      continue: "Doorgaan",
      finish: "Afronden & Bewijs bekijken",
      export: "Exporteren",
      restore: "Herstellen",
      clear: "Wissen",
      delete: "Verwijderen",
      minutes: "min",
      level: "Niveau",
      you: "Jij",
      character: "Personage",
      speakingWith: "In gesprek met:",
      goal: "Doel:",
      stretch: "Extra uitdaging:",
      transferPattern: "Transferpatroon:",
      connectedLoop: "Verbonden lus:",
      meaning: "Betekenis:",
      help: "Hulp",
      retryTurn: "Beurt opnieuw proberen",
      freezeScene: "Scène pauzeren",
      resumeScene: "Scène hervatten",
      endConversation: "Gesprek beëindigen",
      hearingYou: "Ik hoor je:",
      targetPhrase: "Doelzin",
      yourProduction: "Jouw productie:",
      howWasRecall: "Hoe ging het herinneren?",
      listen: "Luisteren",
      check: "Controleren",
      allTrackedVocabulary: "Alle geregistreerde woordenschat",
      evidence: "Bewijs",
      contextsLower: "situaties",
      daysLower: "dagen",
      noEvidenceYet: "Nog geen bewijs",
      inferredFromHistory: "Opgebouwd uit oudere gegevens",
      reviewDue: "Herziening nodig",
      turns: "beurten",
      neededHelp: "Hulp nodig gehad (Morgen herhalen)",
      recalledClearly: "Duidelijk herinnerd (Interval verlengen)",
      allDueReviewed: "Alle te herhalen zinnen voltooid!",
      allDueReviewedDesc:
        "Zinnen zijn bijgewerkt met eerlijk bewijs in je voortgangsregister.",
      switchSpeech: "Wisselen naar spraak",
      typeInstead: "Typen in plaats daarvan",
      showAnswer: "Antwoord tonen",
      translation: "Vertaling",
      hideTranslation: "Vertaling verbergen",
      showTranslation: "Vertaling tonen",
    },
    nav: {
      brandTitle: "Mission Coach",
      brandSubtitle: "Stemgestuurd rollenspel & eerlijk bewijs",
      talk: "Spreken",
      missions: "Missies",
      progress: "Voortgang",
      settingsTooltip: "Instellingen & Gegevenssoevereiniteit",
      targetLang: "Doeltaal",
      appLang: "App-taal",
    },
    languages: {
      es: "Spaans (Español)",
      fr: "Frans (Français)",
      de: "Duits (Deutsch)",
      it: "Italiaans (Italiano)",
      ja: "Japans (日本語)",
      en: "Engels (English)",
      nl: "Nederlands (Nederlands)",
    },
    modes: {
      guided: "Begeleid (Zachte correcties & hints beschikbaar)",
      guidedDesc:
        "Evenwichtige oefening. Het personage blijft in zijn rol, met vriendelijke hints als je vastloopt.",
      immersion: "Onderdompeling (Alleen doeltaal)",
      immersionDesc:
        "Uitsluitend in de doeltaal. Het personage reageert natuurlijk; hulp alleen als je erom vraagt.",
      focused: "Gerichte oefening (Drill op te herhalen zinnen)",
      focusedDesc:
        "Doelgerichte training die zich strikt richt op falingen en communicatief herstel.",
    },
    talk: {
      tagPractice: "Oefening",
      tagMode: "Modus",
      heading: "Wat wil je vandaag oefenen?",
      subheading:
        "Stap in een echte situatie, spreek natuurlijk en leer zinnen die je zult onthouden.",
      startConversation: "Gesprek starten",
      spacedRevisit: "Gespreide herhaling",
      practiseDueTitle: "Herhaal zinnen van vandaag",
      phrasesReadySingle: "zin klaar voor herhaling · ongeveer 2 minuten",
      phrasesReadyPlural:
        "zinnen klaar voor herhaling · ongeveer {mins} minuten",
      allCaughtUp: "Alle zinnen zijn bijgewerkt! Geweldige consistentie.",
      reviewButton: "Zinnen herhalen ({count})",
      neighborhoodTitle: "De Buurt",
      neighborhoodHeading: "Verken verbonden afleveringen",
      neighborhoodDesc:
        "Van ochtendkoffie tot pakketbezorging en buren op Calle Mayor.",
      neighborhoodConsequence:
        "Beslissingen in de ene scène hebben realistische gevolgen in de volgende.",
      browseAllButton: "Bekijk alle situaties",
    },
    missions: {
      heading: "Missies & Situaties",
      subheading:
        "Kies een concreet gespreksdoel. Elke missie hergebruikt essentiële communicatieve patronen.",
      searchPlaceholder: "Zoek situaties, personages of locaties...",
      tabCatalog: "Catalogus",
      tabRoute: "Verbonden route",
      routeSubtitle:
        "Beslissingen in de ene scène beïnvloeden de volgende. Elke aflevering oefent en versterkt gerichte communicatieve patronen.",
      filterAll: "Alle situaties",
      filterCafes: "Cafés & Dineren",
      filterServices: "Diensten & Klusjes",
      filterTransit: "Openbaar vervoer",
      filterProblems: "Gezondheid & Hulp",
      filterSocial: "Buren & Sociaal",
      filterLevel: "Niveau:",
      briefingButton: "Briefing",
      noMissionsFound: "Geen situaties gevonden die voldoen aan je filters.",
    },
    briefing: {
      tag: "Missiebriefing",
      withWhom: "Je spreekt met:",
      primaryGoal: "Hoofddoel:",
      stretchChallenge: "Bonusuitdaging:",
      selectMode: "Kies oefenmodus",
      coldAttemptTitle: "Koude poging (Eerlijk register)",
      coldAttemptDesc:
        "Bekijk de handige zinnen vooraf niet. Test je spontane herinnering zonder ondersteuning.",
      previewPhrasesTitle: "Zinnen vooraf bekijken (Ondersteund)",
      previewPhrasesDesc:
        "Lees de handige zinnen voor je spreekt. Ze worden als ondersteund gemarkeerd in je register.",
      usefulPhrasesTitle: "Handige zinnen in deze scène",
      startMissionButton: "Start missie nu",
    },
    live: {
      liveTag: "Sessie live",
      frozenTag: "Scène gepauzeerd voor advies van de coach",
      pausedTag: "Gepauzeerd",
      askCoach: "Vraag coach (Pauzeer)",
      resume: "Hervat scène",
      showMeaning: "Toon vertaling",
      hideMeaning: "Verberg vertaling",
      typeInstead: "Typen in plaats van spreken",
      typePlaceholder: "Typ je antwoord hier...",
      send: "Verzenden",
      listening: "Luisteren naar je stem...",
      characterSpeaking: "Personage spreekt...",
      reconnecting: "Opnieuw verbinden...",
      voiceFailed: "Stem niet beschikbaar",
      retryConnection: "Opnieuw proberen",
      tapToSpeak: "Tik om te spreken",
      finishButton: "Afronden & Bewijs bekijken",
      coachDrawerTitle: "Hulp van de taalcoach",
      coachStepIntent: "1. Strategische intentie-hint",
      coachStepPartial: "2. Zinsbegin",
      coachStepFull: "3. Volledige voorbeeldzin",
      coachStepExpl: "4. Culturele en grammaticale toelichting",
      coachAsking: "Coach raadplegen...",
    },
    recap: {
      tag: "Leerbewijs",
      title: "Sessieoverzicht",
      communicativeOutcome: "Communicatieve uitkomst",
      turnsCount: "beurten gewisseld",
      validatedEvidence: "Geverifieerd tekstbewijs",
      noPhrasesValidated:
        "Geen specifieke doelzinnen gevalideerd in deze sessie.",
      unassisted: "Spontane herinnering zonder hulp",
      assisted: "Ondersteunde herinnering (Hint / Briefing / Oefening)",
      rehearsal: "Herhaling",
      quoteLabel: "Geverifieerd citaat uit jouw spraak:",
      transcriptTitle: "Transcriptie van het gesprek",
      downloadReceipt: "Download tekstbewijs (.txt)",
      downloadSuccess: "Bewijs gedownload!",
      continueNextMission: "Door naar de volgende missie",
    },
    progress: {
      heading: "Onderbouwd Bewijs",
      subheading:
        "Geen vage scores. Voortgang wordt alleen getoond wanneer ondersteund door citaten uit wat je werkelijk hebt gezegd.",
      tabPhrases: "Zinnen & Geheugen",
      tabSkills: "Communicatieve vaardigheden",
      tabPhrasesShort: "Zinnen",
      tabSkillsShort: "Vaardigheden",
      tabHistoryShort: "Bewijzen",
      tabHistory: "Sessiebewijzen",
      readyToPractise: "Klaar om te oefenen",
      steadyTitle: "Stabiel (aangetoond in 2+ onafhankelijke sessies)",
      growingTitle: "Groeiend (zelfstandige herinnering aangetoond)",
      supportedTitle: "Ondersteund (geoefend met hints of preview)",
      newTitle: "Nieuw (geïntroduceerd, wacht op oefening)",
      reviewDue: "Herhaling nodig",
      nextReviewIn: "Volgende herhaling over {days} dagen",
      spokenCount: "{count}x gesproken",
      typedCount: "{count}x getypt",
      resetPhrase: "Herinneringsstatus resetten",
      communicativeSkillsTitle: "Communicatieve vaardigheden",
      samplePatterns: "Voorbeeldpatronen:",
      observedAcross: "Geobserveerd in {count} verbonden scènes",
      sessionReceiptsTitle: "Sessiebewijzen",
      coldAttempt: "Koude poging",
      assistedAttempt: "Ondersteunde poging",
      viewReceipt: "Bekijk bewijs",
      noReceiptsYet:
        "Nog geen sessiebewijzen opgeslagen. Voltooi je eerste missie om je register op te bouwen.",
      disputeEvidence: "Citaat betwisten",
      hideEvidence: "Verbergen in register",
    },
    drill: {
      title: "Herinneringsoefening",
      subtitle:
        "Test je spontane herinnering voor zinnen die vandaag herhaald moeten worden.",
      counter: "Zin {current} van {total}",
      howDoYouSay: "Hoe zeg je in het {language}:",
      revealButton: "Toon zin & controleer",
      rememberedUnassisted: "Ik wist het zonder hulp",
      neededHint: "Ik had een hint nodig / vergeten",
      completeTitle: "Oefening voltooid!",
      completeDesc: "De herhalingsintervallen zijn bijgewerkt in je register.",
      closeButton: "Oefening sluiten",
    },
    settings: {
      title: "Instellingen",
      subtitle: "Voorkeuren & Gegevenssoevereiniteit",
      sectionLang: "Taal & Leercontext",
      targetLangLabel: "Doeltaal die je leert",
      uiLangLabel: "App- en uitlegtaal (i18n)",
      comfortLabel: "Comfortniveau",
      comfortBeginner: "Beginner (A1 - Eerste stappen)",
      comfortElementary: "Elementair (A2 - Eenvoudige gesprekken)",
      comfortIntermediate: "Gevorderd (B1 - Zelfstandig)",
      comfortNotSure: "Niet zeker / Verkennen",
      goalLabel: "Primair leerdoel",
      goalTravel: "Reizen & Toerisme",
      goalRelocation: "Verhuizing & Dagelijks leven",
      goalWork: "Werk & Zakelijk",
      goalSocial: "Sociaal & Vrienden maken",
      goalExplore: "Nieuwsgierigheid & Cultuur",
      modeLabel: "Standaard oefenmodus",
      sectionVoice: "Stem & Spreektempo",
      speechSpeedLabel: "Spreeksnelheid van personage",
      speedSlower: "0.8x (Rustig & geduldig voor lerenden)",
      speedNatural: "1.0x (Natuurlijk spreektempo)",
      speedBrisk: "1.2x (Vlot moedertaaltempo)",
      autoPlayLabel: "Stem van personage automatisch afspelen",
      sectionPrivacy: "Privacy & AI-verwerking",
      privacyDisclosure:
        "Je spraakaudio wordt verwerkt om natuurlijke dialogen met personages mogelijk te maken. Transcripties en observaties worden lokaal op je apparaat opgeslagen in je privé-register.",
      liveVoiceLabel: "Live spraakverwerking",
      liveVoiceDesc:
        "Verwerkt spraak om audioantwoorden van personages te genereren.",
      savedAnalysisLabel: "Bewijs- en sessieanalyse",
      savedAnalysisDesc:
        "Haalt citaten uit transcripties om je gespreide herhalingsvoortgang bij te houden.",
      sectionArchive: "Lokaal Archief & Soevereiniteit",
      exportArchiveTitle: "Exporteer archief (.json)",
      exportArchiveDesc:
        "Download je complete register: sessies, citaten en herhalingsintervallen.",
      exportArchiveButton: "Download archief",
      restoreArchiveTitle: "Herstel archief (.json)",
      restoreArchiveDesc:
        "Importeer een eerder opgeslagen back-up in je lokale opslag.",
      restoreArchiveButton: "Uploaden & Herstellen",
      eraseTitle: "Alle leergegevens wissen",
      eraseDesc:
        "Wist definitief alle gespreksgeschiedenis en zet zin-statussen terug naar nieuw.",
      eraseConfirm: "Bevestig alles wissen",
      eraseButton: "Wis alle lokale gegevens",
      saveButton: "Voorkeuren opslaan",
    },
  },
};
