"use client";

// Redimensionne et compresse une photo AVANT l'envoi.
// Une photo de téléphone pèse 4 à 8 Mo : Vercel refuserait l'envoi (limite 4,5 Mo), et une
// image aussi lourde ralentirait le catalogue. Après traitement : environ 100 à 400 Ko.

export async function compressImage(file: File, maxSide = 1600): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
    throw new Error("Format non supporté (JPEG, PNG ou WebP).");
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("Image illisible.");
  }

  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Traitement de l'image impossible.");

  // Fond blanc : un PNG transparent deviendrait noir une fois converti en JPEG.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const toBlob = (type: string, quality: number) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

  // WebP si le navigateur le gère, sinon JPEG (Safari ancien renvoie du PNG, très lourd).
  let blob = await toBlob("image/webp", 0.86);
  if (!blob || blob.type !== "image/webp") blob = await toBlob("image/jpeg", 0.88);
  if (!blob) throw new Error("Compression impossible.");

  const ext = blob.type === "image/webp" ? "webp" : "jpg";
  const base = file.name.replace(/\.[^.]+$/, "") || "image";
  return new File([blob], `${base}.${ext}`, { type: blob.type });
}
