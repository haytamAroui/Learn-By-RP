import type { UiLanguage } from '../types';

/**
 * Reviewed routing vocabulary, not a generated catalogue of promised courses.
 * A work context becomes selectable only when a curated programme exists.
 * Availability of a preview does NOT mean the programme is executable.
 */
export interface WorkplaceContextDefinition {
  id: string;
  programId: string;
  locale: 'nl-BE';
  label: Record<UiLanguage, string>;
  description: Record<UiLanguage, string>;
  /** Stable task ids, useful for future occupation-specific coverage checks. */
  taskIds: readonly string[];
}

export const WORKPLACE_CONTEXTS: readonly WorkplaceContextDefinition[] = [
  {
    id: 'logistics-warehouse',
    programId: 'program.nl-be.work.logistics.pilot',
    locale: 'nl-BE',
    label: {
      en: 'Logistics & warehouse',
      fr: 'Logistique et entrepôt',
      es: 'Logística y almacén',
      nl: 'Logistiek & magazijn',
    },
    description: {
      en: 'Report a delivery problem, ask your supervisor what to do and confirm instructions.',
      fr: 'Signalez un problème de livraison, demandez une consigne et vérifiez ce que vous avez compris.',
      es: 'Comunica un problema de entrega, pregunta qué hacer y confirma instrucciones.',
      nl: 'Meld een probleem met een levering, vraag naar de volgende stap en bevestig instructies.',
    },
    taskIds: ['work.logistics.report-damaged-delivery'],
  },
] as const;

export function workplaceContextFor(id: string): WorkplaceContextDefinition | undefined {
  return WORKPLACE_CONTEXTS.find(context => context.id === id);
}
