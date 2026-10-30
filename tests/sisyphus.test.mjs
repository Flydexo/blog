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
