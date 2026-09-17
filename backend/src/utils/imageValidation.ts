import { open } from "node:fs/promises";

export type SafeImageType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

const SIGNATURES: Array<{ mime: SafeImageType; bytes: number[]; offset?: number }> = [
  { mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/gif", bytes: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61] },
  { mime: "image/gif", bytes: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61] },
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 },
];

export async function detectSafeImageType(filePath: string): Promise<SafeImageType | null> {
  const handle = await open(filePath, "r");
  try {
    const buffer = Buffer.alloc(16);
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    if (bytesRead < 8) return null;

    for (const signature of SIGNATURES) {
      const offset = signature.offset ?? 0;
      const matches = signature.bytes.every((byte, index) => buffer[offset + index] === byte);
      if (!matches) continue;

      if (signature.mime === "image/webp") {
        const riffLengthSufficient = bytesRead >= 12;
        const webpMarker = riffLengthSufficient && buffer.subarray(8, 12).toString("ascii") === "WEBP";
        if (!webpMarker) continue;
      }

      return signature.mime;
    }

    return null;
  } finally {
    await handle.close();
  }
}
