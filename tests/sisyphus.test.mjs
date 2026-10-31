import test from 'node:test';
import assert from 'node:assert/strict';
import { Climb } from '../src/scripts/sisyphus-physics.ts';

test('the full climb, fall, and walk back repeat without teleporting', () => {
  const model = new Climb();
  const seen = new Set();
  let restarts = 0;
  for (let frame = 0; frame < 9000; frame++) {
    const rock = model.progress, person = model.person, previousPhase = model.phase;
    model.step(1 / 60);
    seen.add(model.phase);
    if (previousPhase === 'returning' && model.phase === 'climbing') restarts++;
    assert.ok(model.progress >= 0 && model.progress <= 1);
    assert.ok(model.person >= 0 && model.person <= 1);
    assert.ok(Math.abs(model.progress - rock) < .02);
    assert.ok(Math.abs(model.person - person) < .02);
  }
  assert.deepEqual(seen, new Set(['climbing', 'summit', 'falling', 'returning']));
  assert.ok(restarts >= 3);
});

test('pushing knees remain at 90 degrees with feet planted above the slope', async () => {
  const { pushingPose, groundY } = await import('../src/scripts/sisyphus-pose.ts');
  for (const x of [46, 316, 500, 756, 991]) {
    for (let time = 0; time < 2; time += 1 / 60) {
      const pose = pushingPose(x, time);
      for (const { hip, knee, ankle } of [pose.rear, pose.front]) {
        const thigh = [hip[0] - knee[0], hip[1] - knee[1]];
        const calf = [ankle[0] - knee[0], ankle[1] - knee[1]];
        const cosine = (thigh[0] * calf[0] + thigh[1] * calf[1]) / (Math.hypot(...thigh) * Math.hypot(...calf));
        assert.ok(Math.abs(cosine) < 1e-10, 'thigh and calf must be perpendicular');
        assert.equal(ankle[1], groundY(ankle[0]), 'feet must meet the slope');
        assert.ok(knee[1] < groundY(knee[0]), 'knees must not sink into the mountain');
      }
    }
  }
});

test('the uphill face stretches to a summit near the right edge', async () => {
  const { mountainStart, mountainPeak, mountainRise, groundY } = await import('../src/scripts/sisyphus-pose.ts');
  assert.ok(mountainPeak - mountainStart > 950);
  assert.ok(1120 - mountainPeak < (mountainPeak - mountainStart) / 10);
  assert.equal(groundY(mountainStart) - groundY(mountainPeak), mountainRise);
});
