import test from 'node:test';
import assert from 'node:assert/strict';
import { Climb } from '../src/scripts/sisyphus-physics.ts';

test('the full climb, fall, and walk back repeat without teleporting', () => {
  const model = new Climb();
  const seen = new Set();
  for (let frame = 0; frame < 9000; frame++) {
    const rock = model.progress, person = model.person;
    model.step(1 / 60);
    seen.add(model.phase);
    assert.ok(model.progress >= 0 && model.progress <= 1);
    assert.ok(model.person >= 0 && model.person <= 1);
    assert.ok(Math.abs(model.progress - rock) < .02);
    assert.ok(Math.abs(model.person - person) < .02);
  }
  assert.deepEqual(seen, new Set(['climbing', 'summit', 'falling', 'returning']));
  assert.ok(model.ascent >= 4);
});

test('help moves the stone uphill and hindering moves it downhill', () => {
  const help = new Climb(), hinder = new Climb(), ordinary = new Climb();
  help.push(1); hinder.push(-1);
  for (let frame = 0; frame < 30; frame++) [help, hinder, ordinary].forEach(m => m.step(1 / 60));
  assert.ok(help.progress > ordinary.progress);
  assert.ok(hinder.progress < .43);
});

test('paused interaction steps the scene without starting animation', () => {
  const model = new Climb();
  model.push(1, true);
  assert.equal(model.time, 0);
  assert.equal(model.progress, .49);
  model.push(-1, true);
  assert.equal(model.progress, .43);
  assert.equal(model.person, model.progress);
});

test('dragging clamps to the slope and the loop recovers from either end', () => {
  const model = new Climb();
  model.dragTo(5); assert.equal(model.progress, 1);
  model.step(.02); assert.equal(model.phase, 'summit');
  model.dragTo(-5); assert.equal(model.progress, 0);
  model.step(.02); assert.equal(model.phase, 'climbing');
  assert.ok(model.progress > 0);
});

test('repeated pushes cannot take the stone outside the mountain', () => {
  const model = new Climb();
  for (let frame = 0; frame < 6000; frame++) {
    model.push(frame % 400 < 200 ? 1 : -1);
    model.step(1 / 60);
    assert.ok(model.progress >= 0 && model.progress <= 1);
  }
});

test('pushing knees remain at 90 degrees with feet planted above the slope', async () => {
  const { pushingPose, groundY } = await import('../src/scripts/sisyphus-pose.ts');
  for (const x of [316, 500, 756]) {
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
