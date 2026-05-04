
self.window = self;
self.document = { currentScript: null, title: '', createElement: function() { return {}; } };
importScripts("https://cdn.jsdelivr.net/npm/essentia.js@0.1.3/dist/essentia-wasm.web.js");
importScripts("https://cdn.jsdelivr.net/npm/essentia.js@0.1.3/dist/essentia.js-core.js");

let essentia = null;
let initError = null;

function resampleLinear(signal, fromRate, toRate) {
  if (fromRate === toRate) return signal;
  if (!signal || signal.length < 2) return signal;

  const ratio = fromRate / toRate;
  const newLength = Math.max(2, Math.floor(signal.length / ratio));
  const out = new Float32Array(newLength);

  for (let i = 0; i < newLength; i++) {
    const pos = i * ratio;
    const i0 = Math.floor(pos);
    const i1 = Math.min(i0 + 1, signal.length - 1);
    const frac = pos - i0;
    out[i] = signal[i0] * (1 - frac) + signal[i1] * frac;
  }
  return out;
}

function estimateBpmWithEssentia(signal, sampleRate) {
  if (!essentia) return { bpm: null, error: "Essentia is not initialized" };
  try {
    const targetRate = 44100;
    const preparedSignal = resampleLinear(signal, sampleRate, targetRate);
    const signalVector = essentia.arrayToVector(preparedSignal);

    let result = null;
    try {
      result = essentia.RhythmExtractor2013(signalVector, 208, "degara", 40);
      const bpm = Number(result?.bpm ?? 0);
      if (Number.isFinite(bpm) && bpm > 0) {
        return { bpm, error: null };
      }
      return { bpm: null, error: null };
    } finally {
      if (signalVector?.delete) signalVector.delete();
      if (result) {
        // C++のVectorオブジェクトが返るため、手動でメモリ解放しないとWASMのメモリリークを起こす
        if (result.ticks?.delete) result.ticks.delete();
        if (result.estimates?.delete) result.estimates.delete();
        if (result.bpmIntervals?.delete) result.bpmIntervals.delete();
      }
    }
  } catch (err) {
    return { bpm: null, error: String(err) };
  }
}

async function init() {
  try {
    const essentiaWasm = await EssentiaWASM({
      locateFile: function(path) {
        if (path.endsWith('.wasm')) {
          return "https://cdn.jsdelivr.net/npm/essentia.js@0.1.3/dist/essentia-wasm.web.wasm";
        }
        return path;
      }
    });
    essentia = new Essentia(essentiaWasm);
    self.postMessage({ type: "ready" });
  } catch (err) {
    initError = String(err);
    self.postMessage({ type: "ready", error: initError });
  }
}

self.onmessage = (event) => {
  const data = event.data || {};
  if (data.type !== "estimate") return;

  if (initError) {
    self.postMessage({ type: "result", bpm: null, error: initError });
    return;
  }

  const signal = data.signal instanceof Float32Array ? data.signal : new Float32Array(data.signal);
  const sampleRate = Number(data.sampleRate || 44100);
  const { bpm, error } = estimateBpmWithEssentia(signal, sampleRate);
  self.postMessage({ type: "result", bpm, error });
};

init();
