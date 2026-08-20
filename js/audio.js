/**
 * MindBloom — Ultra-Realistic Procedural Soundscapes Engine
 * Powered by Web Audio API (Zero external MP3s, 100% offline).
 */

class SoundscapesEngine {
  constructor() {
    this.ctx = null;
    this.activeNodes = {};
    this.volumes = {
      rain: 0.7,
      ocean: 0.75,
      fire: 0.75,
      pinknoise: 0.6,
      bowl: 0.65,
      night: 0.65
    };
  }

  initContext() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Generate Pink Noise Buffer
  createPinkNoiseBuffer(seconds = 5) {
    const bufferSize = this.ctx.sampleRate * seconds;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.15;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  // 1. Realistic Gentle Rain
  startRain() {
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createPinkNoiseBuffer(6);
    noise.loop = true;

    // Filter 1: Mid-hiss of falling rain
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1200;

    const masterGain = this.ctx.createGain();
    masterGain.gain.value = this.volumes.rain * 0.7;

    noise.connect(filter);
    filter.connect(masterGain);
    masterGain.connect(this.ctx.destination);
    noise.start();

    return { source: noise, gain: masterGain };
  }

  // 2. Realistic Ocean Surf & Rolling Tides
  startOcean() {
    // Layer 1: Pink noise for surf roar
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createPinkNoiseBuffer(8);
    noise.loop = true;

    // Multi-pole lowpass filter for deep water body
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 280;
    filter.Q.value = 2.0;

    // LFO 1: Swell oscillation (rolling wave periodicity)
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.11; // One wave every 9 seconds

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 320; // Modulates cutoff between 100Hz and 600Hz

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    // LFO 2: Volume dynamics for surf wash in and out
    const waveGain = this.ctx.createGain();
    const lfoVol = this.ctx.createOscillator();
    lfoVol.type = 'sine';
    lfoVol.frequency.value = 0.11;

    const lfoVolGain = this.ctx.createGain();
    lfoVolGain.gain.value = 0.45;
    waveGain.gain.value = 0.55;

    lfoVol.connect(lfoVolGain);
    lfoVolGain.connect(waveGain.gain);

    const masterGain = this.ctx.createGain();
    masterGain.gain.value = this.volumes.ocean * 1.1;

    noise.connect(filter);
    filter.connect(waveGain);
    waveGain.connect(masterGain);
    masterGain.connect(this.ctx.destination);

    noise.start();
    lfo.start();
    lfoVol.start();

    return {
      source: noise,
      oscillators: [lfo, lfoVol],
      gain: masterGain
    };
  }

  // 3. Realistic Cozy Fireplace with Wood Crackles & Pops
  startFire() {
    // Bed layer: Low rumbling warm fire bed
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createPinkNoiseBuffer(6);
    noise.loop = true;

    const fireBedFilter = this.ctx.createBiquadFilter();
    fireBedFilter.type = 'bandpass';
    fireBedFilter.frequency.value = 450;
    fireBedFilter.Q.value = 1.2;

    const bedGain = this.ctx.createGain();
    bedGain.gain.value = 0.35;

    const masterGain = this.ctx.createGain();
    masterGain.gain.value = this.volumes.fire * 1.0;

    noise.connect(fireBedFilter);
    fireBedFilter.connect(bedGain);
    bedGain.connect(masterGain);
    masterGain.connect(this.ctx.destination);
    noise.start();

    // Procedural random wood pops & crackle generator
    let isFireRunning = true;
    const triggerCrackle = () => {
      if (!isFireRunning || !this.ctx) return;

      const popOsc = this.ctx.createOscillator();
      const popFilter = this.ctx.createBiquadFilter();
      const popGain = this.ctx.createGain();

      popOsc.type = Math.random() > 0.4 ? 'triangle' : 'square';
      popOsc.frequency.setValueAtTime(800 + Math.random() * 2400, this.ctx.currentTime);

      popFilter.type = 'bandpass';
      popFilter.frequency.setValueAtTime(1500 + Math.random() * 2000, this.ctx.currentTime);
      popFilter.Q.value = 4.0;

      const dur = 0.015 + Math.random() * 0.04;
      popGain.gain.setValueAtTime(0.08 + Math.random() * 0.18, this.ctx.currentTime);
      popGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + dur);

      popOsc.connect(popFilter);
      popFilter.connect(popGain);
      popGain.connect(masterGain);

      popOsc.start();
      popOsc.stop(this.ctx.currentTime + dur);

      // Schedule next random pop
      const nextDelay = 80 + Math.random() * 260; // Random intervals
      setTimeout(triggerCrackle, nextDelay);
    };

    triggerCrackle();

    return {
      source: noise,
      gain: masterGain,
      stopCustom: () => { isFireRunning = false; }
    };
  }

  // 4. Pink Noise (Deep Focus & Sleep)
  startPinkNoise() {
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createPinkNoiseBuffer(6);
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 600;

    const masterGain = this.ctx.createGain();
    masterGain.gain.value = this.volumes.pinknoise * 0.6;

    noise.connect(filter);
    filter.connect(masterGain);
    masterGain.connect(this.ctx.destination);
    noise.start();

    return { source: noise, gain: masterGain };
  }

  // 5. Tibetan Singing Bowl (432Hz Harmonic Resonance)
  startBowl() {
    const fund = 216; // 432Hz octave harmonic
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const osc3 = this.ctx.createOscillator();

    osc1.frequency.value = fund;
    osc2.frequency.value = fund * 2.76;
    osc3.frequency.value = fund * 5.4;

    const g1 = this.ctx.createGain();
    const g2 = this.ctx.createGain();
    const g3 = this.ctx.createGain();

    const masterGain = this.ctx.createGain();
    masterGain.gain.value = this.volumes.bowl * 0.6;

    g1.gain.value = 0.5;
    g2.gain.value = 0.22;
    g3.gain.value = 0.1;

    osc1.connect(g1);
    osc2.connect(g2);
    osc3.connect(g3);

    g1.connect(masterGain);
    g2.connect(masterGain);
    g3.connect(masterGain);

    masterGain.connect(this.ctx.destination);

    osc1.start();
    osc2.start();
    osc3.start();

    return {
      source: osc1,
      oscillators: [osc1, osc2, osc3],
      gain: masterGain
    };
  }

  // 6. Night Crickets
  startNight() {
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 4600;

    const mod = this.ctx.createOscillator();
    mod.type = 'square';
    mod.frequency.value = 16;

    const modGain = this.ctx.createGain();
    modGain.gain.value = 1400;

    mod.connect(modGain);
    modGain.connect(osc.frequency);

    const masterGain = this.ctx.createGain();
    masterGain.gain.value = this.volumes.night * 0.16;

    osc.connect(masterGain);
    masterGain.connect(this.ctx.destination);

    osc.start();
    mod.start();

    return { source: osc, mod: mod, gain: masterGain };
  }

  toggleSound(soundKey) {
    this.initContext();

    if (this.activeNodes[soundKey]) {
      this.stopSound(soundKey);
      return false;
    } else {
      let node;
      switch (soundKey) {
        case 'rain': node = this.startRain(); break;
        case 'ocean': node = this.startOcean(); break;
        case 'fire': node = this.startFire(); break;
        case 'pinknoise': node = this.startPinkNoise(); break;
        case 'bowl': node = this.startBowl(); break;
        case 'night': node = this.startNight(); break;
      }
      this.activeNodes[soundKey] = node;
      return true;
    }
  }

  setVolume(soundKey, val) {
    this.volumes[soundKey] = val;
    if (this.activeNodes[soundKey] && this.activeNodes[soundKey].gain) {
      this.activeNodes[soundKey].gain.gain.setValueAtTime(val * 0.85, this.ctx.currentTime);
    }
  }

  stopSound(soundKey) {
    if (this.activeNodes[soundKey]) {
      const node = this.activeNodes[soundKey];
      try {
        if (node.stopCustom) node.stopCustom();
        if (node.source) node.source.stop();
        if (node.lfo) node.lfo.stop();
        if (node.mod) node.mod.stop();
        if (node.oscillators) node.oscillators.forEach(o => o.stop());
      } catch (e) {}
      delete this.activeNodes[soundKey];
    }
  }

  stopAll() {
    Object.keys(this.activeNodes).forEach(key => this.stopSound(key));
  }

  // Soft Meditation Bell for Breathwork
  playBell(freq = 528) {
    this.initContext();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2.5);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 2.5);
  }
}

window.soundEngine = new SoundscapesEngine();
