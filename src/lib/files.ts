// Profile photos and leave documents, stored exactly where the Day Off website
// stores them: each one is its own app_state document holding a data URL
// (app_state/photo_<personId> and app_state/leavedoc_<docId>).

import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { db } from './firebase';
import { uid } from './dates';
import type { LeaveDoc } from './types';

// ---------------------------------------------------------------------------
// Photos
// ---------------------------------------------------------------------------

const PHOTO_MAX = 1000000;
const PHOTO_CACHE = new Map<string, string | null>();
const PHOTO_INFLIGHT = new Map<string, Promise<string | null>>();
const PHOTO_WAITERS = new Map<string, Set<() => void>>();

function primePhoto(id: string, dataUrl: string | null) {
  PHOTO_CACHE.set(id, dataUrl);
  PHOTO_WAITERS.get(id)?.forEach((fn) => fn());
  PHOTO_WAITERS.delete(id);
}

function fetchPhoto(id: string) {
  if (PHOTO_CACHE.has(id)) return Promise.resolve(PHOTO_CACHE.get(id) ?? null);
  const inflight = PHOTO_INFLIGHT.get(id);
  if (inflight) return inflight;
  const p = (async () => {
    let url: string | null = null;
    try {
      const snap = await getDoc(doc(db, 'app_state', 'photo_' + id));
      url = snap.exists() ? (snap.data().dataUrl as string) || null : null;
    } catch (err) {
      console.error('Photo read error [' + id + ']:', err);
    }
    PHOTO_INFLIGHT.delete(id);
    primePhoto(id, url);
    return url;
  })();
  PHOTO_INFLIGHT.set(id, p);
  return p;
}

/** Resolves a person's photoUrl ("fs:<id>" or a plain URL) to something an <Image> can show. */
export function usePhoto(src?: string | null) {
  const key = src && String(src).startsWith('fs:') ? String(src).slice(3) : null;
  const [, bump] = useState(0);
  useEffect(() => {
    if (!key || PHOTO_CACHE.has(key)) return;
    const wake = () => bump((n) => n + 1);
    const set = PHOTO_WAITERS.get(key) || new Set();
    set.add(wake);
    PHOTO_WAITERS.set(key, set);
    fetchPhoto(key);
    return () => {
      PHOTO_WAITERS.get(key)?.delete(wake);
    };
  }, [key]);
  if (!src) return null;
  return key ? PHOTO_CACHE.get(key) || null : src;
}

async function toJpegDataUrl(uri: string, size: { width: number; height: number } | null, px: number, quality: number, square: boolean) {
  const ctx = ImageManipulator.manipulate(uri);
  if (square && size && size.width && size.height) {
    const side = Math.min(size.width, size.height);
    ctx.crop({ originX: (size.width - side) / 2, originY: (size.height - side) / 2, width: side, height: side });
    ctx.resize({ width: px, height: px });
  } else if (size && Math.max(size.width, size.height) > px) {
    ctx.resize(size.width >= size.height ? { width: px, height: null } : { width: null, height: px });
  }
  const img = await ctx.renderAsync();
  const out = await img.saveAsync({ format: SaveFormat.JPEG, compress: quality, base64: true });
  if (!out.base64) throw new Error('unreadable-image');
  return 'data:image/jpeg;base64,' + out.base64;
}

/** Crops a picked photo square, shrinks it, stores it and returns the reference for photoUrl. */
export async function uploadProfilePhoto(id: string, picked: { uri: string; width: number; height: number }) {
  let dataUrl = await toJpegDataUrl(picked.uri, picked, 320, 0.72, true);
  if (dataUrl.length > PHOTO_MAX) {
    for (const [px, q] of [[280, 0.62], [240, 0.55], [200, 0.5], [160, 0.45]]) {
      dataUrl = await toJpegDataUrl(picked.uri, picked, px, q, true);
      if (dataUrl.length <= PHOTO_MAX) break;
    }
  }
  if (dataUrl.length > PHOTO_MAX) throw new Error('image-too-large');
  const ref = doc(db, 'app_state', 'photo_' + id);
  await setDoc(ref, { dataUrl, updatedAt: Date.now() });
  const check = await getDoc(ref);
  const saved = (check.exists() && (check.data().dataUrl as string)) || null;
  if (!saved) throw new Error('write-not-persisted');
  primePhoto(id, saved);
  return 'fs:' + id;
}

export async function deleteProfilePhoto(id: string) {
  try {
    await deleteDoc(doc(db, 'app_state', 'photo_' + id));
  } catch {}
  primePhoto(id, null);
}

// ---------------------------------------------------------------------------
// Leave documents (sick notes)
// ---------------------------------------------------------------------------

const LEAVE_DOC_MAX = 900000; // Firestore refuses a document over 1MB

export type PickedFile = { uri: string; name: string; mimeType?: string | null; width?: number; height?: number };

async function readAsDataUrl(f: PickedFile) {
  const mime = f.mimeType || 'application/octet-stream';
  if (Platform.OS === 'web') {
    const blob = await (await fetch(f.uri)).blob();
    return await new Promise<string>((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(String(fr.result));
      fr.onerror = () => rej(new Error('unreadable-file'));
      fr.readAsDataURL(blob);
    });
  }
  const b64 = await new File(f.uri).base64();
  return 'data:' + mime + ';base64,' + b64;
}

/** Stores a picked image or PDF; photographed notes are shrunk until they fit. */
export async function uploadLeaveDoc(f: PickedFile): Promise<LeaveDoc> {
  const isPdf = (f.mimeType || '').includes('pdf') || /\.pdf$/i.test(f.name);
  let dataUrl: string | null = null;
  if (isPdf) {
    dataUrl = await readAsDataUrl(f);
    if (dataUrl.length > LEAVE_DOC_MAX) throw new Error('file-too-large');
  } else {
    const size = f.width && f.height ? { width: f.width, height: f.height } : null;
    for (const [px, q] of [[1400, 0.72], [1100, 0.62], [900, 0.55], [700, 0.5]]) {
      const u = await toJpegDataUrl(f.uri, size, px, q, false);
      if (u.length <= LEAVE_DOC_MAX) {
        dataUrl = u;
        break;
      }
    }
    if (!dataUrl) throw new Error('file-too-large');
  }
  const id = uid('doc');
  const mime = isPdf ? 'application/pdf' : 'image/jpeg';
  await setDoc(doc(db, 'app_state', 'leavedoc_' + id), { dataUrl, name: f.name || 'document', mime, at: Date.now() });
  return { id, name: f.name || 'document', mime };
}

export async function fetchLeaveDoc(d: LeaveDoc) {
  if (!d || !d.id) return null;
  const snap = await getDoc(doc(db, 'app_state', 'leavedoc_' + d.id));
  const data = snap.exists() ? snap.data() : null;
  if (!data || !data.dataUrl) return null;
  return { name: (data.name as string) || d.name || 'document', dataUrl: data.dataUrl as string };
}

/** Opens a PDF outside the app: a new tab on the web, the share sheet on phones. */
export async function openPdf(name: string, dataUrl: string) {
  const b64 = dataUrl.split(',')[1] || '';
  if (Platform.OS === 'web') {
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([arr], { type: 'application/pdf' }));
    window.open(url, '_blank');
    return;
  }
  const safe = (name || 'document').replace(/[^\w.\-]+/g, '_');
  const file = new File(Paths.cache, safe.endsWith('.pdf') ? safe : safe + '.pdf');
  if (file.exists) file.delete();
  file.create();
  file.write(b64, { encoding: 'base64' });
  await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf' });
}
