import { SCENES } from '../../src/content/scenes';
import { MISSION_CATALOG } from '../../src/data/missions';
const missions = new Map(MISSION_CATALOG.map(m => [m.id, m]));
for (const scene of Object.values(SCENES) as any[]) {
  const mission: any = missions.get(scene.missionId);
  console.log(`\n## ${scene.id} | lang=${scene.language} | mission=${scene.missionId} | cefr=${mission?.cefrLevel ?? '?'} | levelRange=${JSON.stringify(mission?.levelRange ?? null)} | review=${scene.reviewStatus} | opps=${scene.opportunityDefinitions?.length}`);
  for (const o of scene.opportunityDefinitions ?? []) {
    console.log(`   ${o.id} :: ${o.skillId}`);
  }
}
