# Solar System · True Scale

A buildless Three.js r180 application. Serve `dist/` over HTTP.

## Physical model

One world unit = one AU = exactly 149,597,870.7 km. Planet meshes are volume-equivalent spheres. Sun uses IAU nominal radius. No logarithmic coordinate transformation or compressed distances. A floating camera origin improves local rendering precision without changing physical coordinates. Mesh tessellation and GPU float precision are finite.

Positions and osculating elements are NASA/JPL Horizons body-center, Sun-centered, geometric states at 2026-09-27 00:00 TDB, J2000 ecliptic/ICRF orientation. Queries use CENTER='500@10', REF_PLANE='ECLIPTIC', REF_SYSTEM='ICRF', OUT_UNITS='AU-D', VEC_CORR='NONE'. Raw independent ELEMENTS and VECTORS responses are retained in `data/`. IDs 199,299,399,499,599,699,799,899,999 refer to body centers, not planetary system barycenters.

Paths are 4096-segment osculating ellipses at the specified epoch, not future trajectories. Bodies remain fixed at the dated snapshot. Shape/rotation details, rings and moons are outside this model.

TRUE SCALE uses radiusKm/AU_KM. VISIBLE PLANETS imposes a seven-CSS-pixel minimum projected radius on planets including Pluto, with no modification to centers, orbital paths, element data, or the Sun. Enlargement fades naturally to physical size on approach. TRUE SCALE replaces spheres smaller than 2 CSS pixels in projected diameter with exactly one centered hollow marker. On zooming in, the sphere returns at 2.2 pixels (0.2 pixel hysteresis). Text labels have no dot or connector in TRUE SCALE. VISIBLE PLANETS retains its existing overlays.

## Sources

- https://ssd.jpl.nasa.gov/horizons/
- https://ssd-api.jpl.nasa.gov/doc/horizons.html
- https://ssd.jpl.nasa.gov/planets/phys_par.html
- https://ssd.jpl.nasa.gov/astro_par.html
- https://iauarchive.eso.org/static/resolutions/IAU2015_English.pdf

## Verification

Run `node verify.mjs`. This validates 45 diameter ratios, 36 semi-major-axis ratios, orbital extrema, eccentricities, inclinations, independent Horizons position vectors and mode radius behavior. The output is published at `verification.json` and summarized in Data & scale verification. Agreement with the independent vectors verifies calculation consistency, not astronomical measurement accuracy.

## Controls

Drag to orbit, scroll/pinch or +/- buttons to zoom, right-drag/two-finger gestures to pan, select a marker or body list entry to focus, R or reset to restore the overview. Source links and the numerical audit are in the data dialog.

Three.js and OrbitControls are vendored under their MIT license in `dist/vendor/LICENSE`.
