// Pixel units are CSS pixels, matching projected DOM marker coordinates.
// Return the major-axis diameter of the perspective projection of a sphere.
export function projectedDiameterPx(radius, x, y, depth, height, fov) {
 if (depth <= 0) return 0;
 if (depth <= radius) return Infinity;
 const focal = height / (2 * Math.tan(fov * Math.PI / 360));
 const denominator = depth * depth - radius * radius;
 return 2 * focal * radius * Math.sqrt(denominator + x*x + y*y) / denominator;
}
export function trueScalePresentation(diameterPx, previousSphere = null) {
 // Always hide physical spheres below 2px. The 0.2px return margin
 // prevents repeated switching when zoom oscillates around that boundary.
 const sphereVisible = previousSphere === false ? diameterPx >= 2.2 : diameterPx >= 2;
 return { sphereVisible, markerVisible: !sphereVisible };
}
