'use client';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Location } from '@/lib/api';
import { CATEGORY_HEX } from '@/lib/format';

interface Props {
  locations: Location[];
  selectedId: string | null;
  onSelect: (loc: Location) => void;
  lowBandwidth?: boolean;
}

function markerIcon(loc: Location, selected: boolean) {
  const color = CATEGORY_HEX[loc.category] || '#48CAE4';
  const size = selected ? 34 : 26;
  return L.divIcon({
    className: '',
    html: `
      <div class="polar-marker" style="position:relative;width:${size}px;height:${size}px">
        ${selected ? `<span class="polar-marker-pulse" style="background:${color}55"></span>` : ''}
        <div style="width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);
          background:${color}${selected ? '55' : '26'};border:2px solid ${color};box-shadow:0 0 ${selected ? 22 : 12}px ${color}88;
          display:flex;align-items:center;justify-content:center;">
          <div style="width:${selected ? 10 : 8}px;height:${selected ? 10 : 8}px;border-radius:50%;background:${color};transform:rotate(45deg)"></div>
        </div>
      </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
  });
}

export default function PolarMapInner({ locations, selectedId, onSelect, lowBandwidth }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const onSelectRef = useRef(onSelect);
  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [-10, 40], zoom: 2, minZoom: 2, maxZoom: 9, zoomControl: false, worldCopyJump: true,
      zoomAnimation: !lowBandwidth, fadeAnimation: !lowBandwidth, keyboard: true,
    });
    // Esri World Dark Gray (no API key required), tinted toward the PolarSync navy palette via CSS
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ', maxZoom: 16, className: 'polar-tiles',
    }).addTo(map);
    L.control.zoom({ position: 'bottomleft' }).addTo(map);
    L.control.scale({ position: 'bottomleft', imperial: false }).addTo(map);
    mapRef.current = map;
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(containerRef.current);
    return () => { ro.disconnect(); map.remove(); mapRef.current = null; markersRef.current.clear(); };
  }, [lowBandwidth]);

  // markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current.clear();
    locations.forEach((loc) => {
      const m = L.marker([loc.lat, loc.lng], { icon: markerIcon(loc, loc.id === selectedId), title: loc.name, alt: loc.name, keyboard: true, riseOnHover: true })
        .addTo(map)
        .on('click', () => onSelectRef.current(loc));
      m.bindTooltip(loc.name, { direction: 'top', offset: [0, -26], className: 'polar-tooltip' });
      markersRef.current.set(loc.id, m);
    });
  }, [locations, selectedId]);

  // fly to selection
  useEffect(() => {
    const map = mapRef.current;
    const loc = locations.find((l) => l.id === selectedId);
    if (map && loc) map.flyTo([loc.lat, loc.lng], Math.max(map.getZoom(), 5), { duration: lowBandwidth ? 0 : 1.1 });
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={containerRef} className="h-full w-full" role="application" aria-label="Interactive polar map. Use the location list for keyboard access." />;
}
