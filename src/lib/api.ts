// PolarSync API client — typed wrappers around the FastAPI backend (proxied via /api).
import { useAppStore } from './store';

export type ContentType =
  | 'paper' | 'dataset' | 'report' | 'photo' | 'video' | 'press_release'
  | 'story' | 'tour' | 'quiz' | 'kit' | 'expedition';

export interface Location {
  id: string; name: string; description: string; lat: number; lng: number;
  category: 'station' | 'expedition' | 'dataset' | 'media' | 'event';
  region: string; established?: number | null; research_areas?: string[]; image?: string;
  counts?: Record<string, number>; total_linked?: number;
}

export interface ContentCard {
  id: string; title: string; description?: string; content_type: ContentType;
  region?: string; research_area?: string; author?: string; organization?: string; year?: number;
  tags: string[]; thumbnail?: string; views: number; location_ids: string[];
  extra: Record<string, any>; file_format?: string; relevance?: number; location_name?: string;
  abstract?: string; created_at?: string;
}

export interface ContentDetail extends ContentCard {
  abstract?: string; keywords?: string[]; status: string; license?: string; access_level?: string;
  file_url?: string; file_name?: string; file_size?: string; ai_summary?: string;
  downloads?: number; citations?: number; created_at: string; updated_at: string; published_at?: string;
  locations: Location[];
  related: (ContentCard & { similarity: number; reason: string })[];
  provenance?: {
    submitted_by: string; submitted_at: string; status: string; reviewed_by?: string;
    reviewed_at?: string; review_comment?: string; ai_assisted: boolean;
  };
}

export interface SearchResult extends ContentCard {
  abstract?: string; score: number; relevance: number; group: string;
  breakdown: { semantic: number; keyword: number; metadata: number; cosine: number };
  matched_terms: string[]; semantic_match: boolean;
}

export interface SearchResponse {
  query: string; mode: string; total: number; results: SearchResult[];
  facets: Record<string, Record<string, number>>; related_topics: string[];
  locations: { id: string; name: string; region: string; category: string; image?: string; similarity?: number }[];
  query_analysis?: { tokens: string[]; concepts: string[]; expanded_terms: string[]; intents: Record<string, string[]> };
  pipeline: { step: string; ms: number; detail: string }[];
  insight: null | { summary: string; themes: string[]; regions: string[]; evidence: { sentence: string; content_id: string; similarity: number }[]; method: string };
  weights?: Record<string, number>; model?: string; took_ms?: number;
}

export interface AITag { tag: string; confidence: number; source: 'vocabulary' | 'keyphrase' | 'human' }
export interface Classified { label: string; confidence: number; display?: string; alternatives: { label: string; confidence: number }[] }
export interface AIAnalysis {
  summary: string; key_topics: string[]; tags: AITag[];
  classification: { content_type: Classified; region: Classified; research_area: Classified };
  suggested_location_ids: string[];
  similar_content: { id: string; title: string; content_type: string; region?: string; thumbnail?: string; similarity: number }[];
  possible_duplicate: null | { id: string; title: string; similarity: number };
  quality_checks: { key: string; label: string; score: number; detail: string }[];
  overall_quality: number; model: Record<string, string>; analysed_characters: number;
  processing_ms: number; human_review_required: boolean; extraction?: string;
}

export interface UploadInfo {
  upload_id: string; file_name: string; size: number; size_label: string; extension: string;
  extracted_characters: number; extraction: string;
}

export interface User { id: string; name: string; email: string; role: 'contributor' | 'admin' | 'public'; organization?: string; title?: string }

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}

function authHeader(): Record<string, string> {
  const token = useAppStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function api<T = any>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = { ...authHeader(), ...(init.headers as Record<string, string> | undefined) };
  let body = init.body;
  if (init.json !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(init.json);
  }
  let res: Response;
  try {
    res = await fetch(path, { ...init, headers, body });
  } catch {
    throw new ApiError(0, 'Cannot reach the PolarSync API. Is the backend running on port 8000?');
  }
  if (!res.ok) {
    let msg = res.statusText;
    try { const j = await res.json(); msg = typeof j.detail === 'string' ? j.detail : JSON.stringify(j.detail); } catch { /* not json */ }
    if (res.status === 500 && !msg) msg = 'Server error';
    if (res.status >= 500 && /ECONNREFUSED|socket hang up|Internal Server Error/i.test(msg)) {
      msg = 'Cannot reach the PolarSync API. Is the backend running on port 8000?';
    }
    if (res.status === 401) useAppStore.getState().logout();
    throw new ApiError(res.status, msg);
  }
  return res.json();
}

export function qs(params: Record<string, string | number | boolean | undefined | null>) {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '' && v !== 'all') p.set(k, String(v));
  });
  const s = p.toString();
  return s ? `?${s}` : '';
}

/** Upload with progress events (XHR, since fetch has no upload progress). */
export function uploadFile(file: File, onProgress: (pct: number) => void): Promise<UploadInfo> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/uploads');
    const h = authHeader();
    Object.entries(h).forEach(([k, v]) => xhr.setRequestHeader(k, v));
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText));
      else {
        let msg = `Upload failed (${xhr.status})`;
        try { msg = JSON.parse(xhr.responseText).detail || msg; } catch { /* ignore */ }
        reject(new ApiError(xhr.status, msg));
      }
    };
    xhr.onerror = () => reject(new ApiError(0, 'Upload failed — network error'));
    const fd = new FormData();
    fd.append('file', file);
    xhr.send(fd);
  });
}

export function trackEvent(kind: 'view' | 'download' | 'media_play' | 'search', content_id?: string, query?: string) {
  fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind, content_id, query }) }).catch(() => {});
}
