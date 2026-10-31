import { poseSlope } from './sisyphus-pose.ts';

export function createSceneGeometry(width: number, height: number) {
  const slope = height / width;
  const groundY = (x: number) => height - x * slope;
  const scale = Math.max(.9, Math.min(1.6, width / 1120));
  const angle = Math.atan(slope);
  const tilt = Math.atan(poseSlope) - angle;
  const tangent = { x: Math.cos(angle), y: -Math.sin(angle) };
  const normal = { x: -Math.sin(angle), y: -Math.cos(angle) };
  const radius = 28 * scale;
  const personGap = 58 * Math.hypot(1, poseSlope) * scale;
  const peak = { x: width * .94, y: height * .06 };
  const sun = {
    x: width * .23,
    y: height * .28,
    radius: Math.min(51 * scale, height * .085, width * .12),
  };
  const corners = [[-32, -62], [36, -62], [-32, 20], [36, 20]];
  const actorOffsets = corners.map(([x, y]) => ({
    x: (x * Math.cos(tilt) - y * Math.sin(tilt)) * scale - tangent.x * personGap,
    y: (x * Math.sin(tilt) + y * Math.cos(tilt)) * scale - tangent.y * personGap,
  }));
  const minX = Math.min(...actorOffsets.map(point => point.x), normal.x * radius - radius);
  const maxX = Math.max(...actorOffsets.map(point => point.x), normal.x * radius + radius);
  const minY = Math.min(...actorOffsets.map(point => point.y), normal.y * radius - radius);
  const maxY = Math.max(...actorOffsets.map(point => point.y), normal.y * radius + radius);
  const start = Math.max((8 - minX) / width, (8 + maxY) / height);
  const end = Math.min(.92, 1 - (8 + maxX) / width, 1 + (minY - 8) / height);

  const pointOnSlope = (progress: number) => {
    const x = (start + progress * (end - start)) * width;
    return { x, y: groundY(x) };
  };
  const rockPosition = (progress: number) => {
    const point = pointOnSlope(progress);
    return { x: point.x + normal.x * radius, y: point.y + normal.y * radius };
  };
  const personPosition = (progress: number) => {
    const point = pointOnSlope(progress);
    return { x: point.x - tangent.x * personGap, y: point.y - tangent.y * personGap };
  };

  return { width, height, slope, groundY, scale, tilt, tangent, normal, radius, peak, sun, start, end, rockPosition, personPosition };
}

export type SceneGeometry = ReturnType<typeof createSceneGeometry>;
