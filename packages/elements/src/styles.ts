/** Themed with CSS custom properties on the element; every piece is also a ::part() for full control. */
export const STYLES = `
:host {
  --clourora-accent: #6d4c41;
  --clourora-on-accent: #fff;
  --clourora-surface: #fff;
  --clourora-text: #2b2b2b;
  --clourora-muted: #6b6b6b;
  --clourora-radius: 16px;
  --clourora-gap: 20px;
  --clourora-card-min: 240px;
  --clourora-shadow: 0 2px 12px rgb(0 0 0 / 0.08);
  display: block;
  font: inherit;
  color: var(--clourora-text);
}
[hidden] { display: none !important; }
.grid {
  display: grid;
  gap: var(--clourora-gap);
  grid-template-columns: repeat(auto-fill, minmax(min(100%, var(--clourora-card-min)), 1fr));
}
.card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: var(--clourora-radius);
  background: var(--clourora-surface);
  box-shadow: var(--clourora-shadow);
  cursor: pointer;
  text-align: start;
  border: 0;
  padding: 0;
  font: inherit;
  color: inherit;
}
.card:focus-visible { outline: 2px solid var(--clourora-accent); outline-offset: 2px; }
.photo { position: relative; aspect-ratio: 4 / 3; background: color-mix(in srgb, var(--clourora-accent) 12%, transparent); }
.photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
.badge {
  position: absolute; top: 10px; inset-inline-start: 10px;
  padding: 2px 10px; border-radius: 999px; font-size: 0.8em;
  background: var(--clourora-accent); color: var(--clourora-on-accent);
}
.body { display: flex; flex-direction: column; gap: 6px; padding: 14px 16px 16px; flex: 1; }
.name { margin: 0; font-size: 1.15em; font-weight: 600; }
.meta { margin: 0; color: var(--clourora-muted); font-size: 0.9em; }
.tags { display: flex; flex-wrap: wrap; gap: 6px; margin: 4px 0 0; padding: 0; list-style: none; }
.tags li {
  padding: 2px 8px; border-radius: 999px; font-size: 0.8em;
  background: color-mix(in srgb, var(--clourora-accent) 10%, transparent);
}
.bio { margin: 4px 0 0; font-size: 0.95em; line-height: 1.45; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
.cta {
  align-self: flex-start; margin-top: auto; padding: 8px 16px; border-radius: 999px; text-decoration: none;
  background: var(--clourora-accent); color: var(--clourora-on-accent); font-size: 0.9em;
}
.state { color: var(--clourora-muted); padding: 24px 0; text-align: center; }
`;
