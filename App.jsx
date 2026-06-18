import React, { useState, useMemo } from "react";
import {
  Thermometer,
  Stethoscope,
  BedDouble,
  UserPlus,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Activity,
  Users,
  ArrowRight,
  Plus,
  X,
  ClipboardCheck,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  LogOut,
  Sparkles,
} from "lucide-react";

/* ---------------------------------------------------------------------
   Wardline — a quarantine ward's daily chart, made legible.
   Design tokens
--------------------------------------------------------------------- */
const COLORS = {
  paper: "#F4F7F5",
  card: "#FFFFFF",
  ink: "#16302B",
  inkSoft: "#3E5651",
  muted: "#6E8079",
  line: "#DCE5E0",
  lineSoft: "#EAEFEC",
  teal: "#2F6F62",
  tealDark: "#204E44",
  tealTint: "#E4EFEA",
  amber: "#C95A28",
  amberTint: "#FBE9DD",
  sage: "#3F8462",
  sageTint: "#E3F0E6",
  brick: "#8E433F",
  brickTint: "#F3E2DF",
  gold: "#B68A2E",
  goldTint: "#F3E8CF",
};

const FONT_DISPLAY = "'IBM Plex Serif', serif";
const FONT_BODY = "'IBM Plex Sans', sans-serif";
const FONT_MONO = "'IBM Plex Mono', monospace";

const FEVER_THRESHOLD = 100.4;
const TOTAL_BEDS = 74;
const TODAY = "2026-06-18";

/* ---------------------------------------------------------------------
   Date helpers
--------------------------------------------------------------------- */
function addDays(dateStr, n) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
function dayDiff(a, b) {
  return Math.round((new Date(a + "T00:00:00") - new Date(b + "T00:00:00")) / 86400000);
}
function formatShort(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function last7Days(todayStr) {
  const out = [];
  for (let i = 6; i >= 0; i--) out.push(addDays(todayStr, -i));
  return out;
}

/* ---------------------------------------------------------------------
   Clinical helpers
--------------------------------------------------------------------- */
function computeStreak(tempLog) {
  if (!tempLog.length) return 0;
  const sorted = [...tempLog].sort((a, b) => (a.date < b.date ? 1 : -1));
  let streak = 0;
  let prevDate = null;
  for (const entry of sorted) {
    if (entry.tempF >= FEVER_THRESHOLD) break;
    if (prevDate && dayDiff(prevDate, entry.date) !== 1) break;
    streak++;
    prevDate = entry.date;
  }
  return streak;
}
function loggedToday(log, today) {
  return log.some((e) => e.date === today);
}

/* ---------------------------------------------------------------------
   Seed data — 7 resident patients (occupying beds) + 2 historical
   outcomes, used only to seed the success-rate metric.
--------------------------------------------------------------------- */
const seedPatients = [
  {
    id: "P-104",
    name: "Aarav Mehta",
    age: 8,
    room: "4A",
    admittedOn: "2026-06-12",
    status: "active",
    tempLog: [
      { date: "2026-06-15", tempF: 101.8, by: "Nurse Alvarez" },
      { date: "2026-06-16", tempF: 100.9, by: "Nurse Alvarez" },
      { date: "2026-06-17", tempF: 99.1, by: "Nurse Okafor" },
    ],
    visitLog: [
      { date: "2026-06-17", by: "Dr. Mensah", note: "Fever breaking. Continue antipyretics, recheck tomorrow." },
    ],
  },
  {
    id: "P-098",
    name: "Priya Nair",
    age: 29,
    room: "7C",
    admittedOn: "2026-06-09",
    status: "active",
    tempLog: [
      { date: "2026-06-16", tempF: 98.9, by: "Nurse Okafor" },
      { date: "2026-06-17", tempF: 98.6, by: "Nurse Okafor" },
      { date: "2026-06-18", tempF: 98.4, by: "Nurse Alvarez" },
    ],
    visitLog: [{ date: "2026-06-17", by: "Dr. Mensah", note: "Day 2 fever-free. Looking good." }],
  },
  {
    id: "P-111",
    name: "Kabir Sheth",
    age: 45,
    room: "2B",
    admittedOn: "2026-06-14",
    status: "active",
    tempLog: [
      { date: "2026-06-16", tempF: 102.1, by: "Nurse Alvarez" },
      { date: "2026-06-17", tempF: 100.6, by: "Nurse Alvarez" },
    ],
    visitLog: [{ date: "2026-06-16", by: "Dr. Mensah", note: "Started on antipyretic course." }],
  },
  {
    id: "P-087",
    name: "Sara Liu",
    age: 16,
    room: "9A",
    admittedOn: "2026-06-11",
    status: "active",
    tempLog: [
      { date: "2026-06-16", tempF: 101.0, by: "Nurse Okafor" },
      { date: "2026-06-17", tempF: 98.8, by: "Nurse Okafor" },
      { date: "2026-06-18", tempF: 98.5, by: "Nurse Alvarez" },
    ],
    visitLog: [],
  },
  {
    id: "P-122",
    name: "Devika Rao",
    age: 62,
    room: "11D",
    admittedOn: "2026-06-08",
    status: "active",
    tempLog: [
      { date: "2026-06-15", tempF: 99.0, by: "Nurse Alvarez" },
      { date: "2026-06-16", tempF: 99.5, by: "Nurse Alvarez" },
      { date: "2026-06-18", tempF: 99.2, by: "Nurse Okafor" },
    ],
    visitLog: [{ date: "2026-06-16", by: "Dr. Mensah", note: "Stable, monitoring." }],
  },
  {
    id: "P-130",
    name: "Noah Fernandez",
    age: 5,
    room: "1A",
    admittedOn: "2026-06-17",
    status: "active",
    tempLog: [{ date: "2026-06-17", tempF: 103.2, by: "Nurse Alvarez" }],
    visitLog: [{ date: "2026-06-17", by: "Dr. Mensah", note: "New admission, high fever. Starting treatment." }],
  },
  {
    id: "P-076",
    name: "Imran Qureshi",
    age: 51,
    room: "5B",
    admittedOn: "2026-06-05",
    status: "pending_discharge",
    tempLog: [
      { date: "2026-06-15", tempF: 98.5, by: "Nurse Okafor" },
      { date: "2026-06-16", tempF: 98.7, by: "Nurse Okafor" },
      { date: "2026-06-17", tempF: 98.4, by: "Nurse Alvarez" },
      { date: "2026-06-18", tempF: 98.3, by: "Nurse Alvarez" },
    ],
    visitLog: [
      { date: "2026-06-17", by: "Dr. Mensah", note: "3 full days fever-free confirmed. Approved for discharge.", approvedDischarge: true },
    ],
  },
  {
    id: "P-052",
    name: "Yusuf Khan",
    age: 38,
    room: "—",
    admittedOn: "2026-06-02",
    status: "discharged",
    dischargedOn: "2026-06-10",
    tempLog: [],
    visitLog: [],
  },
  {
    id: "P-061",
    name: "Meera Joshi",
    age: 70,
    room: "—",
    admittedOn: "2026-06-01",
    status: "deceased",
    outcomeOn: "2026-06-09",
    tempLog: [],
    visitLog: [],
  },
];

/* ---------------------------------------------------------------------
   Small building blocks
--------------------------------------------------------------------- */
function StatusBadge({ status, streak }) {
  const map = {
    active: { label: "In treatment", bg: COLORS.tealTint, fg: COLORS.tealDark },
    pending_discharge: { label: "Awaiting discharge", bg: COLORS.goldTint, fg: "#7A5A12" },
    discharged: { label: "Discharged", bg: COLORS.sageTint, fg: COLORS.sage },
    deceased: { label: "Deceased", bg: COLORS.brickTint, fg: COLORS.brick },
  };
  const s = map[status] || map.active;
  return (
    <span
      style={{
        background: s.bg,
        color: s.fg,
        fontFamily: FONT_MONO,
        fontSize: 11,
        letterSpacing: "0.04em",
        padding: "3px 8px",
        borderRadius: 20,
        textTransform: "uppercase",
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {s.label}
    </span>
  );
}

function FeverChart({ tempLog, today, compact }) {
  const days = last7Days(today);
  const byDate = {};
  tempLog.forEach((e) => (byDate[e.date] = e.tempF));
  const w = compact ? 132 : 280;
  const h = compact ? 40 : 90;
  const padX = 8;
  const padY = compact ? 6 : 14;
  const minT = 97,
    maxT = 104;
  const yFor = (t) => padY + (1 - (t - minT) / (maxT - minT)) * (h - padY * 2);
  const xFor = (i) => padX + (i / (days.length - 1)) * (w - padX * 2);
  const thresholdY = yFor(FEVER_THRESHOLD);

  const points = days.map((d, i) => ({ x: xFor(i), y: byDate[d] != null ? yFor(byDate[d]) : null, t: byDate[d], date: d }));

  // build connected segments skipping gaps
  const segments = [];
  let current = [];
  points.forEach((p) => {
    if (p.y != null) current.push(p);
    else {
      if (current.length > 1) segments.push(current);
      current = [];
    }
  });
  if (current.length > 1) segments.push(current);

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      <line x1={padX} y1={thresholdY} x2={w - padX} y2={thresholdY} stroke={COLORS.amber} strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
      {segments.map((seg, si) => (
        <polyline
          key={si}
          fill="none"
          stroke={COLORS.teal}
          strokeWidth="1.6"
          points={seg.map((p) => `${p.x},${p.y}`).join(" ")}
        />
      ))}
      {points.map((p, i) =>
        p.y == null ? (
          <circle key={i} cx={p.x} cy={h - padY / 1.4} r={compact ? 2.2 : 3} fill={COLORS.card} stroke={COLORS.line} strokeWidth="1.2" />
        ) : (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={compact ? 2.6 : 3.6}
            fill={p.t >= FEVER_THRESHOLD ? COLORS.amber : COLORS.sage}
            stroke={COLORS.card}
            strokeWidth="1"
          />
        )
      )}
    </svg>
  );
}

function StreakPill({ streak }) {
  const ready = streak >= 3;
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontFamily: FONT_MONO,
        fontSize: 11.5,
        color: ready ? COLORS.sage : COLORS.muted,
        fontWeight: 600,
      }}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: i < streak ? COLORS.sage : COLORS.lineSoft,
            border: `1px solid ${i < streak ? COLORS.sage : COLORS.line}`,
          }}
        />
      ))}
      <span>{streak}/3 fever-free</span>
    </div>
  );
}

function Modal({ title, onClose, children, width = 420 }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(22,48,43,0.32)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: COLORS.card,
          borderRadius: 14,
          width,
          maxWidth: "100%",
          maxHeight: "85vh",
          overflowY: "auto",
          boxShadow: "0 24px 60px rgba(22,48,43,0.25)",
          fontFamily: FONT_BODY,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: `1px solid ${COLORS.lineSoft}`,
          }}
        >
          <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 18, color: COLORS.ink, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.muted, padding: 4 }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}

function FieldLabel({ children }) {
  return (
    <label style={{ display: "block", fontSize: 12.5, color: COLORS.inkSoft, fontWeight: 600, marginBottom: 6, fontFamily: FONT_BODY }}>
      {children}
    </label>
  );
}

const inputStyle = {
  width: "100%",
  border: `1px solid ${COLORS.line}`,
  borderRadius: 8,
  padding: "9px 11px",
  fontSize: 14,
  fontFamily: FONT_BODY,
  color: COLORS.ink,
  outline: "none",
  boxSizing: "border-box",
  marginBottom: 14,
};

function PrimaryButton({ children, onClick, disabled, tone = "teal", icon, style }) {
  const tones = {
    teal: { bg: COLORS.teal, hover: COLORS.tealDark },
    amber: { bg: COLORS.amber, hover: "#A8481E" },
    brick: { bg: COLORS.brick, hover: "#73332F" },
  };
  const t = tones[tone];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        background: disabled ? COLORS.lineSoft : t.bg,
        color: disabled ? COLORS.muted : "#fff",
        border: "none",
        borderRadius: 9,
        padding: "9px 16px",
        fontSize: 13.5,
        fontWeight: 600,
        fontFamily: FONT_BODY,
        cursor: disabled ? "not-allowed" : "pointer",
        width: "100%",
        ...style,
      }}
    >
      {icon}
      {children}
    </button>
  );
}

function GhostButton({ children, onClick, icon, style }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        background: "transparent",
        color: COLORS.inkSoft,
        border: `1px solid ${COLORS.line}`,
        borderRadius: 9,
        padding: "9px 14px",
        fontSize: 13.5,
        fontWeight: 600,
        fontFamily: FONT_BODY,
        cursor: "pointer",
        ...style,
      }}
    >
      {icon}
      {children}
    </button>
  );
}

function EmptyState({ icon, title, note }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "36px 20px",
        color: COLORS.muted,
        border: `1px dashed ${COLORS.line}`,
        borderRadius: 12,
        background: "#FBFCFB",
      }}
    >
      <div style={{ marginBottom: 10, display: "flex", justifyContent: "center", color: COLORS.sage }}>{icon}</div>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 15.5, color: COLORS.ink, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 13 }}>{note}</div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   Header / role switcher
--------------------------------------------------------------------- */
function TopBar({ role, setRole, occupied }) {
  const roles = [
    { id: "nurse", label: "Nurse", icon: <Thermometer size={14} /> },
    { id: "doctor", label: "Doctor", icon: <Stethoscope size={14} /> },
    { id: "admin", label: "Admin", icon: <ClipboardCheck size={14} /> },
  ];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 22px",
        borderBottom: `1px solid ${COLORS.line}`,
        background: COLORS.card,
        flexWrap: "wrap",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <span style={{ fontFamily: FONT_DISPLAY, fontSize: 21, color: COLORS.ink, fontWeight: 600 }}>Wardline</span>
        <span style={{ fontFamily: FONT_MONO, fontSize: 11.5, color: COLORS.muted, letterSpacing: "0.03em" }}>
          Quarantine Ward · {formatShort(TODAY)} · {occupied}/{TOTAL_BEDS} beds
        </span>
      </div>
      <div style={{ display: "flex", background: COLORS.paper, borderRadius: 10, padding: 3, gap: 2 }}>
        {roles.map((r) => (
          <button
            key={r.id}
            onClick={() => setRole(r.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              border: "none",
              cursor: "pointer",
              padding: "7px 14px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              fontFamily: FONT_BODY,
              background: role === r.id ? COLORS.teal : "transparent",
              color: role === r.id ? "#fff" : COLORS.inkSoft,
              transition: "all 120ms ease",
            }}
          >
            {r.icon}
            {r.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function NameStrip({ name, setName, role }) {
  const placeholder = role === "nurse" ? "Nurse Alvarez" : "Dr. Mensah";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 22px",
        background: COLORS.tealTint,
        borderBottom: `1px solid ${COLORS.line}`,
        fontSize: 12.5,
        color: COLORS.tealDark,
      }}
    >
      <span style={{ fontFamily: FONT_BODY, fontWeight: 600 }}>Signed in as</span>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={placeholder}
        style={{
          border: "none",
          background: "transparent",
          borderBottom: `1px solid ${COLORS.teal}`,
          fontFamily: FONT_MONO,
          fontSize: 12.5,
          color: COLORS.tealDark,
          outline: "none",
          padding: "1px 2px",
          width: 150,
        }}
      />
      <span style={{ color: COLORS.muted, fontSize: 12 }}>— every reading and note is logged under this name.</span>
    </div>
  );
}

/* ---------------------------------------------------------------------
   Patient card (shared shell, role-specific footer passed in)
--------------------------------------------------------------------- */
function PatientCard({ p, today, footer, accent }) {
  const streak = computeStreak(p.tempLog);
  const latestTemp = [...p.tempLog].sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  return (
    <div
      style={{
        background: COLORS.card,
        border: `1px solid ${accent ? COLORS.teal : COLORS.line}`,
        borderRadius: 13,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        boxShadow: accent ? "0 4px 16px rgba(47,111,98,0.10)" : "none",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16.5, color: COLORS.ink }}>{p.name}</div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 11.5, color: COLORS.muted, marginTop: 2 }}>
            {p.id} · Age {p.age} · Room {p.room}
          </div>
        </div>
        <StatusBadge status={p.status} />
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <FeverChart tempLog={p.tempLog} today={today} compact />
        <div style={{ textAlign: "right" }}>
          {latestTemp ? (
            <div style={{ fontFamily: FONT_MONO, fontSize: 13, color: latestTemp.tempF >= FEVER_THRESHOLD ? COLORS.amber : COLORS.sage, fontWeight: 700 }}>
              {latestTemp.tempF.toFixed(1)}°F
              <div style={{ fontSize: 10.5, color: COLORS.muted, fontWeight: 400 }}>{formatShort(latestTemp.date)}</div>
            </div>
          ) : (
            <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: COLORS.muted }}>no readings</div>
          )}
        </div>
      </div>

      <StreakPill streak={streak} />

      {footer}
    </div>
  );
}

/* ---------------------------------------------------------------------
   NURSE VIEW
--------------------------------------------------------------------- */
function NurseView({ patients, today, name, onAddTemp }) {
  const [tempModal, setTempModal] = useState(null); // patient id
  const [tempValue, setTempValue] = useState("");

  const resident = patients.filter((p) => p.status === "active" || p.status === "pending_discharge");
  const needsToday = resident.filter((p) => !loggedToday(p.tempLog, today));
  const done = resident.filter((p) => loggedToday(p.tempLog, today));

  const openModal = (id) => {
    setTempValue("");
    setTempModal(id);
  };
  const submit = () => {
    const v = parseFloat(tempValue);
    if (isNaN(v) || v < 90 || v > 110) return;
    onAddTemp(tempModal, v, name || "Nurse on duty");
    setTempModal(null);
  };
  const patient = patients.find((p) => p.id === tempModal);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
      <Section
        title="Needs a reading today"
        subtitle={`${needsToday.length} of ${resident.length} residents haven't had their temperature taken yet.`}
        icon={<Thermometer size={16} color={COLORS.amber} />}
      >
        {needsToday.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 size={28} />}
            title="Every resident is checked for today"
            note="New patients or a new day will repopulate this list."
          />
        ) : (
          <CardGrid>
            {needsToday.map((p) => (
              <PatientCard
                key={p.id}
                p={p}
                today={today}
                accent
                footer={
                  <PrimaryButton icon={<Plus size={15} />} onClick={() => openModal(p.id)}>
                    Record temperature
                  </PrimaryButton>
                }
              />
            ))}
          </CardGrid>
        )}
      </Section>

      <Section
        title="Already recorded today"
        subtitle="Logged once per resident per day — re-checking is disabled to keep the chart accurate."
        icon={<CheckCircle2 size={16} color={COLORS.sage} />}
      >
        {done.length === 0 ? (
          <EmptyState icon={<Thermometer size={26} />} title="Nothing logged yet today" note="Readings will appear here as you record them." />
        ) : (
          <CardGrid>
            {done.map((p) => (
              <PatientCard
                key={p.id}
                p={p}
                today={today}
                footer={
                  <div
                    style={{
                      fontSize: 12.5,
                      color: COLORS.sage,
                      fontFamily: FONT_BODY,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <CheckCircle2 size={14} /> Recorded for today
                  </div>
                }
              />
            ))}
          </CardGrid>
        )}
      </Section>

      {tempModal && patient && (
        <Modal title={`Record temperature — ${patient.name}`} onClose={() => setTempModal(null)}>
          <FieldLabel>Temperature (°F)</FieldLabel>
          <input
            autoFocus
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            placeholder="e.g. 99.4"
            style={inputStyle}
            type="number"
            step="0.1"
          />
          <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 14, marginTop: -8 }}>
            Fever threshold is {FEVER_THRESHOLD}°F. Readings above this break the fever-free streak.
          </div>
          <PrimaryButton onClick={submit} disabled={!tempValue} icon={<Thermometer size={15} />}>
            Save reading for {formatShort(today)}
          </PrimaryButton>
        </Modal>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------
   DOCTOR VIEW
--------------------------------------------------------------------- */
function DoctorView({ patients, today, name, onAddVisit, onOutcome }) {
  const [visitModal, setVisitModal] = useState(null);
  const [note, setNote] = useState("");
  const [outcomeConfirm, setOutcomeConfirm] = useState(null);

  const resident = patients.filter((p) => p.status === "active");
  const awaitingTemp = resident.filter((p) => !loggedToday(p.tempLog, today));
  const readyForVisit = resident.filter((p) => loggedToday(p.tempLog, today) && !loggedToday(p.visitLog, today));
  const visitedToday = resident.filter((p) => loggedToday(p.tempLog, today) && loggedToday(p.visitLog, today));
  const pendingAdmin = patients.filter((p) => p.status === "pending_discharge");

  const patient = patients.find((p) => p.id === visitModal);
  const streakOf = patient ? computeStreak(patient.tempLog) : 0;

  const submitVisit = (approve) => {
    onAddVisit(visitModal, note || "Reviewed, no new concerns.", name || "Doctor on duty", approve);
    setVisitModal(null);
    setNote("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
      <Section
        title="Ready for your visit"
        subtitle="Today's temperature is in — review the chart and leave a note."
        icon={<Stethoscope size={16} color={COLORS.teal} />}
      >
        {readyForVisit.length === 0 ? (
          <EmptyState icon={<CheckCircle2 size={26} />} title="Nothing waiting on you" note="Patients appear here once today's reading is in." />
        ) : (
          <CardGrid>
            {readyForVisit.map((p) => {
              const s = computeStreak(p.tempLog);
              return (
                <PatientCard
                  key={p.id}
                  p={p}
                  today={today}
                  accent
                  footer={
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {s >= 3 && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: COLORS.sage, fontWeight: 600 }}>
                          <Sparkles size={14} /> Eligible for discharge
                        </div>
                      )}
                      <PrimaryButton icon={<Stethoscope size={15} />} onClick={() => setVisitModal(p.id)}>
                        Visit &amp; add note
                      </PrimaryButton>
                    </div>
                  }
                />
              );
            })}
          </CardGrid>
        )}
      </Section>

      <Section
        title="Awaiting a temperature reading"
        subtitle="No reading yet today — visiting now means doing the nurse's job yourself. Locked until a nurse logs it."
        icon={<AlertTriangle size={16} color={COLORS.amber} />}
      >
        {awaitingTemp.length === 0 ? (
          <EmptyState icon={<CheckCircle2 size={26} />} title="No one is waiting on a nurse" note="All residents have today's reading logged." />
        ) : (
          <CardGrid>
            {awaitingTemp.map((p) => (
              <PatientCard
                key={p.id}
                p={p}
                today={today}
                footer={
                  <div
                    style={{
                      fontSize: 12.5,
                      color: COLORS.amber,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      background: COLORS.amberTint,
                      borderRadius: 7,
                      padding: "6px 9px",
                    }}
                  >
                    <AlertTriangle size={13} /> Awaiting temperature — visit disabled
                  </div>
                }
              />
            ))}
          </CardGrid>
        )}
      </Section>

      <Section title="Visited today" subtitle="Already reviewed — no action needed." icon={<CheckCircle2 size={16} color={COLORS.sage} />}>
        {visitedToday.length === 0 ? (
          <EmptyState icon={<Stethoscope size={26} />} title="No visits logged yet" note="Completed visits will move here." />
        ) : (
          <CardGrid>
            {visitedToday.map((p) => (
              <PatientCard key={p.id} p={p} today={today} footer={<div style={{ fontSize: 12.5, color: COLORS.muted }}>{p.visitLog.find((v) => v.date === today)?.note}</div>} />
            ))}
          </CardGrid>
        )}
      </Section>

      {pendingAdmin.length > 0 && (
        <Section title="Sent to admin for discharge" subtitle="Awaiting the front desk to free the bed." icon={<ArrowRight size={16} color={COLORS.gold} />}>
          <CardGrid>
            {pendingAdmin.map((p) => (
              <PatientCard key={p.id} p={p} today={today} footer={<div style={{ fontSize: 12.5, color: COLORS.muted }}>Approved {formatShort(p.visitLog[p.visitLog.length - 1]?.date)} — waiting on admin.</div>} />
            ))}
          </CardGrid>
        </Section>
      )}

      {visitModal && patient && (
        <Modal title={`Visit — ${patient.name}`} onClose={() => setVisitModal(null)} width={460}>
          <div style={{ marginBottom: 14 }}>
            <FeverChart tempLog={patient.tempLog} today={today} />
          </div>
          <StreakPill streak={streakOf} />
          <div style={{ height: 14 }} />
          <FieldLabel>Note for the chart</FieldLabel>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Fever resolving, continue current course."
            style={{ ...inputStyle, minHeight: 72, resize: "vertical" }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {streakOf >= 3 ? (
              <PrimaryButton tone="teal" icon={<CheckCircle2 size={15} />} onClick={() => submitVisit(true)}>
                Approve discharge &amp; send to admin
              </PrimaryButton>
            ) : (
              <PrimaryButton tone="teal" icon={<Stethoscope size={15} />} onClick={() => submitVisit(false)}>
                Save visit note
              </PrimaryButton>
            )}
            <GhostButton
              icon={<ShieldAlert size={14} />}
              onClick={() => {
                setOutcomeConfirm(visitModal);
                setVisitModal(null);
              }}
              style={{ color: COLORS.brick, borderColor: COLORS.brickTint }}
            >
              Record outcome: deceased
            </GhostButton>
          </div>
        </Modal>
      )}

      {outcomeConfirm && (
        <Modal title="Confirm outcome" onClose={() => setOutcomeConfirm(null)} width={400}>
          <p style={{ fontSize: 13.5, color: COLORS.inkSoft, lineHeight: 1.5, marginTop: 0 }}>
            This permanently closes the chart for <strong>{patients.find((p) => p.id === outcomeConfirm)?.name}</strong> and frees their bed. This
            action feeds directly into the ward's mortality tracking and cannot be undone here.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <GhostButton onClick={() => setOutcomeConfirm(null)} style={{ flex: 1 }}>
              Cancel
            </GhostButton>
            <PrimaryButton
              tone="brick"
              style={{ flex: 1 }}
              onClick={() => {
                onOutcome(outcomeConfirm, "deceased");
                setOutcomeConfirm(null);
              }}
            >
              Confirm
            </PrimaryButton>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------
   ADMIN VIEW
--------------------------------------------------------------------- */
function AdminView({ patients, onAdmit, onFinalizeDischarge }) {
  const [admitOpen, setAdmitOpen] = useState(false);
  const [form, setForm] = useState({ name: "", age: "", room: "" });

  const resident = patients.filter((p) => p.status === "active" || p.status === "pending_discharge");
  const pendingDischarge = patients.filter((p) => p.status === "pending_discharge");
  const dischargedCured = patients.filter((p) => p.status === "discharged").length;
  const deceased = patients.filter((p) => p.status === "deceased").length;
  const outcomes = dischargedCured + deceased;
  const successRate = outcomes ? Math.round((dischargedCured / outcomes) * 100) : null;
  const benchmark = 85;
  const atCapacity = resident.length >= TOTAL_BEDS;

  const submitAdmit = () => {
    if (!form.name || !form.age || !form.room) return;
    onAdmit({ name: form.name, age: parseInt(form.age, 10), room: form.room });
    setForm({ name: "", age: "", room: "" });
    setAdmitOpen(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14 }}>
        <StatCard
          icon={<BedDouble size={17} />}
          label="Beds occupied"
          value={`${resident.length} / ${TOTAL_BEDS}`}
          note={atCapacity ? "At capacity — admissions blocked" : `${TOTAL_BEDS - resident.length} beds free`}
          tone={atCapacity ? "amber" : "teal"}
        />
        <StatCard
          icon={successRate !== null && successRate < benchmark ? <TrendingDown size={17} /> : <TrendingUp size={17} />}
          label="Success rate"
          value={successRate === null ? "No outcomes yet" : `${successRate}%`}
          note={successRate === null ? "Recorded once a patient is discharged or an outcome is logged" : `Benchmark ${benchmark}% · ${dischargedCured} recovered, ${deceased} deceased`}
          tone={successRate !== null && successRate < benchmark ? "brick" : "sage"}
        />
        <StatCard icon={<ArrowRight size={17} />} label="Pending discharge" value={pendingDischarge.length} note="Approved by a doctor, awaiting bed release" tone="gold" />
        <StatCard icon={<Users size={17} />} label="Total tracked" value={patients.length} note="Across all statuses, this ward" tone="muted" />
      </div>

      {successRate !== null && successRate < benchmark && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: COLORS.brickTint,
            color: COLORS.brick,
            borderRadius: 10,
            padding: "12px 16px",
            fontSize: 13.5,
          }}
        >
          <AlertTriangle size={17} />
          Success rate has dropped below the {benchmark}% benchmark. Consider flagging this to the head doctor for a treatment review.
        </div>
      )}

      <Section title="Admissions" subtitle="Bring a new patient onto the ward." icon={<UserPlus size={16} color={COLORS.teal} />} action={
        <PrimaryButton icon={<Plus size={15} />} onClick={() => setAdmitOpen(true)} disabled={atCapacity} style={{ width: "auto" }}>
          Admit patient
        </PrimaryButton>
      }>
        {atCapacity && (
          <div style={{ fontSize: 13, color: COLORS.amber, marginTop: -6 }}>
            The ward is at full capacity ({TOTAL_BEDS} beds). Discharge a patient before admitting another.
          </div>
        )}
      </Section>

      <Section title="Awaiting discharge" subtitle="A doctor has confirmed 3 fever-free days. Finalize to free the bed." icon={<ClipboardCheck size={16} color={COLORS.gold} />}>
        {pendingDischarge.length === 0 ? (
          <EmptyState icon={<CheckCircle2 size={26} />} title="No discharges waiting" note="Approved patients will appear here." />
        ) : (
          <CardGrid>
            {pendingDischarge.map((p) => (
              <PatientCard
                key={p.id}
                p={p}
                today={TODAY}
                accent
                footer={
                  <PrimaryButton icon={<LogOut size={15} />} onClick={() => onFinalizeDischarge(p.id)}>
                    Finalize discharge &amp; free bed
                  </PrimaryButton>
                }
              />
            ))}
          </CardGrid>
        )}
      </Section>

      <Section title="Ward history" subtitle="Closed records — for the quality log." icon={<Activity size={16} color={COLORS.muted} />}>
        <div style={{ border: `1px solid ${COLORS.line}`, borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT_BODY, fontSize: 13 }}>
            <thead>
              <tr style={{ background: COLORS.paper, textAlign: "left" }}>
                {["Patient", "Admitted", "Outcome", "Date"].map((h) => (
                  <th key={h} style={{ padding: "9px 14px", color: COLORS.muted, fontWeight: 600, fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {patients
                .filter((p) => p.status === "discharged" || p.status === "deceased")
                .map((p) => (
                  <tr key={p.id} style={{ borderTop: `1px solid ${COLORS.lineSoft}` }}>
                    <td style={{ padding: "9px 14px", color: COLORS.ink, fontFamily: FONT_DISPLAY }}>{p.name}</td>
                    <td style={{ padding: "9px 14px", fontFamily: FONT_MONO, color: COLORS.muted }}>{formatShort(p.admittedOn)}</td>
                    <td style={{ padding: "9px 14px" }}>
                      <StatusBadge status={p.status} />
                    </td>
                    <td style={{ padding: "9px 14px", fontFamily: FONT_MONO, color: COLORS.muted }}>{formatShort(p.dischargedOn || p.outcomeOn)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Section>

      {admitOpen && (
        <Modal title="Admit a new patient" onClose={() => setAdmitOpen(false)}>
          <FieldLabel>Full name</FieldLabel>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} placeholder="e.g. Tara Bose" />
          <FieldLabel>Age</FieldLabel>
          <input value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} style={inputStyle} type="number" placeholder="e.g. 34" />
          <FieldLabel>Room</FieldLabel>
          <input value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} style={inputStyle} placeholder="e.g. 6C" />
          <PrimaryButton onClick={submitAdmit} disabled={!form.name || !form.age || !form.room} icon={<UserPlus size={15} />}>
            Admit to ward
          </PrimaryButton>
        </Modal>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, note, tone }) {
  const tones = {
    teal: COLORS.teal,
    amber: COLORS.amber,
    sage: COLORS.sage,
    brick: COLORS.brick,
    gold: COLORS.gold,
    muted: COLORS.muted,
  };
  const c = tones[tone] || COLORS.teal;
  return (
    <div style={{ background: COLORS.card, border: `1px solid ${COLORS.line}`, borderRadius: 13, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: c, marginBottom: 10 }}>
        {icon}
        <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: "0.03em" }}>{label}</span>
      </div>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 26, color: COLORS.ink }}>{value}</div>
      <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 4 }}>{note}</div>
    </div>
  );
}

function Section({ title, subtitle, icon, children, action }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12, gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {icon}
            <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 17.5, color: COLORS.ink, margin: 0 }}>{title}</h2>
          </div>
          {subtitle && <div style={{ fontSize: 12.5, color: COLORS.muted, marginTop: 3 }}>{subtitle}</div>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function CardGrid({ children }) {
  return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 14 }}>{children}</div>;
}

/* ---------------------------------------------------------------------
   ROOT APP
--------------------------------------------------------------------- */
export default function Wardline() {
  const [patients, setPatients] = useState(seedPatients);
  const [role, setRole] = useState("nurse");
  const [names, setNames] = useState({ nurse: "", doctor: "" });

  const occupied = patients.filter((p) => p.status === "active" || p.status === "pending_discharge").length;

  const addTemp = (id, tempF, by) => {
    setPatients((prev) => prev.map((p) => (p.id === id ? { ...p, tempLog: [...p.tempLog, { date: TODAY, tempF, by }] } : p)));
  };

  const addVisit = (id, note, by, approveDischarge) => {
    setPatients((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              visitLog: [...p.visitLog, { date: TODAY, by, note, approvedDischarge: !!approveDischarge }],
              status: approveDischarge ? "pending_discharge" : p.status,
            }
          : p
      )
    );
  };

  const recordOutcome = (id, outcome) => {
    setPatients((prev) => prev.map((p) => (p.id === id ? { ...p, status: outcome, outcomeOn: TODAY } : p)));
  };

  const admitPatient = ({ name, age, room }) => {
    const newId = "P-" + Math.floor(100 + Math.random() * 800);
    setPatients((prev) => [
      ...prev,
      { id: newId, name, age, room, admittedOn: TODAY, status: "active", tempLog: [], visitLog: [] },
    ]);
  };

  const finalizeDischarge = (id) => {
    setPatients((prev) => prev.map((p) => (p.id === id ? { ...p, status: "discharged", dischargedOn: TODAY } : p)));
  };

  return (
    <div style={{ fontFamily: FONT_BODY, background: COLORS.paper, minHeight: "100%", color: COLORS.ink }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Serif:wght@500;600&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        input::placeholder, textarea::placeholder { color: #9DAEA8; }
        input:focus, textarea:focus { border-color: ${COLORS.teal} !important; }
      `}</style>

      <TopBar role={role} setRole={setRole} occupied={occupied} />
      {(role === "nurse" || role === "doctor") && (
        <NameStrip role={role} name={names[role]} setName={(v) => setNames({ ...names, [role]: v })} />
      )}

      <div style={{ padding: "24px 22px 60px", maxWidth: 1180, margin: "0 auto" }}>
        {role === "nurse" && <NurseView patients={patients} today={TODAY} name={names.nurse} onAddTemp={addTemp} />}
        {role === "doctor" && (
          <DoctorView patients={patients} today={TODAY} name={names.doctor} onAddVisit={addVisit} onOutcome={recordOutcome} />
        )}
        {role === "admin" && <AdminView patients={patients} onAdmit={admitPatient} onFinalizeDischarge={finalizeDischarge} />}
      </div>
    </div>
  );
}
