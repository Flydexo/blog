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

test('terrain and actors fit the viewport incline at desktop and phone sizes', async () => {
  const { createSceneGeometry } = await import('../src/scripts/sisyphus-geometry.ts');
  const { pushingPose } = await import('../src/scripts/sisyphus-pose.ts');
  for (const [width, height] of [[1440, 900], [1996, 1248], [390, 844], [320, 568], [844, 390], [2560, 1080]]) {
    const scene = createSceneGeometry(width, height);
    assert.equal(scene.groundY(0), height, 'mountain begins at the bottom edge');
    assert.equal((scene.groundY(0) - scene.groundY(width)) / width, height / width);
    assert.ok(Math.abs(scene.groundY(scene.peak.x) - scene.peak.y) < 1e-9);
    assert.ok(width - scene.peak.x < scene.peak.x / 10, 'only a narrow far side is visible');
    const sunClearance = (height - scene.slope * scene.sun.x - scene.sun.y) / Math.hypot(1, scene.slope);
    assert.ok(sunClearance > scene.sun.radius, 'sun stays entirely above the mountain');
    assert.ok(scene.sun.x + scene.sun.radius < width / 2, 'sun stays on the left');
    assert.ok(scene.start < scene.end);
    for (const progress of [0, .43, 1]) {
      const rock = scene.rockPosition(progress);
      assert.ok(rock.x - scene.radius >= 0 && rock.x + scene.radius <= width);
      assert.ok(rock.y - scene.radius >= 0 && rock.y + scene.radius <= height);
      const clearance = (height - scene.slope * rock.x - rock.y) / Math.hypot(1, scene.slope);
      assert.ok(Math.abs(clearance - scene.radius) < 1e-9, 'rock rests on the incline');
      const person = scene.personPosition(progress);
      const transform = ([x, y]) => [
        person.x + (x * Math.cos(scene.tilt) - y * Math.sin(scene.tilt)) * scene.scale,
        person.y + (x * Math.sin(scene.tilt) + y * Math.cos(scene.tilt)) * scene.scale,
      ];
      for (let time = 0; time < 2; time += .1) {
        const pose = pushingPose(0, time);
        for (const leg of [pose.rear, pose.front]) {
          const [hip, knee, ankle] = [leg.hip, leg.knee, leg.ankle].map(transform);
          assert.ok(Math.abs(ankle[1] - scene.groundY(ankle[0])) < 1e-9, 'rotated feet meet the incline');
          const dot = (hip[0] - knee[0]) * (ankle[0] - knee[0]) + (hip[1] - knee[1]) * (ankle[1] - knee[1]);
          assert.ok(Math.abs(dot) < 1e-8, 'rotated knees remain perpendicular');
          for (const [x, y] of [hip, knee, ankle]) {
            assert.ok(x >= 0 && x <= width && y >= 0 && y <= height, 'figure stays visible');
          }
        }
      }
    }
  }
});
