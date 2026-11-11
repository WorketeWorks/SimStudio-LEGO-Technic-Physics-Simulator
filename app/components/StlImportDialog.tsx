"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { STLLoader } from "three/addons/loaders/STLLoader.js";
import {
  defaultStlSettings,
  prepareStlGeometry,
  stlStats,
  type StlOrigin,
  type StlSettings,
  type StlUnit,
} from "../stl-import";

type Props = {
  files: File[];
  labels: Record<string, string>;
  onCancel: () => void;
  onImport: (settings: StlSettings) => void;
  /** Replaces the files shown in the dialog. */
  onPickFiles: (files: File[]) => void;
};

const ORIGINS: StlOrigin[] = ["bottom", "center", "top", "mass", "file"];
const UNITS: StlUnit[] = ["mm", "cm", "in", "stud", "fit"];

/**
 * Popup shown before an STL is added: a live preview with the origin marker,
 * and the controls that decide where the part's origin (its "moving place": the
 * point it rotates and animates about) sits.
 */
export default function StlImportDialog({ files, labels: L, onCancel, onImport, onPickFiles }: Props) {
  const picker = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState<StlSettings>(defaultStlSettings);
  const [current, setCurrent] = useState(0);
  const [sources, setSources] = useState<(THREE.BufferGeometry | null)[]>([]);
  const [error, setError] = useState("");
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<{
    set: (geometry: THREE.BufferGeometry | null, color: string) => void;
    dispose: () => void;
  } | null>(null);
  const patch = (next: Partial<StlSettings>) => setSettings((value) => ({ ...value, ...next }));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loader = new STLLoader(),
        list: (THREE.BufferGeometry | null)[] = [];
      for (const file of files) {
        try {
          list.push(loader.parse(await file.arrayBuffer()));
        } catch (reason) {
          list.push(null);
          setError(`${file.name}: ${reason instanceof Error ? reason.message : reason}`);
        }
      }
      if (!cancelled) setSources(list);
    })();
    return () => {
      cancelled = true;
    };
  }, [files]);

  const prepared = useMemo(() => {
    const source = sources[current];
    return source ? prepareStlGeometry(source, settings) : null;
  }, [sources, current, settings]);
  const stats = useMemo(() => (prepared ? stlStats(prepared) : null), [prepared]);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch {
      return;
    }
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(40, 4 / 3, 0.05, 2000),
      pivot = new THREE.Group(),
      content = new THREE.Group();
    scene.background = new THREE.Color(0x1b1f24);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 1.4));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(4, 8, 6);
    scene.add(sun);
    const grid = new THREE.GridHelper(40, 40, 0x56657a, 0x2d3643);
    scene.add(grid);
    // The origin marker: axes + a ball, always drawn on top.
    const axes = new THREE.AxesHelper(3);
    (axes.material as THREE.Material).depthTest = false;
    axes.renderOrder = 10;
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0xffd23a, depthTest: false }),
    );
    ball.renderOrder = 11;
    scene.add(pivot);
    pivot.add(content, axes, ball);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    element.appendChild(renderer.domElement);
    renderer.domElement.style.cssText = "width:100%;height:100%;display:block;border-radius:8px;touch-action:none";
    let yaw = 0.7,
      pitch = 0.45,
      distance = 12,
      frame = 0,
      mesh: THREE.Mesh | null = null,
      box: THREE.Box3Helper | null = null;
    const draw = () => {
      frame = 0;
      const width = element.clientWidth || 480,
        height = element.clientHeight || 320;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      camera.position.set(
        Math.sin(yaw) * Math.cos(pitch) * distance,
        Math.sin(pitch) * distance,
        Math.cos(yaw) * Math.cos(pitch) * distance,
      );
      camera.lookAt(0, Math.max(0.5, distance * 0.08), 0);
      renderer.render(scene, camera);
    };
    const request = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };
    let drag: { x: number; y: number } | null = null;
    const canvas = renderer.domElement;
    canvas.onpointerdown = (event) => {
      drag = { x: event.clientX, y: event.clientY };
      canvas.setPointerCapture(event.pointerId);
    };
    canvas.onpointermove = (event) => {
      if (!drag) return;
      yaw -= (event.clientX - drag.x) * 0.01;
      pitch = Math.min(1.4, Math.max(-0.2, pitch + (event.clientY - drag.y) * 0.01));
      drag = { x: event.clientX, y: event.clientY };
      request();
    };
    canvas.onpointerup = () => (drag = null);
    canvas.onwheel = (event) => {
      event.preventDefault();
      distance = Math.min(400, Math.max(2, distance * (event.deltaY > 0 ? 1.1 : 0.9)));
      request();
    };
    view.current = {
      set(geometry, color) {
        if (mesh) {
          content.remove(mesh);
          mesh.geometry.dispose();
          (mesh.material as THREE.Material).dispose();
          mesh = null;
        }
        if (box) {
          content.remove(box);
          box.dispose();
          box = null;
        }
        if (geometry) {
          mesh = new THREE.Mesh(
            geometry.clone(),
            new THREE.MeshStandardMaterial({ color, roughness: 0.6, flatShading: true }),
          );
          content.add(mesh);
          geometry.computeBoundingBox();
          box = new THREE.Box3Helper(geometry.boundingBox!.clone(), 0x66ccff);
          content.add(box);
          const size = geometry.boundingBox!.getSize(new THREE.Vector3()),
            radius = Math.max(size.x, size.y, size.z, 1);
          distance = Math.max(6, radius * 2.6);
          axes.scale.setScalar(Math.max(0.6, radius / 3));
          ball.scale.setScalar(Math.max(1, radius / 12));
        }
        request();
      },
      dispose() {
        cancelAnimationFrame(frame);
        mesh?.geometry.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      },
    };
    request();
    return () => {
      view.current?.dispose();
      view.current = null;
    };
  }, []);

  useEffect(() => {
    view.current?.set(prepared, settings.color);
  }, [prepared, settings.color]);

  const number = (value: string, fallback: number) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  const turn = (axis: 0 | 1 | 2, step: number) =>
    patch({
      rotate: settings.rotate.map((value, index) =>
        index === axis ? (((value + step) % 360) + 360) % 360 : value,
      ) as StlSettings["rotate"],
    });

  return (
    <div
      className="project-backdrop"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <section className="project-dialog settings-dialog stl-dialog" role="dialog" aria-modal="true">
        <div className="project-dialog-head">
          <div>
            <small>STL</small>
            <h2>{L.stlTitle}</h2>
          </div>
          <button className="project-close" onClick={onCancel} aria-label={L.close}>
            ×
          </button>
        </div>
        <div className="settings-body stl-body">
          <div className="settings-row">
            <span title={files.map((file) => file.name).join(", ")}>
              {files.length === 1 ? files[0].name : `${files.length} ${L.stlFiles}`}
            </span>
            <button type="button" onClick={() => picker.current?.click()}>
              {L.stlChoose}
            </button>
            <input
              ref={picker}
              type="file"
              hidden
              multiple
              accept=".stl,model/stl"
              onChange={(event) => {
                const picked = [...(event.target.files ?? [])];
                event.currentTarget.value = "";
                if (picked.length) {
                  setCurrent(0);
                  setSources([]);
                  setError("");
                  onPickFiles(picked);
                }
              }}
            />
          </div>
          <div className="stl-preview" ref={host} />
          <p className="settings-help">
            {stats
              ? `${stats.triangles.toLocaleString()} △ · ${stats.studs.map((v) => v.toFixed(2)).join(" × ")} studs · ${stats.mm
                  .map((v) => v.toFixed(1))
                  .join(" × ")} mm`
              : error || L.stlLoading}
          </p>
          {files.length > 1 && (
            <div className="settings-row">
              <span>{L.stlFile}</span>
              <select value={current} onChange={(event) => setCurrent(Number(event.target.value))}>
                {files.map((file, index) => (
                  <option key={file.name + index} value={index}>
                    {file.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="settings-row">
            <span>{L.stlOrigin}</span>
            <div className="settings-choice">
              {ORIGINS.map((origin) => (
                <button
                  key={origin}
                  type="button"
                  className={settings.origin === origin ? "active" : ""}
                  onClick={() => patch({ origin })}
                  title={L[`stlOrigin_${origin}Help`]}
                >
                  {L[`stlOrigin_${origin}`]}
                </button>
              ))}
            </div>
          </div>
          <div className="settings-row">
            <span>{L.stlOffset}</span>
            <div className="stl-numbers">
              {(["X", "Y", "Z"] as const).map((axis, index) => (
                <label key={axis}>
                  {axis}
                  <input
                    type="number"
                    step={0.25}
                    value={settings.offset[index]}
                    onChange={(event) =>
                      patch({
                        offset: settings.offset.map((value, i) =>
                          i === index ? number(event.target.value, value) : value,
                        ) as StlSettings["offset"],
                      })
                    }
                  />
                </label>
              ))}
            </div>
          </div>
          <div className="settings-row">
            <span>{L.stlUnits}</span>
            <div className="settings-choice">
              {UNITS.map((unit) => (
                <button
                  key={unit}
                  type="button"
                  className={settings.unit === unit ? "active" : ""}
                  onClick={() => patch({ unit })}
                >
                  {unit === "stud" ? L.stlStuds : unit === "fit" ? L.stlFit : unit}
                </button>
              ))}
            </div>
          </div>
          <div className="settings-row">
            <span>{settings.unit === "fit" ? L.stlFitSize : L.stlScale}</span>
            {settings.unit === "fit" ? (
              <input
                type="number"
                min={0.5}
                step={0.5}
                value={settings.fitStuds}
                onChange={(event) => patch({ fitStuds: Math.max(0.5, number(event.target.value, 8)) })}
              />
            ) : (
              <input
                type="number"
                min={1}
                step={5}
                value={settings.percent}
                onChange={(event) => patch({ percent: Math.max(1, number(event.target.value, 100)) })}
              />
            )}
          </div>
          <div className="settings-row">
            <span>{L.stlUp}</span>
            <div className="settings-choice">
              {(["z", "y"] as const).map((up) => (
                <button key={up} type="button" className={settings.up === up ? "active" : ""} onClick={() => patch({ up })}>
                  {up.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="settings-row">
            <span>{L.stlRotate}</span>
            <div className="stl-numbers">
              {(["X", "Y", "Z"] as const).map((axis, index) => (
                <span key={axis} className="stl-turn">
                  <button type="button" onClick={() => turn(index as 0 | 1 | 2, -90)} aria-label={`${axis} −90°`}>
                    ⟲
                  </button>
                  <b>
                    {axis} {settings.rotate[index]}°
                  </b>
                  <button type="button" onClick={() => turn(index as 0 | 1 | 2, 90)} aria-label={`${axis} +90°`}>
                    ⟳
                  </button>
                </span>
              ))}
            </div>
          </div>
          <label className="settings-row">
            <span>{L.stlColor}</span>
            <input type="color" value={settings.color} onChange={(event) => patch({ color: event.target.value })} />
          </label>
          <p className="settings-help">{L.stlOriginHelp}</p>
          <button
            type="button"
            className="primary settings-reload"
            disabled={!prepared}
            onClick={() => onImport(settings)}
          >
            {L.stlImport} · {files.length}
          </button>
        </div>
      </section>
    </div>
  );
}
