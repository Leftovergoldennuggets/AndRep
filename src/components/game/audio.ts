export class AudioSystem {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;
  private masterVolume: number = 0.5;

  initialize(): void {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  playSound(type: 'shoot' | 'hit' | 'damage' | 'jump' | 'powerup' | 'explosion' | 'dash' | 'berserker'): void {
    if (!this.enabled || !this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    const currentTime = this.audioContext.currentTime;
    
    switch(type) {
      case 'shoot':
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(150, currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.3 * this.masterVolume, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.1);
        oscillator.start(currentTime);
        oscillator.stop(currentTime + 0.1);
        break;
        
      case 'hit':
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(100, currentTime);
        gainNode.gain.setValueAtTime(0.2 * this.masterVolume, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.05);
        oscillator.start(currentTime);
        oscillator.stop(currentTime + 0.05);
        break;
        
      case 'damage':
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(200, currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.4 * this.masterVolume, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.2);
        oscillator.start(currentTime);
        oscillator.stop(currentTime + 0.2);
        break;
        
      case 'jump':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(400, currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, currentTime + 0.15);
        gainNode.gain.setValueAtTime(0.15 * this.masterVolume, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.15);
        oscillator.start(currentTime);
        oscillator.stop(currentTime + 0.15);
        break;
        
      case 'powerup':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, currentTime);
        oscillator.frequency.linearRampToValueAtTime(1200, currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.2 * this.masterVolume, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.3);
        oscillator.start(currentTime);
        oscillator.stop(currentTime + 0.3);
        break;
        
      case 'explosion': {
        // Create noise for explosion
        const bufferSize = this.audioContext.sampleRate * 0.3;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        
        const whiteNoise = this.audioContext.createBufferSource();
        whiteNoise.buffer = buffer;
        const noiseGain = this.audioContext.createGain();
        
        whiteNoise.connect(noiseGain);
        noiseGain.connect(this.audioContext.destination);
        
        noiseGain.gain.setValueAtTime(0.5 * this.masterVolume, currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.3);
        
        whiteNoise.start(currentTime);
        whiteNoise.stop(currentTime + 0.3);
        break;
      }
        
      case 'dash':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(100, currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1000, currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.3 * this.masterVolume, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.2);
        oscillator.start(currentTime);
        oscillator.stop(currentTime + 0.2);
        break;
        
      case 'berserker':
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(50, currentTime);
        oscillator.frequency.linearRampToValueAtTime(150, currentTime + 0.5);
        gainNode.gain.setValueAtTime(0.4 * this.masterVolume, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.5);
        oscillator.start(currentTime);
        oscillator.stop(currentTime + 0.5);
        break;
    }
  }

  playBossMusic(_start: boolean): void {
    // Placeholder for boss music implementation
    // In a real implementation, this would load and play an audio file
  }

  cleanup(): void {
    if (this.audioContext) {
      void this.audioContext.close();
      this.audioContext = null;
    }
  }
}