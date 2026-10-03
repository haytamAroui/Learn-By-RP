import { SCENES } from '../src/content/scenes';
import {
  validateMissionScenarioFamily,
  validateScenarioFamilyCatalog,
} from '../src/content/scenarioFamilies';
import { MISSION_CATALOG } from '../src/data/missions';
import { modelCheckScene } from '../src/features/roleplay/sceneModelChecker';
import { validateSceneDefinition } from '../src/features/roleplay/sceneValidation';
import { validateCharacterBehaviorPolicy } from '../src/features/roleplay/characterPolicy';
import { ROLEPLAY_PROGRAM_CATALOG } from '../src/data/programs';
import { validateProgramForActivation } from '../src/features/program/releaseGates';
import { LAUNCH_CONTENT_SPECS, validateLaunchContentCoverage } from '../src/content/launchContent';

let failed = false;

const familyCatalog = validateScenarioFamilyCatalog();
if (!familyCatalog.valid) {
  failed = true;
  for (const error of familyCatalog.errors) {
    console.error(`  ERROR scenario-family catalog: ${error}`);
  }
}

for (const mission of MISSION_CATALOG) {
  const errors = [
    ...validateMissionScenarioFamily(mission),
    ...validateCharacterBehaviorPolicy(mission),
  ];
  if (errors.length === 0) continue;
  failed = true;
  for (const error of errors) {
    console.error(`  ERROR mission scenario-family: ${error}`);
  }
}

for (const program of ROLEPLAY_PROGRAM_CATALOG) {
  // Draft/reviewed programs are allowed to exist for authoring and preview. A
  // program labeled released, however, must pass every deterministic activation
  // gate or the build fails.
  if (program.reviewStatus !== 'released') continue;
  const result = validateProgramForActivation(program);
  if (!result.ready) {
    failed = true;
    for (const error of result.errors) {
      console.error(`  ERROR released program ${program.id}: ${error}`);
    }
  }
}

for (const spec of LAUNCH_CONTENT_SPECS) {
  const launchCoverage = validateLaunchContentCoverage(spec);
  if (!launchCoverage.valid) {
    failed = true;
    for (const error of launchCoverage.errors) {
      console.error(`  ERROR launch-content coverage [${spec.targetLocale}]: ${error}`);
    }
  } else {
    console.log(`\n[launch-content] ${spec.targetLocale} core skill coverage`);
    for (const item of launchCoverage.coverage) {
      console.log(
        `  ${item.skillId}: ${item.scenarioFamilyIds.length} families (${item.scenarioFamilyIds.join(', ')})`
      );
    }
  }
}

for (const scene of Object.values(SCENES)) {
  if (scene.reviewStatus !== 'released') continue;

  const staticResult = validateSceneDefinition(scene);
  const model = staticResult.valid ? modelCheckScene(scene) : null;

  console.log(`\n[scene] ${scene.id} v${scene.version}`);

  if (!staticResult.valid) {
    failed = true;
    for (const error of staticResult.errors) console.error(`  ERROR static: ${error}`);
    continue;
  }

  console.log('  static: valid');
  console.log(`  reachable states: ${model!.reachableStateCount}`);
  console.log(
    `  reachable actions: ${model!.reachableActions.join(', ') || '(none)'}`
  );
  console.log(
    `  reachable opportunities: ${model!.reachableOpportunityIds.join(', ') || '(none)'}`
  );
  console.log(
    `  reachable pressure branches: ${model!.reachablePressureBranchIds.join(', ') || '(none)'}`
  );

  if (model!.achievedPath) {
    console.log(
      `  dry-run achieved: ${model!.achievedPath.map(step => step.action).join(' -> ')}`
    );
  } else {
    console.log('  dry-run achieved: NONE');
  }

  for (const warning of model!.warnings) {
    console.warn(`  WARN: ${warning}`);
  }

  if (model!.errors.length > 0) {
    failed = true;
    for (const error of model!.errors) console.error(`  ERROR model: ${error}`);
  }
}

if (failed) {
  console.error('\nScene content validation failed.');
  process.exit(1);
}

console.log('\nAll released scenes/programs and mission safety/scenario-family references passed content validation.');
