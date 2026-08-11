// Star Shard — the shareable card PNG.
//
// OWNER: Claude Code (drawing mechanics). The CARD block below is the tunable
// surface — sizes, colours and type are safe to change from a design pass.
//
// NOTE (audit W10): this renders 720x1000 (18:25). The share surface people
// actually post to is 9:16 / 1080x1920. Changing W and H here plus the y
// positions is the whole job; the drawing code is resolution-independent.

export const CARD = {
  W: 720,
  H: 1000,
  bg: ['#fefcff', '#f2fbfa', '#fff5fa'],
  frameOuter: '#ffb7d5',
  frameInner: '#7fdbd4',
  ink: '#6d5a68',
  name: '#8a4d9e',
  muted: '#c9a0b8',
  sub: '#a06f8c',
  chipLabel: '#c9b3c0',
  eyebrow: '✧ S T A R  S H A R D · C E R T I F I E D  C U T E ✧',
  footer: 'starshard95 · tag your oshi ♡',
  chipColors: ['#3fb8ad', '#9d84e8', '#e0a63c', '#e677ab'],
  body: { size: 21, lineHeight: 34, top: 396, boxTop: 350, boxHeight: 460 },
};

const EMPTY_READING = 'a reading as unique as a limited-edition drop ✦';

/**
 * Draw the card onto a 2D context. Pure apart from the context it is handed,
 * so it can be unit-tested against a stub or an offscreen canvas.
 *
 * data: { name, birthLine, minis: [[label, value, color] x4], reading }
 */
export function drawCard(x, data) {
  const { W, H } = CARD;

  const grad = x.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, CARD.bg[0]);
  grad.addColorStop(0.55, CARD.bg[1]);
  grad.addColorStop(1, CARD.bg[2]);
  x.fillStyle = grad; x.fillRect(0, 0, W, H);

  x.strokeStyle = CARD.frameOuter; x.lineWidth = 8; x.strokeRect(10, 10, W - 20, H - 20);
  x.strokeStyle = CARD.frameInner; x.lineWidth = 2; x.strokeRect(24, 24, W - 48, H - 48);

  x.textAlign = 'center';
  x.fillStyle = CARD.muted; x.font = '600 20px "Pixelify Sans", monospace';
  x.fillText(CARD.eyebrow, W / 2, 80);

  x.fillStyle = CARD.name; x.font = '800 58px "Baloo 2", sans-serif';
  x.fillText(data.name, W / 2, 160);

  x.fillStyle = CARD.sub; x.font = '20px "Varela Round", sans-serif';
  x.fillText(data.birthLine, W / 2, 196);

  data.minis.forEach(([label, value, color], i) => {
    const bx = 60 + i * 155, by = 230, bw = 140, bh = 84;
    x.fillStyle = '#ffffff'; x.fillRect(bx, by, bw, bh);
    x.strokeStyle = color; x.lineWidth = 2.5; x.strokeRect(bx, by, bw, bh);
    x.fillStyle = CARD.chipLabel; x.font = '600 14px "Varela Round", sans-serif';
    x.fillText(label.toUpperCase(), bx + bw / 2, by + 26);
    x.fillStyle = color; x.font = '700 17px "Baloo 2", sans-serif';
    x.fillText(value, bx + bw / 2, by + 56);
  });

  const b = CARD.body;
  x.fillStyle = '#ffffff'; x.fillRect(60, b.boxTop, W - 120, b.boxHeight);
  x.strokeStyle = '#b7e3de'; x.setLineDash([8, 6]); x.lineWidth = 2.5;
  x.strokeRect(60, b.boxTop, W - 120, b.boxHeight); x.setLineDash([]);

  x.fillStyle = CARD.ink; x.font = `${b.size}px "Varela Round", sans-serif`;
  x.textAlign = 'left';
  let line = '', ty = b.top;
  (data.reading || EMPTY_READING).split(' ').forEach(word => {
    if (x.measureText(line + word).width > W - 190) {
      x.fillText(line, 88, ty); ty += b.lineHeight; line = '';
    }
    line += word + ' ';
  });
  x.fillText(line.trim(), 88, ty);

  x.textAlign = 'center';
  x.fillStyle = '#e0a63c'; x.font = '30px sans-serif';
  x.fillText('✦  ★  ✧', W / 2, 880);
  x.fillStyle = CARD.muted; x.font = '600 18px "Pixelify Sans", monospace';
  x.fillText(CARD.footer, W / 2, 930);
}

/** Render and trigger a download. Returns the filename used. */
export function downloadCard(data) {
  const c = document.createElement('canvas');
  c.width = CARD.W; c.height = CARD.H;
  drawCard(c.getContext('2d'), data);
  const filename = `star-shard-${(data.name || 'card').replace(/[^a-z0-9]/gi, '_')}.png`;
  const a = document.createElement('a');
  a.download = filename;
  a.href = c.toDataURL('image/png');
  a.click();
  return filename;
}
