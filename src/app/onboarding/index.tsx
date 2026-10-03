import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useArchive } from '../../features/archive/ArchiveProvider';
import { CONSENT_VERSION } from '../../features/archive/schema';
import { getTranslations } from '../../features/i18n';
import {
  LanguageCode,
  StartingPointSelfReport,
  UiLanguage,
  UserPreferences,
} from '../../types';
import { Button, Card, ChipRow, SectionLabel } from '../../components/ui';
import {
  buildStartingPointProfile,
  DEFAULT_STARTING_POINT_ANSWERS,
  legacyComfortLevelForEntryMode,
} from '../../features/program/startingPoint';
import {
  defaultLearningLocale,
  resolveProgramCandidate,
} from '../../features/program/goalResolver';

const TARGET_LANGUAGES: Array<{ id: LanguageCode; label: string }> = [
  { id: 'es', label: '🇪🇸 Spanish' },
  { id: 'fr', label: '🇫🇷 French' },
  { id: 'de', label: '🇩🇪 German' },
  { id: 'it', label: '🇮🇹 Italian' },
  { id: 'ja', label: '🇯🇵 Japanese' },
  { id: 'nl', label: '🇧🇪 Dutch (Belgium)' },
];

const UI_LANGUAGES: Array<{ id: UiLanguage; label: string }> = [
  { id: 'en', label: '🇬🇧 English' },
  { id: 'fr', label: '🇫🇷 Français' },
  { id: 'es', label: '🇪🇸 Español' },
  { id: 'nl', label: '🇧🇪 Nederlands' },
];

const JOURNEY_COPY: Record<
  UiLanguage,
  {
    intro: string;
    startingPoint: string;
    completeBeginner: string;
    notSureShortcut: string;
    studied: string;
    studiedNone: string;
    studiedLittle: string;
    studiedYes: string;
    notSure: string;
    understands: string;
    no: string;
    sometimes: string;
    yes: string;
    canAnswer: string;
    notYet: string;
    withHelp: string;
    entryObserve: string;
    entryGuided: string;
    entryWarmup: string;
    dailyLife: string;
    study: string;
    talkWithPeople: string;
    noProgramTitle: string;
    noProgramBody: string;
    start: string;
  }
> = {
  en: {
    intro: 'Choose what you want to learn, why you need it, and where you want to start.',
    startingPoint: 'Starting point',
    completeBeginner: "I'm a complete beginner",
    notSureShortcut: "I'm not sure",
    studied: 'Have you studied this language before?',
    studiedNone: 'Never',
    studiedLittle: 'A little',
    studiedYes: 'Yes',
    notSure: 'Not sure',
    understands: 'Can you understand simple everyday phrases?',
    no: 'No',
    sometimes: 'Sometimes',
    yes: 'Yes',
    canAnswer: 'Could you answer a basic question in this language?',
    notYet: 'Not yet',
    withHelp: 'With help',
    entryObserve: 'We’ll start by showing a short model scene before you speak.',
    entryGuided: 'We’ll start with visible support, then reduce it as you practise.',
    entryWarmup: 'We’ll start with a short, tolerant warm-up to find the right place in the program.',
    dailyLife: 'Daily life',
    study: 'Study',
    talkWithPeople: 'Talk with people',
    noProgramTitle: 'No reviewed path for that goal yet',
    noProgramBody: 'We will not generate an unreviewed course. Choose Daily life or Travel to preview the reviewed paths currently available.',
    start: 'Show my learning path',
  },
  fr: {
    intro: 'Choisissez ce que vous voulez apprendre, pourquoi vous en avez besoin et par où commencer.',
    startingPoint: 'Point de départ',
    completeBeginner: 'Je débute complètement',
    notSureShortcut: 'Je ne suis pas sûr',
    studied: 'Avez-vous déjà étudié cette langue ?',
    studiedNone: 'Jamais',
    studiedLittle: 'Un peu',
    studiedYes: 'Oui',
    notSure: 'Je ne sais pas',
    understands: 'Comprenez-vous des phrases simples de la vie quotidienne ?',
    no: 'Non',
    sometimes: 'Parfois',
    yes: 'Oui',
    canAnswer: 'Pourriez-vous répondre à une question simple dans cette langue ?',
    notYet: 'Pas encore',
    withHelp: 'Avec de l’aide',
    entryObserve: 'Nous commencerons par une courte scène modèle avant de vous faire parler.',
    entryGuided: 'Nous commencerons avec une aide visible, puis nous la réduirons progressivement.',
    entryWarmup: 'Nous commencerons par un court échauffement tolérant pour trouver le bon point d’entrée.',
    dailyLife: 'Vie quotidienne',
    study: 'Études',
    talkWithPeople: 'Parler avec des gens',
    noProgramTitle: 'Pas encore de parcours examiné pour cet objectif',
    noProgramBody: 'Nous ne générons pas de cours non examiné. Choisissez Vie quotidienne ou Voyage pour voir les parcours actuellement disponibles.',
    start: 'Afficher mon parcours',
  },
  es: {
    intro: 'Elige qué quieres aprender, para qué lo necesitas y desde dónde quieres empezar.',
    startingPoint: 'Punto de partida',
    completeBeginner: 'Soy principiante absoluto',
    notSureShortcut: 'No estoy seguro',
    studied: '¿Has estudiado este idioma antes?',
    studiedNone: 'Nunca',
    studiedLittle: 'Un poco',
    studiedYes: 'Sí',
    notSure: 'No estoy seguro',
    understands: '¿Entiendes frases sencillas de la vida cotidiana?',
    no: 'No',
    sometimes: 'A veces',
    yes: 'Sí',
    canAnswer: '¿Podrías responder una pregunta básica en este idioma?',
    notYet: 'Todavía no',
    withHelp: 'Con ayuda',
    entryObserve: 'Empezaremos mostrando una escena modelo breve antes de que hables.',
    entryGuided: 'Empezaremos con ayuda visible y la reduciremos a medida que practiques.',
    entryWarmup: 'Empezaremos con un calentamiento breve y tolerante para encontrar tu punto de entrada.',
    dailyLife: 'Vida cotidiana',
    study: 'Estudios',
    talkWithPeople: 'Hablar con gente',
    noProgramTitle: 'Todavía no hay una ruta revisada para ese objetivo',
    noProgramBody: 'No generaremos un curso sin revisar. Elige Vida cotidiana o Viajes para ver las rutas revisadas disponibles.',
    start: 'Ver mi recorrido',
  },
  nl: {
    intro: 'Kies wat je wilt leren, waarom je het nodig hebt en waar je wilt beginnen.',
    startingPoint: 'Startpunt',
    completeBeginner: 'Ik ben een absolute beginner',
    notSureShortcut: 'Ik weet het niet zeker',
    studied: 'Heb je deze taal al eerder geleerd?',
    studiedNone: 'Nog nooit',
    studiedLittle: 'Een beetje',
    studiedYes: 'Ja',
    notSure: 'Ik weet het niet',
    understands: 'Begrijp je eenvoudige zinnen uit het dagelijks leven?',
    no: 'Nee',
    sometimes: 'Soms',
    yes: 'Ja',
    canAnswer: 'Kun je een eenvoudige vraag in deze taal beantwoorden?',
    notYet: 'Nog niet',
    withHelp: 'Met hulp',
    entryObserve: 'We beginnen met een korte voorbeeldscène voordat je zelf spreekt.',
    entryGuided: 'We beginnen met zichtbare hulp en bouwen die daarna geleidelijk af.',
    entryWarmup: 'We beginnen met een korte, tolerante opwarming om het juiste startpunt te vinden.',
    dailyLife: 'Dagelijks leven',
    study: 'Studie',
    talkWithPeople: 'Met mensen praten',
    noProgramTitle: 'Voor dit doel is er nog geen beoordeeld leerpad',
    noProgramBody: 'We maken geen niet-beoordeelde cursus. Kies Dagelijks leven of Reizen om de beschikbare beoordeelde leerpaden te bekijken.',
    start: 'Toon mijn leerpad',
  },
};

function startingAnswersFromPreferences(
  preferences: UserPreferences
): StartingPointSelfReport {
  if (preferences.startingPoint?.answers) return preferences.startingPoint.answers;

  if (preferences.comfortLevel === 'beginner') {
    return {
      studiedBefore: 'none',
      understandsEveryday: 'no',
      canAnswerBasic: 'no',
    };
  }

  if (preferences.comfortLevel === 'elementary') {
    return {
      studiedBefore: 'a_little',
      understandsEveryday: 'sometimes',
      canAnswerBasic: 'with_help',
    };
  }

  if (preferences.comfortLevel === 'intermediate') {
    return {
      studiedBefore: 'yes',
      understandsEveryday: 'yes',
      canAnswerBasic: 'yes',
    };
  }

  return DEFAULT_STARTING_POINT_ANSWERS;
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { preferences, savePreferences, consent } = useArchive();

  const [learningLanguage, setLearningLanguage] = useState<LanguageCode>(
    preferences.learningLanguage
  );
  const [learningLocale, setLearningLocale] = useState(
    preferences.learningLocale ?? defaultLearningLocale(preferences.learningLanguage)
  );
  const [explanationLanguage, setExplanationLanguage] = useState<UiLanguage>(
    preferences.explanationLanguage
  );
  const [primaryGoal, setPrimaryGoal] = useState<UserPreferences['primaryGoal']>(
    preferences.primaryGoal === 'relocation'
      ? 'daily_life'
      : preferences.primaryGoal === 'explore'
        ? 'social'
        : preferences.primaryGoal
  );
  const [startingAnswers, setStartingAnswers] = useState<StartingPointSelfReport>(
    startingAnswersFromPreferences(preferences)
  );
  const [voiceConsent, setVoiceConsent] = useState(consent.voice?.granted ?? false);
  const [analysisConsent, setAnalysisConsent] = useState(
    consent.savedAnalysis?.granted ?? false
  );
  const [goalUnavailable, setGoalUnavailable] = useState(false);

  const t = getTranslations(explanationLanguage);
  const copy = JOURNEY_COPY[explanationLanguage];
  const startingProfile = useMemo(
    () => buildStartingPointProfile(startingAnswers),
    [startingAnswers]
  );

  const entryMessage =
    startingProfile.entryMode === 'observe_first'
      ? copy.entryObserve
      : startingProfile.entryMode === 'guided_first'
        ? copy.entryGuided
        : copy.entryWarmup;

  const chooseLearningLanguage = (id: LanguageCode) => {
    setLearningLanguage(id);
    setLearningLocale(defaultLearningLocale(id));
    setGoalUnavailable(false);
  };

  const handleContinue = async () => {
    const profile = buildStartingPointProfile(startingAnswers);
    const nextPreferences: UserPreferences = {
      ...preferences,
      learningLanguage,
      learningLocale,
      explanationLanguage,
      comfortLevel: legacyComfortLevelForEntryMode(profile.entryMode),
      primaryGoal,
      startingPoint: profile,
      voiceProcessingConsent: voiceConsent,
      savedAnalysisConsent: analysisConsent,
    };

    await savePreferences(nextPreferences);
    await consent.recordConsent('voice', voiceConsent);
    await consent.recordConsent('saved_analysis', analysisConsent);

    const resolution = resolveProgramCandidate({
      learningLanguage,
      learningLocale,
      primaryGoal,
    });

    if (resolution.program) {
      setGoalUnavailable(false);
      router.replace({
        pathname: '/program/[programId]',
        params: {
          programId: resolution.program.id,
          recommended: '1',
          entryMode: profile.entryMode,
          match: resolution.match,
        },
      });
      return;
    }

    setGoalUnavailable(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'bottom']}>
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          width: '100%',
          maxWidth: 720,
          alignSelf: 'center',
          padding: 20,
          paddingBottom: 40,
          gap: 22,
        }}
      >
        <View className="gap-1.5">
          <Text className="text-2xl font-semibold tracking-tight text-ink">
            {t.nav.brandTitle}
          </Text>
          <Text className="text-sm leading-relaxed text-body">
            {copy.intro}
          </Text>
        </View>

        <View className="gap-2">
          <SectionLabel>{t.settings.targetLangLabel}</SectionLabel>
          <ChipRow
            value={learningLanguage}
            onChange={id => chooseLearningLanguage(id as LanguageCode)}
            options={TARGET_LANGUAGES}
          />
        </View>

        <View className="gap-2">
          <SectionLabel>{t.settings.goalLabel}</SectionLabel>
          <ChipRow
            value={primaryGoal}
            onChange={id => {
              setPrimaryGoal(id as UserPreferences['primaryGoal']);
              setGoalUnavailable(false);
            }}
            options={[
              { id: 'daily_life', label: copy.dailyLife },
              { id: 'travel', label: t.settings.goalTravel },
              { id: 'work', label: t.settings.goalWork },
              { id: 'study', label: copy.study },
              { id: 'social', label: copy.talkWithPeople },
            ]}
          />
        </View>

        <Card className="gap-4 bg-surface-sunken">
          <SectionLabel>{copy.startingPoint}</SectionLabel>

          <ChipRow
            value={
              startingAnswers.studiedBefore === 'none' &&
              startingAnswers.understandsEveryday === 'no' &&
              startingAnswers.canAnswerBasic === 'no'
                ? 'complete_beginner'
                : startingAnswers.studiedBefore === 'not_sure' &&
                    startingAnswers.understandsEveryday === 'not_sure' &&
                    startingAnswers.canAnswerBasic === 'not_sure'
                  ? 'not_sure'
                  : ''
            }
            onChange={id => {
              if (id === 'complete_beginner') {
                setStartingAnswers({
                  studiedBefore: 'none',
                  understandsEveryday: 'no',
                  canAnswerBasic: 'no',
                });
              } else if (id === 'not_sure') {
                setStartingAnswers(DEFAULT_STARTING_POINT_ANSWERS);
              }
            }}
            options={[
              { id: 'complete_beginner', label: copy.completeBeginner },
              { id: 'not_sure', label: copy.notSureShortcut },
            ]}
          />

          <View className="gap-2">
            <Text className="text-sm font-semibold text-ink">{copy.studied}</Text>
            <ChipRow
              value={startingAnswers.studiedBefore}
              onChange={id =>
                setStartingAnswers(current => ({
                  ...current,
                  studiedBefore: id as StartingPointSelfReport['studiedBefore'],
                }))
              }
              options={[
                { id: 'none', label: copy.studiedNone },
                { id: 'a_little', label: copy.studiedLittle },
                { id: 'yes', label: copy.studiedYes },
                { id: 'not_sure', label: copy.notSure },
              ]}
            />
          </View>

          <View className="gap-2">
            <Text className="text-sm font-semibold text-ink">{copy.understands}</Text>
            <ChipRow
              value={startingAnswers.understandsEveryday}
              onChange={id =>
                setStartingAnswers(current => ({
                  ...current,
                  understandsEveryday:
                    id as StartingPointSelfReport['understandsEveryday'],
                }))
              }
              options={[
                { id: 'no', label: copy.no },
                { id: 'sometimes', label: copy.sometimes },
                { id: 'yes', label: copy.yes },
                { id: 'not_sure', label: copy.notSure },
              ]}
            />
          </View>

          <View className="gap-2">
            <Text className="text-sm font-semibold text-ink">{copy.canAnswer}</Text>
            <ChipRow
              value={startingAnswers.canAnswerBasic}
              onChange={id =>
                setStartingAnswers(current => ({
                  ...current,
                  canAnswerBasic: id as StartingPointSelfReport['canAnswerBasic'],
                }))
              }
              options={[
                { id: 'no', label: copy.notYet },
                { id: 'with_help', label: copy.withHelp },
                { id: 'yes', label: copy.yes },
                { id: 'not_sure', label: copy.notSure },
              ]}
            />
          </View>

          <Text className="rounded-2xl bg-surface px-4 py-3 text-sm leading-5 text-body">
            {entryMessage}
          </Text>
        </Card>

        <View className="gap-2">
          <SectionLabel>{t.settings.uiLangLabel}</SectionLabel>
          <ChipRow
            value={explanationLanguage}
            onChange={id => setExplanationLanguage(id as UiLanguage)}
            options={UI_LANGUAGES}
          />
        </View>

        <Card className="gap-3 bg-surface-sunken">
          <SectionLabel>Before you start</SectionLabel>
          <Text className="text-xs leading-relaxed text-body">
            When you speak, your voice is processed by an AI provider to produce the
            character&apos;s reply. Your conversation is stored on this device. Only the
            turns needed for review are sent for assessment, and nothing is used to train a
            model. You can change or withdraw this at any time in Settings.
          </Text>

          <ConsentRow
            label="Live voice processing"
            description="Required for speaking to a character. Without it you can still type your turns."
            value={voiceConsent}
            onChange={setVoiceConsent}
          />

          <ConsentRow
            label="Conversation analysis"
            description="Lets the app check your transcript for phrases you produced, which is how progress is measured. Without it, sessions are still saved but no evidence is recorded."
            value={analysisConsent}
            onChange={setAnalysisConsent}
          />

          <Text className="text-xs text-muted">Consent version {CONSENT_VERSION}</Text>
        </Card>

        {goalUnavailable ? (
          <Card className="gap-2 bg-card-warm">
            <Text className="text-sm font-semibold text-ink">
              {copy.noProgramTitle}
            </Text>
            <Text className="text-sm leading-5 text-body">
              {copy.noProgramBody}
            </Text>
          </Card>
        ) : null}

        <Button
          label={copy.start}
          onPress={handleContinue}
          size="lg"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

interface ConsentRowProps {
  label: string;
  description: string;
  value: boolean;
  onChange: (next: boolean) => void;
}

const ConsentRow: React.FC<ConsentRowProps> = ({ label, description, value, onChange }) => {
  const [open, setOpen] = useState(false);

  return (
    <View className="gap-2 rounded-xl border border-border-subtle bg-surface p-3">
      <Text
        className="text-xs font-semibold text-ink"
        onPress={() => setOpen(prev => !prev)}
        accessibilityRole="button"
      >
        {label} {open ? '▾' : '▸'}
      </Text>
      {open ? <Text className="text-xs leading-relaxed text-body">{description}</Text> : null}
      <Button
        label={value ? 'Agreed' : 'Not agreed'}
        onPress={() => onChange(!value)}
        variant={value ? 'primary' : 'secondary'}
        size="sm"
        className="self-start"
      />
    </View>
  );
};
