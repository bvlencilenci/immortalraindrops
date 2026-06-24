import React, { useState, useEffect } from 'react';

function extractAPICFromBuffer(buffer: ArrayBuffer): string | null {
  const arr = new Uint8Array(buffer);

  // Check ID3v2 header
  if (arr[0] !== 0x49 || arr[1] !== 0x44 || arr[2] !== 0x33) {
    return null;
  }

  const version = arr[3]; // e.g. 3 for ID3v2.3, 4 for ID3v2.4
  if (version !== 3 && version !== 4 && version !== 2) {
    return null;
  }

  // Header size is 10 bytes. The synchsafe size is in bytes 6-9
  const tagSize =
    ((arr[6] & 0x7f) << 21) |
    ((arr[7] & 0x7f) << 14) |
    ((arr[8] & 0x7f) << 7) |
    (arr[9] & 0x7f);

  let offset = 10;
  const limit = Math.min(tagSize + 10, arr.length);

  while (offset < limit - 10) {
    let frameId = "";
    let frameSize = 0;
    let headerSize = 10;

    if (version === 2) {
      // ID3v2.2
      frameId = String.fromCharCode(arr[offset], arr[offset + 1], arr[offset + 2]);
      frameSize = (arr[offset + 3] << 16) | (arr[offset + 4] << 8) | arr[offset + 5];
      headerSize = 6;
    } else {
      // ID3v2.3 or ID3v2.4
      frameId = String.fromCharCode(arr[offset], arr[offset + 1], arr[offset + 2], arr[offset + 3]);
      
      if (version === 3) {
        frameSize =
          (arr[offset + 4] << 24) |
          (arr[offset + 5] << 16) |
          (arr[offset + 6] << 8) |
          arr[offset + 7];
      } else {
        frameSize =
          ((arr[offset + 4] & 0x7f) << 21) |
          ((arr[offset + 5] & 0x7f) << 14) |
          ((arr[offset + 6] & 0x7f) << 7) |
          (arr[offset + 7] & 0x7f);
      }
      headerSize = 10;
    }

    if (frameSize <= 0 || offset + headerSize + frameSize > limit) {
      break;
    }

    if (frameId === "APIC" || frameId === "PIC") {
      const dataStart = offset + headerSize;
      const dataEnd = dataStart + frameSize;

      let mimeType = "";
      let p = dataStart;

      const encoding = arr[p];
      p++;

      if (version === 2) {
        const imgFormat = String.fromCharCode(arr[p], arr[p + 1], arr[p + 2]).toLowerCase();
        mimeType = imgFormat === "png" ? "image/png" : "image/jpeg";
        p += 3;
      } else {
        const mimeStart = p;
        while (p < dataEnd && arr[p] !== 0) {
          p++;
        }
        mimeType = String.fromCharCode.apply(null, Array.from(arr.slice(mimeStart, p)));
        p++; // skip null terminator
      }

      const pictureType = arr[p];
      p++;

      if (encoding === 1 || encoding === 2) {
        // UTF-16: find double null
        while (p < dataEnd - 1 && !(arr[p] === 0 && arr[p + 1] === 0)) {
          p++;
        }
        p += 2;
      } else {
        // ASCII/UTF-8: find single null
        while (p < dataEnd && arr[p] !== 0) {
          p++;
        }
        p++;
      }

      const pictureData = arr.slice(p, dataEnd);
      const blob = new Blob([pictureData], { type: mimeType || "image/jpeg" });
      return URL.createObjectURL(blob);
    }

    offset += headerSize + frameSize;
  }

  return null;
}

export interface TrackCoverProps {
  audioUrl?: string;
  trackKey: string;
}

export function TrackCover({ audioUrl, trackKey }: TrackCoverProps) {
  const [src, setSrc] = useState('/logo.png');
  const [isFallback, setIsFallback] = useState(true);

  useEffect(() => {
    if (!audioUrl) {
      setSrc('/logo.png');
      setIsFallback(true);
      return;
    }

    let active = true;
    let objectUrl: string | null = null;

    async function loadCover() {
      try {
        const initialSize = 128 * 1024;
        let response = await fetch(audioUrl!, {
          headers: { Range: `bytes=0-${initialSize - 1}` }
        });
        
        if (!active) return;

        if (!response.ok && response.status !== 206) {
          return;
        }

        let buffer = await response.arrayBuffer();
        if (!active) return;

        let arr = new Uint8Array(buffer);

        if (arr[0] === 0x49 && arr[1] === 0x44 && arr[2] === 0x33) {
          const tagSize =
            ((arr[6] & 0x7f) << 21) |
            ((arr[7] & 0x7f) << 14) |
            ((arr[8] & 0x7f) << 7) |
            (arr[9] & 0x7f);

          const totalRequired = tagSize + 10;
          if (totalRequired > buffer.byteLength) {
            response = await fetch(audioUrl!, {
              headers: { Range: `bytes=0-${totalRequired - 1}` }
            });
            if (!active) return;
            buffer = await response.arrayBuffer();
            if (!active) return;
            arr = new Uint8Array(buffer);
          }
        }

        const parsedUrl = extractAPICFromBuffer(buffer);
        if (parsedUrl && active) {
          objectUrl = parsedUrl;
          setSrc(parsedUrl);
          setIsFallback(false);
        }
      } catch (err) {
        console.warn('Error loading embedded cover for:', trackKey, err);
      }
    }

    loadCover();

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [audioUrl, trackKey]);

  return (
    <img
      src={src}
      alt=""
      className="w-10 h-10 border border-[#ECEEDF]/10 bg-black/40 flex-shrink-0 grayscale"
      style={{
        objectFit: isFallback ? 'contain' : 'cover',
        filter: isFallback ? 'invert(1)' : 'none',
        mixBlendMode: isFallback ? 'screen' : 'normal',
        padding: isFallback ? '4px' : '0px'
      }}
      crossOrigin="anonymous"
      data-testid="track-cover"
    />
  );
}
