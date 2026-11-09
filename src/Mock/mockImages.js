// Generates inline SVG data-URIs for website icons and screenshots so the
// mock data needs no network access. Colours come from the existing palette.

const ICON_COLORS = [
  ["#c4956a", "#b08560"],
  ["#334155", "#1e293b"],
  ["#d4a574", "#c4956a"],
  ["#389e61", "#2d7d4d"],
  ["#b08560", "#8a6a48"],
  ["#475569", "#334155"],
];

const toDataUri = (svg) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

export function makeIcon(name, index = 0) {
  const [from, to] = ICON_COLORS[index % ICON_COLORS.length];
  const letter = (name || "?").charAt(0).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="128" height="128" fill="url(#g)"/><text x="64" y="64" text-anchor="middle" dominant-baseline="central" font-family="Poppins, Arial, sans-serif" font-size="64" font-weight="700" fill="#ffffff">${letter}</text></svg>`;
  return toDataUri(svg);
}

export function makeScreenshot(title, variant = 0) {
  const accents = ["#c4956a", "#334155", "#389e61"];
  const accent = accents[variant % accents.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400"><rect width="640" height="400" fill="#f5efe6"/><rect x="0" y="0" width="640" height="44" fill="#fafafa"/><circle cx="24" cy="22" r="6" fill="#e0d9d0"/><circle cx="44" cy="22" r="6" fill="#e0d9d0"/><circle cx="64" cy="22" r="6" fill="#e0d9d0"/><rect x="40" y="76" width="260" height="22" rx="6" fill="${accent}"/><rect x="40" y="112" width="360" height="12" rx="6" fill="#e0d9d0"/><rect x="40" y="134" width="300" height="12" rx="6" fill="#e0d9d0"/><rect x="40" y="176" width="170" height="150" rx="14" fill="#fafafa" stroke="#e0d9d0"/><rect x="235" y="176" width="170" height="150" rx="14" fill="#fafafa" stroke="#e0d9d0"/><rect x="430" y="176" width="170" height="150" rx="14" fill="#fafafa" stroke="#e0d9d0"/><rect x="56" y="192" width="48" height="48" rx="12" fill="${accent}" opacity="0.85"/><rect x="251" y="192" width="48" height="48" rx="12" fill="${accent}" opacity="0.55"/><rect x="446" y="192" width="48" height="48" rx="12" fill="${accent}" opacity="0.3"/><rect x="56" y="256" width="110" height="10" rx="5" fill="#e0d9d0"/><rect x="251" y="256" width="110" height="10" rx="5" fill="#e0d9d0"/><rect x="446" y="256" width="110" height="10" rx="5" fill="#e0d9d0"/><text x="320" y="368" text-anchor="middle" font-family="Poppins, Arial, sans-serif" font-size="14" fill="#767676">${title}</text></svg>`;
  return toDataUri(svg);
}
