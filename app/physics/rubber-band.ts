import * as THREE from "three";

import type { RubberBand } from "../editor/types";

// Keep neighbouring collision balls overlapping slightly. At larger spacing a
// thin LEGO liftarm can pass through the gaps between rope particles.
const nodeSpacing = 0.11;

export const sampleRubberBand = (guides: THREE.Vector3[], minimumLength = 0) => {
  const nodes: THREE.Vector3[] = [];
  const routeLength = rubberBandLength(guides);
  const density = Math.max(1, minimumLength / Math.max(routeLength, 1.0e-5));
  for (let index = 0; index < guides.length; index++) {
    const start = guides[index];
    const end = guides[(index + 1) % guides.length];
    const count = Math.max(1, Math.ceil((start.distanceTo(end) * density) / nodeSpacing));
    for (let step = 0; step < count; step++)
      nodes.push(start.clone().lerp(end, step / count));
  }
  return nodes;
};

export const rubberBandLength = (guides: THREE.Vector3[]) =>
  guides.reduce(
    (length, point, index) => length + point.distanceTo(guides[(index + 1) % guides.length]),
    0,
  );

export const makeRubberBandLine = (color: number) =>
  new THREE.Line(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.92 }),
  );

export const makeRubberBandMarkers = (color: number) =>
  new THREE.Points(
    new THREE.BufferGeometry(),
    new THREE.PointsMaterial({ color, size: 10, sizeAttenuation: false, depthTest: false }),
  );

export const makeRubberBandVisual = (color: number) => {
  const visual = new THREE.Group();
  visual.userData.segmentGeometry = new THREE.CylinderGeometry(1, 1, 1, 10);
  visual.userData.nodeGeometry = new THREE.SphereGeometry(1, 12, 8);
  visual.userData.bandMaterial = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.72,
    metalness: 0,
  });
  visual.userData.nodeMaterial = new THREE.MeshStandardMaterial({
    color: 0x2584ef,
    roughness: 0.55,
    emissive: 0x061d38,
  });
  return visual;
};

export const drawRubberBand = (band: RubberBand, points = band.guides) => {
  const loop = [...points, points[0]].flatMap((point) => point.toArray());
  band.line.geometry.setAttribute("position", new THREE.Float32BufferAttribute(loop, 3));
  band.line.geometry.computeBoundingSphere();
  if (band.markers) {
    band.markers.geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(points.flatMap((point) => point.toArray()), 3),
    );
    band.markers.geometry.computeBoundingSphere();
  }
  if (band.visual) {
    const visual = band.visual,
      segmentGeometry = visual.userData.segmentGeometry as THREE.BufferGeometry,
      nodeGeometry = visual.userData.nodeGeometry as THREE.BufferGeometry,
      bandMaterial = visual.userData.bandMaterial as THREE.Material,
      nodeMaterial = visual.userData.nodeMaterial as THREE.Material,
      required = points.length * 2;
    if (visual.userData.pointCount !== points.length) {
      visual.clear();
      visual.userData.pointCount = points.length;
    }
    while (visual.children.length < required) {
      const index = visual.children.length;
      const mesh = new THREE.Mesh(
        index < points.length ? segmentGeometry : nodeGeometry,
        index < points.length ? bandMaterial : nodeMaterial,
      );
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.rubberNode = index >= points.length;
      if (mesh.userData.rubberNode)
        mesh.visible = visual.userData.handlesVisible === true;
      visual.add(mesh);
    }
    while (visual.children.length > required) visual.remove(visual.children.at(-1)!);
    for (let index = 0; index < points.length; index++) {
      const start = points[index],
        end = points[(index + 1) % points.length],
        segment = visual.children[index] as THREE.Mesh,
        node = visual.children[points.length + index] as THREE.Mesh,
        delta = end.clone().sub(start),
        length = delta.length();
      segment.position.copy(start).lerp(end, 0.5);
      segment.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        length > 1e-6 ? delta.clone().multiplyScalar(1 / length) : new THREE.Vector3(0, 1, 0),
      );
      segment.scale.set(band.radius, length, band.radius);
      node.position.copy(start);
      node.scale.setScalar(band.radius * 1.8);
    }
    visual.updateMatrixWorld(true);
  }
};

export const disposeRubberBand = (band: RubberBand) => {
  band.line.geometry.dispose();
  (band.line.material as THREE.Material).dispose();
  band.markers?.geometry.dispose();
  if (band.markers) (band.markers.material as THREE.Material).dispose();
  if (band.visual) {
    (band.visual.userData.segmentGeometry as THREE.BufferGeometry).dispose();
    (band.visual.userData.nodeGeometry as THREE.BufferGeometry).dispose();
    (band.visual.userData.bandMaterial as THREE.Material).dispose();
    (band.visual.userData.nodeMaterial as THREE.Material).dispose();
  }
};
