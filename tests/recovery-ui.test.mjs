import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../backup.html',import.meta.url),'utf8');

test('Recovery screen is canonical and exposes safety controls',()=>{assert.doesNotMatch(html,/state\.jobs/);assert.doesNotMatch(html,/job\.jobId/);assert.match(html,/createSafetySnapshot/);assert.match(html,/listSafetySnapshots/);assert.match(html,/validateBackupPayload/);assert.match(html,/stateHealth/);});

test('Recovery screen exposes explicit safe cloud actions',()=>{assert.match(html,/Safe cloud pull/);assert.match(html,/Safe cloud push/);assert.match(html,/forceCloudPull/);assert.match(html,/forceCloudPush/);});
