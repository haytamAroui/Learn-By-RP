import { describe, expect, it } from 'vitest';
import { MISSION_CATALOG } from '../../data/missions';
import {
  FLEMISH_WORK_LOGISTICS_PILOT,
  ROLEPLAY_PROGRAM_CATALOG,
  validateProgramAgainstCatalog,
} from '../../data/programs';
import { WORKPLACE_CONTEXTS } from '../../content/workplaceContexts';
import { validateWorkplaceMissionContract } from './workplaceMissionContract';
import { validateProgramForActivation } from './releaseGates';

const mission = MISSION_CATALOG.find(item => item.id === 'mission-nl-be-work-damaged-delivery')!;

describe('workplace task-based contract', () => {
  it('has one explicitly routable occupational context and no invented programme', () => {
    expect(WORKPLACE_CONTEXTS).toHaveLength(1);
    expect(new Set(WORKPLACE_CONTEXTS.map(item => item.id)).size).toBe(WORKPLACE_CONTEXTS.length);
    for (const context of WORKPLACE_CONTEXTS) {
      expect(ROLEPLAY_PROGRAM_CATALOG.some(program =>
        program.id === context.programId &&
        program.goalBinding?.domain === 'work' &&
        program.goalBinding.contextId === context.id
      )).toBe(true);
      expect(context.taskIds.length).toBeGreaterThan(0);
    }
  });

  it('requires authored Situation/Need/Friction/Rescue/Bridge fields', () => {
    expect(validateWorkplaceMissionContract(mission)).toEqual([]);
    const invalid = {
      ...mission,
      taskContract: { ...mission.taskContract!, communicationNeed: '', realWorldBridge: '' },
    };
    const errors = validateWorkplaceMissionContract(invalid);
    expect(errors).toEqual(expect.arrayContaining([
      expect.stringContaining('communicationNeed'),
      expect.stringContaining('realWorldBridge'),
    ]));
  });

  it('rejects unknown occupation contexts and a task outside the reviewed context', () => {
    const wrong = { ...mission, workplaceContextId: 'made-up-profession', workplaceTaskId: 'fake-task' };
    expect(validateWorkplaceMissionContract(wrong)).toEqual(expect.arrayContaining([
      expect.stringContaining('unknown workplace context'),
      expect.stringContaining('workplace task is not reviewed'),
    ]));
  });

  it('rejects a programme whose goal binding contradicts its missions', () => {
    const invalid = {
      ...FLEMISH_WORK_LOGISTICS_PILOT,
      goalBinding: { domain: 'work' as const, contextId: 'retail' },
    };
    expect(validateProgramAgainstCatalog(invalid).valid).toBe(false);
  });

  it('retains an authoritative draft release gate regardless of valid task DNA', () => {
    expect(validateProgramAgainstCatalog(FLEMISH_WORK_LOGISTICS_PILOT).valid).toBe(true);
    expect(validateProgramForActivation(FLEMISH_WORK_LOGISTICS_PILOT).ready).toBe(false);
  });
});
