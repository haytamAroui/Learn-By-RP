import { MissionDefinition } from '../types';

export const MISSION_CATALOG: MissionDefinition[] = [
  {
    id: 'mission-es-cafe-sol',
    version: 2,
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
    secondarySkillIds: [
      'skill-propose-alternative',
      'skill-communicative-repair',
      'skill-request-repetition',
      'skill-request-slower-speech',
      'skill-ask-clarification',
      'skill-check-understanding',
      'skill-clarify-misunderstanding',
      'skill-paraphrase-when-stuck',
    ],
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
    version: 2,
    language: 'es',
    sceneId: 'scene.es.parcel.reschedule',
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
    secondarySkillIds: [
      'skill-communicative-repair',
      'skill-request-repetition',
      'skill-ask-clarification',
    ],
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
    version: 2,
    language: 'es',
    sceneId: 'scene.es.neighbor.key-handover',
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
    primarySkillIds: ['skill-propose-alternative', 'skill-inquire-specifications'],
    secondarySkillIds: [
      'skill-communicative-repair',
      'skill-check-understanding',
      'skill-clarify-misunderstanding',
    ],
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
    version: 2,
    language: 'es',
    sceneId: 'scene.es.metro.ticket-platform',
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
    secondarySkillIds: [
      'skill-communicative-repair',
      'skill-request-repetition',
      'skill-ask-clarification',
      'skill-check-understanding',
    ],
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
    transferReason: 'Applies your question-asking pattern to ask Elena at the pharmacy for medication details.'
  },
  {
    id: 'mission-es-farmacia-sol',
    version: 1,
    language: 'es',
    sceneId: 'scene.es.pharmacy.symptom',
    scenarioFamilyId: 'pharmacy-consultation',
    levelRange: 'A2',
    title: 'Farmacia Sol: Seasonal Allergies',
    category: 'problems',
    neighborhood: 'El Barrio · Farmacia Calle del Sol 22',
    setting: 'A bright, quiet neighborhood pharmacy with green cross signage and glass shelves of wellness products. An herbal scent fills the air.',
    aiRole: 'Elena, the licensed pharmacist on duty.',
    character: {
      name: 'Elena',
      role: 'Pharmacist',
      voiceStyle: 'Calm, empathetic, precise',
      personality: 'Listens attentively, helps the learner locate product-label information, and avoids diagnosis or treatment advice',
      knowledgeBoundary: [
        'Has antihistamine tablets (pastillas para la alergia) that do not cause drowsiness',
        'Has saline nasal spray and eye drops',
        'Knows where package labels and official usage information are displayed; does not provide individualized dosage advice'
      ]
    },
    learnerGoal: 'Describe your symptoms and ask where the official package information shows relevant warnings',
    stretchGoal: 'Ask where the official usage and contraindication information appears on the package label',
    targetIntents: ['describe_symptoms', 'request_product_information', 'ask_label_instructions'],
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
        id: 'phrase.es.package_warning',
        form: '¿Dónde puedo ver las advertencias en el envase?',
        meaning: 'Where can I see the warnings on the package?',
        usageNote: 'Asks for official package information.',
        difficulty: 'intermediate'
      },
      {
        id: 'phrase.es.instrucciones_envase',
        form: '¿Dónde puedo ver las instrucciones y advertencias en el envase?',
        meaning: 'Where can I see the instructions and warnings on the package?',
        usageNote: 'Asks where to find official package information without requesting individualized dosage advice.',
        difficulty: 'intermediate'
      }
    ],
    supportPolicy: {
      hintLadderAvailable: true,
      correctionStyle: 'gentle',
      allowSlowing: true
    },
    completionSignals: ['Symptoms described', 'Product-condition question asked', 'Official label information located'],
    estimatedMinutes: 4,
    tags: ['health', 'pharmacy', 'symptoms', 'services'],
    nextMissionId: 'mission-es-la-terraza',
    transferPattern: 'Specify requirements & conditions',
    transferReason: 'Transfers the specific requirement pattern ("que no dé...") to specify terrace requirements at La Terraza.'
  },
  {
    id: 'mission-es-la-terraza',
    version: 2,
    language: 'es',
    sceneId: 'scene.es.dining.terrace',
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
    id: 'mission-es-hotel-checkin',
    version: 1,
    language: 'es',
    sceneId: 'scene.es.hotel.checkin',
    scenarioFamilyId: 'lodging-checkin',
    levelRange: 'A2',
    title: 'Hotel Centro: Early Check-in',
    category: 'lodging',
    neighborhood: 'Centro · Hotel near Plaza de España',
    setting: 'A compact hotel reception desk during the afternoon arrival period. Suitcases are lined beside a luggage-storage room.',
    aiRole: 'Lucía, the hotel receptionist. Welcoming, organized, and concise.',
    character: {
      name: 'Lucía',
      role: 'Hotel Receptionist',
      voiceStyle: 'Professional, clear, warm',
      personality: 'Helpful with booking details and practical arrival arrangements',
      knowledgeBoundary: [
        'Knows the booking reference and room status',
        'Knows the room is not ready yet',
        'Knows luggage storage is available until check-in time',
      ]
    },
    learnerGoal: 'Identify your booking, ask when the room will be ready, and arrange what to do with your luggage',
    stretchGoal: 'Confirm that you can leave the luggage and return later for the room key',
    targetIntents: ['provide_booking_reference', 'ask_checkin_condition', 'propose_arrival_plan'],
    primarySkillIds: ['skill-inquire-specifications', 'skill-propose-alternative'],
    secondarySkillIds: [
      'skill-communicative-repair',
      'skill-request-repetition',
      'skill-check-understanding',
    ],
    usefulPhrases: [
      {
        id: 'phrase.es.hotel_reserva',
        form: 'Tengo una reserva a nombre de García.',
        meaning: 'I have a reservation under the name García.',
        usageNote: 'Natural reception phrase for identifying a booking.',
        difficulty: 'elementary'
      },
      {
        id: 'phrase.es.hotel_habitacion_lista',
        form: '¿A qué hora estará lista la habitación?',
        meaning: 'What time will the room be ready?',
        usageNote: 'Direct question about the check-in condition.',
        difficulty: 'elementary'
      },
      {
        id: 'phrase.es.hotel_dejar_maletas',
        form: '¿Podemos dejar las maletas aquí y volver más tarde?',
        meaning: 'Can we leave the luggage here and come back later?',
        usageNote: 'Useful alternative-arrangement pattern when a room is not ready.',
        difficulty: 'intermediate'
      }
    ],
    supportPolicy: {
      hintLadderAvailable: true,
      correctionStyle: 'gentle',
      allowSlowing: true
    },
    completionSignals: [
      'Booking identified',
      'Room-ready condition clarified',
      'Luggage or later-return plan confirmed'
    ],
    estimatedMinutes: 4,
    tags: ['lodging', 'hotel', 'check-in', 'coordination'],
    nextMissionId: 'mission-es-bike-rental',
    transferPattern: 'Clarify conditions and agree a practical alternative',
    transferReason: 'Transfers service-condition and alternative-arrangement skills into a lodging reception context.'
  },
  {
    id: 'mission-es-bike-rental',
    version: 1,
    language: 'es',
    sceneId: 'scene.es.rental.bike',
    scenarioFamilyId: 'equipment-rental',
    levelRange: 'A2',
    title: 'Bici Centro: Afternoon Rental',
    category: 'services',
    neighborhood: 'Centro · Bike rental near the park',
    setting: 'A small rental counter with city bikes lined outside. The preferred standard bike type is temporarily unavailable.',
    aiRole: 'Diego, the bike-rental clerk. Friendly, practical, and clear about rental conditions.',
    character: {
      name: 'Diego',
      role: 'Bike Rental Clerk',
      voiceStyle: 'Friendly, practical, clear',
      personality: 'Explains available options and return conditions without unnecessary detail',
      knowledgeBoundary: [
        'Knows the standard city bike is unavailable',
        'Knows an electric city bike is available',
        'Knows the return deadline and that a lock is included',
      ]
    },
    learnerGoal: 'Rent a bike, choose an available alternative, and ask when it must be returned',
    stretchGoal: 'Ask whether a lock is included and confirm the return deadline',
    targetIntents: ['request_rental', 'request_substitution', 'ask_rental_condition'],
    primarySkillIds: ['skill-request-substitution', 'skill-inquire-specifications'],
    secondarySkillIds: [
      'skill-communicative-repair',
      'skill-ask-clarification',
      'skill-check-understanding',
    ],
    usefulPhrases: [
      {
        id: 'phrase.es.rental_bici',
        form: 'Quisiera alquilar una bicicleta esta tarde.',
        meaning: 'I would like to rent a bicycle this afternoon.',
        usageNote: 'Direct and polite rental request.',
        difficulty: 'elementary'
      },
      {
        id: 'phrase.es.rental_otra_bici',
        form: '¿Tiene otra bicicleta disponible?',
        meaning: 'Do you have another bicycle available?',
        usageNote: 'Substitution request when the preferred option is unavailable.',
        difficulty: 'elementary'
      },
      {
        id: 'phrase.es.rental_devolver',
        form: '¿A qué hora tengo que devolverla?',
        meaning: 'What time do I have to return it?',
        usageNote: 'Concrete question about a rental condition.',
        difficulty: 'elementary'
      }
    ],
    supportPolicy: {
      hintLadderAvailable: true,
      correctionStyle: 'gentle',
      allowSlowing: true
    },
    completionSignals: [
      'Rental need stated',
      'Available bike selected',
      'Return condition clarified'
    ],
    estimatedMinutes: 4,
    tags: ['services', 'rental', 'bike', 'substitution'],
    transferPattern: 'Request a substitute and clarify service conditions',
    transferReason: 'Adds a new service family for substitution and condition-question transfer.'
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
    transferReason: 'Reuses your substitution question when asking Camille at the pharmacy for non-drowsy alternatives.'
  },
  {
    id: 'mission-fr-pharmacie',
    version: 1,
    language: 'fr',
    scenarioFamilyId: 'pharmacy-consultation',
    levelRange: 'A2',
    title: 'Pharmacie Saint-Michel: Maux de Gorge & Soins',
    category: 'problems',
    neighborhood: 'Quartier Saint-Michel · Rue Saint-André-des-Arts',
    setting: 'A bright, quiet Parisian pharmacy with a glowing green neon cross outside. Glass shelves are filled with remedies and thermal skincare.',
    aiRole: 'Camille, the pharmacist on duty in a clean white coat.',
    character: {
      name: 'Camille',
      role: 'Pharmacist',
      voiceStyle: 'Articulate, caring, calm Parisian French',
      personality: 'Listens carefully, helps locate official product information, and avoids diagnosis or treatment advice',
      knowledgeBoundary: [
        'Has honey-lemon throat pastilles that soothe irritation without drowsiness',
        'Has saline nasal spray and paracetamol',
        'Knows where the package label lists official use and warning information; does not provide individualized dosage advice'
      ]
    },
    learnerGoal: 'Explain that you have a sore throat and ask for lozenges that do not cause drowsiness',
    stretchGoal: 'Ask where the package label explains use, warnings, and when to seek professional advice',
    targetIntents: ['describe_symptoms', 'request_product_information', 'clarify_label_information'],
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
        form: 'Est-ce que vous avez des pastilles qui ne font pas dormir ?',
        meaning: 'Do you have pastilles that do not make you sleepy?',
        usageNote: 'Essential conditional request for non-drowsy medication.',
        difficulty: 'intermediate'
      },
      {
        id: 'phrase.fr.combien_de_fois',
        form: 'Combien de fois par jour dois-je les prendre ?',
        meaning: 'How many times a day should I take them?',
        usageNote: 'Key question for clarifying dosage instructions.',
        difficulty: 'intermediate'
      }
    ],
    supportPolicy: {
      hintLadderAvailable: true,
      correctionStyle: 'gentle',
      allowSlowing: true
    },
    completionSignals: ['Symptoms described', 'Product-information question asked', 'Official label information located'],
    estimatedMinutes: 4,
    tags: ['health', 'pharmacy', 'symptoms', 'remedy'],
    nextMissionId: 'mission-fr-kiosque',
    transferPattern: 'Inquire about instructions & requirements',
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
    version: 1,
    language: 'de',
    scenarioFamilyId: 'pharmacy-consultation',
    levelRange: 'A2',
    title: 'Apotheke am Tor: Allergietabletten & Beratung',
    category: 'problems',
    neighborhood: 'Kreuzberg · Oranienstraße Apotheke',
    setting: 'A quiet, well-organized Berlin pharmacy with amber glass bottles on wood shelves and a calm medicinal aroma.',
    aiRole: 'Stefan, the certified pharmacist.',
    character: {
      name: 'Stefan',
      role: 'Pharmacist',
      voiceStyle: 'Calm, precise, standard German (Hochdeutsch)',
      personality: 'Thorough, helps locate official product information, and avoids diagnosis or individualized treatment advice',
      knowledgeBoundary: [
        'Has antihistamine tablets (Cetirizin / Loratadin) that do not cause drowsiness (macht nicht müde)',
        'Has saline nasal spray (Meerwasserspray) and eye drops',
        'Knows where official package information and contraindication warnings are displayed; does not provide individualized dosage advice'
      ]
    },
    learnerGoal: 'Explain seasonal allergy symptoms (hay fever, itchy eyes) and ask for medicine that does not make you drowsy',
    stretchGoal: 'Ask where to find official use and contraindication information on the package label',
    targetIntents: ['describe_allergies', 'request_product_information', 'ask_label_instructions'],
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
        form: 'Haben Sie Tabletten, die nicht müde machen?',
        meaning: 'Do you have tablets that do not cause tiredness?',
        usageNote: 'Very useful condition pattern for pharmacy visits.',
        difficulty: 'intermediate'
      },
      {
        id: 'phrase.de.wie_oft',
        form: 'Wie oft am Tag soll ich die Tablette nehmen?',
        meaning: 'How often a day should I take the tablet?',
        usageNote: 'Standard question for dosage instructions.',
        difficulty: 'intermediate'
      }
    ],
    supportPolicy: {
      hintLadderAvailable: true,
      correctionStyle: 'gentle',
      allowSlowing: true
    },
    completionSignals: ['Symptoms described', 'Product-information question asked', 'Official label information located'],
    estimatedMinutes: 4,
    tags: ['pharmacy', 'health', 'medicine', 'allergies'],
    nextMissionId: 'mission-de-ubahn',
    transferPattern: 'Specify requirements & conditions',
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
    transferReason: 'Reuses your counter inquiry pattern when asking Elena at the farmacia for specific remedies.'
  },
  {
    id: 'mission-it-farmacia',
    version: 1,
    language: 'it',
    scenarioFamilyId: 'pharmacy-consultation',
    levelRange: 'A2',
    title: 'Farmacia Santa Croce: Mal di Gola & Rimedi',
    category: 'problems',
    neighborhood: 'Centro Storico · Via dei Neri Farmacia',
    setting: 'A historic Florentine pharmacy with dark walnut cabinets, porcelain apothecary jars, and the faint soothing scent of eucalyptus.',
    aiRole: 'Elena, the helpful pharmacist.',
    character: {
      name: 'Elena',
      role: 'Pharmacist',
      voiceStyle: 'Gentle, articulate, classic Tuscan Italian',
      personality: 'Attentive, helps locate official product information, and avoids diagnosis or individualized treatment advice',
      knowledgeBoundary: [
        'Has propolis throat spray and honey lozenges that do not cause drowsiness',
        'Has saline spray and headache tablets',
        'Knows where package labels provide official use and warning information; does not provide individualized dosage advice'
      ]
    },
    learnerGoal: 'Describe your sore throat and ask for a spray or lozenges that do not cause drowsiness',
    stretchGoal: 'Ask where the package label explains use, warnings, and when professional advice is needed',
    targetIntents: ['describe_throat_pain', 'request_product_information', 'ask_label_instructions'],
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
        form: 'Ha uno spray per la gola che non dia sonnolenza?',
        meaning: 'Do you have a throat spray that does not cause drowsiness?',
        usageNote: 'Polite formal subjunctive request for medical specifications.',
        difficulty: 'intermediate'
      },
      {
        id: 'phrase.it.prima_o_dopo_pasti',
        form: 'Si prende prima o dopo i pasti?',
        meaning: 'Is it taken before or after meals?',
        usageNote: 'Crucial question for medical administration.',
        difficulty: 'elementary'
      }
    ],
    supportPolicy: {
      hintLadderAvailable: true,
      correctionStyle: 'gentle',
      allowSlowing: true
    },
    completionSignals: ['Symptoms described', 'Product-information question asked', 'Official label information located'],
    estimatedMinutes: 4,
    tags: ['health', 'pharmacy', 'symptoms', 'florence'],
    nextMissionId: 'mission-it-stazione',
    transferPattern: 'Clarify official instructions & conditions',
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
    transferReason: 'Reuses your polite request pattern ("...kudasai / onegaishimasu") when asking for headache medicine at the drugstore.'
  },
  {
    id: 'mission-ja-yakkyoku',
    version: 1,
    language: 'ja',
    scenarioFamilyId: 'pharmacy-consultation',
    levelRange: 'A2',
    title: 'Kusuri no Yanaka: Zutsū-yaku to Nomikata',
    category: 'problems',
    neighborhood: 'Yanaka · Yanaka Shotengai Pharmacy',
    setting: 'A quiet Japanese neighborhood drugstore lined with organized aisles of healthcare remedies, vitamin tonics, and eye drops.',
    aiRole: 'Aoi, the registered pharmacist.',
    character: {
      name: 'Aoi',
      role: 'Pharmacist',
      voiceStyle: 'Gentle, clear, supportive Japanese',
      personality: 'Careful listener who helps locate official product information without diagnosing or selecting treatment',
      knowledgeBoundary: [
        'Has headache medicine (zutsuu-yaku / ibuprofen) that is gentle on the stomach and does not cause drowsiness (nemuku naranai)',
        'Has cooling forehead sheets (netsu-sama sheet) and hydration salts',
        'Knows where official package use and warning information is displayed; does not provide individualized dosage advice'
      ]
    },
    learnerGoal: 'Explain you have a headache and ask for medicine that does not make you drowsy',
    stretchGoal: 'Ask where the package label explains official use, warnings, and when to seek professional advice',
    targetIntents: ['describe_headache', 'request_product_information', 'ask_label_instructions'],
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
        form: '眠くならない薬はありますか？',
        meaning: 'Do you have medicine that does not cause drowsiness?',
        usageNote: 'Vital question when purchasing over-the-counter medicine in Japan.',
        difficulty: 'intermediate'
      },
      {
        id: 'phrase.ja.shokugo_nomimasu',
        form: '一回何錠、食後に飲みますか？',
        meaning: 'How many tablets at a time, and do I take it after meals?',
        usageNote: 'Clear question for dosage and intake instructions.',
        difficulty: 'intermediate'
      }
    ],
    supportPolicy: {
      hintLadderAvailable: true,
      correctionStyle: 'gentle',
      allowSlowing: true
    },
    completionSignals: ['Symptoms described', 'Product-information question asked', 'Official label information located'],
    estimatedMinutes: 4,
    tags: ['health', 'pharmacy', 'symptoms', 'medicine'],
    nextMissionId: 'mission-ja-eki',
    transferPattern: 'Specifying conditions & official instructions',
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

/**
 * Backward-compatible re-export. The canonical runtime authority lives in
 * src/content/skills.ts; mission data no longer owns a second skill catalog.
 */
export { COMMUNICATIVE_SKILLS_CATALOG } from '../content/skills';
export type { CommunicativeSkillDefinition as CommunicativeSkillMeta } from '../types';
