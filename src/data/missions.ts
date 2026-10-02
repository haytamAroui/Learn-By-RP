import { MissionDefinition } from '../types';

export const MISSION_CATALOG: MissionDefinition[] = [
  {
    id: 'mission-es-cafe-sol',
    version: 1,
    language: 'es',
    sceneId: 'scene.es.cafe.breakfast',
    scenarioFamilyId: 'counter-ordering',
    levelRange: 'A1',
    title: 'Café Sol: Breakfast Before the Train',
    category: 'cafes',
    neighborhood: 'El Barrio · Calle del Sol',
    setting: 'A bustling neighborhood café with morning commuters. An old espresso machine hisses, and fresh pastries sit in a glass display.',
    aiRole: 'Mateo, the barista at Café Sol. Friendly, energetic, speaking with authentic natural pacing.',
    character: {
      name: 'Mateo',
      role: 'Barista',
      voiceStyle: 'Warm, colloquial Madrid-neutral, patient with learners',
      personality: 'Upbeat, accommodating, asks concise follow-ups',
      knowledgeBoundary: [
        'Knows the café menu prices and stock',
        'Knows oat milk is out today, but almond milk (leche de almendra) and whole milk (leche entera) are available',
        'Knows the train station is a 7-minute walk down Calle del Sol',
        'Does not know the learner’s personal life or future schedule beyond what is mentioned'
      ]
    },
    learnerGoal: 'Order a coffee drink and confirm it is for takeaway ("para llevar")',
    stretchGoal: 'Ask if they have oat milk or inquire about a dairy-free milk alternative',
    targetIntents: ['order_beverage', 'request_substitution', 'specify_takeaway'],
    primarySkillIds: ['skill-request-substitution', 'skill-inquire-specifications'],
    secondarySkillIds: ['skill-propose-alternative', 'skill-communicative-repair'],
    usefulPhrases: [
      {
        id: 'phrase.es.cafe_con_leche',
        form: 'Un café con leche, por favor.',
        meaning: 'A coffee with milk, please.',
        usageNote: 'Standard polite breakfast coffee order in Spain and Latin America.',
        difficulty: 'beginner'
      },
      {
        id: 'phrase.es.oat_milk_request',
        form: '¿Tiene leche de avena?',
        meaning: 'Do you have oat milk?',
        usageNote: 'Polite question to check for dairy-free plant milk.',
        difficulty: 'elementary'
      },
      {
        id: 'phrase.es.para_llevar',
        form: 'Para llevar, por favor.',
        meaning: 'To take away / to go, please.',
        usageNote: 'Essential phrase when you do not want to drink at the counter or table.',
        difficulty: 'beginner'
      },
      {
        id: 'phrase.es.cuanto_es',
        form: '¿Cuánto es?',
        meaning: 'How much is it?',
        usageNote: 'Natural way to ask for the total bill in a shop or café.',
        difficulty: 'beginner'
      }
    ],
    supportPolicy: {
      hintLadderAvailable: true,
      correctionStyle: 'gentle',
      allowSlowing: true
    },
    completionSignals: [
      'Drink ordered and confirmed',
      'Takeaway or for-here decided',
      'Price clarified'
    ],
    estimatedMinutes: 3,
    tags: ['ordering', 'café', 'breakfast', 'substitution'],
    nextMissionId: 'mission-es-parcel-counter',
    transferPattern: 'Request a substitution / change an option',
    transferReason: 'Reuses the substitution pattern you practice here when you reschedule at the parcel counter.'
  },
  {
    id: 'mission-es-parcel-counter',
    version: 1,
    language: 'es',
    scenarioFamilyId: 'parcel-service',
    levelRange: 'A2',
    title: 'Parcel Drop: The Rescheduled Delivery',
    category: 'services',
    neighborhood: 'El Barrio · Calle Mayor Postal Point',
    setting: 'A quiet neighborhood parcel shop lined with yellow sorting bins and bubble mailers. A clerk inspects a delivery slip.',
    aiRole: 'Carmen, the postal point manager. Efficient, polite, and helpful with neighborhood deliveries.',
    character: {
      name: 'Carmen',
      role: 'Parcel Clerk',
      voiceStyle: 'Professional, articulate, warm',
      personality: 'Orderly, asks for reference numbers or name, offers rescheduling',
      knowledgeBoundary: [
        'Knows package tracking: package #409 has arrived but requires an ID check or reschedule',
        'Knows morning pickup hours (9:00 - 14:00) and afternoon pickup (17:00 - 20:00)',
        'Does not accept payments for customs unless asked'
      ]
    },
    learnerGoal: 'Give your tracking reference and ask to collect the package or change the pickup day',
    stretchGoal: 'Explain you cannot come this evening and propose collecting it tomorrow morning',
    targetIntents: ['provide_reference', 'reschedule_time', 'confirm_hours'],
    primarySkillIds: ['skill-inquire-specifications', 'skill-propose-alternative'],
    secondarySkillIds: ['skill-communicative-repair'],
    usefulPhrases: [
      {
        id: 'phrase.es.vengo_a_recoger',
        form: 'Vengo a recoger un paquete.',
        meaning: 'I have come to pick up a parcel.',
        usageNote: 'Standard entrance phrase at parcel points and post offices.',
        difficulty: 'elementary'
      },
      {
        id: 'phrase.es.cambiar_la_hora',
        form: '¿Es posible cambiar la hora?',
        meaning: 'Is it possible to change the time?',
        usageNote: 'Communicative pattern for requesting a reschedule.',
        difficulty: 'intermediate'
      },
      {
        id: 'phrase.es.manana_por_la_manana',
        form: 'Prefiero pasar mañana por la mañana.',
        meaning: 'I prefer to come by tomorrow morning.',
        usageNote: 'Specifies preferred alternative slot.',
        difficulty: 'elementary'
      }
    ],
    supportPolicy: {
      hintLadderAvailable: true,
      correctionStyle: 'gentle',
      allowSlowing: true
    },
    completionSignals: [
      'Parcel identified by name or number',
      'Alternative pickup agreed',
      'Clerk confirms schedule'
    ],
    estimatedMinutes: 4,
    tags: ['services', 'errands', 'rescheduling', 'logistics'],
    nextMissionId: 'mission-es-neighbors-door',
    transferPattern: 'Propose an alternative slot or meeting place',
    transferReason: 'Builds upon the rescheduling skill to propose a meeting place with your neighbor Sofia.'
  },
  {
    id: 'mission-es-neighbors-door',
    version: 1,
    language: 'es',
    scenarioFamilyId: 'neighbour-coordination',
    levelRange: 'A2',
    title: "Neighbor's Door: The Spare Key & The Terrace",
    category: 'social',
    neighborhood: 'El Barrio · Calle del Sol 14, 3rd Floor',
    setting: 'The tiled hallway of an old Madrid residential building. Sofia is watering potted plants outside her apartment door.',
    aiRole: 'Sofia, your next-door neighbor. Friendly and observant.',
    character: {
      name: 'Sofia',
      role: 'Neighbor',
      voiceStyle: 'Casual, conversational, warm',
      personality: 'Chatty, helpful, occasionally pauses to remember things',
      knowledgeBoundary: [
        'Knows the building superintendent left a spare terrace key with her yesterday',
        'Is leaving for work in 15 minutes',
        'Remembers seeing Mateo from the café walking his dog earlier'
      ]
    },
    learnerGoal: 'Ask Sofia if she has the terrace key and arrange a quick handover',
    stretchGoal: 'Propose meeting downstairs at Café Sol if she is in a rush right now',
    targetIntents: ['ask_neighbor_help', 'propose_alternative_meeting', 'express_thanks'],
    primarySkillIds: ['skill-propose-alternative', 'skill-communicative-repair'],
    secondarySkillIds: ['skill-inquire-specifications'],
    usefulPhrases: [
      {
        id: 'phrase.es.tienes_un_momento',
        form: 'Hola Sofía, ¿tienes un momento?',
        meaning: 'Hi Sofia, do you have a moment?',
        usageNote: 'Friendly, natural neighbor greeting before asking a favor.',
        difficulty: 'beginner'
      },
      {
        id: 'phrase.es.proponer_lugar',
        form: '¿Podemos vernos abajo en el café?',
        meaning: 'Can we meet downstairs at the café?',
        usageNote: 'Transfers the alternative proposal pattern to a social scenario.',
        difficulty: 'intermediate'
      },
      {
        id: 'phrase.es.muchas_gracias',
        form: 'Muchas gracias por tu ayuda.',
        meaning: 'Thank you very much for your help.',
        usageNote: 'Warm social gratitude.',
        difficulty: 'beginner'
      }
    ],
    supportPolicy: {
      hintLadderAvailable: true,
      correctionStyle: 'gentle',
      allowSlowing: true
    },
    completionSignals: [
      'Key inquiry made',
      'Meeting or handover coordinated',
      'Parting farewell'
    ],
    estimatedMinutes: 4,
    tags: ['neighbor', 'social', 'favors', 'coordination'],
    transferPattern: 'Propose an alternative arrangement',
    transferReason: 'Completes the neighborhood loop connecting Café Sol and your apartment.'
  },
  {
    id: 'mission-es-metro-station',
    version: 1,
    language: 'es',
    scenarioFamilyId: 'public-transit',
    levelRange: 'A2',
    title: 'Metro Sol: Ticket Machine & Platform Guidance',
    category: 'transit',
    neighborhood: 'El Barrio · Estación de Metro Sol',
    setting: 'The tiled subterranean concourse of Metro Sol. Commuters tap contactless cards against turnstiles, and automated ticket machines glow under fluorescent lamps.',
    aiRole: 'Javier, the metro station attendant in navy uniform.',
    character: {
      name: 'Javier',
      role: 'Metro Attendant',
      voiceStyle: 'Fast, clear, practical Madrid Spanish',
      personality: 'Helpful with transit questions, straightforward',
      knowledgeBoundary: [
        'Knows ticket types: Tarjeta Multi (€2.50) + 10-journey pack (€12.20)',
        'Knows Line 1 connects directly to Atocha train station in 4 stops (Platform 1)',
        'Knows machines accept credit cards, contactless, or cash'
      ]
    },
    learnerGoal: 'Ask how to buy a 10-trip card and ask which platform goes toward Atocha train station',
    stretchGoal: 'Explain the card machine did not return your change or receipt',
    targetIntents: ['purchase_transit_ticket', 'ask_platform', 'clarify_directions'],
    primarySkillIds: ['skill-wayfinding-transit', 'skill-inquire-specifications'],
    secondarySkillIds: ['skill-communicative-repair'],
    usefulPhrases: [
      {
        id: 'phrase.es.tarjeta_diez_viajes',
        form: 'Quisiera comprar una tarjeta de diez viajes.',
        meaning: 'I would like to buy a ten-journey card.',
        usageNote: 'Standard way to purchase multi-ride metro transport in Spain.',
        difficulty: 'elementary'
      },
      {
        id: 'phrase.es.por_que_anden',
        form: '¿Por qué andén sale el metro hacia Atocha?',
        meaning: 'Which platform does the train to Atocha depart from?',
        usageNote: 'Key wayfinding phrase across train and subway networks.',
        difficulty: 'intermediate'
      },
      {
        id: 'phrase.es.la_maquina_no_funciona',
        form: 'La máquina no me da el cambio.',
        meaning: 'The machine is not giving me my change.',
        usageNote: 'Useful communicative repair for automated kiosks.',
        difficulty: 'intermediate'
      }
    ],
    supportPolicy: {
      hintLadderAvailable: true,
      correctionStyle: 'gentle',
      allowSlowing: true
    },
    completionSignals: ['Ticket purchased', 'Platform identified', 'Directions confirmed'],
    estimatedMinutes: 4,
    tags: ['transit', 'metro', 'directions', 'tickets'],
    nextMissionId: 'mission-es-farmacia-sol',
    transferPattern: 'Ask for specific options & instructions',
    transferReason: 'Applies your question-asking pattern to describe symptoms and request the licensed pharmacist at the pharmacy.'
  },
  {
    id: 'mission-es-farmacia-sol',
    version: 2,
    language: 'es',
    sceneId: 'scene.es.pharmacy.symptom',
    scenarioFamilyId: 'pharmacy-consultation',
    levelRange: 'A2',
    title: 'Farmacia Sol: Describe Symptoms & Ask for the Pharmacist',
    category: 'problems',
    neighborhood: 'El Barrio · Farmacia Calle del Sol 22',
    setting: 'A bright, quiet neighborhood pharmacy with green cross signage and glass shelves of wellness products. An herbal scent fills the air.',
    aiRole: 'Elena, the pharmacy counter staff member who routes clinical questions to the licensed pharmacist.',
    character: {
      name: 'Elena',
      role: 'Pharmacy Counter Staff',
      voiceStyle: 'Calm, empathetic, precise',
      personality: 'Calm service professional who helps visitors explain needs and reach the licensed pharmacist without giving medical advice',
      knowledgeBoundary: [
        'Can direct the learner to the licensed pharmacist and the consultation counter',
        'Can point to official product labels and patient leaflets without interpreting them as medical advice',
        'Must not diagnose, recommend or select medicine, or give dosage, treatment, contraindication, efficacy, or side-effect advice'
      ]
    },
    learnerGoal: 'Describe your symptoms (sneezing, itchy eyes) and ask to speak with the licensed pharmacist',
    stretchGoal: 'Ask where the consultation counter is and ask for help locating the official label or patient leaflet',
    targetIntents: ['describe_symptoms', 'request_pharmacist', 'ask_label_help'],
    primarySkillIds: ['skill-inquire-specifications', 'skill-communicative-repair'],
    secondarySkillIds: ['skill-request-substitution'],
    usefulPhrases: [
      {
        id: 'phrase.es.tengo_alergia',
        form: 'Tengo alergia y me pican los ojos.',
        meaning: 'I have allergies and my eyes are itchy.',
        usageNote: 'Common everyday health description.',
        difficulty: 'elementary'
      },
      {
        id: 'phrase.es.que_no_de_sueno',
        form: 'Necesito hablar con el farmacéutico sobre estos síntomas.',
        meaning: 'I need to speak with the pharmacist about these symptoms.',
        usageNote: 'Service-language pattern for requesting the appropriate licensed professional.',
        difficulty: 'intermediate'
      },
      {
        id: 'phrase.es.como_se_toma',
        form: '¿Puede ayudarme a encontrar la etiqueta o el prospecto?',
        meaning: 'Can you help me find the label or patient leaflet?',
        usageNote: 'Safe clarification request that keeps medical interpretation with the professional and official product information.',
        difficulty: 'intermediate'
      }
    ],
    supportPolicy: {
      hintLadderAvailable: true,
      correctionStyle: 'gentle',
      allowSlowing: true
    },
    completionSignals: ['Symptoms explained', 'Licensed pharmacist requested', 'Official label or leaflet located'],
    estimatedMinutes: 4,
    tags: ['health', 'pharmacy', 'symptoms', 'services'],
    nextMissionId: 'mission-es-la-terraza',
    transferPattern: 'State needs & ask for authoritative information',
    transferReason: 'Transfers the specific requirement pattern ("que no dé...") to specify terrace requirements at La Terraza.'
  },
  {
    id: 'mission-es-la-terraza',
    version: 1,
    language: 'es',
    scenarioFamilyId: 'social-dining',
    levelRange: 'A2',
    title: 'Restaurante La Terraza: Dinner in the Plaza',
    category: 'cafes',
    neighborhood: 'El Barrio · Plaza Mayor',
    setting: 'A warm evening terrace lined with olive trees and fairy lights overlooking the plaza. Waiters carry trays of tapas and chilled wine.',
    aiRole: 'Andrés, the head waiter greeting patrons at the outdoor podium.',
    character: {
      name: 'Andrés',
      role: 'Head Waiter',
      voiceStyle: 'Courteous, welcoming, classic Spanish hospitality',
      personality: 'Pride in house specials, checks reservation or accommodates walk-ins',
      knowledgeBoundary: [
        'Has an outdoor table available near the fountain',
        'Recommends the croquetas caseras and grilled sea bass',
        'Kitchen accommodates gluten and nut sensitivities'
      ]
    },
    learnerGoal: 'Ask for a table for two on the terrace and ask Andrés what tapas he recommends today',
    stretchGoal: 'Ask if the house special contains gluten or dairy',
    targetIntents: ['request_table', 'ask_recommendation', 'check_allergens'],
    primarySkillIds: ['skill-propose-alternative', 'skill-inquire-specifications'],
    secondarySkillIds: ['skill-request-substitution'],
    usefulPhrases: [
      {
        id: 'phrase.es.mesa_en_terraza',
        form: 'Una mesa para dos en la terraza, por favor.',
        meaning: 'A table for two on the terrace, please.',
        usageNote: 'The quintessential restaurant seating request in Spain.',
        difficulty: 'beginner'
      },
      {
        id: 'phrase.es.que_nos_recomienda',
        form: '¿Qué nos recomienda para cenar hoy?',
        meaning: 'What do you recommend for us for dinner tonight?',
        usageNote: 'Friendly question to discover chef specialties.',
        difficulty: 'elementary'
      },
      {
        id: 'phrase.es.lleva_gluten',
        form: '¿Lleva algún tipo de gluten o lácteos?',
        meaning: 'Does it contain any kind of gluten or dairy?',
        usageNote: 'Dietary safeguard question.',
        difficulty: 'intermediate'
      }
    ],
    supportPolicy: {
      hintLadderAvailable: true,
      correctionStyle: 'gentle',
      allowSlowing: true
    },
    completionSignals: ['Table requested', 'Specialty recommended', 'Seating confirmed'],
    estimatedMinutes: 4,
    tags: ['dining', 'restaurant', 'tapas', 'social'],
    transferPattern: 'Propose and refine social arrangements',
    transferReason: 'Synthesizes ordering, requesting conditions, and social coordination into a complete evening scenario.'
  },
  {
    id: 'mission-fr-boulangerie',
    version: 1,
    language: 'fr',
    scenarioFamilyId: 'counter-ordering',
    levelRange: 'A1',
    title: 'Boulangerie: Croissant & Café Crème',
    category: 'cafes',
    neighborhood: 'Quartier Saint-Michel',
    setting: 'A warm artisan bakery smelling of fresh sourdough and butter croissants. A bell jingles as you step onto the mosaic tile floor.',
    aiRole: 'Laurent, the baker behind the glass display.',
    character: {
      name: 'Laurent',
      role: 'Artisan Baker',
      voiceStyle: 'Parisian French, friendly, polite',
      personality: 'Proud of his baguettes, efficient during morning rush',
      knowledgeBoundary: [
        'Knows the croissants are freshly baked 15 minutes ago',
        'Almond croissants are sold out; pain au chocolat is available',
        'Knows espresso and café crème prices'
      ]
    },
    learnerGoal: 'Order a pastry and a warm drink, and ask if the pastry is fresh',
    stretchGoal: 'Ask for a pain au chocolat when told almond croissants are finished',
    targetIntents: ['order_food', 'ask_freshness', 'pay_counter'],
    primarySkillIds: ['skill-inquire-specifications'],
    secondarySkillIds: ['skill-request-substitution', 'skill-communicative-repair'],
    usefulPhrases: [
      {
        id: 'phrase.fr.croissant_svp',
        form: 'Un croissant et un café crème, s’il vous plaît.',
        meaning: 'A croissant and a coffee with milk, please.',
        usageNote: 'The classic morning bakery order across France.',
        difficulty: 'beginner'
      },
      {
        id: 'phrase.fr.cest_combien',
        form: 'Ça fait combien ?',
        meaning: 'How much does that come to?',
        usageNote: 'Colloquial and universal for asking the total price in shops.',
        difficulty: 'beginner'
      },
      {
        id: 'phrase.fr.alors_un_autre',
        form: 'Alors, je vais prendre un pain au chocolat.',
        meaning: 'In that case, I will take a pain au chocolat.',
        usageNote: 'Polite pivot when your first choice is unavailable.',
        difficulty: 'elementary'
      }
    ],
    supportPolicy: {
      hintLadderAvailable: true,
      correctionStyle: 'gentle',
      allowSlowing: true
    },
    completionSignals: ['Pastry ordered', 'Drink confirmed', 'Total paid'],
    estimatedMinutes: 3,
    tags: ['bakery', 'breakfast', 'food', 'paris'],
    nextMissionId: 'mission-fr-pharmacie',
    transferPattern: 'Request a substitution & confirm options',
    transferReason: 'Reuses your service-request pattern when asking Camille to direct you to the licensed pharmacist.'
  },
  {
    id: 'mission-fr-pharmacie',
    version: 2,
    language: 'fr',
    scenarioFamilyId: 'pharmacy-consultation',
    levelRange: 'A2',
    title: 'Pharmacie Saint-Michel: Décrire ses symptômes & demander le pharmacien',
    category: 'problems',
    neighborhood: 'Quartier Saint-Michel · Rue Saint-André-des-Arts',
    setting: 'A bright, quiet Parisian pharmacy with a glowing green neon cross outside. Glass shelves are filled with remedies and thermal skincare.',
    aiRole: 'Camille, the pharmacy counter staff member who routes clinical questions to the licensed pharmacist.',
    character: {
      name: 'Camille',
      role: 'Pharmacy Counter Staff',
      voiceStyle: 'Articulate, caring, calm Parisian French',
      personality: 'Listens carefully, helps visitors formulate questions, and routes medical decisions to the licensed pharmacist',
      knowledgeBoundary: [
        'Can direct the learner to the licensed pharmacist and consultation counter',
        'Can point to official packaging and patient leaflets without interpreting them as medical advice',
        'Must not diagnose, recommend or select medicine, or give dosage, treatment, contraindication, efficacy, or side-effect advice'
      ]
    },
    learnerGoal: 'Explain that you have a sore throat and ask to speak with the licensed pharmacist',
    stretchGoal: 'Ask where the consultation counter is and ask for help finding the official notice or packaging information',
    targetIntents: ['describe_symptoms', 'request_pharmacist', 'ask_label_help'],
    primarySkillIds: ['skill-inquire-specifications', 'skill-communicative-repair'],
    secondarySkillIds: ['skill-request-substitution'],
    usefulPhrases: [
      {
        id: 'phrase.fr.mal_de_gorge',
        form: 'J’ai très mal à la gorge depuis hier.',
        meaning: 'I have a very sore throat since yesterday.',
        usageNote: 'Standard way to describe throat pain in French.',
        difficulty: 'beginner'
      },
      {
        id: 'phrase.fr.qui_ne_fait_pas_dormir',
        form: 'Je voudrais parler au pharmacien de mes symptômes.',
        meaning: 'I would like to speak with the pharmacist about my symptoms.',
        usageNote: 'Natural service request that hands clinical questions to the licensed professional.',
        difficulty: 'intermediate'
      },
      {
        id: 'phrase.fr.combien_de_fois',
        form: 'Pouvez-vous m’aider à trouver la notice officielle ?',
        meaning: 'Can you help me find the official patient leaflet?',
        usageNote: 'Safe clarification request about where to find authoritative product information.',
        difficulty: 'intermediate'
      }
    ],
    supportPolicy: {
      hintLadderAvailable: true,
      correctionStyle: 'gentle',
      allowSlowing: true
    },
    completionSignals: ['Symptoms stated', 'Licensed pharmacist requested', 'Official notice located'],
    estimatedMinutes: 4,
    tags: ['health', 'pharmacy', 'symptoms', 'remedy'],
    nextMissionId: 'mission-fr-kiosque',
    transferPattern: 'Describe a need & request authoritative help',
    transferReason: 'Applies your clarification questions when inquiring about metro zones and pass validity at the kiosk.'
  },
  {
    id: 'mission-fr-kiosque',
    version: 1,
    language: 'fr',
    scenarioFamilyId: 'public-transit',
    levelRange: 'A2',
    title: 'Kiosque Saint-Michel: Pass Navigo & Direction Métro',
    category: 'transit',
    neighborhood: 'Quartier Saint-Michel · Place Saint-Michel',
    setting: 'A vintage wrought-iron Parisian news kiosk bustling with commuters picking up newspapers and transit tickets.',
    aiRole: 'Pierre, the friendly kiosk keeper who knows all neighborhood routes.',
    character: {
      name: 'Pierre',
      role: 'Kiosk Keeper',
      voiceStyle: 'Casual, fast, welcoming Parisian French',
      personality: 'Direct, knowledgeable about Paris transit, offers quick advice',
      knowledgeBoundary: [
        'Sells Navigo Easy cards (€2) loaded with ticket t+ books (€17.35 for 10)',
        'Knows Metro Line 4 goes directly toward Montparnasse from Platform 1 (direction Bagneux)',
        'Accepts contactless card or cash; prefers small bills'
      ]
    },
    learnerGoal: 'Ask to buy a ten-ticket carnet on Navigo Easy and ask which metro line goes to Montparnasse',
    stretchGoal: 'Ask whether you can pay by contactless card ("par sans contact")',
    targetIntents: ['buy_transit_pass', 'ask_metro_direction', 'payment_inquiry'],
    primarySkillIds: ['skill-wayfinding-transit', 'skill-inquire-specifications'],
    secondarySkillIds: ['skill-communicative-repair'],
    usefulPhrases: [
      {
        id: 'phrase.fr.carnet_tickets',
        form: 'Je voudrais acheter un carnet de dix tickets, s’il vous plaît.',
        meaning: 'I would like to buy a pack of ten tickets, please.',
        usageNote: 'Classic request for metro travel in Paris.',
        difficulty: 'elementary'
      },
      {
        id: 'phrase.fr.quelle_direction',
        form: 'Quelle direction dois-je prendre pour aller à Montparnasse ?',
        meaning: 'Which direction should I take to go to Montparnasse?',
        usageNote: 'Crucial wayfinding pattern on the Paris Metro network.',
        difficulty: 'intermediate'
      },
      {
        id: 'phrase.fr.sans_contact',
        form: 'Est-ce que je peux payer par carte sans contact ?',
        meaning: 'Can I pay by contactless card?',
        usageNote: 'Quick everyday transaction phrase.',
        difficulty: 'beginner'
      }
    ],
    supportPolicy: {
      hintLadderAvailable: true,
      correctionStyle: 'gentle',
      allowSlowing: true
    },
    completionSignals: ['Pass requested', 'Direction confirmed', 'Payment settled'],
    estimatedMinutes: 4,
    tags: ['transit', 'metro', 'tickets', 'directions'],
    nextMissionId: 'mission-fr-bistro',
    transferPattern: 'Wayfinding & condition inquiry',
    transferReason: 'Transfers your condition-specifying pattern to request a terrace table at Bistro Le Marais.'
  },
  {
    id: 'mission-fr-bistro',
    version: 1,
    language: 'fr',
    scenarioFamilyId: 'social-dining',
    levelRange: 'A2',
    title: 'Bistro Le Marais: Dîner en Terrasse',
    category: 'cafes',
    neighborhood: 'Le Marais · Rue des Rosiers',
    setting: 'A warm evening terrace with woven wicker chairs under zinc awnings. Glasses clink as bistro waiters navigate the crowded sidewalk.',
    aiRole: 'Sophie, the welcoming head waitress greeting guests at the terrace entrance.',
    character: {
      name: 'Sophie',
      role: 'Head Waitress',
      voiceStyle: 'Brisk, polished, hospitable Parisian French',
      personality: 'Takes pride in daily specials, accommodates seating preferences',
      knowledgeBoundary: [
        'Has a cozy table for two available on the heated terrace',
        'Recommends the magret de canard and the seasonal tarte tatin',
        'Knows which sauces contain dairy or cream'
      ]
    },
    learnerGoal: 'Ask for a table for two on the terrace and ask what Sophie recommends for dinner',
    stretchGoal: 'Ask if the daily special contains cream or dairy products',
    targetIntents: ['request_terrace_table', 'ask_recommendation', 'inquire_allergens'],
    primarySkillIds: ['skill-inquire-specifications', 'skill-propose-alternative'],
    secondarySkillIds: ['skill-request-substitution'],
    usefulPhrases: [
      {
        id: 'phrase.fr.table_terrasse',
        form: 'Une table pour deux en terrasse, s’il vous plaît.',
        meaning: 'A table for two on the terrace, please.',
        usageNote: 'The gold standard restaurant request in France.',
        difficulty: 'beginner'
      },
      {
        id: 'phrase.fr.que_recommandez_vous',
        form: 'Qu’est-ce que vous nous recommandez comme plat du jour ?',
        meaning: 'What do you recommend to us as the dish of the day?',
        usageNote: 'Polite way to inquire about chef recommendations.',
        difficulty: 'elementary'
      },
      {
        id: 'phrase.fr.contient_produits_laitiers',
        form: 'Est-ce que cette sauce contient de la crème ou des produits laitiers ?',
        meaning: 'Does this sauce contain cream or dairy products?',
        usageNote: 'Essential dietary safeguard in French dining.',
        difficulty: 'intermediate'
      }
    ],
    supportPolicy: {
      hintLadderAvailable: true,
      correctionStyle: 'gentle',
      allowSlowing: true
    },
    completionSignals: ['Table seated', 'Recommendation given', 'Dietary confirmed'],
    estimatedMinutes: 4,
    tags: ['dining', 'bistro', 'terrace', 'restaurant'],
    transferPattern: 'Refine social & dining arrangements',
    transferReason: 'Synthesizes ordering, clarifying conditions, and social etiquette into a complete Parisian dinner scenario.'
  },
  {
    id: 'mission-de-baeckerei',
    version: 1,
    language: 'de',
    scenarioFamilyId: 'counter-ordering',
    levelRange: 'A1',
    title: 'Bäckerei am Markt: Brötchen & Kaffee',
    category: 'cafes',
    neighborhood: 'Kreuzberg · Marktplatz',
    setting: 'A cozy neighborhood bakery in Berlin with fresh pretzel baskets and a chalkboard coffee menu.',
    aiRole: 'Klara, the cheerful bakery assistant.',
    character: {
      name: 'Klara',
      role: 'Bakery Assistant',
      voiceStyle: 'Clear, modern German, cheerful',
      personality: 'Welcoming, speaks clearly for learners',
      knowledgeBoundary: [
        'Knows rye bread, pretzels, and cheese rolls are fresh',
        'Has oat milk (Hafermilch) and cow milk',
        'Accepts card or cash'
      ]
    },
    learnerGoal: 'Order two bread rolls and a coffee with oat milk to take away',
    stretchGoal: 'Ask if you can pay by card ("Mit Karte bitte")',
    targetIntents: ['order_bakery', 'specify_milk', 'payment_method'],
    primarySkillIds: ['skill-request-substitution'],
    secondarySkillIds: ['skill-inquire-specifications', 'skill-communicative-repair'],
    usefulPhrases: [
      {
        id: 'phrase.de.broetchen_bitte',
        form: 'Zwei Brötchen und einen Kaffee zum Mitnehmen, bitte.',
        meaning: 'Two bread rolls and a coffee to go, please.',
        usageNote: 'Everyday German bakery phrasing.',
        difficulty: 'beginner'
      },
      {
        id: 'phrase.de.hafermilch',
        form: 'Haben Sie Hafermilch?',
        meaning: 'Do you have oat milk?',
        usageNote: 'Polite question for oat milk.',
        difficulty: 'elementary'
      },
      {
        id: 'phrase.de.mit_karte',
        form: 'Kann ich mit Karte zahlen?',
        meaning: 'Can I pay by card?',
        usageNote: 'Essential question in Germany.',
        difficulty: 'beginner'
      }
    ],
    supportPolicy: {
      hintLadderAvailable: true,
      correctionStyle: 'gentle',
      allowSlowing: true
    },
    completionSignals: ['Rolls specified', 'Coffee milk chosen', 'Payment completed'],
    estimatedMinutes: 3,
    tags: ['bakery', 'berlin', 'coffee', 'cash_card'],
    nextMissionId: 'mission-de-apotheke',
    transferPattern: 'Request a substitution & dietary options',
    transferReason: 'Reuses your question pattern ("Haben Sie...?") when asking the pharmacist for non-drowsy medication.'
  },
  {
    id: 'mission-de-apotheke',
    version: 2,
    language: 'de',
    scenarioFamilyId: 'pharmacy-consultation',
    levelRange: 'A2',
    title: 'Apotheke am Tor: Beschwerden schildern & nach dem Apotheker fragen',
    category: 'problems',
    neighborhood: 'Kreuzberg · Oranienstraße Apotheke',
    setting: 'A quiet, well-organized Berlin pharmacy with amber glass bottles on wood shelves and a calm medicinal aroma.',
    aiRole: 'Stefan, the pharmacy counter staff member who routes clinical questions to the licensed pharmacist.',
    character: {
      name: 'Stefan',
      role: 'Pharmacy Counter Staff',
      voiceStyle: 'Calm, precise, standard German (Hochdeutsch)',
      personality: 'Thorough service professional who helps visitors formulate questions without giving medical advice',
      knowledgeBoundary: [
        'Can direct the learner to the licensed pharmacist and consultation area',
        'Can point to official packaging and package leaflets without interpreting them as medical advice',
        'Must not diagnose, recommend or select medicine, or give dosage, treatment, contraindication, efficacy, or side-effect advice'
      ]
    },
    learnerGoal: 'Explain seasonal allergy symptoms (hay fever, itchy eyes) and ask to speak with the licensed pharmacist',
    stretchGoal: 'Ask where the consultation area is and ask for help finding the official package leaflet',
    targetIntents: ['describe_allergies', 'request_pharmacist', 'ask_label_help'],
    primarySkillIds: ['skill-request-substitution', 'skill-inquire-specifications'],
    secondarySkillIds: ['skill-communicative-repair'],
    usefulPhrases: [
      {
        id: 'phrase.de.heuschnupfen',
        form: 'Ich habe Heuschnupfen und meine Augen jucken.',
        meaning: 'I have hay fever and my eyes itch.',
        usageNote: 'Clear description of seasonal allergy symptoms.',
        difficulty: 'elementary'
      },
      {
        id: 'phrase.de.nicht_muede',
        form: 'Ich möchte mit dem Apotheker über meine Beschwerden sprechen.',
        meaning: 'I would like to speak with the pharmacist about my symptoms.',
        usageNote: 'Natural service request that routes clinical questions to the licensed professional.',
        difficulty: 'intermediate'
      },
      {
        id: 'phrase.de.wie_oft',
        form: 'Können Sie mir helfen, die Packungsbeilage zu finden?',
        meaning: 'Can you help me find the package leaflet?',
        usageNote: 'Safe request for authoritative written product information.',
        difficulty: 'intermediate'
      }
    ],
    supportPolicy: {
      hintLadderAvailable: true,
      correctionStyle: 'gentle',
      allowSlowing: true
    },
    completionSignals: ['Symptoms explained', 'Licensed pharmacist requested', 'Official package leaflet located'],
    estimatedMinutes: 4,
    tags: ['pharmacy', 'health', 'medicine', 'allergies'],
    nextMissionId: 'mission-de-ubahn',
    transferPattern: 'State needs & request authoritative information',
    transferReason: 'Applies your specification pattern when asking for specific transit zones at the U-Bahn station.'
  },
  {
    id: 'mission-de-ubahn',
    version: 1,
    language: 'de',
    scenarioFamilyId: 'public-transit',
    levelRange: 'A2',
    title: 'U-Bahn Kottbusser Tor: Fahrschein & Gleis',
    category: 'transit',
    neighborhood: 'Kreuzberg · U-Bahnhof Kottbusser Tor',
    setting: 'The tiled subway concourse of Kottbusser Tor. Electronic displays flicker and commuters hurry between the U1 and U8 platforms.',
    aiRole: 'Lukas, the BVG station information officer.',
    character: {
      name: 'Lukas',
      role: 'BVG Station Attendant',
      voiceStyle: 'Direct, practical Berlin German, efficient',
      personality: 'Helpful with transit navigation, concise',
      knowledgeBoundary: [
        'Knows ticket options: Berlin AB 24-Stunden-Karte (€9.90) and single tickets (€3.50)',
        'Knows U8 toward Wittenau reaches Alexanderplatz in 6 stops (Gleis 2)',
        'Reminds passengers that paper tickets must be validated (entwertet) before riding'
      ]
    },
    learnerGoal: 'Ask to buy a 24-hour AB ticket and ask which platform to take toward Alexanderplatz',
    stretchGoal: 'Ask whether you need to stamp / validate the ticket before boarding',
    targetIntents: ['buy_day_ticket', 'ask_platform', 'validate_ticket'],
    primarySkillIds: ['skill-wayfinding-transit', 'skill-inquire-specifications'],
    secondarySkillIds: ['skill-communicative-repair'],
    usefulPhrases: [
      {
        id: 'phrase.de.tageskarte_ab',
        form: 'Ich möchte bitte eine Tageskarte für den Bereich AB kaufen.',
        meaning: 'I would like to buy a day ticket for zone AB, please.',
        usageNote: 'Standard day ticket request in Berlin.',
        difficulty: 'elementary'
      },
      {
        id: 'phrase.de.welches_gleis',
        form: 'Von welchem Gleis fährt die U-Bahn zum Alexanderplatz?',
        meaning: 'From which track does the subway to Alexanderplatz depart?',
        usageNote: 'Essential transit question for trains and subway.',
        difficulty: 'intermediate'
      },
      {
        id: 'phrase.de.entwerten',
        form: 'Muss ich das Ticket vor der Fahrt entwerten?',
        meaning: 'Do I have to validate the ticket before traveling?',
        usageNote: 'Critical question in Germany where unstamped tickets incur fines.',
        difficulty: 'intermediate'
      }
    ],
    supportPolicy: {
      hintLadderAvailable: true,
      correctionStyle: 'gentle',
      allowSlowing: true
    },
    completionSignals: ['Ticket selected', 'Platform found', 'Validation clarified'],
    estimatedMinutes: 4,
    tags: ['transit', 'ubahn', 'tickets', 'directions'],
    nextMissionId: 'mission-de-gasthaus',
    transferPattern: 'Wayfinding & clarification',
    transferReason: 'Transfers your inquiry pattern to request outdoor seating and recommendations at the Gasthaus.'
  },
  {
    id: 'mission-de-gasthaus',
    version: 1,
    language: 'de',
    scenarioFamilyId: 'social-dining',
    levelRange: 'A2',
    title: 'Gasthaus zur Linde: Abendessen im Biergarten',
    category: 'cafes',
    neighborhood: 'Kreuzberg · Paul-Lincke-Ufer',
    setting: 'A warm evening at a traditional Berlin tavern overlooking the canal. Lanterns hang from chestnut branches in the outdoor beer garden.',
    aiRole: 'Hannah, the friendly host and waitress.',
    character: {
      name: 'Hannah',
      role: 'Host & Waitress',
      voiceStyle: 'Warm, hospitable Berlin German, casual',
      personality: 'Enjoys recommending house specialties, accommodating with seating',
      knowledgeBoundary: [
        'Has a quiet table for two under the chestnut tree in the garden',
        'Recommends the homemade Spätzle and seasonal asparagus (Spargel)',
        'Knows dishes without dairy or meat'
      ]
    },
    learnerGoal: 'Ask for a table for two in the beer garden and ask what seasonal specialty Hannah recommends',
    stretchGoal: 'Ask if the special dish contains dairy products or nuts',
    targetIntents: ['request_garden_table', 'ask_recommendation', 'check_ingredients'],
    primarySkillIds: ['skill-propose-alternative', 'skill-inquire-specifications'],
    secondarySkillIds: ['skill-request-substitution'],
    usefulPhrases: [
      {
        id: 'phrase.de.tisch_draussen',
        form: 'Einen Tisch für zwei Personen draußen im Garten, bitte.',
        meaning: 'A table for two people outside in the garden, please.',
        usageNote: 'Natural dining request for outdoor seating in Germany.',
        difficulty: 'beginner'
      },
      {
        id: 'phrase.de.was_empfehlen_sie',
        form: 'Was können Sie uns heute Abend empfehlen?',
        meaning: 'What can you recommend to us this evening?',
        usageNote: 'Friendly, natural way to ask for dinner recommendations.',
        difficulty: 'elementary'
      },
      {
        id: 'phrase.de.milchprodukte',
        form: 'Sind in diesem Gericht Milchprodukte oder Nüsse enthalten?',
        meaning: 'Are there dairy products or nuts contained in this dish?',
        usageNote: 'Dietary safeguard question in German restaurants.',
        difficulty: 'intermediate'
      }
    ],
    supportPolicy: {
      hintLadderAvailable: true,
      correctionStyle: 'gentle',
      allowSlowing: true
    },
    completionSignals: ['Table seated', 'Special recommended', 'Ingredients confirmed'],
    estimatedMinutes: 4,
    tags: ['dining', 'restaurant', 'biergarten', 'social'],
    transferPattern: 'Negotiating arrangements & preferences',
    transferReason: 'Synthesizes polite requests, seating specifications, and dietary questions into an evening dining episode.'
  },
  {
    id: 'mission-it-bar-portico',
    version: 1,
    language: 'it',
    scenarioFamilyId: 'counter-ordering',
    levelRange: 'A1',
    title: 'Bar Il Portico: Un Espresso al Banco',
    category: 'cafes',
    neighborhood: 'Centro Storico · Piazza Santa Croce',
    setting: 'A lively Italian piazza bar with polished brass rails, a steaming espresso machine, and locals reading the morning paper.',
    aiRole: 'Gianni, the energetic barista.',
    character: {
      name: 'Gianni',
      role: 'Barista',
      voiceStyle: 'Vibrant, melodic Italian, expressive',
      personality: 'Fast-paced but delighted when foreigners speak Italian',
      knowledgeBoundary: [
        'Knows cornetti flavors (crema, marmellata, cioccolato)',
        'Espresso is 1.20 Euro at the counter (al banco)',
        'Water comes still (naturale) or sparkling (frizzante)'
      ]
    },
    learnerGoal: 'Order an espresso and a croissant at the counter, and specify sparkling water',
    stretchGoal: 'Ask Gianni which pastry is his personal favorite today',
    targetIntents: ['order_espresso', 'specify_water', 'counter_service'],
    primarySkillIds: ['skill-request-substitution', 'skill-inquire-specifications'],
    secondarySkillIds: ['skill-communicative-repair'],
    usefulPhrases: [
      {
        id: 'phrase.it.un_caffe',
        form: 'Un caffè e un cornetto alla crema, per favore.',
        meaning: 'An espresso and a cream croissant, please.',
        usageNote: 'Classic Italian breakfast at the counter.',
        difficulty: 'beginner'
      },
      {
        id: 'phrase.it.acqua_frizzante',
        form: 'Un bicchiere d’acqua frizzante, grazie.',
        meaning: 'A glass of sparkling water, thank you.',
        usageNote: 'Common accompaniment to espresso.',
        difficulty: 'beginner'
      },
      {
        id: 'phrase.it.qual_e_il_migliore',
        form: 'Qual è il tuo cornetto preferito stamattina?',
        meaning: 'Which is your favorite croissant this morning?',
        usageNote: 'Friendly conversational question with the barista.',
        difficulty: 'elementary'
      }
    ],
    supportPolicy: {
      hintLadderAvailable: true,
      correctionStyle: 'gentle',
      allowSlowing: true
    },
    completionSignals: ['Coffee ordered', 'Pastry picked', 'Farewell exchanged'],
    estimatedMinutes: 3,
    tags: ['italian', 'espresso', 'bar', 'piazza'],
    nextMissionId: 'mission-it-farmacia',
    transferPattern: 'Specify preferences & quick service requests',
    transferReason: 'Reuses your counter inquiry pattern when asking Elena to direct you to the licensed pharmacist.'
  },
  {
    id: 'mission-it-farmacia',
    version: 2,
    language: 'it',
    scenarioFamilyId: 'pharmacy-consultation',
    levelRange: 'A2',
    title: 'Farmacia Santa Croce: Descrivere i sintomi & chiedere il farmacista',
    category: 'problems',
    neighborhood: 'Centro Storico · Via dei Neri Farmacia',
    setting: 'A historic Florentine pharmacy with dark walnut cabinets, porcelain apothecary jars, and the faint soothing scent of eucalyptus.',
    aiRole: 'Elena, the pharmacy counter staff member who routes clinical questions to the licensed pharmacist.',
    character: {
      name: 'Elena',
      role: 'Pharmacy Counter Staff',
      voiceStyle: 'Gentle, articulate, classic Tuscan Italian',
      personality: 'Attentive service professional who helps visitors formulate requests without giving medical advice',
      knowledgeBoundary: [
        'Can direct the learner to the licensed pharmacist and consultation counter',
        'Can point to official packaging and patient leaflets without interpreting them as medical advice',
        'Must not diagnose, recommend or select medicine, or give dosage, treatment, contraindication, efficacy, or side-effect advice'
      ]
    },
    learnerGoal: 'Describe your sore throat and ask to speak with the licensed pharmacist',
    stretchGoal: 'Ask where the consultation counter is and ask for help finding the official patient leaflet',
    targetIntents: ['describe_throat_pain', 'request_pharmacist', 'ask_label_help'],
    primarySkillIds: ['skill-inquire-specifications'],
    secondarySkillIds: ['skill-request-substitution', 'skill-communicative-repair'],
    usefulPhrases: [
      {
        id: 'phrase.it.mal_di_gola',
        form: 'Ho mal di gola e faccio fatica a deglutire.',
        meaning: 'I have a sore throat and trouble swallowing.',
        usageNote: 'Everyday expression for describing throat inflammation.',
        difficulty: 'beginner'
      },
      {
        id: 'phrase.it.non_dia_sonnolenza',
        form: 'Vorrei parlare con il farmacista dei miei sintomi.',
        meaning: 'I would like to speak with the pharmacist about my symptoms.',
        usageNote: 'Polite service request that leaves clinical decisions to the licensed professional.',
        difficulty: 'intermediate'
      },
      {
        id: 'phrase.it.prima_o_dopo_pasti',
        form: 'Può aiutarmi a trovare il foglietto illustrativo ufficiale?',
        meaning: 'Can you help me find the official patient leaflet?',
        usageNote: 'Safe request for authoritative written product information.',
        difficulty: 'elementary'
      }
    ],
    supportPolicy: {
      hintLadderAvailable: true,
      correctionStyle: 'gentle',
      allowSlowing: true
    },
    completionSignals: ['Symptoms stated', 'Licensed pharmacist requested', 'Official leaflet located'],
    estimatedMinutes: 4,
    tags: ['health', 'pharmacy', 'symptoms', 'florence'],
    nextMissionId: 'mission-it-stazione',
    transferPattern: 'Clarify service steps & authoritative information',
    transferReason: 'Transfers clarifying instructions to purchasing regional tickets and validating them at the station.'
  },
  {
    id: 'mission-it-stazione',
    version: 1,
    language: 'it',
    scenarioFamilyId: 'public-transit',
    levelRange: 'A2',
    title: 'Stazione Santa Maria Novella: Biglietto & Binario',
    category: 'transit',
    neighborhood: 'Centro · Stazione di Firenze Santa Maria Novella',
    setting: 'The echoing marble hall of Santa Maria Novella train station. Commuters glance at the large departure board while trains whistle in the background.',
    aiRole: 'Marco, the ticket officer at the regional service desk.',
    character: {
      name: 'Marco',
      role: 'Ticket Officer',
      voiceStyle: 'Fast, clear, standard Italian, professional',
      personality: 'Efficient, used to travelers, clarifies train types (Regionale vs Freccia)',
      knowledgeBoundary: [
        'Regional ticket to Pisa Centrale is €8.90, valid for 4 hours once stamped',
        'Next train leaves at 10:28 from Platform 6 (Binario 6)',
        'Reminds passengers to stamp (convalidare/obliterare) the paper ticket before boarding'
      ]
    },
    learnerGoal: 'Buy a one-way regional ticket to Pisa and ask which platform the train departs from',
    stretchGoal: 'Ask where to stamp/validate the ticket before getting on the train',
    targetIntents: ['buy_train_ticket', 'ask_platform', 'clarify_validation'],
    primarySkillIds: ['skill-wayfinding-transit', 'skill-inquire-specifications'],
    secondarySkillIds: ['skill-communicative-repair'],
    usefulPhrases: [
      {
        id: 'phrase.it.biglietto_regionale',
        form: 'Vorrei un biglietto di sola andata per Pisa, per favore.',
        meaning: 'I would like a one-way ticket to Pisa, please.',
        usageNote: 'Standard railway ticket purchase in Italy.',
        difficulty: 'elementary'
      },
      {
        id: 'phrase.it.da_quale_binario',
        form: 'Da quale binario parte il treno?',
        meaning: 'From which platform does the train depart?',
        usageNote: 'Essential station wayfinding question.',
        difficulty: 'intermediate'
      },
      {
        id: 'phrase.it.dove_convalidare',
        form: 'Dove devo convalidare il biglietto prima di salire?',
        meaning: 'Where must I validate the ticket before boarding?',
        usageNote: 'Crucial requirement in Italian rail travel to avoid conductor fines.',
        difficulty: 'intermediate'
      }
    ],
    supportPolicy: {
      hintLadderAvailable: true,
      correctionStyle: 'gentle',
      allowSlowing: true
    },
    completionSignals: ['Destination stated', 'Platform learned', 'Validation understood'],
    estimatedMinutes: 4,
    tags: ['transit', 'train', 'station', 'tickets'],
    nextMissionId: 'mission-it-trattoria',
    transferPattern: 'Wayfinding & logistical instructions',
    transferReason: 'Prepares you to navigate reservations and table preferences at Trattoria Mario.'
  },
  {
    id: 'mission-it-trattoria',
    version: 1,
    language: 'it',
    scenarioFamilyId: 'social-dining',
    levelRange: 'A2',
    title: 'Trattoria Mario: Tavolo all’Aperto & Specialità',
    category: 'cafes',
    neighborhood: 'San Lorenzo · Via Rosina',
    setting: 'A bustling traditional Florentine trattoria with paper placemats, the aroma of garlic, sage, and ribollita, and chatter of happy diners.',
    aiRole: 'Sofia, the spirited host welcoming guests.',
    character: {
      name: 'Sofia',
      role: 'Host & Server',
      voiceStyle: 'Warm, spirited Florentine Italian, engaging',
      personality: 'Passionate about Tuscan home cooking, welcoming to walk-ins',
      knowledgeBoundary: [
        'Has a cozy table for two outside in the alleyway',
        'Recommends fresh pappardelle al cinghiale (wild boar) and the daily ribollita',
        'Knows which dishes contain gluten, dairy, or nuts'
      ]
    },
    learnerGoal: 'Ask for an outdoor table for two and ask Sofia what pasta dish she recommends tonight',
    stretchGoal: 'Ask whether the house specialty contains dairy or cheese ("senza formaggio")',
    targetIntents: ['request_outdoor_table', 'ask_recommendation', 'check_dairy'],
    primarySkillIds: ['skill-request-substitution', 'skill-propose-alternative'],
    secondarySkillIds: ['skill-inquire-specifications'],
    usefulPhrases: [
      {
        id: 'phrase.it.tavolo_all_aperto',
        form: 'Avete un tavolo per due all’aperto, per favore?',
        meaning: 'Do you have an outdoor table for two, please?',
        usageNote: 'Polite restaurant seating request across Italy.',
        difficulty: 'beginner'
      },
      {
        id: 'phrase.it.cosa_consiglia',
        form: 'Che piatto di pasta ci consiglia stasera?',
        meaning: 'What pasta dish do you recommend to us tonight?',
        usageNote: 'Friendly, natural way to ask for the chef specialty.',
        difficulty: 'elementary'
      },
      {
        id: 'phrase.it.senza_latticini',
        form: 'È possibile averlo senza formaggio o latticini?',
        meaning: 'Is it possible to have it without cheese or dairy?',
        usageNote: 'Polite dietary modification in Italian dining.',
        difficulty: 'intermediate'
      }
    ],
    supportPolicy: {
      hintLadderAvailable: true,
      correctionStyle: 'gentle',
      allowSlowing: true
    },
    completionSignals: ['Table seated', 'Pasta chosen', 'Dietary confirmed'],
    estimatedMinutes: 4,
    tags: ['dining', 'trattoria', 'florence', 'pasta'],
    transferPattern: 'Social dining & culinary preferences',
    transferReason: 'Synthesizes table requests, ingredient questions, and friendly Italian social interaction.'
  },
  {
    id: 'mission-ja-konbini',
    version: 1,
    language: 'ja',
    scenarioFamilyId: 'counter-ordering',
    levelRange: 'A1',
    title: 'Konbini Yanaka: O-bento to O-cha',
    category: 'services',
    neighborhood: 'Yanaka · Yanaka Ginza Konbini',
    setting: 'A bright, clean neighborhood convenience store in Tokyo with chilled drink shelves, fresh onigiri, and hot fried chicken warmers near the register.',
    aiRole: 'Kenji, the polite convenience store clerk.',
    character: {
      name: 'Kenji',
      role: 'Konbini Clerk',
      voiceStyle: 'Polite, clear, standard Japanese service speech (keigo)',
      personality: 'Courteous, follows standard Japanese register protocol, patient with foreigners',
      knowledgeBoundary: [
        'Knows salmon onigiri (sake) and green tea (ocha) are in stock',
        'Can heat up lunchboxes in the microwave (atatamemasu)',
        'Asks if a plastic bag (fukuro) is needed (5 yen) and takes cash or Suica'
      ]
    },
    learnerGoal: 'Buy an onigiri and tea, ask to have your bento warmed up, and say a bag is not needed',
    stretchGoal: 'Pay using an IC card ("Suica de onegaishimasu")',
    targetIntents: ['order_konbini_items', 'request_heating', 'decline_bag', 'pay_suica'],
    primarySkillIds: ['skill-request-substitution', 'skill-communicative-repair'],
    secondarySkillIds: ['skill-inquire-specifications'],
    usefulPhrases: [
      {
        id: 'phrase.ja.atatamete_kudasai',
        form: 'お弁当を温めてください。',
        meaning: 'Please warm up the bento.',
        usageNote: 'Essential phrase at Japanese convenience stores.',
        difficulty: 'beginner'
      },
      {
        id: 'phrase.ja.fukuro_kekkou',
        form: 'レジ袋は結構です。',
        meaning: 'A bag is not needed, thank you.',
        usageNote: 'Polite way to decline a plastic bag.',
        difficulty: 'beginner'
      },
      {
        id: 'phrase.ja.suica_de',
        form: 'Suicaでお願いします。',
        meaning: 'By Suica (IC card), please.',
        usageNote: 'Everyday contactless payment in Japan.',
        difficulty: 'beginner'
      }
    ],
    supportPolicy: {
      hintLadderAvailable: true,
      correctionStyle: 'gentle',
      allowSlowing: true
    },
    completionSignals: ['Items brought to counter', 'Heating requested', 'Payment finished'],
    estimatedMinutes: 3,
    tags: ['konbini', 'shopping', 'tokyo', 'everyday'],
    nextMissionId: 'mission-ja-yakkyoku',
    transferPattern: 'Service requests & polite counters',
    transferReason: 'Reuses your polite request pattern ("...kudasai / onegaishimasu") when asking to consult the licensed pharmacist.'
  },
  {
    id: 'mission-ja-yakkyoku',
    version: 2,
    language: 'ja',
    scenarioFamilyId: 'pharmacy-consultation',
    levelRange: 'A2',
    title: 'Kusuri no Yanaka: Shōjō o Tsutaete Yakuzaishi ni Sōdan',
    category: 'problems',
    neighborhood: 'Yanaka · Yanaka Shotengai Pharmacy',
    setting: 'A quiet Japanese neighborhood drugstore lined with organized aisles of healthcare remedies, vitamin tonics, and eye drops.',
    aiRole: 'Aoi, the pharmacy counter staff member who routes clinical questions to the licensed pharmacist.',
    character: {
      name: 'Aoi',
      role: 'Pharmacy Counter Staff',
      voiceStyle: 'Gentle, clear, supportive Japanese',
      personality: 'Careful service professional who helps visitors explain symptoms and reach the licensed pharmacist without giving medical advice',
      knowledgeBoundary: [
        'Can direct the learner to the licensed pharmacist and consultation counter',
        'Can point to official packaging and patient leaflets without interpreting them as medical advice',
        'Must not diagnose, recommend or select medicine, or give dosage, treatment, contraindication, efficacy, or side-effect advice'
      ]
    },
    learnerGoal: 'Explain you have a headache and ask to speak with the licensed pharmacist',
    stretchGoal: 'Ask where the consultation counter is and ask for help finding the official package leaflet',
    targetIntents: ['describe_headache', 'request_pharmacist', 'ask_label_help'],
    primarySkillIds: ['skill-inquire-specifications', 'skill-request-substitution'],
    secondarySkillIds: ['skill-communicative-repair'],
    usefulPhrases: [
      {
        id: 'phrase.ja.zutsuu_ga_suru',
        form: '頭痛がして、少し熱があります。',
        meaning: 'I have a headache and a slight fever.',
        usageNote: 'Standard symptom description in Japanese clinics and pharmacies.',
        difficulty: 'elementary'
      },
      {
        id: 'phrase.ja.nemuku_naranai',
        form: 'この症状について薬剤師に相談したいです。',
        meaning: 'I would like to consult the pharmacist about these symptoms.',
        usageNote: 'Natural service phrase for routing a health question to the licensed professional.',
        difficulty: 'intermediate'
      },
      {
        id: 'phrase.ja.shokugo_nomimasu',
        form: '公式の説明書はどこにありますか？',
        meaning: 'Where can I find the official product leaflet?',
        usageNote: 'Safe request for authoritative written product information.',
        difficulty: 'intermediate'
      }
    ],
    supportPolicy: {
      hintLadderAvailable: true,
      correctionStyle: 'gentle',
      allowSlowing: true
    },
    completionSignals: ['Headache explained', 'Licensed pharmacist requested', 'Official product leaflet located'],
    estimatedMinutes: 4,
    tags: ['health', 'pharmacy', 'symptoms', 'medicine'],
    nextMissionId: 'mission-ja-eki',
    transferPattern: 'Describe a need & request authoritative information',
    transferReason: 'Applies your question-asking pattern when asking station staff about train lines and card recharging.'
  },
  {
    id: 'mission-ja-eki',
    version: 1,
    language: 'ja',
    scenarioFamilyId: 'public-transit',
    levelRange: 'A2',
    title: 'Nippori Station: Suica Charge & Platform Directions',
    category: 'transit',
    neighborhood: 'Yanaka · Nippori Station North Gate',
    setting: 'The bustling concourse of Nippori station. Commuters tap IC cards through ticket gates while automated chime melodies announce departures.',
    aiRole: 'Tanaka-san, the helpful JR station attendant at the ticket window.',
    character: {
      name: 'Tanaka-san',
      role: 'JR Station Attendant',
      voiceStyle: 'Clear, helpful, polite standard Japanese',
      personality: 'Patient with foreign visitors, points clearly to platform diagrams',
      knowledgeBoundary: [
        'Suica cards can be charged at the pink or black ticket machines, or at the window with cash',
        'Platform 10 / 11 is Yamanote Line inner loop toward Tokyo Station (about 12 minutes)',
        'Reminds that trains arrive every 3 minutes'
      ]
    },
    learnerGoal: 'Ask how to charge your Suica card and ask which platform goes toward Tokyo Station',
    stretchGoal: 'Ask how many minutes it takes to reach Tokyo Station',
    targetIntents: ['ask_suica_charge', 'ask_platform_number', 'ask_travel_duration'],
    primarySkillIds: ['skill-wayfinding-transit', 'skill-inquire-specifications'],
    secondarySkillIds: ['skill-communicative-repair'],
    usefulPhrases: [
      {
        id: 'phrase.ja.suica_chaaji',
        form: 'Suicaのチャージはどこでできますか？',
        meaning: 'Where can I recharge my Suica card?',
        usageNote: 'Essential transit question for IC cards in Japan.',
        difficulty: 'elementary'
      },
      {
        id: 'phrase.ja.nanban_sen',
        form: '東京駅に行くには、何番線ですか？',
        meaning: 'To go to Tokyo Station, which platform track is it?',
        usageNote: 'Standard way to ask for the correct train platform in Japan.',
        difficulty: 'intermediate'
      },
      {
        id: 'phrase.ja.donokurai_kakaru',
        form: '東京駅まで何分くらいかかりますか？',
        meaning: 'About how many minutes does it take to Tokyo Station?',
        usageNote: 'Everyday transit duration question.',
        difficulty: 'elementary'
      }
    ],
    supportPolicy: {
      hintLadderAvailable: true,
      correctionStyle: 'gentle',
      allowSlowing: true
    },
    completionSignals: ['Suica charge located', 'Platform number confirmed', 'Travel time noted'],
    estimatedMinutes: 4,
    tags: ['transit', 'station', 'suica', 'train'],
    nextMissionId: 'mission-ja-izakaya',
    transferPattern: 'Wayfinding & transit guidance',
    transferReason: 'Transfers your clarification questions to ordering recommendations and the bill at the local izakaya.'
  },
  {
    id: 'mission-ja-izakaya',
    version: 1,
    language: 'ja',
    scenarioFamilyId: 'social-dining',
    levelRange: 'A2',
    title: 'Yanaka Izakaya Maru: Counter Seating & Daily Skewers',
    category: 'cafes',
    neighborhood: 'Yanaka · Yanaka Ginza Izakaya Maru',
    setting: 'A cozy traditional izakaya with red paper lanterns outside, smoky charcoal aroma of yakitori, and a warm cedar wood counter.',
    aiRole: 'Hiroshi, the master chef and owner of Izakaya Maru.',
    character: {
      name: 'Hiroshi',
      role: 'Master Chef',
      voiceStyle: 'Warm, jovial, authentic Tokyo Shitamachi Japanese',
      personality: 'Proud of his yakitori grill, welcomes new faces warmly to his counter',
      knowledgeBoundary: [
        'Has two seats open at the wooden counter',
        'Recommends the negima (chicken and scallion skewer) with salt and seasonal grilled mushrooms',
        'Knows cold draft beer, oolong tea, and sake pairings'
      ]
    },
    learnerGoal: 'Ask for a counter seat for two and ask Hiroshi what grilled skewer he recommends today',
    stretchGoal: 'Ask for the bill at the end and express your compliments ("Gochisousama deshita")',
    targetIntents: ['request_counter_seat', 'ask_chef_recommendation', 'ask_for_bill'],
    primarySkillIds: ['skill-propose-alternative', 'skill-inquire-specifications'],
    secondarySkillIds: ['skill-communicative-repair'],
    usefulPhrases: [
      {
        id: 'phrase.ja.kauntaa_seki',
        form: '二人ですが、カウンター席は空いていますか？',
        meaning: 'There are two of us; are there seats at the counter?',
        usageNote: 'Classic polite izakaya entrance request in Japan.',
        difficulty: 'intermediate'
      },
      {
        id: 'phrase.ja.osusume_wa',
        form: '今日のおすすめの焼き鳥は何ですか？',
        meaning: 'What is today’s recommended yakitori skewer?',
        usageNote: 'Friendly way to ask for the chef specialty in an izakaya.',
        difficulty: 'elementary'
      },
      {
        id: 'phrase.ja.okaikei_onegaishimasu',
        form: 'お会計をお願いします。ごちそうさまでした！',
        meaning: 'The bill, please. Thank you for the wonderful meal!',
        usageNote: 'Polite departure etiquette in Japanese dining.',
        difficulty: 'beginner'
      }
    ],
    supportPolicy: {
      hintLadderAvailable: true,
      correctionStyle: 'gentle',
      allowSlowing: true
    },
    completionSignals: ['Seated at counter', 'Yakitori recommended', 'Bill settled politely'],
    estimatedMinutes: 4,
    tags: ['dining', 'izakaya', 'tokyo', 'yakitori', 'social'],
    transferPattern: 'Social dining & culturally grounded etiquette',
    transferReason: 'Synthesizes counter seating requests, recommendation inquiries, and cultural parting etiquette.'
  }
];

export const INITIAL_PHRASE_ITEMS = MISSION_CATALOG.flatMap(m =>
  m.usefulPhrases.map(p => ({
    id: p.id,
    language: m.language,
    form: p.form,
    meaning: p.meaning,
    usageNote: p.usageNote,
    difficulty: p.difficulty,
    recallStatus: 'new' as const,
    scheduling: {
      nextReviewAt: new Date(Date.now() - 3600000).toISOString(),
      due: true,
      intervalDays: 1,
      modalityHistory: [],
      contexts: [m.title]
    },
    stats: {
      assistedCount: 0,
      unassistedCount: 0,
      spokenCount: 0,
      typedCount: 0
    }
  }))
);

export interface CommunicativeSkillMeta {
  id: string;
  name: string;
  category: string;
  description: string;
  patterns: string[];
  samplePhrases: string[];
  associatedMissions: string[];
}

export const COMMUNICATIVE_SKILLS_CATALOG: CommunicativeSkillMeta[] = [
  {
    id: 'skill-request-substitution',
    name: 'Requesting a Substitution & Dietary Needs',
    category: 'Transaction & Service',
    description: 'Politely inquire whether an alternative option, ingredient replacement, or dietary adaptation is available.',
    patterns: [
      '¿Tiene [X] en vez de [Y]?',
      'Est-ce que vous avez [X] au lieu de [Y] ?',
      'Haben Sie [X] statt [Y]?',
      'È possibile avere [X] invece di [Y]?',
      '[X] の代わりに [Y] はありますか？'
    ],
    samplePhrases: [
      '¿Tiene leche de avena?',
      'Est-ce que vous avez des pastilles qui ne font pas dormir ?',
      'Haben Sie Hafermilch?',
      'È possibile averlo senza formaggio o latticini?',
      '眠くならない薬はありますか？'
    ],
    associatedMissions: [
      'mission-es-cafe-sol',
      'mission-es-farmacia-sol',
      'mission-fr-boulangerie',
      'mission-fr-pharmacie',
      'mission-de-baeckerei',
      'mission-de-apotheke',
      'mission-it-farmacia',
      'mission-ja-yakkyoku'
    ]
  },
  {
    id: 'skill-propose-alternative',
    name: 'Proposing Alternative Arrangements & Seating',
    category: 'Coordination & Negotiation',
    description: 'Suggest an alternative time, meeting slot, or terrace/counter seating arrangement when the default is not preferred.',
    patterns: [
      'Prefiero pasar [tiempo]',
      'Une table pour deux en [zone], s’il vous plaît',
      'Einen Tisch für zwei [Ort], bitte',
      'Avete un tavolo per due [luogo]?',
      '[場所] の席は空いていますか？'
    ],
    samplePhrases: [
      'Prefiero pasar mañana por la mañana.',
      'Une table pour deux en terrasse, s’il vous plaît.',
      'Einen Tisch für zwei Personen draußen im Garten, bitte.',
      'Avete un tavolo per due all’aperto, per favore?',
      '二人ですが、カウンター席は空いていますか？'
    ],
    associatedMissions: [
      'mission-es-parcel-counter',
      'mission-es-neighbors-door',
      'mission-es-la-terraza',
      'mission-fr-bistro',
      'mission-de-gasthaus',
      'mission-it-trattoria',
      'mission-ja-izakaya'
    ]
  },
  {
    id: 'skill-inquire-specifications',
    name: 'Inquiring About Specifications & Recommendations',
    category: 'Clarification & Inquiry',
    description: 'Ask for service recommendations, label information, or ingredient specifications before making a choice.',
    patterns: [
      '¿Qué nos recomienda para [ocasión]?',
      'Qu’est-ce que vous nous recommandez...?',
      'Was können Sie uns heute empfehlen?',
      'Che piatto ci consiglia stasera?',
      '今日のおすすめは何ですか？'
    ],
    samplePhrases: [
      '¿Qué nos recomienda para cenar hoy?',
      'Qu’est-ce que vous nous recommandez comme plat du jour ?',
      'Was können Sie uns heute Abend empfehlen?',
      'Che piatto di pasta ci consiglia stasera?',
      '今日のおすすめの焼き鳥は何ですか？'
    ],
    associatedMissions: [
      'mission-es-la-terraza',
      'mission-fr-bistro',
      'mission-de-gasthaus',
      'mission-it-trattoria',
      'mission-ja-izakaya'
    ]
  },
  {
    id: 'skill-wayfinding-transit',
    name: 'Wayfinding & Navigating Transit',
    category: 'Mobility & Wayfinding',
    description: 'Ask for platform directions, ticket validation, or travel duration on public transit networks.',
    patterns: [
      '¿Por qué andén sale...?',
      'Quelle direction dois-je prendre...?',
      'Von welchem Gleis fährt...?',
      'Da quale binario parte il treno?',
      '[場所] に行くには、何番線ですか？'
    ],
    samplePhrases: [
      '¿Por qué andén sale el metro hacia Atocha?',
      'Quelle direction dois-je prendre pour aller à Montparnasse ?',
      'Von welchem Gleis fährt die U-Bahn zum Alexanderplatz?',
      'Da quale binario parte il treno?',
      '東京駅に行くには、何番線ですか？'
    ],
    associatedMissions: [
      'mission-es-metro-station',
      'mission-fr-kiosque',
      'mission-de-ubahn',
      'mission-it-stazione',
      'mission-ja-eki'
    ]
  },
  {
    id: 'skill-communicative-repair',
    name: 'Communicative Repair & Asking Clarification',
    category: 'Social Interaction',
    description: 'Report an issue with a machine, politely ask how to validate a ticket, or request help gracefully.',
    patterns: [
      'La máquina no me...',
      'Est-ce que je peux payer par...?',
      'Muss ich das Ticket vor der Fahrt entwerten?',
      'Dove devo convalidare il biglietto...?',
      'お会計をお願いします。'
    ],
    samplePhrases: [
      'La máquina no me da el cambio.',
      'Est-ce que je peux payer par carte sans contact ?',
      'Muss ich das Ticket vor der Fahrt entwerten?',
      'Dove devo convalidare il biglietto prima di salire?',
      'お会計をお願いします。ごちそうさまでした！'
    ],
    associatedMissions: [
      'mission-es-metro-station',
      'mission-es-neighbors-door',
      'mission-fr-kiosque',
      'mission-de-ubahn',
      'mission-it-stazione',
      'mission-ja-izakaya'
    ]
  }
];
