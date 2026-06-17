/**
 * Pilih item acak dari array tapi hindari mengulang item yang sama dengan
 * yang terakhir kali tampil (disimpan di localStorage per-`key`).
 * Dipakai biar pesan sayang nggak monoton tiap buka. — Henry 💛
 *
 * Client-only (butuh localStorage); aman dipanggil di useEffect.
 */
export function pickFresh<T>(key: string, arr: T[]): T {
  if (arr.length === 0) throw new Error("pickFresh: array kosong");
  if (arr.length === 1) return arr[0]!;

  const storageKey = `love:last:${key}`;
  let last = -1;
  try {
    last = Number(localStorage.getItem(storageKey) ?? -1);
  } catch {
    // localStorage nggak tersedia — abaikan, tetap random
  }

  let idx = last;
  while (idx === last) {
    idx = Math.floor(Math.random() * arr.length);
  }

  try {
    localStorage.setItem(storageKey, String(idx));
  } catch {
    // abaikan
  }

  return arr[idx]!;
}
