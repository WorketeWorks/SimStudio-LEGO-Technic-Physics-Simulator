/**
 * MP4 (WebCodecs + mp4-muxer) and GIF (gifenc) encoders. The caller renders the
 * scene frame by frame (`renderFrame`), so the result never depends on the
 * real-time frame rate of the machine.
 */
export type VideoOptions = {
  format: "mp4" | "gif";
  /** Output width in pixels; height follows the viewport aspect ratio. */
  width: number;
  fps: number;
  /** Number of times the animation repeats inside the file. */
  repeats: number;
};

export type VideoJob = {
  duration: number;
  options: VideoOptions;
  /** Viewport aspect ratio (width / height). */
  aspect: number;
  /** Draws the scene at time `t` into `ctx` (size w x h). */
  renderFrame: (t: number, ctx: CanvasRenderingContext2D, w: number, h: number) => Promise<void>;
  onProgress: (fraction: number) => void;
  isCancelled: () => boolean;
};

const even = (value: number) => Math.max(2, Math.round(value / 2) * 2);

export const videoSupported = () =>
  typeof VideoEncoder !== "undefined" && typeof VideoFrame !== "undefined";

export async function encodeVideo(job: VideoJob): Promise<Blob | null> {
  const { options } = job,
    width = even(options.width),
    height = even(width / job.aspect),
    perLoop = Math.max(1, Math.round(job.duration * options.fps)),
    total = perLoop * Math.max(1, options.repeats),
    canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: options.format === "gif" })!,
    frameTime = (index: number) => ((index % perLoop) / perLoop) * job.duration;

  if (options.format === "gif") {
    const { GIFEncoder, quantize, applyPalette } = await import("gifenc");
    const gif = GIFEncoder();
    for (let i = 0; i < total; i++) {
      if (job.isCancelled()) return null;
      await job.renderFrame(frameTime(i), ctx, width, height);
      const { data } = ctx.getImageData(0, 0, width, height),
        palette = quantize(data, 256),
        index = applyPalette(data, palette);
      gif.writeFrame(index, width, height, { palette, delay: Math.round(1000 / options.fps), repeat: 0 });
      job.onProgress((i + 1) / total);
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    gif.finish();
    return new Blob([gif.bytes() as BlobPart], { type: "image/gif" });
  }

  if (!videoSupported()) throw new Error("MP4 export needs a browser with WebCodecs (Chrome, Edge); use GIF instead.");
  const { Muxer, ArrayBufferTarget } = await import("mp4-muxer"),
    target = new ArrayBufferTarget(),
    muxer = new Muxer({ target, video: { codec: "avc", width, height }, fastStart: "in-memory" });
  let failure: Error | undefined;
  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (error) => (failure = error),
  });
  const pixels = width * height;
  let configured = false;
  // ~0.3 bit per pixel per frame keeps fine edges and gradients clean (the old
  // 0.14 showed blocky noise); 4K gets up to 100 Mbps.
  const bitrate = Math.round(Math.min(100e6, Math.max(4e6, pixels * options.fps * 0.3)));
  for (const codec of ["avc1.640034", "avc1.640033", "avc1.64002A", "avc1.4d0028", "avc1.42001f"]) {
    const config = {
      codec,
      width,
      height,
      bitrate,
      framerate: options.fps,
      latencyMode: "quality" as const,
      bitrateMode: "variable" as const,
    };
    if ((await VideoEncoder.isConfigSupported(config)).supported) {
      encoder.configure(config);
      configured = true;
      break;
    }
  }
  if (!configured) throw new Error("This browser cannot encode H.264 at this size; try a smaller width or GIF.");
  for (let i = 0; i < total; i++) {
    if (job.isCancelled()) {
      encoder.close();
      return null;
    }
    if (failure) throw failure;
    await job.renderFrame(frameTime(i), ctx, width, height);
    const frame = new VideoFrame(canvas, {
      timestamp: Math.round((i * 1e6) / options.fps),
      duration: Math.round(1e6 / options.fps),
    });
    encoder.encode(frame, { keyFrame: i % options.fps === 0 });
    frame.close();
    while (encoder.encodeQueueSize > 6) await new Promise((resolve) => setTimeout(resolve, 2));
    job.onProgress((i + 1) / total);
  }
  await encoder.flush();
  if (failure) throw failure;
  muxer.finalize();
  encoder.close();
  return new Blob([target.buffer], { type: "video/mp4" });
}
