"use client";

import type { Transaction } from "@/types";

interface DayData {
  hasIncome: boolean;
  hasExpense: boolean;
}

interface ExpenseCalendarProps {
  year: number;
  month: number;
  transactions: Transaction[];
  selectedDate: string | null; // ISO YYYY-MM-DD or null
  onSelectDate: (date: string | null) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  isNextMonthDisabled: boolean;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function ExpenseCalendar({
  year,
  month,
  transactions,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  isNextMonthDisabled,
}: ExpenseCalendarProps) {
  // Build a map: "YYYY-MM-DD" → { hasIncome, hasExpense }
  const dayMap: Record<string, DayData> = {};
  for (const t of transactions) {
    const existing = dayMap[t.date] ?? { hasIncome: false, hasExpense: false };
    dayMap[t.date] = {
      hasIncome: existing.hasIncome || t.type === "income",
      hasExpense: existing.hasExpense || t.type === "expense",
    };
  }

  // Calendar grid math
  const firstDay = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month, 0).getDate();
  const todayISO = new Date().toISOString().split("T")[0];

  // Pad the start with empty slots, then fill days
  const cells: Array<number | null> = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // Pad end to complete the last row (for consistent grid height)
  while (cells.length % 7 !== 0) cells.push(null);

  const toISO = (day: number) =>
    `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const handleDayClick = (day: number) => {
    const iso = toISO(day);
    onSelectDate(selectedDate === iso ? null : iso);
  };

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5edf5",
        borderRadius: "8px",
        boxShadow: "rgba(23,23,23,0.08) 0px 15px 35px 0px",
        overflow: "hidden",
      }}
    >
      {/* Calendar header — month nav */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid #e5edf5" }}
      >
        <button
          onClick={onPrevMonth}
          style={{
            background: "transparent",
            border: "1px solid #e5edf5",
            borderRadius: "4px",
            padding: "4px 10px",
            color: "#273951",
            fontSize: "14px",
            cursor: "pointer",
            lineHeight: 1,
          }}
        >
          ‹
        </button>
        <span
          style={{
            fontSize: "14px",
            fontWeight: 400,
            color: "#061b31",
            fontFeatureSettings: '"ss01"',
            letterSpacing: "-0.1px",
          }}
        >
          {MONTH_NAMES[month - 1]} {year}
        </span>
        <button
          onClick={onNextMonth}
          disabled={isNextMonthDisabled}
          style={{
            background: "transparent",
            border: "1px solid #e5edf5",
            borderRadius: "4px",
            padding: "4px 10px",
            color: isNextMonthDisabled ? "#e5edf5" : "#273951",
            fontSize: "14px",
            cursor: isNextMonthDisabled ? "default" : "pointer",
            lineHeight: 1,
          }}
        >
          ›
        </button>
      </div>

      {/* Day name headers */}
      <div className="grid grid-cols-7 px-2 pt-2">
        {DAY_NAMES.map((d) => (
          <div
            key={d}
            className="text-center py-1"
            style={{
              fontSize: "10px",
              fontWeight: 400,
              color: "#64748d",
              fontFeatureSettings: '"ss01"',
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-1 px-2 pb-3">
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} />;
          }

          const iso = toISO(day);
          const isToday = iso === todayISO;
          const isSelected = iso === selectedDate;
          const dots = dayMap[iso];

          return (
            <button
              key={iso}
              onClick={() => handleDayClick(day)}
              className="flex flex-col items-center justify-center py-1 rounded transition-colors"
              style={{
                border: "none",
                cursor: "pointer",
                borderRadius: "6px",
                background: isSelected
                  ? "#533afd"
                  : isToday
                  ? "rgba(83,58,253,0.06)"
                  : "transparent",
                minHeight: 44,
                gap: 2,
              }}
            >
              {/* Day number */}
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: isToday && !isSelected ? 400 : 300,
                  fontFeatureSettings: '"tnum"',
                  color: isSelected
                    ? "#ffffff"
                    : isToday
                    ? "#533afd"
                    : "#061b31",
                  lineHeight: 1,
                }}
              >
                {day}
              </span>

              {/* Dots row */}
              <div className="flex items-center gap-0.5" style={{ minHeight: 6 }}>
                {dots?.hasIncome && (
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: isSelected ? "rgba(255,255,255,0.8)" : "#15be53",
                      display: "inline-block",
                      flexShrink: 0,
                    }}
                  />
                )}
                {dots?.hasExpense && (
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: isSelected ? "rgba(255,255,255,0.6)" : "#ea2261",
                      display: "inline-block",
                      flexShrink: 0,
                    }}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected date label */}
      {selectedDate && (
        <div
          className="flex items-center justify-between px-4 py-2"
          style={{ borderTop: "1px solid #e5edf5" }}
        >
          <span
            style={{
              fontSize: "12px",
              color: "#533afd",
              fontFeatureSettings: '"ss01"',
              fontWeight: 400,
            }}
          >
            Showing {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric" })}
          </span>
          <button
            onClick={() => onSelectDate(null)}
            style={{
              fontSize: "11px",
              color: "#64748d",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFeatureSettings: '"ss01"',
              padding: "2px 4px",
            }}
          >
            Show all ×
          </button>
        </div>
      )}
    </div>
  );
}
