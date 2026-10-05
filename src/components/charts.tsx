'use client';
// Lightweight SVG charts (no chart library). Palette: validated categorical set for the
// dark navy surface (#0A1F35) — all checks pass (CVD ΔE ≥ 8.4, contrast ≥ 3:1).
import { useMemo, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Table2, BarChart3 } from 'lucide-react';

export const SERIES = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300'];
const GRID = 'rgba(141,183,201,0.12)';
const AXIS_TEXT = '#7A9FB2';

function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}

function Tooltip({ x, y, children, width }: { x: number; y: number; children: ReactNode; width: number }) {
  const left = Math.min(Math.max(x, 70), width - 70);
  return (
    <div className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-cyan-400/25 bg-[rgba(4,16,30,0.96)] px-2.5 py-1.5 text-[11px] text-ice-100 shadow-xl"
      style={{ left, top: y - 8 }}>
      {children}
    </div>
  );
}

/** Single-series area/line chart with crosshair tooltip. */
export function AreaChart({ data, label, height = 140, color = SERIES[0], format = (v: number) => v.toLocaleString('en-IN') }: {
  data: { date: string; count: number }[]; label: string; height?: number; color?: string; format?: (v: number) => string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const [scale, setScale] = useState(1);
  const W = 600, H = height, P = { l: 34, r: 8, t: 10, b: 20 };
  const max = niceMax(Math.max(...data.map((d) => d.count), 1));
  const x = (i: number) => P.l + (i / Math.max(1, data.length - 1)) * (W - P.l - P.r);
  const y = (v: number) => P.t + (1 - v / max) * (H - P.t - P.b);
  const line = data.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d.count).toFixed(1)}`).join(' ');
  const area = `${line} L${x(data.length - 1)},${y(0)} L${x(0)},${y(0)} Z`;
  const gid = `g-${label.replace(/\W/g, '')}`;
  const onMove = (e: React.MouseEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    setScale(r.width / W);
    const px = ((e.clientX - r.left) / r.width) * W;
    const i = Math.round(((px - P.l) / (W - P.l - P.r)) * (data.length - 1));
    setHover(Math.max(0, Math.min(data.length - 1, i)));
  };
  const hv = hover !== null ? data[hover] : null;
  return (
    <div className="relative" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`${label}: ${data.length} days, latest ${data.at(-1)?.count ?? 0}`}>
        <defs><linearGradient id={gid} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.35" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1={P.l} x2={W - P.r} y1={y(max * f)} y2={y(max * f)} stroke={GRID} strokeWidth="1" />
            <text x={P.l - 6} y={y(max * f) + 3} textAnchor="end" fontSize="10" fill={AXIS_TEXT}>{format(max * f)}</text>
          </g>
        ))}
        {[0, Math.floor(data.length / 2), data.length - 1].map((i) => data[i] && (
          <text key={i} x={x(i)} y={H - 4} textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'} fontSize="10" fill={AXIS_TEXT}>
            {new Date(data[i].date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </text>
        ))}
        <motion.path d={area} fill={`url(#${gid})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} />
        <motion.path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, ease: 'easeOut' }} />
        {hv && hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={P.t} y2={H - P.b} stroke="rgba(211,241,248,0.35)" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx={x(hover)} cy={y(hv.count)} r="4.5" fill={color} stroke="#0A1F35" strokeWidth="2" />
          </g>
        )}
      </svg>
      {hv && hover !== null && (
        <Tooltip x={x(hover) * scale} y={y(hv.count) * scale} width={W * scale}>
          <span className="block text-ice-400">{new Date(hv.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          <strong className="tabular-nums">{format(hv.count)}</strong> {label.toLowerCase()}
        </Tooltip>
      )}
    </div>
  );
}

/** Horizontal bars for magnitude comparison (single hue), with values as text and hover. */
export function BarList({ data, color = SERIES[0], max: maxIn, onSelect, unit = '' }: {
  data: { label: string; value: number; hint?: string }[]; color?: string; max?: number; onSelect?: (label: string) => void; unit?: string;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const max = maxIn ?? Math.max(...data.map((d) => d.value), 1);
  return (
    <ul className="space-y-2.5">
      {data.map((d, i) => {
        const Row = onSelect ? 'button' : 'div';
        return (
          <li key={d.label}>
            <Row {...(onSelect ? { onClick: () => onSelect(d.label), type: 'button' as const } : {})}
              onMouseEnter={() => setHover(d.label)} onMouseLeave={() => setHover(null)}
              className="block w-full text-left" title={`${d.label}: ${d.value.toLocaleString('en-IN')}${unit}${d.hint ? ` · ${d.hint}` : ''}`}>
              <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
                <span className={`truncate ${hover === d.label ? 'text-ice-50' : 'text-ice-300'}`}>{d.label}</span>
                <span className="shrink-0 tabular-nums text-ice-100">{d.value.toLocaleString('en-IN')}{unit}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/[0.04]">
                <motion.div initial={{ width: 0 }} whileInView={{ width: `${(d.value / max) * 100}%` }} viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: i * 0.04 }} className="h-full rounded-full"
                  style={{ background: color, opacity: hover && hover !== d.label ? 0.55 : 1 }} />
              </div>
            </Row>
          </li>
        );
      })}
    </ul>
  );
}

/** Stacked columns (e.g. monthly publications by content group) with legend + per-column tooltip. */
export function StackedColumns({ data, keys, labels, height = 180 }: {
  data: Record<string, number | string>[]; keys: string[]; labels: Record<string, string>; height?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const [scale, setScale] = useState(1);
  const W = 600, H = height, P = { l: 26, r: 6, t: 8, b: 20 };
  const totals = data.map((d) => keys.reduce((s, k) => s + Number(d[k] || 0), 0));
  const max = niceMax(Math.max(...totals, 1));
  const bw = (W - P.l - P.r) / data.length;
  const y = (v: number) => P.t + (1 - v / max) * (H - P.t - P.b);
  return (
    <div>
      <div className="relative" onMouseLeave={() => setHover(null)} onMouseMove={(e) => setScale(e.currentTarget.getBoundingClientRect().width / W)}>
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Monthly publications by content type">
          {[0, 0.5, 1].map((f) => (
            <g key={f}>
              <line x1={P.l} x2={W - P.r} y1={y(max * f)} y2={y(max * f)} stroke={GRID} />
              <text x={P.l - 5} y={y(max * f) + 3} textAnchor="end" fontSize="10" fill={AXIS_TEXT}>{Math.round(max * f)}</text>
            </g>
          ))}
          {data.map((d, i) => {
            let acc = 0;
            const cx = P.l + i * bw;
            return (
              <g key={i} onMouseEnter={() => setHover(i)}>
                <rect x={cx} y={P.t} width={bw} height={H - P.t - P.b} fill="transparent" />
                {keys.map((k, ki) => {
                  const v = Number(d[k] || 0);
                  if (!v) return null;
                  const y0 = y(acc), y1 = y(acc + v);
                  acc += v;
                  const isTop = keys.slice(ki + 1).every((kk) => !Number(d[kk] || 0));
                  return (
                    <rect key={k} x={cx + bw * 0.2} width={bw * 0.6} y={y1} height={Math.max(0, y0 - y1 - 2)} rx={isTop ? 3 : 0}
                      fill={SERIES[ki % SERIES.length]} opacity={hover === null || hover === i ? 1 : 0.5} />
                  );
                })}
                <text x={cx + bw / 2} y={H - 5} textAnchor="middle" fontSize="9.5" fill={AXIS_TEXT}>
                  {new Date(`${d.month}-01`).toLocaleDateString('en-IN', { month: 'short' })}
                </text>
              </g>
            );
          })}
        </svg>
        {hover !== null && (
          <Tooltip x={(P.l + hover * bw + bw / 2) * scale} y={y(totals[hover]) * scale} width={W * scale}>
            <span className="mb-1 block font-semibold">{new Date(`${data[hover].month}-01`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} · {totals[hover]}</span>
            {keys.filter((k) => Number(data[hover][k])).map((k) => (
              <span key={k} className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ background: SERIES[keys.indexOf(k) % SERIES.length] }} />{labels[k]}: <strong className="tabular-nums">{data[hover][k]}</strong></span>
            ))}
          </Tooltip>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {keys.map((k, i) => <span key={k} className="flex items-center gap-1.5 text-[11px] text-ice-300"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: SERIES[i % SERIES.length] }} />{labels[k]}</span>)}
      </div>
    </div>
  );
}

/** Wrapper that adds a chart ↔ table toggle (accessibility: data available as text). */
export function ChartCard({ title, subtitle, children, table, className = '', action }: {
  title: string; subtitle?: string; children: ReactNode; table?: { headers: string[]; rows: (string | number)[][] }; className?: string; action?: ReactNode;
}) {
  const [asTable, setAsTable] = useState(false);
  return (
    <section className={`glass-panel rounded-2xl p-5 ${className}`} aria-label={title}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-space text-sm font-semibold text-ice-50">{title}</h2>
          {subtitle && <p className="text-[11px] text-ice-500">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {action}
          {table && (
            <button onClick={() => setAsTable(!asTable)} aria-pressed={asTable} className="rounded-lg p-1.5 text-ice-400 hover:bg-white/5 hover:text-ice-100" title={asTable ? 'Show chart' : 'Show table'} aria-label={asTable ? 'Show chart' : 'Show table'}>
              {asTable ? <BarChart3 size={14} /> : <Table2 size={14} />}
            </button>
          )}
        </div>
      </div>
      {asTable && table ? (
        <div className="max-h-72 overflow-auto">
          <table className="polar-table text-xs">
            <thead><tr>{table.headers.map((h) => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>{table.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className={j ? 'tabular-nums' : ''}>{c}</td>)}</tr>)}</tbody>
          </table>
        </div>
      ) : children}
    </section>
  );
}

export function useSum(series?: { count: number }[]) {
  return useMemo(() => (series || []).reduce((s, d) => s + d.count, 0), [series]);
}
