"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ToolIcon } from "@/components/ToolIcon";
import type { ToolConfig } from "@/config/tools";
import {
  detectDocumentCorners,
  quadArea,
  quadStable,
} from "@/core/scan/edgeDetect";
import { buildSearchablePdf, runOcr } from "@/core/scan/ocrPdf";
import {
  downscaleImageData,
  imageDataToDataUrl,
  loadImageData,
  scaleQuad,
  warpPerspective,
} from "@/core/scan/perspective";
import type { Quad, ScannedPage } from "@/core/scan/types";
import { downloadBlob } from "@/core/application/download";
import { sanitizeBaseName } from "@/core/application/outputName";

type DocScanWorkspaceProps = {
  tool: ToolConfig;
};

type Mode = "camera" | "review";

export function DocScanWorkspace({ tool }: DocScanWorkspaceProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const stableCountRef = useRef(0);
  const lastQuadRef = useRef<Quad | null>(null);

  const [mode, setMode] = useState<Mode>("camera");
  const [cameraOn, setCameraOn] = useState(false);
  const [autoEdge, setAutoEdge] = useState(true);
  const [autoCapture, setAutoCapture] = useState(false);
  const [withOcr, setWithOcr] = useState(true);
  const [pages, setPages] = useState<ScannedPage[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("On-device · No upload");
  const [error, setError] = useState("");
  const [outputName, setOutputName] = useState("docscan");

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  }, []);

  const drawOverlay = useCallback((quad: Quad | null, width: number, height: number) => {
    const canvas = overlayRef.current;
    if (!canvas) return;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    if (!quad) return;

    ctx.strokeStyle = "rgba(31, 111, 235, 0.95)";
    ctx.fillStyle = "rgba(31, 111, 235, 0.12)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(quad[0].x, quad[0].y);
    for (let i = 1; i < 4; i += 1) ctx.lineTo(quad[i].x, quad[i].y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    for (const point of quad) {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 7, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
      ctx.strokeStyle = "#1f6feb";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, []);

  const processFrameImage = useCallback(
    async (imageData: ImageData, applyWarp: boolean) => {
      let quad = detectDocumentCorners(
        downscaleImageData(imageData, 480),
      );
      const small = downscaleImageData(imageData, 480);
      quad = scaleQuad(quad, small.width, small.height, imageData.width, imageData.height);

      const warped = applyWarp ? warpPerspective(imageData, quad) : imageData;
      const dataUrl = imageDataToDataUrl(warped);
      const page: ScannedPage = {
        id: crypto.randomUUID(),
        previewUrl: dataUrl,
        imageDataUrl: dataUrl,
      };
      setPages((current) => [...current, page]);
      setStatus(`Captured page ${pages.length + 1}`);
      setMode("review");
      return page;
    },
    [pages.length],
  );

  const captureFromVideo = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      setError("Camera is not ready yet.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const imageData = await loadImageData(video);
      await processFrameImage(imageData, autoEdge);
      if (autoCapture) {
        // stay in camera for batch
        setMode("camera");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Capture failed.");
    } finally {
      setBusy(false);
    }
  }, [autoCapture, autoEdge, processFrameImage]);

  useEffect(() => {
    if (!cameraOn || !autoEdge) {
      if (overlayRef.current) {
        const ctx = overlayRef.current.getContext("2d");
        ctx?.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);
      }
      return;
    }

    const tick = () => {
      const video = videoRef.current;
      if (video && video.readyState >= 2 && video.videoWidth) {
        try {
          const canvas = document.createElement("canvas");
          const sampleW = 320;
          const sampleH = Math.round((video.videoHeight / video.videoWidth) * sampleW);
          canvas.width = sampleW;
          canvas.height = sampleH;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (ctx) {
            ctx.drawImage(video, 0, 0, sampleW, sampleH);
            const sample = ctx.getImageData(0, 0, sampleW, sampleH);
            const smallQuad = detectDocumentCorners(sample);
            const displayW = video.clientWidth || video.videoWidth;
            const displayH = video.clientHeight || video.videoHeight;
            const quad = scaleQuad(smallQuad, sampleW, sampleH, displayW, displayH);
            drawOverlay(quad, displayW, displayH);

            const fullArea = displayW * displayH;
            const areaRatio = quadArea(quad) / fullArea;
            const prev = lastQuadRef.current;
            if (prev && quadStable(prev, quad, 10) && areaRatio > 0.18 && areaRatio < 0.92) {
              stableCountRef.current += 1;
            } else {
              stableCountRef.current = 0;
            }
            lastQuadRef.current = quad;

            if (autoCapture && !busy && stableCountRef.current >= 12) {
              stableCountRef.current = 0;
              void captureFromVideo();
            }
          }
        } catch {
          // ignore frame errors
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [autoCapture, autoEdge, busy, cameraOn, captureFromVideo, drawOverlay]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  async function openCamera() {
    setError("");
    setMode("camera");
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
      setStatus("Live edge tracking · Point at a document");
    } catch {
      setError("Camera permission denied or unavailable. Use Import from Gallery instead.");
      setCameraOn(false);
    }
  }

  async function importFromGallery(fileList: FileList | null) {
    if (!fileList?.length) return;
    setError("");
    setBusy(true);
    try {
      for (const file of Array.from(fileList)) {
        if (!file.type.startsWith("image/")) continue;
        const url = URL.createObjectURL(file);
        const image = new Image();
        image.src = url;
        await image.decode();
        const imageData = await loadImageData(image);
        URL.revokeObjectURL(url);
        await processFrameImage(imageData, autoEdge);
      }
      setMode("review");
      setStatus("Imported from gallery");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setBusy(false);
    }
  }

  async function exportPdf() {
    if (!pages.length || busy) return;
    setBusy(true);
    setError("");
    setStatus(withOcr ? "OCR → searchable PDF…" : "Building PDF…");
    try {
      const enriched: ScannedPage[] = [];
      for (let i = 0; i < pages.length; i += 1) {
        const page = pages[i];
        if (withOcr && !page.ocrText) {
          setStatus(`OCR PDF page ${i + 1}/${pages.length}…`);
          const text = await runOcr(page.imageDataUrl);
          enriched.push({ ...page, ocrText: text });
        } else {
          enriched.push(page);
        }
      }
      setPages(enriched);
      const bytes = await buildSearchablePdf(enriched, false);
      const name = `${sanitizeBaseName(outputName, "docscan")}.pdf`;
      downloadBlob(new Blob([new Uint8Array(bytes)], { type: "application/pdf" }), name);
      setStatus("Searchable PDF ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "PDF export failed.");
    } finally {
      setBusy(false);
    }
  }

  function removePage(id: string) {
    setPages((current) => current.filter((page) => page.id !== id));
  }

  return (
    <div className="docscan">
      <header className="docscan-top">
        <div className="docscan-brand">
          <ToolIcon toolId={tool.id} title={tool.name} size={44} />
          <div>
            <h1>{tool.name}</h1>
            <p>{tool.detail}</p>
          </div>
        </div>
        <div className="docscan-badges">
          <span>On-device · No upload</span>
          <span>Sobel detect</span>
          <span>Homography</span>
          <span>OCR PDF</span>
        </div>
      </header>

      <div className="docscan-phone">
        <div className="docscan-screen">
          {mode === "camera" ? (
            <div className="docscan-camera">
              <video ref={videoRef} playsInline muted autoPlay className="docscan-video" />
              <canvas ref={overlayRef} className="docscan-overlay" />
              {!cameraOn ? (
                <div className="docscan-camera-empty">
                  <h2>DocScan</h2>
                  <p>Live edge tracking, auto-capture, perspective fix, multi-page OCR PDF.</p>
                  <button type="button" className="docscan-primary" onClick={() => void openCamera()}>
                    Open Camera
                  </button>
                  <button
                    type="button"
                    className="docscan-secondary"
                    onClick={() => galleryRef.current?.click()}
                  >
                    Import from Gallery
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="docscan-review">
              <h2>Batch capture</h2>
              <p>{pages.length} PDF page{pages.length === 1 ? "" : "s"} ready</p>
            </div>
          )}

          {pages.length > 0 ? (
            <div className="docscan-strip">
              <div className="docscan-thumbs">
                {pages.map((page, index) => (
                  <div className="docscan-thumb" key={page.id}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={page.previewUrl} alt={`Scan ${index + 1}`} />
                    <span>{index + 1}</span>
                    <button type="button" onClick={() => removePage(page.id)}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              {mode === "camera" ? (
                <button type="button" className="docscan-secondary" onClick={() => setMode("review")}>
                  Review pages
                </button>
              ) : (
                <button type="button" className="docscan-secondary" onClick={() => setMode("camera")}>
                  Back to camera
                </button>
              )}
            </div>
          ) : null}
        </div>

        <div className="docscan-toolbar">
          <div className="docscan-toggles">
            <label>
              <input
                type="checkbox"
                checked={autoEdge}
                onChange={(event) => setAutoEdge(event.target.checked)}
              />
              Auto-edge
            </label>
            <label>
              <input
                type="checkbox"
                checked={autoCapture}
                onChange={(event) => setAutoCapture(event.target.checked)}
              />
              Auto-capture
            </label>
            <label>
              <input
                type="checkbox"
                checked={withOcr}
                onChange={(event) => setWithOcr(event.target.checked)}
              />
              Searchable OCR
            </label>
          </div>

          <div className="docscan-actions">
            <button type="button" className="docscan-secondary" onClick={() => void openCamera()}>
              Open Camera
            </button>
            <button
              type="button"
              className="docscan-secondary"
              onClick={() => galleryRef.current?.click()}
            >
              Import from Gallery
            </button>
            <button
              type="button"
              className="docscan-primary"
              disabled={!cameraOn || busy}
              onClick={() => void captureFromVideo()}
            >
              Capture
            </button>
            <button
              type="button"
              className="docscan-primary"
              disabled={!pages.length || busy}
              onClick={() => void exportPdf()}
            >
              {busy ? "Working…" : "OCR → PDF"}
            </button>
          </div>

          <label className="docscan-name field">
            <span>PDF name</span>
            <input
              value={outputName}
              onChange={(event) => setOutputName(event.target.value)}
              placeholder="docscan"
            />
          </label>

          <p className="docscan-status">{status}</p>
          {error ? <p className="tool-error">{error}</p> : null}
        </div>
      </div>

      <ul className="docscan-features">
        <li>Live edge tracking</li>
        <li>Auto-capture</li>
        <li>Perspective fix / de-skew</li>
        <li>Multi-page batch</li>
        <li>Gallery import</li>
        <li>OCR → searchable PDF</li>
      </ul>

      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(event) => {
          void importFromGallery(event.target.files);
          event.currentTarget.value = "";
        }}
      />
    </div>
  );
}
