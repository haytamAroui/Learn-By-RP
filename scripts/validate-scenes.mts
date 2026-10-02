import { SCENES } from '../src/content/scenes';
import { modelCheckScene } from '../src/features/roleplay/sceneModelChecker';
import { validateSceneDefinition } from '../src/features/roleplay/sceneValidation';

let failed = false;

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

console.log('\nAll released scenes passed static validation and finite-state model checking.');
