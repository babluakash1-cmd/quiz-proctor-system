// ==============================================================================
// Dynamic Color Themes:
// 1. General Interface / Admin Portal: Blue mixed with Gold
// 2. Room 1 (R1): Orange & Lavender
// 3. Room 2 & 3 (R2 / R3 / R23): Black & Maroon
// ==============================================================================

export const GENERAL_THEME = {
  name: 'General Portal (Blue & Gold)',
  bg: 'bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900',
  cardBg: 'bg-slate-900/90 backdrop-blur-md',
  text: 'text-amber-400',
  textLight: 'text-slate-100',
  subText: 'text-slate-400',
  border: 'border-amber-500/60',
  inputBg: 'bg-slate-950 text-amber-300 placeholder-slate-500 border-amber-500/50',
  buttonBg: 'bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-extrabold shadow-lg shadow-amber-500/20',
  headerBg: 'bg-slate-950/80 border-b-2 border-amber-500/60 backdrop-blur-md',
  badge: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
  accentColor: '#f59e0b',
  primaryColor: '#1e3a8a'
};

export const ROOM_THEMES = {
  // Room 1 -> Orange and Lavender Theme
  r1: {
    name: 'Room 1 (Orange & Lavender)',
    bg: 'bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-950',
    cardBg: 'bg-purple-950/80 backdrop-blur-md',
    text: 'text-orange-400',
    textLight: 'text-purple-100',
    subText: 'text-purple-300',
    border: 'border-orange-500/70',
    inputBg: 'bg-purple-950 text-orange-300 placeholder-purple-400 border-orange-500/60',
    buttonBg: 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-purple-950 font-extrabold shadow-lg shadow-orange-500/30',
    headerBg: 'bg-purple-950/90 border-b-2 border-orange-500/70 backdrop-blur-md',
    badge: 'bg-purple-900/90 text-purple-200 border border-purple-400/60',
    optionDefault: 'border-purple-400/40 bg-purple-900/30 text-purple-100 hover:bg-orange-500/20 hover:border-orange-400/60',
    optionSelected: 'border-orange-500 bg-gradient-to-r from-orange-500 to-amber-500 text-purple-950 font-extrabold shadow-md shadow-orange-500/40',
    accentColor: '#f97316',
    primaryColor: '#a855f7'
  },
  // Room 2 & Room 3 (R2, R3, R23) -> Black and Maroon Theme
  r2: {
    name: 'Room 2 & 3 (Black & Maroon)',
    bg: 'bg-gradient-to-br from-black via-zinc-950 to-neutral-950',
    cardBg: 'bg-zinc-950/95 backdrop-blur-md',
    text: 'text-rose-500',
    textLight: 'text-zinc-100',
    subText: 'text-zinc-400',
    border: 'border-rose-900/80',
    inputBg: 'bg-black text-rose-300 placeholder-zinc-600 border-rose-900',
    buttonBg: 'bg-gradient-to-r from-rose-950 to-maroon hover:from-rose-900 hover:to-red-950 text-rose-100 font-extrabold border border-rose-700/70 shadow-lg shadow-rose-950/60',
    headerBg: 'bg-black/90 border-b-2 border-rose-900/80 backdrop-blur-md',
    badge: 'bg-rose-950/80 text-rose-300 border border-rose-800/70',
    optionDefault: 'border-rose-950 bg-zinc-900/70 text-zinc-200 hover:bg-rose-950/30 hover:border-rose-800/80',
    optionSelected: 'border-rose-600 bg-gradient-to-r from-rose-900 to-rose-950 text-white font-extrabold shadow-md shadow-rose-900/50',
    accentColor: '#9f1239',
    primaryColor: '#09090b'
  }
};

/**
 * Get color theme based on room code or room name
 * R1 -> Orange & Lavender
 * R2, R3, R23 -> Black & Maroon
 * Otherwise -> General Blue & Gold
 */
export function getRoomTheme(roomCodeOrName) {
  if (!roomCodeOrName) return GENERAL_THEME;
  const str = String(roomCodeOrName).toUpperCase();

  if (
    str.includes('R1') ||
    str.includes('ROOM 1') ||
    str.includes('ROOM_1') ||
    str.includes('CORE')
  ) {
    return ROOM_THEMES.r1;
  }

  if (
    str.includes('R2') ||
    str.includes('R3') ||
    str.includes('R23') ||
    str.includes('ROOM 2') ||
    str.includes('ROOM 3') ||
    str.includes('ROOM_2') ||
    str.includes('ROOM_3') ||
    str.includes('COMMUNICATION')
  ) {
    return ROOM_THEMES.r2;
  }

  return GENERAL_THEME;
}
