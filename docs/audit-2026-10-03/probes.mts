// Audit reproductions. Run: npx tsx docs/audit-2026-10-03/probes.mts
// Uses in-memory SQLite and mocked native APIs; never calls a paid provider.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { createRequire } from 'node:module';
import 'fake-indexeddb/auto';
import express from 'express';
import { validateAssessmentProposal, validateDrillReview } from '../../src/features/learning/learningCore';
import { matchPhraseInText } from '../../src/features/learning/matching';
import { resolveProviderIdentity, ProviderRateLimiter } from '../../server/security/requestGuard';
import { createNodeSqliteAdapter } from '../../src/features/archive/db';
import { SqliteSceneStore } from '../../src/features/roleplay/SqliteSceneStore';
import { __setSceneStoreForTesting, createHostedSession, applySceneAction, getSceneSnapshot, rebuildSceneStateFromEventLog } from '../../src/features/roleplay/sceneStore';
import { CAFE_SCENE } from '../../src/content/scenes';
import { roleplayRouter } from '../../server/roleplay/routes';
import { reduceLifecycle } from '../../src/features/session/lifecycle';

const require=createRequire(import.meta.url);
const database=require('../../src/features/archive/database.ts');
const {SqliteArchiveRepository}=require('../../src/features/archive/SqliteArchiveRepository.ts');
const {IndexedDbArchiveRepository}=require('../../src/features/archive/IndexedDbArchiveRepository.ts');
// Use the same CommonJS module instance as repository internals for the
// validator's private WeakSet write capability.
const core=require('../../src/features/learning/learningCore.ts');

const passage: any = { id: 'p1', sessionId: 's1', attemptId: 'attempt-1', speaker: 'user', revisionKey: 'rev-1', status: 'final', assemblyVersion: 1, text: 'hola', modality: 'typed', startedAt: '2026-10-03T10:00:00Z', fragments: [] };
const proposal: any = { schemaVersion: 2, sessionId: 's1', attemptId: 'attempt-1', taskOutcome: 'unknown', items: [{ itemId: 'phrase.es.cafe_leche', candidateForm: 'hola', meaning: 'coffee with milk', quote: 'hola', sourcePassageId: 'p1', sourceRevision: 'rev-1', modality: 'spoken', retrievalProposal: 'unknown' }] };
// The original saved results predate architecture Phase 1. Supply the newly
// required authored context so this probe remains runnable after that change.
console.log('MODEL ITEM/MODALITY:', JSON.stringify(validateAssessmentProposal(proposal, [passage], [], {sessionId:'s1',attemptId:'attempt-1',candidates:[{id:'phrase.es.cafe_leche',form:'Un café con leche',meaning:'coffee with milk'}]}).validatedObservations.map(o => ({itemId:o.itemId, form:o.candidateForm, modality:o.modality, retrieval:o.retrieval}))));
console.log('NEGATION MATCH:', JSON.stringify(matchPhraseInText('Un café con leche', 'No quiero un café con leche.')));
console.log('WRONG DRILL ANSWER:', JSON.stringify(validateDrillReview({ phrase:{ id:'phrase.es.cafe_leche', form:'Un café con leche', meaning:'coffee with milk' }, quote:'banana', modality:'spoken', selfReportedResult:'remembered', learnerAttemptCaptured:true, answerRevealedBeforeAttempt:false, modelAudioPlayedBeforeAttempt:false }).observations.map(o=>({quote:o.quote,retrieval:o.retrieval}))));
const request = (token: string) => ({header:(name:string)=>name==='authorization'?`Bearer ${token}`:''});
const limiter = new ProviderRateLimiter();
const identity = resolveProviderIdentity(request('made-up')).identity!;
let accepted = 0;
for(let i=0;i<13;i++) if(limiter.take(identity,'realtime')) accepted++;
console.log('FORGED IDENTITY:', JSON.stringify({identity, accepted, rotatedAccepted:limiter.take(resolveProviderIdentity(request('another-made-up')).identity!,'realtime')}));
let lifecycle:any='preflight';
for(const event of ['END','ENDED','ASSESS_START','ASSESS_OK'] as const) lifecycle=reduceLifecycle(lifecycle,event);
console.log('ACTUAL FINISH EVENT SEQUENCE:',lifecycle);

// Execute the actual native transport with mocked Expo imports. Bound callback
// recursion at 25 to make the probe safe instead of exhausting the stack.
const exports: any = {};
const source = ts.transpileModule(readFileSync('src/providers/voice/nativeVoiceTransport.ts','utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
let recognizerStarts=0;
const mocks: Record<string,any> = {
  'react-native':{Platform:{OS:'web'}},
  'expo-speech-recognition':{ExpoSpeechRecognitionModule:{addListener:()=>({remove(){}}),requestPermissionsAsync:async()=>({granted:true}),start:()=>{recognizerStarts++},stop(){}}},
  'expo-audio':{setAudioModeAsync:async()=>{}},
  'expo-file-system':{},
  'expo-speech':{stop(){},getAvailableVoicesAsync:async()=>[],speak(){}},
  './language':{resolveSpeechLocale:()=> 'es-ES',pickBestNativeVoice:()=>null},
};
vm.runInNewContext(source,{exports,require:(id:string)=>mocks[id],console,globalThis:{},setTimeout,clearTimeout});
const transport = new exports.NativeVoiceTransport();
let playbackEnds=0;
transport.subscribe((event:any)=>{if(event.type==='playback_end'){playbackEnds++; if(playbackEnds<25) void transport.startListening();}});
transport.stopPlayback();
await new Promise(resolve=>setTimeout(resolve,50));
console.log('PLAYBACK/LISTEN LOOP:',JSON.stringify({playbackEnds,recognizerStarts,stoppedAtSafetyLimit:25}));
transport.dispose();

const archiveDriver=createNodeSqliteAdapter();
database.__setDatabaseForTesting(archiveDriver.db);
await database.migrate(archiveDriver.db);
try {
  for(const [label,repo] of [['sqlite',new SqliteArchiveRepository()],['indexeddb',new IndexedDbArchiveRepository()]] as const){
    const phrase=(await repo.getPhrases())[0];
    const drill=core.validateDrillReview({phrase,quote:phrase.form,modality:'spoken',selfReportedResult:'remembered',learnerAttemptCaptured:true,answerRevealedBeforeAttempt:false,modelAudioPlayedBeforeAttempt:false});
    await repo.recordDrillReview({phrase,evidence:drill});
    const before=(await repo.getPhrases()).find((p:any)=>p.id===phrase.id);
    await repo.deleteSession('drill');
    const after=(await repo.getPhrases()).find((p:any)=>p.id===phrase.id);
    console.log('DELETE LAST EVIDENCE:',JSON.stringify({driver:label,before:before.recallStatus,after:after.recallStatus,remainingObservations:(await repo.getObservations()).length,unassistedCount:after.stats.unassistedCount}));
    const second=core.validateDrillReview({phrase,quote:phrase.form,modality:'spoken',selfReportedResult:'remembered',learnerAttemptCaptured:true,answerRevealedBeforeAttempt:false,modelAudioPlayedBeforeAttempt:false});
    await repo.recordDrillReview({phrase,evidence:second});
    await new Promise(resolve=>setTimeout(resolve,2));
    const supported=core.validateDrillReview({phrase,quote:phrase.form,modality:'spoken',selfReportedResult:'supported',learnerAttemptCaptured:true,answerRevealedBeforeAttempt:true,modelAudioPlayedBeforeAttempt:false});
    await repo.recordDrillReview({phrase,evidence:supported});
    const latest=(await repo.getPhrases()).find((p:any)=>p.id===phrase.id);
    console.log('DRILL HISTORY PROJECTION:',JSON.stringify({driver:label,remainingObservations:(await repo.getObservations()).length,recallStatus:latest.recallStatus,unassistedCount:latest.stats.unassistedCount}));
  }
}finally{database.__setDatabaseForTesting(null);archiveDriver.close();}

const driver = createNodeSqliteAdapter();
await __setSceneStoreForTesting(await SqliteSceneStore.open(driver.db));
try {
  await createHostedSession({sessionId:'race',sceneId:CAFE_SCENE.id,missionId:CAFE_SCENE.missionId,attemptId:'attempt-1'});
  const base: any = {sessionId:'race',attemptId:'attempt-1',expectedSceneRevision:1,action:'confirm_order_item',payload:{item:'café con leche'},sourceTurnIds:['p1']};
  const results = await Promise.all([applySceneAction({...base,actionId:'race-a'}),applySceneAction({...base,actionId:'race-b'})]);
  console.log('CONCURRENT SCENE ACTIONS:',JSON.stringify(results.map(r=>({accepted:r.accepted,revision:r.revision}))));
  try {await rebuildSceneStateFromEventLog('race'); console.log('REPLAY: succeeded');} catch(e:any){console.log('REPLAY:', e.message);}
  console.log('SNAPSHOT:',(await getSceneSnapshot('race'))?.revision);

  process.env.SCENE_DB_PATH=':memory:';
  const app=express(); app.use(express.json()); app.use(roleplayRouter);
  const listener=app.listen(0,'127.0.0.1');
  await new Promise<void>(resolve=>listener.once('listening',resolve));
  const address:any=listener.address();
  try {
    const create=await fetch(`http://127.0.0.1:${address.port}/v1/voice/sessions`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'anonymous',sceneId:CAFE_SCENE.id,missionId:CAFE_SCENE.missionId,attemptId:'attempt-1'})});
    const response=await fetch(`http://127.0.0.1:${address.port}/v1/voice/sessions/anonymous`);
    const close=await fetch(`http://127.0.0.1:${address.port}/v1/voice/sessions/anonymous/close`,{method:'POST'});
    console.log('ANONYMOUS SCENE ACCESS:',JSON.stringify({createStatus:create.status,readStatus:response.status,closeStatus:close.status}));
  }finally{await new Promise<void>((resolve,reject)=>listener.close(error=>error?reject(error):resolve()));}
} finally {await __setSceneStoreForTesting(null);driver.close();}
