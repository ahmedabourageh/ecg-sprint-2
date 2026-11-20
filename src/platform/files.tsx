// Portable replacement for the @instinct/files runtime library.
// The app was originally built inside Instinct's file platform, which supplies
// these layout components and the router. This shim reimplements the exact
// subset the app uses, on top of react-router-dom and localStorage, so the
// app builds and runs anywhere. A vite alias maps '@instinct/files' here.
import React, { useCallback, useState } from 'react';
import {
  HashRouter,
  Link as RouterLink,
  NavLink as RouterNavLink,
  Route as RouterRoute,
  Routes as RouterRoutes,
} from 'react-router-dom';
import './platform.css';

// HashRouter so the app works on plain static hosting (GitHub Pages, Netlify
// drop) with no server-side rewrite rules. In-app URLs look like #/m/foundations.
export function FileRouter({ children }: { children: React.ReactNode }) {
  return <HashRouter>{children}</HashRouter>;
}

export const Route = RouterRoute;
export const Routes = RouterRoutes;

export function FileCard({ lang, dir, children }: { lang?: string; dir?: string; children: React.ReactNode }) {
  return (
    <div className="file-card" lang={lang} dir={dir}>
      {children}
    </div>
  );
}

export function Header({ title, fact, intro }: { title: string; fact?: string; intro?: string }) {
  return (
    <header className="file-header">
      <h1 className="file-title">{title}</h1>
      {fact && <p className="file-fact">{fact}</p>}
      {intro && <p className="file-intro">{intro}</p>}
    </header>
  );
}

export function Group({ label, heading, children }: { label: string; heading?: string | boolean; children: React.ReactNode }) {
  return (
    <section className="file-group">
      {heading === true
        ? <h2 className="file-group-heading">{label}</h2>
        : <>
            <p className="file-group-label">{label}</p>
            {typeof heading === 'string' && <h2 className="file-group-heading">{heading}</h2>}
          </>}
      <div className="file-group-body">{children}</div>
    </section>
  );
}

export function Text({ children }: { children: React.ReactNode }) {
  return <div className="file-text">{children}</div>;
}

export function Paragraph({ children }: { children: React.ReactNode }) {
  return <p className="file-paragraph">{children}</p>;
}

export function Facts({ items }: { items: { label: string; value: string }[] }) {
  return (
    <dl className="file-facts">
      {items.map((it) => (
        <div key={it.label} className="file-fact-row">
          <dt>{it.label}</dt>
          <dd>{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Rows({ children }: { children: React.ReactNode }) {
  return <div className="file-rows">{children}</div>;
}

export function Row({ number, name, detail }: { number?: number; name: string; detail?: string }) {
  return (
    <div className="file-row">
      {number !== undefined && <span className="file-row-num">{number}.</span>}
      <div className="file-row-text">
        <span className="file-row-name">{name}</span>
        {detail && <span className="file-row-detail">{detail}</span>}
      </div>
    </div>
  );
}

type LinkProps = {
  to: string;
  className?: string;
  children: React.ReactNode;
} & Record<string, unknown>;

export function Link({ to, className, children, ...rest }: LinkProps) {
  return (
    <RouterLink to={to} className={className} {...rest}>
      {children}
    </RouterLink>
  );
}

export function NavLink({ to, end, className, children, ...rest }: LinkProps & { end?: boolean }) {
  return (
    <RouterNavLink to={to} end={end} className={className} {...rest}>
      {children}
    </RouterNavLink>
  );
}

export function Callout({ title, tone, children }: { title: string; tone?: 'note' | 'warning'; children: React.ReactNode }) {
  return (
    <div className={`file-callout is-${tone ?? 'note'}`}>
      <p className="file-callout-title">{title}</p>
      <div className="file-callout-body">{children}</div>
    </div>
  );
}

export function Closing({ children }: { children: React.ReactNode }) {
  return <footer className="file-closing">{children}</footer>;
}

// Persistent state on localStorage. Mirrors the platform's useLocalState
// signature: [value, setValue, { ready }]. ready is true immediately here
// because localStorage is synchronous.
export function useLocalState<T>(key: string, initial: T): [T, (v: T) => void, { ready: boolean }] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) return JSON.parse(raw) as T;
    } catch { /* corrupted or unavailable storage: fall back to initial */ }
    return initial;
  });
  const set = useCallback((v: T) => {
    setValue(v);
    try {
      window.localStorage.setItem(key, JSON.stringify(v));
    } catch { /* storage full or blocked: keep in-memory state */ }
  }, [key]);
  return [value, set, { ready: true }];
}
