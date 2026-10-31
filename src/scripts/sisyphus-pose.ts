export type Point = [number, number];
export const groundY = (x: number) => 470 - (x - 320) * 0.58;

/** The knee lies on the hip–ankle diameter's circle, giving a true 90° bend. */
export function bentLeg(hip: Point, ankle: Point) {
  const dx = ankle[0] - hip[0], dy = ankle[1] - hip[1];
  const knee: Point = [(hip[0] + ankle[0] + dy) / 2, (hip[1] + ankle[1] - dx) / 2];
  return { hip, knee, ankle };
}

export function pushingPose(x: number, time: number) {
  const y = groundY(x);
  const stride = Math.sin(time * 6) * 3;
  const hip: Point = [x - 15, y - 26];
  const rearX = x - 19 + stride, frontX = x + 10 - stride;
  return {
    hip,
    rear: bentLeg(hip, [rearX, groundY(rearX)]),
    front: bentLeg(hip, [frontX, groundY(frontX)]),
  };
}
