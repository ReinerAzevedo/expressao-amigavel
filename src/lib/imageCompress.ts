/**
 * Comprime uma imagem (File ou dataUrl) para JPEG ~80KB / 800px.
 */
export async function compressImage(
  source: File | Blob | string,
  maxSize = 800,
  quality = 0.7,
): Promise<{ dataUrl: string; bytes: number }> {
  const dataUrl =
    typeof source === "string" ? source : await blobToDataUrl(source);
  const img = await loadImage(dataUrl);

  const ratio = Math.min(1, maxSize / Math.max(img.width, img.height));
  const w = Math.round(img.width * ratio);
  const h = Math.round(img.height * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);

  const out = canvas.toDataURL("image/jpeg", quality);
  const bytes = Math.floor(((out.length - "data:image/jpeg;base64,".length) * 3) / 4);
  return { dataUrl: out, bytes };
}

function blobToDataUrl(b: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(b);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });
}
