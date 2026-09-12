import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Maximize2, X } from "lucide-react";

export function usePreviewDimensions(url, isVideo) {
  const [loaded, setLoaded] = useState(null);
  useEffect(() => {
    if (!url) return;
    let active = true;
    const asset = isVideo ? document.createElement("video") : new window.Image();
    const event = isVideo ? "loadedmetadata" : "load";
    const read = () => {
      const width = isVideo ? asset.videoWidth : asset.naturalWidth;
      const height = isVideo ? asset.videoHeight : asset.naturalHeight;
      if (active && width > 0 && height > 0) setLoaded({ url, width, height });
    };
    asset.addEventListener(event, read);
    if (isVideo) asset.preload = "metadata";
    asset.src = url;
    return () => {
      active = false;
      asset.removeEventListener(event, read);
      if (isVideo) { asset.removeAttribute("src"); asset.load(); }
    };
  }, [url, isVideo]);
  return url && loaded?.url === url ? loaded : null;
}

export function getPreviewGeometry(platform, format, dimensions) {
  // 9:16 is the vertical placement canvas, not a constraint on the source file.
  const vertical = platform === "tt" || (platform === "ig" && ["story", "reel"].includes(format));
  const sourceRatio = dimensions ? dimensions.width / dimensions.height : null;
  const ratio = vertical ? 9 / 16 : sourceRatio || (platform === "yt" ? 16 / 9 : 1);
  const known = [[1, "1:1"], [4 / 5, "4:5"], [3 / 4, "3:4"], [9 / 16, "9:16"], [16 / 9, "16:9"], [1.91, "1.91:1"]];
  const ratioLabel = known.find(([number]) => Math.abs(number - ratio) < .003)?.[1] || `${ratio.toFixed(2)}:1`;
  return { ratio, ratioLabel, vertical, letterboxed: vertical && sourceRatio && Math.abs(sourceRatio - ratio) > .003 };
}

export function fitPreviewSize(availableWidth, availableHeight, contentWidth, contentHeight) {
  if (![availableWidth, availableHeight, contentWidth, contentHeight].every(value => Number.isFinite(value) && value > 0)) return null;
  const scale = Math.min(availableWidth / contentWidth, availableHeight / contentHeight);
  return { scale, width: contentWidth * scale, height: contentHeight * scale };
}

function FittedPostPreview({ children, frameStyle, label }) {
  const frame = useRef(null);
  const surface = useRef(null);
  const [fit, setFit] = useState(null);
  useLayoutEffect(() => {
    const container = frame.current;
    const content = surface.current;
    if (!container || !content) return;
    const measure = () => {
      // Measure the unscaled post, then fit the entire frame with one scale.
      // The small inset keeps fractional pixels inside the visible area.
      const next = fitPreviewSize(container.clientWidth - 2, container.clientHeight - 2, content.offsetWidth, content.offsetHeight);
      setFit(previous => previous?.scale === next?.scale && previous?.height === next?.height && previous?.width === next?.width ? previous : next);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    observer.observe(content);
    measure();
    return () => observer.disconnect();
  }, []);
  return <div ref={frame} className="tw-preview-frame tw-preview-fit-frame" style={frameStyle} role="region" aria-label={label}>
    <div className="tw-preview-fit-footprint" style={{ width: fit?.width || 0, height: fit?.height || 0, visibility: fit ? "visible" : "hidden" }}>
      <div ref={surface} className="tw-preview-post-surface tw-preview-fit-canvas" style={{ transform: `scale(${fit?.scale || 1})` }}>{children}</div>
    </div>
  </div>;
}

export default function PostPreviewStage({ children, dimensions, geometry, platformName, lang, hasMedia }) {
  const t = (en, ar) => lang === "ar" ? ar : en;
  const [expanded, setExpanded] = useState(false);
  const [nativePixels, setNativePixels] = useState(false);
  const dialog = useRef(null);
  const trigger = useRef(null);
  const titleId = useId();
  useEffect(() => {
    if (!expanded || !dialog.current) return;
    const element = dialog.current;
    if (!element.open) element.showModal();
    return () => { if (element.open) element.close(); trigger.current?.focus(); };
  }, [expanded]);
  const dimensionLabel = dimensions
    ? `${dimensions.width.toLocaleString()} × ${dimensions.height.toLocaleString()} px`
    : hasMedia ? t("Reading media dimensions…", "جارٍ قراءة أبعاد الوسائط…") : t("Add media to see its dimensions", "أضف وسائط لعرض أبعادها");
  const frameStyle = { "--tw-preview-ratio": geometry.ratio };
  const close = () => { setExpanded(false); setNativePixels(false); };
  return <>
    <div className="tw-preview-toolbar"><strong>{platformName}</strong><span className="tw-preview-ratio" title={dimensionLabel}>{geometry.ratioLabel}{dimensions && <small> · {dimensions.width} × {dimensions.height}</small>}</span><button ref={trigger} onClick={() => setExpanded(true)} aria-label={t("Expand post preview", "تكبير معاينة المنشور")}><Maximize2 size={13} aria-hidden="true"/>{t("Expand", "تكبير")}</button></div>
    <FittedPostPreview frameStyle={frameStyle} label={`${platformName} ${geometry.ratioLabel}. ${dimensionLabel}`}>{children}</FittedPostPreview>
    {expanded && createPortal(
      <dialog className="tw-preview-dialog" ref={dialog} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); close(); }} onClick={event => { if (event.target === event.currentTarget) close(); }}>
        <header><div><h2 id={titleId}>{platformName} · {t("Post preview", "معاينة المنشور")}</h2><p>{geometry.ratioLabel} · {dimensionLabel}</p></div><button className="tw-preview-close" onClick={close} aria-label={t("Close preview", "إغلاق المعاينة")} autoFocus><X size={20} aria-hidden="true"/></button></header>
        <div className="tw-preview-zoom"><button aria-pressed={!nativePixels} onClick={() => setNativePixels(false)}>{t("Fit width", "ملاءمة العرض")}</button><button aria-pressed={nativePixels} disabled={!dimensions} onClick={() => setNativePixels(true)}>{t("100% pixels", "١٠٠٪ بكسل")}</button><span>{nativePixels ? t("1 image pixel = 1 CSS pixel. Scroll to inspect.", "كل بكسل بالصورة يساوي بكسل CSS. مرّر للتفحّص.") : t("Same proportions, larger preview.", "النسب نفسها بمعاينة أكبر.")}</span></div>
        <div className="tw-preview-dialog-scroll"><div className={`tw-preview-frame tw-preview-post-surface tw-preview-expanded-frame${nativePixels ? " tw-preview-native" : ""}`} style={{ ...frameStyle, "--tw-preview-native-width": `${(dimensions?.width || 1080) + (platformName === "X" ? 76 : 2)}px`, "--tw-preview-pixel-width": `${dimensions?.width || 1080}px` }}>{children}</div></div>
        <footer>{t("Visual preview only. Expanding does not resize or change your upload.", "معاينة مرئية فقط. التكبير لا يغيّر حجم الملف المرفوع أو محتواه.")}</footer>
      </dialog>, document.body)}
  </>;
}
