// Som de toque ASMR do botão "Entrar": estalinho de unha em vidro com corpo
// quente e um rabinho de eco. Feito no navegador (Web Audio), sem arquivo de som.

let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;

function ensure(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC: typeof AudioContext | undefined =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function noiseBuffer(c: AudioContext) {
  if (!noise) {
    noise = c.createBuffer(1, Math.floor(c.sampleRate * 0.4), c.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return noise;
}

/** Toque suave: clique curto + corpo grave + brilho de vidro + eco. */
export function playTap() {
  const c = ensure();
  if (!c) return;
  const t = c.currentTime + 0.001;

  const out = c.createDynamicsCompressor();
  out.threshold.value = -14;
  out.ratio.value = 8;
  out.attack.value = 0.003;
  out.release.value = 0.12;
  out.connect(c.destination);

  const bus = c.createGain();
  bus.gain.value = 0.9;
  bus.connect(out);

  // Rabinho de eco — é o que deixa o toque gostoso de repetir.
  const echo = c.createDelay(0.5);
  echo.delayTime.value = 0.13;
  const fb = c.createGain();
  fb.gain.value = 0.32;
  const damp = c.createBiquadFilter();
  damp.type = "lowpass";
  damp.frequency.value = 2600;
  echo.connect(damp);
  damp.connect(fb);
  fb.connect(echo);
  const wet = c.createGain();
  wet.gain.value = 0.45;
  damp.connect(wet);
  wet.connect(bus);

  // Leve variação a cada clique, para nunca soar igual.
  const jitter = 0.94 + Math.random() * 0.12;

  // 1. Estalo de unha: ruído curto passado num filtro de faixa.
  const click = c.createBufferSource();
  click.buffer = noiseBuffer(c);
  click.playbackRate.value = 0.9 + Math.random() * 0.3;
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 2100 * jitter;
  bp.Q.value = 0.9;
  const cg = c.createGain();
  cg.gain.setValueAtTime(0.0001, t);
  cg.gain.exponentialRampToValueAtTime(0.5, t + 0.004);
  cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
  click.connect(bp);
  bp.connect(cg);
  cg.connect(bus);
  cg.connect(echo);
  click.start(t, Math.random() * 0.2, 0.12);

  // 2. Corpo quente que desce.
  const body = c.createOscillator();
  body.type = "sine";
  body.frequency.setValueAtTime(360 * jitter, t);
  body.frequency.exponentialRampToValueAtTime(150, t + 0.12);
  const bg = c.createGain();
  bg.gain.setValueAtTime(0.0001, t);
  bg.gain.exponentialRampToValueAtTime(0.28, t + 0.008);
  bg.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
  body.connect(bg);
  bg.connect(bus);
  bg.connect(echo);
  body.start(t);
  body.stop(t + 0.3);

  // 3. Brilho de vidro.
  const glass = c.createOscillator();
  glass.type = "sine";
  glass.frequency.value = 1420 * jitter;
  const gg = c.createGain();
  gg.gain.setValueAtTime(0.0001, t);
  gg.gain.exponentialRampToValueAtTime(0.1, t + 0.006);
  gg.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
  glass.connect(gg);
  gg.connect(bus);
  gg.connect(echo);
  glass.start(t);
  glass.stop(t + 0.25);

  // 4. Sopro de ar no final.
  const air = c.createBufferSource();
  air.buffer = noiseBuffer(c);
  air.playbackRate.value = 1.6;
  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 4200;
  const ag = c.createGain();
  ag.gain.setValueAtTime(0.0001, t + 0.002);
  ag.gain.exponentialRampToValueAtTime(0.06, t + 0.02);
  ag.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
  air.connect(hp);
  hp.connect(ag);
  ag.connect(bus);
  air.start(t + 0.002, 0.2, 0.18);
}
