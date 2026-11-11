"use client";

import { useEffect, useRef, useState } from "react";
import type { Ease, Keyframe } from "../animation.ts";

export type TimelineRow = {
  id: string;
  label: string;
  kind: "group" | "piece" | "sub";
  keys: Keyframe[];
};

export type TimelineSelection = { trackId: string; index: number } | null;

export type TimelineLabels = Record<string, string>;

export type TimelineGroupInfo = {
  id: string;
  name: string;
  pivot: [number, number, number];
  parts: { id: number; label: string }[];
};

type Props = {
  labels: TimelineLabels;
  duration: number;
  loop: boolean;
  time: number;
  playing: boolean;
  speed: number;
  previewActive: boolean;
  posing: boolean;
  rows: TimelineRow[];
  /** Label of the current selection's track target, if any. */
  targetLabel: string | null;
  group: TimelineGroupInfo | null;
  selectedKey: TimelineSelection;
  onPlayPause: () => void;
  onStop: () => void;
  onSeek: (time: number) => void;
  onSpeed: (speed: number) => void;
  onDuration: (seconds: number) => void;
  onLoop: (loop: boolean) => void;
  onEditPose: () => void;
  subparts: { key: string; label: string }[];
  subTarget: string | null;
  hasSelection: boolean;
  onSubTarget: (key: string | null) => void;
  onSplitPart: () => void;
  precision: { move: number; turn: number };
  onPrecision: (precision: { move: number; turn: number }) => void;
  onCleanKeys: () => void;
  onAddKey: () => void;
  onSpin: (axis: "x" | "y" | "z", turns: number) => void;
  onBeginPose: () => void;
  onCapturePose: () => void;
  onCancelPose: () => void;
  onSelectKey: (selection: TimelineSelection) => void;
  onUpdateKey: (patch: Partial<Keyframe>) => void;
  onDeleteKey: () => void;
  onDeleteKeyAt: (trackId: string, index: number) => void;
  onEaseKeyAt: (trackId: string, index: number, ease: Ease) => void;
  onRemoveTrack: (trackId: string) => void;
  onRenameGroup: (name: string) => void;
  onPivot: (pivot: [number, number, number]) => void;
  onPivotFromPart: (partId: number) => void;
  onPivotFromBounds: () => void;
  onClose: () => void;
};

const formatTime = (value: number) => {
  const minutes = Math.floor(value / 60),
    seconds = value - minutes * 60;
  return `${minutes}:${seconds.toFixed(2).padStart(5, "0")}`;
};

const num = (value: number) => (Math.abs(value) < 1e-9 ? 0 : +value.toFixed(4));

export default function TimelinePanel(props: Props) {
  const { labels: L } = props,
    lanesRef = useRef<HTMLDivElement>(null),
    [menu, setMenu] = useState<{ x: number; y: number; trackId: string; index: number } | null>(null),
    selectedRow = props.selectedKey
      ? props.rows.find((row) => row.id === props.selectedKey!.trackId)
      : undefined,
    selected = selectedRow?.keys[props.selectedKey?.index ?? -1];

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null),
      onKey = (event: KeyboardEvent) => event.key === "Escape" && close();
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", onKey);
    window.addEventListener("blur", close);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("blur", close);
      window.removeEventListener("resize", close);
    };
  }, [menu]);

  const seekFromPointer = (clientX: number) => {
    const lane = lanesRef.current;
    if (!lane) return;
    const rect = lane.getBoundingClientRect();
    props.onSeek(
      Math.min(
        props.duration,
        Math.max(0, ((clientX - rect.left) / Math.max(1, rect.width)) * props.duration),
      ),
    );
  };

  const percent = (time: number) => `${(time / Math.max(0.001, props.duration)) * 100}%`;

  const triple = (
    title: string,
    values: [number, number, number],
    onChange: (next: [number, number, number]) => void,
    step: number,
  ) => (
    <div className="timeline-field">
      <span>{title}</span>
      {([0, 1, 2] as const).map((axis) => (
        <input
          key={axis}
          type="number"
          step={step}
          value={num(values[axis])}
          onChange={(event) => {
            const next = [...values] as [number, number, number];
            const parsed = Number(event.target.value);
            next[axis] = Number.isFinite(parsed) ? parsed : 0;
            onChange(next);
          }}
          aria-label={`${title} ${"XYZ"[axis]}`}
        />
      ))}
    </div>
  );

  return (
    <section className="timeline-panel" aria-label={L.timeline}>
      <div className="timeline-bar">
        <button
          type="button"
          className="timeline-play"
          onClick={props.onPlayPause}
          title={props.playing ? L.pause : L.play}
        >
          {props.playing ? "❚❚" : "▶"}
        </button>
        <button type="button" onClick={props.onStop} title={L.stop}>
          ■
        </button>
        <output className="timeline-clock">
          {formatTime(props.time)} / {formatTime(props.duration)}
        </output>
        <input
          className="timeline-scrub"
          type="range"
          min={0}
          max={props.duration}
          step={0.01}
          value={Math.min(props.time, props.duration)}
          onChange={(event) => props.onSeek(Number(event.target.value))}
          aria-label={L.time}
        />
        <label className="timeline-mini">
          {L.duration}
          <input
            type="number"
            min={0.1}
            max={600}
            step={0.5}
            value={props.duration}
            onChange={(event) => props.onDuration(Number(event.target.value))}
          />
          s
        </label>
        <label className="timeline-mini">
          <input
            type="checkbox"
            checked={props.loop}
            onChange={(event) => props.onLoop(event.target.checked)}
          />
          {L.loop}
        </label>
        <label className="timeline-mini" title={L.precisionHelp}>
          {L.precision}
          <input
            type="number"
            min={0}
            max={1}
            step={0.01}
            value={props.precision.move}
            onChange={(event) =>
              props.onPrecision({ ...props.precision, move: Math.max(0, Number(event.target.value) || 0) })
            }
          />
          u
          <input
            type="number"
            min={0}
            max={10}
            step={0.1}
            value={props.precision.turn}
            onChange={(event) =>
              props.onPrecision({ ...props.precision, turn: Math.max(0, Number(event.target.value) || 0) })
            }
          />
          °
        </label>
        <button type="button" onClick={props.onCleanKeys} title={L.precisionHelp}>
          ✦ {L.cleanKeys}
        </button>
        <select
          className="timeline-speed"
          value={props.speed}
          onChange={(event) => props.onSpeed(Number(event.target.value))}
          aria-label={L.speed}
        >
          {[0.25, 0.5, 1, 2].map((speed) => (
            <option key={speed} value={speed}>
              {speed}×
            </option>
          ))}
        </select>
        {props.previewActive && !props.posing && (
          <button type="button" onClick={props.onEditPose} title={L.editPoseHelp}>
            ✎ {L.editPose}
          </button>
        )}
        <button type="button" className="timeline-close" onClick={props.onClose} aria-label={L.close}>
          ×
        </button>
      </div>

      <div className="timeline-body">
        <div className="timeline-side">
          {props.posing ? (
            <>
              <b>{L.poseMode}</b>
              <small>{L.poseModeHelp}</small>
              <button type="button" className="primary" onClick={props.onCapturePose}>
                ◆ {L.capturePose}
              </button>
              <button type="button" onClick={props.onCancelPose}>
                {L.cancel}
              </button>
            </>
          ) : (
            <>
              <b>{props.targetLabel ?? L.noTarget}</b>
              {props.subparts.length > 0 && (
                <select
                  value={props.subTarget ?? ""}
                  onChange={(event) => props.onSubTarget(event.target.value || null)}
                  aria-label={L.subPart}
                  title={L.subSplitHelp}
                >
                  <option value="">{L.subWhole}</option>
                  {props.subparts.map((sub) => (
                    <option key={sub.key} value={sub.key}>
                      ⚙ {sub.label}
                    </option>
                  ))}
                </select>
              )}
              {props.hasSelection && props.subparts.length === 0 && (
                <button type="button" onClick={props.onSplitPart} title={L.subSplitHelp}>
                  ⚙ {L.subSplit}
                </button>
              )}
              <button type="button" disabled={!props.targetLabel} onClick={props.onAddKey}>
                ◆ {L.addKey}
              </button>
              <button type="button" disabled={!props.targetLabel || !!props.subTarget} onClick={props.onBeginPose}>
                ✥ {L.poseKey}
              </button>
              <div className="timeline-spin">
                <span>{L.spin}</span>
                {(["x", "y", "z"] as const).map((axis) => (
                  <button
                    key={axis}
                    type="button"
                    disabled={!props.targetLabel}
                    onClick={() => props.onSpin(axis, 1)}
                    title={`${L.spin} 360° ${axis.toUpperCase()}`}
                  >
                    {axis.toUpperCase()}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="timeline-tracks">
          <div
            className="timeline-ruler"
            ref={lanesRef}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              seekFromPointer(event.clientX);
            }}
            onPointerMove={(event) => {
              if (event.buttons & 1) seekFromPointer(event.clientX);
            }}
          >
            {Array.from({ length: Math.min(40, Math.floor(props.duration) + 1) }, (_, i) => {
              const step = Math.max(1, Math.ceil(props.duration / 10)),
                second = i * step;
              return second <= props.duration ? (
                <i key={second} style={{ left: percent(second) }}>
                  {second}s
                </i>
              ) : null;
            })}
            <span className="timeline-head" style={{ left: percent(props.time) }} />
          </div>
          {props.rows.length ? (
            props.rows.map((row) => (
              <div
                key={row.id}
                className={`timeline-row ${
                  props.selectedKey?.trackId === row.id ? "selected" : ""
                }`}
              >
                <span className="timeline-row-label" title={row.label}>
                  {row.kind === "group" ? "▣ " : row.kind === "sub" ? "⚙ " : "● "}
                  {row.label}
                  <button
                    type="button"
                    className="timeline-row-remove"
                    onClick={() => props.onRemoveTrack(row.id)}
                    aria-label={L.removeTrack}
                    title={L.removeTrack}
                  >
                    ×
                  </button>
                </span>
                <div
                  className="timeline-lane"
                  onPointerDown={(event) => {
                    if ((event.target as HTMLElement).closest(".timeline-key")) return;
                    const rect = event.currentTarget.getBoundingClientRect();
                    props.onSeek(
                      Math.min(
                        props.duration,
                        Math.max(0, ((event.clientX - rect.left) / rect.width) * props.duration),
                      ),
                    );
                  }}
                >
                  {row.keys.map((key, index) => (
                    <button
                      type="button"
                      key={`${index}-${key.t}`}
                      className={`timeline-key ${
                        props.selectedKey?.trackId === row.id &&
                        props.selectedKey.index === index
                          ? "active"
                          : ""
                      }`}
                      style={{ left: percent(key.t) }}
                      onClick={() => {
                        props.onSelectKey({ trackId: row.id, index });
                        props.onSeek(key.t);
                      }}
                      onContextMenu={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        props.onSelectKey({ trackId: row.id, index });
                        setMenu({
                          x: Math.min(event.clientX, window.innerWidth - 190),
                          y: Math.min(event.clientY, window.innerHeight - 170),
                          trackId: row.id,
                          index,
                        });
                      }}
                      title={`${key.t.toFixed(2)} s`}
                      aria-label={`${L.key} ${key.t.toFixed(2)} s`}
                    />
                  ))}
                  <span className="timeline-head" style={{ left: percent(props.time) }} />
                </div>
              </div>
            ))
          ) : (
            <p className="timeline-empty">{L.emptyTimeline}</p>
          )}
        </div>

        <div className="timeline-editor">
          {selected ? (
            <>
              <b>
                {L.key} · {selectedRow?.label}
              </b>
              <label className="timeline-field">
                <span>{L.time}</span>
                <input
                  type="number"
                  min={0}
                  max={props.duration}
                  step={0.05}
                  value={num(selected.t)}
                  onChange={(event) => props.onUpdateKey({ t: Number(event.target.value) })}
                />
              </label>
              {triple(L.move, selected.p, (p) => props.onUpdateKey({ p }), 0.1)}
              {triple(L.rotate, selected.r, (r) => props.onUpdateKey({ r }), 5)}
              <label className="timeline-field">
                <span>{L.ease}</span>
                <select
                  value={selected.e}
                  onChange={(event) => props.onUpdateKey({ e: event.target.value as Ease })}
                >
                  <option value="linear">{L.easeLinear}</option>
                  <option value="easeInOut">{L.easeInOut}</option>
                  <option value="step">{L.easeStep}</option>
                </select>
              </label>
              <button type="button" onClick={props.onDeleteKey}>
                {L.deleteKey}
              </button>
            </>
          ) : props.group ? (
            <>
              <b>
                {L.group} · {props.group.parts.length} {L.parts}
              </b>
              <label className="timeline-field">
                <span>{L.name}</span>
                <input
                  type="text"
                  maxLength={40}
                  value={props.group.name}
                  onChange={(event) => props.onRenameGroup(event.target.value)}
                />
              </label>
              {triple(L.pivot, props.group.pivot, props.onPivot, 0.25)}
              <div className="timeline-field">
                <span>{L.pivotFrom}</span>
                <select
                  value=""
                  onChange={(event) => {
                    if (event.target.value === "bounds") props.onPivotFromBounds();
                    else if (event.target.value) props.onPivotFromPart(Number(event.target.value));
                  }}
                >
                  <option value="">…</option>
                  <option value="bounds">{L.pivotBounds}</option>
                  {props.group.parts.map((part) => (
                    <option key={part.id} value={part.id}>
                      {part.label}
                    </option>
                  ))}
                </select>
              </div>
              <small>{L.rotationVectorHelp}</small>
            </>
          ) : (
            <small>{L.selectKeyHelp}</small>
          )}
        </div>
      </div>
      {menu && (
        <div
          className="timeline-menu"
          role="menu"
          style={{ left: menu.x, top: menu.y }}
          onPointerDown={(event) => event.stopPropagation()}
          onContextMenu={(event) => event.preventDefault()}
        >
          <button
            type="button"
            role="menuitem"
            className="danger"
            onClick={() => {
              props.onDeleteKeyAt(menu.trackId, menu.index);
              setMenu(null);
            }}
          >
            ✕ {L.deleteKey}
          </button>
          <hr />
          {(["linear", "easeInOut", "step"] as const).map((ease) => (
            <button
              type="button"
              role="menuitem"
              key={ease}
              onClick={() => {
                props.onEaseKeyAt(menu.trackId, menu.index, ease);
                setMenu(null);
              }}
            >
              {L.ease}: {ease === "linear" ? L.easeLinear : ease === "easeInOut" ? L.easeInOut : L.easeStep}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
