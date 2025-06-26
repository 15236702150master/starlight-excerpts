// Audio Manager for handling various audio effects and recordings

class AudioManager {
  constructor() {
    this.audioContext = null
    this.ambientSounds = new Map()
    this.isInitialized = false
  }

  // Initialize audio context (must be called after user interaction)
  async initialize() {
    if (this.isInitialized) return

    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
      await this.loadAmbientSounds()
      this.isInitialized = true
    } catch (error) {
      console.warn('Audio initialization failed:', error)
    }
  }

  // Load ambient sound effects
  async loadAmbientSounds() {
    const sounds = {
      starChime: this.generateStarChime(),
      windChime: this.generateWindChime(),
      cosmicPulse: this.generateCosmicPulse(),
    }

    for (const [name, audioBuffer] of Object.entries(sounds)) {
      this.ambientSounds.set(name, audioBuffer)
    }
  }

  // Generate star chime sound using Web Audio API
  generateStarChime() {
    if (!this.audioContext) return null

    const duration = 0.5
    const sampleRate = this.audioContext.sampleRate
    const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate)
    const data = buffer.getChannelData(0)

    // Generate a bell-like sound with harmonics
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate
      const frequency = 800 // Base frequency
      
      // Add multiple harmonics for a bell-like sound
      let sample = 0
      sample += Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t * 3)
      sample += Math.sin(2 * Math.PI * frequency * 2 * t) * 0.5 * Math.exp(-t * 4)
      sample += Math.sin(2 * Math.PI * frequency * 3 * t) * 0.3 * Math.exp(-t * 5)
      
      data[i] = sample * 0.1 // Keep volume low
    }

    return buffer
  }

  // Generate wind chime sound
  generateWindChime() {
    if (!this.audioContext) return null

    const duration = 1.0
    const sampleRate = this.audioContext.sampleRate
    const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate)
    const data = buffer.getChannelData(0)

    // Generate multiple overlapping chimes
    const frequencies = [523, 659, 784, 988] // C5, E5, G5, B5
    
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate
      let sample = 0
      
      frequencies.forEach((freq, index) => {
        const delay = index * 0.1
        if (t > delay) {
          const adjustedT = t - delay
          sample += Math.sin(2 * Math.PI * freq * adjustedT) * 
                   Math.exp(-adjustedT * 2) * 0.25
        }
      })
      
      data[i] = sample * 0.05
    }

    return buffer
  }

  // Generate cosmic pulse sound
  generateCosmicPulse() {
    if (!this.audioContext) return null

    const duration = 2.0
    const sampleRate = this.audioContext.sampleRate
    const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate
      const frequency = 60 + Math.sin(t * 2) * 20 // Oscillating low frequency
      
      let sample = Math.sin(2 * Math.PI * frequency * t) * 
                  Math.sin(t * Math.PI / duration) * // Envelope
                  0.03
      
      data[i] = sample
    }

    return buffer
  }

  // Play ambient sound
  playAmbientSound(soundName, volume = 0.1) {
    if (!this.isInitialized || !this.audioContext) return

    const buffer = this.ambientSounds.get(soundName)
    if (!buffer) return

    const source = this.audioContext.createBufferSource()
    const gainNode = this.audioContext.createGain()
    
    source.buffer = buffer
    gainNode.gain.value = volume
    
    source.connect(gainNode)
    gainNode.connect(this.audioContext.destination)
    
    source.start()
  }

  // Record audio from microphone
  async startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      const chunks = []

      // Return recorder instance for manual control
      return {
        recorder: mediaRecorder,
        stream: stream,
        stop: () => {
          return new Promise((resolve, reject) => {
            mediaRecorder.ondataavailable = (e) => {
              if (e.data.size > 0) {
                chunks.push(e.data)
              }
            }

            mediaRecorder.onstop = () => {
              const blob = new Blob(chunks, { type: 'audio/webm' })
              // 停止所有音轨
              stream.getTracks().forEach(track => track.stop())
              resolve(blob)
            }

            mediaRecorder.onerror = reject

            if (mediaRecorder.state === 'recording') {
              mediaRecorder.stop()
            } else {
              reject(new Error('MediaRecorder is not recording'))
            }
          })
        },
        start: () => {
          mediaRecorder.start()
        }
      }
    } catch (error) {
      console.error('Recording failed:', error)
      throw error
    }
  }

  // Convert blob to base64 for storage
  blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        // 返回纯 base64 字符串，去掉 data URL 前缀
        const result = reader.result
        const base64 = result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  // Convert base64 back to blob
  base64ToBlob(base64) {
    try {
      // Handle both full data URL and just base64 string
      let data, mimeType = 'audio/webm'

      if (base64.includes(',')) {
        const [header, base64Data] = base64.split(',')
        data = base64Data
        const mimeMatch = header.match(/:(.*?);/)
        if (mimeMatch) {
          mimeType = mimeMatch[1]
        }
      } else {
        data = base64
      }

      const binary = atob(data)
      const array = new Uint8Array(binary.length)

      for (let i = 0; i < binary.length; i++) {
        array[i] = binary.charCodeAt(i)
      }

      return new Blob([array], { type: mimeType })
    } catch (error) {
      console.error('Error converting base64 to blob:', error)
      return null
    }
  }

  // Play recorded audio
  playRecording(audioBlob) {
    if (!audioBlob) {
      console.error('No audio blob provided')
      return null
    }

    try {
      const audio = new Audio()
      audio.src = URL.createObjectURL(audioBlob)

      // Add error handling
      audio.onerror = (e) => {
        console.error('Audio playback error:', e)
        URL.revokeObjectURL(audio.src)
      }

      // Clean up object URL when audio ends
      audio.onended = () => {
        URL.revokeObjectURL(audio.src)
      }

      audio.play().catch(error => {
        console.error('Failed to play audio:', error)
        URL.revokeObjectURL(audio.src)
      })

      return audio
    } catch (error) {
      console.error('Error creating audio element:', error)
      return null
    }
  }
}

// Create singleton instance
const audioManager = new AudioManager()

export default audioManager

// Helper functions
export const initializeAudio = () => audioManager.initialize()
export const playStarChime = () => audioManager.playAmbientSound('starChime')
export const playWindChime = () => audioManager.playAmbientSound('windChime')
export const playCosmicPulse = () => audioManager.playAmbientSound('cosmicPulse')
export const startRecording = () => audioManager.startRecording()
export const playRecording = (blob) => audioManager.playRecording(blob)
export const blobToBase64 = (blob) => audioManager.blobToBase64(blob)
export const base64ToBlob = (base64) => audioManager.base64ToBlob(base64)
