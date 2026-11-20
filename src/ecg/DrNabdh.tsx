import React from 'react';

// Dr. Beat: the app's teacher character.
// Flat geometric vector, white coat and stethoscope: neat and respectable,
// with a light bounce so he feels alive without looking childish.
export function DrBeat({ size = 96, talking = false }: { size?: number; talking?: boolean }) {
  return (
    <svg className="ecg-avatar" width={size} height={size} viewBox="0 0 120 120" role="img" aria-label="Dr. Beat, your ECG teacher">
      <circle cx={60} cy={60} r={56} fill="#f4efec" />
      <circle cx={60} cy={46} r={22} fill="#f6c89f" />
      <path d="M38 44 C38 30 48 24 60 24 C72 24 82 30 82 44 C82 40 72 36 60 36 C48 36 38 40 38 44 Z" fill="#3d3235" />
      <circle cx={52} cy={48} r={2.6} fill="#251f21" />
      <circle cx={68} cy={48} r={2.6} fill="#251f21" />
      {talking ? (
        <ellipse cx={60} cy={58} rx={6} ry={2.4} fill="#8a4a3a">
          <animate attributeName="ry" values="2.4;5;2.8;4.6;2.4" dur="0.55s" repeatCount="indefinite" />
        </ellipse>
      ) : (
        <path d="M52 56 Q60 62 68 56" stroke="#251f21" strokeWidth={2.2} fill="none" strokeLinecap="round" />
      )}
      <rect x={36} y={70} width={48} height={38} rx={10} fill="#ffffff" stroke="#eae9ea" strokeWidth={2} />
      <path d="M60 70 L60 108" stroke="#eae9ea" strokeWidth={2} />
      <path d="M46 72 L52 86 M74 72 L68 86" stroke="#c0bebf" strokeWidth={2} fill="none" />
      <path d="M48 88 C48 96 54 100 60 100" stroke="#585254" strokeWidth={2.5} fill="none" />
      <circle cx={61} cy={101} r={4} fill="none" stroke="#585254" strokeWidth={2.5} />
      <rect x={63} y={76} width={14} height={10} rx={2} fill="#ed313e" />
      <path d="M66 81 h3 M71 81 h3" stroke="#ffffff" strokeWidth={1.6} />
    </svg>
  );
}
