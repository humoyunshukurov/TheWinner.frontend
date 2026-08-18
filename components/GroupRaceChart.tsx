import { useEffect, useMemo, useState } from 'react';

const WIDTH = 760;
const HEIGHT = 280;
const PAD_X = 24;
const PAD_TOP = 28;
const PAD_BOTTOM = 24;
const HEADROOM = 1.15;
const PAGE_SIZE = 5;

const SERIES_COLORS = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'];

const GROUP_COLOR_ORDER = [
  'Frontend-201',
  'Backend-101',
  'Python-Data-14',
  'UI/UX-22',
  'Mobile-27',
  'DevOps-12',
  'QA-45',
  'Marketing-9'
];

function colorFor(group) {
  const index = GROUP_COLOR_ORDER.indexOf(group);
  return SERIES_COLORS[(index === -1 ? 0 : index) % SERIES_COLORS.length];
}

export default function GroupRaceChart({ labels, series }) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const [page, setPage] = useState(0);

  useEffect(() => {
    setHoverIndex(null);
    setPage(0);
  }, [labels, series]);

  const rankedGroups = useMemo(
    () =>
      [...series]
        .map((s) => ({ group: s.group, color: colorFor(s.group), values: s.values }))
        .sort((a, b) => b.values[b.values.length - 1] - a.values[a.values.length - 1]),
    [series]
  );

  const totalPages = Math.ceil(rankedGroups.length / PAGE_SIZE);
  const pageGroups = rankedGroups.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const { lines, maxValue } = useMemo(() => {
    const allValues = pageGroups.flatMap((s) => s.values);
    const max = Math.max(...allValues, 1);
    const scaleMax = max * HEADROOM;
    const innerWidth = WIDTH - PAD_X * 2;
    const innerHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;

    const lines = pageGroups.map((s) => ({
      group: s.group,
      color: s.color,
      points: s.values.map((v, i) => ({
        x: PAD_X + (innerWidth * i) / (labels.length - 1 || 1),
        y: PAD_TOP + innerHeight * (1 - v / scaleMax),
        value: v
      }))
    }));

    return { lines, maxValue: max };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageGroups, labels]);

  function handleMove(event) {
    const svg = event.currentTarget;
    const rect = svg.getBoundingClientRect();
    const relX = ((event.clientX - rect.left) / rect.width) * WIDTH;
    const innerWidth = WIDTH - PAD_X * 2;
    const ratio = (relX - PAD_X) / innerWidth;
    const index = Math.round(ratio * (labels.length - 1));
    setHoverIndex(Math.min(Math.max(index, 0), labels.length - 1));
  }

  const active = hoverIndex !== null ? hoverIndex : labels.length - 1;
  const rangeStart = page * PAGE_SIZE + 1;
  const rangeEnd = Math.min(rankedGroups.length, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="race-chart-wrap">
      <div className="race-legend">
        {lines.map((line) => (
          <span key={line.group} className="race-legend-item" style={{ color: line.color }}>
            [{line.group}]
          </span>
        ))}
      </div>

      <div className="race-chart-body">
        <div className="race-y-axis">
          <span>{maxValue}</span>
          <span>0</span>
        </div>

        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
          className="race-svg"
          onMouseMove={handleMove}
          onMouseLeave={() => setHoverIndex(null)}
          role="img"
          aria-label="Guruhlar coin poygasi"
        >
          <line
            x1={lines[0].points[active].x}
            x2={lines[0].points[active].x}
            y1={PAD_TOP}
            y2={HEIGHT - PAD_BOTTOM}
            className="race-crosshair"
          />

          {lines.map((line) => (
            <path
              key={line.group}
              d={line.points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
              fill="none"
              stroke={line.color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {lines.map((line) => (
            <circle
              key={line.group}
              cx={line.points[active].x}
              cy={line.points[active].y}
              r="4"
              fill={line.color}
              style={{ stroke: 'var(--card-bg)' }}
              strokeWidth="2"
            />
          ))}
        </svg>
      </div>

      <div className="race-tooltip">
        <strong>{labels[active]}</strong>
        {lines
          .map((line) => ({ group: line.group, color: line.color, value: line.points[active].value }))
          .sort((a, b) => b.value - a.value)
          .map((line, i) => (
            <div key={line.group} className="race-tooltip-row">
              <span className="race-tooltip-rank">{page * PAGE_SIZE + i + 1}.</span>
              <span className="race-tooltip-key" style={{ background: line.color }} />
              <span>{line.group}</span>
              <strong>{line.value}</strong>
            </div>
          ))}
      </div>

      {totalPages > 1 && (
        <div className="race-pagination">
          <button className="race-page-btn" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
            ← Oldingi 5ta
          </button>
          <span className="race-page-indicator">
            {rangeStart}-{rangeEnd} / {rankedGroups.length}
          </span>
          <button
            className="race-page-btn"
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          >
            Keyingi 5tani ko'rish →
          </button>
        </div>
      )}
    </div>
  );
}
