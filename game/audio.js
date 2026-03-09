// audio.js - Audio functions

function getAudioCtx() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AC();
  }
  return audioCtx;
}

// generate a quick 'gunshot' using noise + a short oscillator
function playGunshot() {
  const ac = getAudioCtx();
  const now = ac.currentTime;

  // short noise burst
  const bufferSize = Math.floor(ac.sampleRate * 0.18);
  const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++)
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);

  const noise = ac.createBufferSource();
  noise.buffer = buffer;
  const bp = ac.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 1000 + Math.random() * 1200;
  bp.Q.value = 0.7;

  const ng = ac.createGain();
  ng.gain.setValueAtTime(0.0001, now);
  ng.gain.linearRampToValueAtTime(1.0, now + 0.005);
  ng.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

  noise.connect(bp);
  bp.connect(ng);
  ng.connect(ac.destination);
  noise.start(now);
  noise.stop(now + 0.18);

  // add a high 'click' for impact
  const osc = ac.createOscillator();
  osc.type = "triangle";
  osc.frequency.value = 2800 + Math.random() * 800;
  const og = ac.createGain();
  og.gain.setValueAtTime(0.0001, now);
  og.gain.linearRampToValueAtTime(0.7, now + 0.004);
  og.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
  osc.connect(og);
  og.connect(ac.destination);
  osc.start(now);
  osc.stop(now + 0.06);
}

// play a short descending 'death' sound using Web Audio API
function playDeathSound() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    const ac = new AC();
    const now = ac.currentTime;
    const freqs = [880, 740, 620, 520, 420];
    let t = 0;
    freqs.forEach((f) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = "sine";
      o.frequency.value = f;
      o.connect(g);
      g.connect(ac.destination);
      const dur = 0.14;
      g.gain.setValueAtTime(0, now + t);
      g.gain.linearRampToValueAtTime(0.9, now + t + 0.01);
      g.gain.linearRampToValueAtTime(0.0, now + t + dur);
      o.start(now + t);
      o.stop(now + t + dur + 0.02);
      t += dur;
    });
    // close the context shortly after sounds finish if supported
    setTimeout(() => {
      if (ac.close) ac.close();
    }, (t + 0.1) * 1000);
  } catch (e) {
    console.warn("Audio unavailable", e);
  }
}