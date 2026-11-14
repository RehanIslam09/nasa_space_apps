import wave
import struct
import math
import random
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from app.core.config import settings

class AudioGenerator:
    """
    Pure Python Audio Synthesis Engine for PRANA.
    Synthesizes multi-layer, high-fidelity 16-bit PCM Stereo WAV files.
    Mathematically deterministic and independent of native audio drivers.
    """
    
    def __init__(self, sample_rate: int = 44100):
        self.sample_rate = sample_rate

    @staticmethod
    def hz_to_midi(hz: float) -> float:
        return 69.0 + 12.0 * math.log2(max(1.0, hz) / 440.0)

    @staticmethod
    def midi_to_hz(midi: float) -> float:
        return 440.0 * (2.0 ** ((midi - 69.0) / 12.0))

    def generate_sine_wave(
        self,
        freq: float,
        duration: float,
        volume: float = 0.5,
        pan: float = 0.0,
        freq_modulation: Optional[List[float]] = None
    ) -> Tuple[List[float], List[float]]:
        """Generates pure sine wave with optional frequency modulation."""
        num_samples = int(self.sample_rate * duration)
        left = [0.0] * num_samples
        right = [0.0] * num_samples
        
        # Constant-power panning
        pan_norm = max(-1.0, min(1.0, pan))
        angle = (pan_norm + 1.0) * (math.pi / 4.0)
        gain_l = math.cos(angle) * volume
        gain_r = math.sin(angle) * volume
        
        phase = 0.0
        two_pi = 2.0 * math.pi
        
        for i in range(num_samples):
            current_freq = freq
            if freq_modulation and i < len(freq_modulation):
                current_freq += freq_modulation[i]
                
            phase += (two_pi * current_freq) / self.sample_rate
            if phase > two_pi:
                phase -= two_pi
                
            sample = math.sin(phase)
            left[i] = sample * gain_l
            right[i] = sample * gain_r
            
        return left, right

    def generate_harmonic_pad(
        self,
        base_freq: float,
        duration: float,
        harmonics: List[float] = [1.0, 0.5, 0.25, 0.125],
        volume: float = 0.5,
        pan: float = 0.0,
        lfo_rate: float = 0.2
    ) -> Tuple[List[float], List[float]]:
        """Generates lush, warm harmonic pad tone with gentle slow LFO breathing."""
        num_samples = int(self.sample_rate * duration)
        left = [0.0] * num_samples
        right = [0.0] * num_samples
        
        pan_norm = max(-1.0, min(1.0, pan))
        angle = (pan_norm + 1.0) * (math.pi / 4.0)
        gain_l = math.cos(angle) * volume
        gain_r = math.sin(angle) * volume
        
        two_pi = 2.0 * math.pi
        phases = [0.0] * len(harmonics)
        
        for i in range(num_samples):
            t = i / self.sample_rate
            lfo = 0.85 + 0.15 * math.sin(two_pi * lfo_rate * t) # Breathing swell
            
            sample = 0.0
            for h_idx, h_gain in enumerate(harmonics):
                h_freq = base_freq * (h_idx + 1)
                phases[h_idx] += (two_pi * h_freq) / self.sample_rate
                if phases[h_idx] > two_pi:
                    phases[h_idx] -= two_pi
                sample += math.sin(phases[h_idx]) * h_gain
                
            sample = (sample / max(1.0, sum(harmonics))) * lfo
            left[i] = sample * gain_l
            right[i] = sample * gain_r
            
        return left, right

    def generate_fm_bell(
        self,
        carrier_freq: float,
        modulator_ratio: float,
        mod_index: float,
        duration: float,
        volume: float = 0.5,
        pan: float = 0.0
    ) -> Tuple[List[float], List[float]]:
        """Frequency Modulation synthesis for crystal bells, shimmering salt spray, or night lights."""
        num_samples = int(self.sample_rate * duration)
        left = [0.0] * num_samples
        right = [0.0] * num_samples
        
        pan_norm = max(-1.0, min(1.0, pan))
        angle = (pan_norm + 1.0) * (math.pi / 4.0)
        gain_l = math.cos(angle) * volume
        gain_r = math.sin(angle) * volume
        
        mod_freq = carrier_freq * modulator_ratio
        two_pi = 2.0 * math.pi
        phase_c = 0.0
        phase_m = 0.0
        
        for i in range(num_samples):
            t = i / self.sample_rate
            # Exponential decay envelope
            env = math.exp(-2.5 * (t / duration))
            
            phase_m += (two_pi * mod_freq) / self.sample_rate
            mod_val = mod_index * env * math.sin(phase_m)
            
            phase_c += (two_pi * (carrier_freq + mod_val * mod_freq)) / self.sample_rate
            sample = math.sin(phase_c) * env
            
            left[i] = sample * gain_l
            right[i] = sample * gain_r
            
        return left, right

    def generate_filtered_noise(
        self,
        duration: float,
        center_freq: float = 1000.0,
        q: float = 4.0,
        volume: float = 0.3,
        pan: float = 0.0,
        seed: int = 42
    ) -> Tuple[List[float], List[float]]:
        """Generates bandpass filtered noise for atmospheric texture, sea spray, and wind."""
        rng = random.Random(seed)
        num_samples = int(self.sample_rate * duration)
        left = [0.0] * num_samples
        right = [0.0] * num_samples
        
        pan_norm = max(-1.0, min(1.0, pan))
        angle = (pan_norm + 1.0) * (math.pi / 4.0)
        gain_l = math.cos(angle) * volume
        gain_r = math.sin(angle) * volume
        
        # 2nd order IIR Resonant Bandpass Filter
        w0 = 2.0 * math.pi * center_freq / self.sample_rate
        alpha = math.sin(w0) / (2.0 * q)
        b0 = alpha
        b1 = 0.0
        b2 = -alpha
        a0 = 1.0 + alpha
        a1 = -2.0 * math.cos(w0)
        a2 = 1.0 - alpha
        
        b0 /= a0
        b1 /= a0
        b2 /= a0
        a1 /= a0
        a2 /= a0
        
        x1 = x2 = y1 = y2 = 0.0
        for i in range(num_samples):
            white = rng.uniform(-1.0, 1.0)
            y = b0 * white + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2
            x2 = x1
            x1 = white
            y2 = y1
            y1 = y
            
            left[i] = y * gain_l
            right[i] = y * gain_r
            
        return left, right

    def generate_percussive_strike(
        self,
        duration: float,
        hit_times: List[float],
        base_freq: float = 120.0,
        volume: float = 0.6,
        seed: int = 42
    ) -> Tuple[List[float], List[float]]:
        """Rhythmic lightning strike impulses or urban activity clicks with deterministic seeding."""
        num_samples = int(self.sample_rate * duration)
        left = [0.0] * num_samples
        right = [0.0] * num_samples
        
        two_pi = 2.0 * math.pi
        decay_time = 0.15 # 150ms per strike
        rng = random.Random(seed)
        
        for hit_t in hit_times:
            start_idx = int(hit_t * self.sample_rate)
            hit_len = int(decay_time * self.sample_rate)
            pan = (rng.random() * 1.6) - 0.8
            angle = (pan + 1.0) * (math.pi / 4.0)
            gl = math.cos(angle) * volume
            gr = math.sin(angle) * volume
            
            for j in range(hit_len):
                idx = start_idx + j
                if idx >= num_samples:
                    break
                t_local = j / self.sample_rate
                env = math.exp(-30.0 * t_local) # Fast transient drop
                # Pitch sweep downwards
                inst_freq = base_freq * (1.0 + 3.0 * env)
                sample = math.sin(two_pi * inst_freq * t_local) * env
                # Add sharp crackle with seeded RNG
                crackle = (rng.random() * 2.0 - 1.0) * env * 0.4
                total = sample + crackle
                
                left[idx] += total * gl
                right[idx] += total * gr
                
        return left, right

    def apply_adsr(
        self,
        samples: List[float],
        attack: float = 0.5,
        decay: float = 0.5,
        sustain: float = 0.8,
        release: float = 1.0
    ) -> List[float]:
        """Applies Attack-Decay-Sustain-Release envelope to eliminate clicks."""
        total = len(samples)
        if total == 0:
            return samples
            
        dur = total / self.sample_rate
        out = [0.0] * total
        
        att_samples = int(attack * self.sample_rate)
        dec_samples = int(decay * self.sample_rate)
        rel_samples = int(release * self.sample_rate)
        
        for i in range(total):
            t = i / self.sample_rate
            if i < att_samples and att_samples > 0:
                gain = i / att_samples
            elif i < att_samples + dec_samples and dec_samples > 0:
                prog = (i - att_samples) / dec_samples
                gain = 1.0 - (1.0 - sustain) * prog
            elif i >= total - rel_samples and rel_samples > 0:
                prog = (total - i) / rel_samples
                gain = sustain * prog
            else:
                gain = sustain
            out[i] = samples[i] * gain
        return out

    def mix_and_normalize(
        self,
        layers: List[Tuple[List[float], List[float]]],
        master_volume: float = 0.85
    ) -> Tuple[List[float], List[float]]:
        """Mixes multiple stereo layers with soft limiting to prevent any digital clipping."""
        if not layers:
            return [], []
            
        length = max(len(l[0]) for l in layers)
        mix_l = [0.0] * length
        mix_r = [0.0] * length
        
        for layer_l, layer_r in layers:
            for i in range(min(length, len(layer_l))):
                mix_l[i] += layer_l[i]
                mix_r[i] += layer_r[i]
                
        # Find peak amplitude
        peak = 1e-6
        for i in range(length):
            abs_l = abs(mix_l[i])
            abs_r = abs(mix_r[i])
            if abs_l > peak:
                peak = abs_l
            if abs_r > peak:
                peak = abs_r
                
        # Soft-knee limiting / Peak normalization
        norm_factor = (master_volume / peak) if peak > master_volume else 1.0
        final_l = [max(-1.0, min(1.0, math.tanh(s * norm_factor))) for s in mix_l]
        final_r = [max(-1.0, min(1.0, math.tanh(s * norm_factor))) for s in mix_r]
        
        return final_l, final_r

    def export_wav(
        self,
        left_channel: List[float],
        right_channel: List[float],
        output_path: Path
    ) -> Path:
        """Writes 16-bit Stereo PCM WAV file directly to disk."""
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        num_frames = min(len(left_channel), len(right_channel))
        with wave.open(str(output_path), 'wb') as wf:
            wf.setnchannels(2)       # Stereo
            wf.setsampwidth(2)       # 16-bit (2 bytes)
            wf.setframerate(self.sample_rate)
            
            raw_frames = bytearray()
            for i in range(num_frames):
                # Scale float [-1.0, 1.0] to int16 [-32767, 32767]
                sl = int(left_channel[i] * 32767.0)
                sr = int(right_channel[i] * 32767.0)
                sl = max(-32767, min(32767, sl))
                sr = max(-32767, min(32767, sr))
                raw_frames.extend(struct.pack('<hh', sl, sr))
                
            wf.writeframes(raw_frames)
            
        return output_path
