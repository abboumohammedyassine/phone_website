// lib/image-validation.ts — serveur uniquement.
// On ne fait JAMAIS confiance au type MIME envoyé par le navigateur (falsifiable) :
// on lit les premiers octets du fichier pour reconnaître un vrai JPEG, PNG ou WebP.

export type DetectedImage = { ext: "jpg" | "png" | "webp"; mime: string };

export function detectImageType(bytes: Uint8Array): DetectedImage | null {
  // JPEG : FF D8 FF
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { ext: "jpg", mime: "image/jpeg" };
  }
  // PNG : 89 50 4E 47 0D 0A 1A 0A
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length > 8 && png.every((b, i) => bytes[i] === b)) {
    return { ext: "png", mime: "image/png" };
  }
  // WebP : "RIFF" .... "WEBP"
  if (
    bytes.length > 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return { ext: "webp", mime: "image/webp" };
  }
  return null;
}
