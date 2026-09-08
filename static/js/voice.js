/**
 * Voice Accessibility Module (Speech-to-Text & Text-to-Speech)
 * Smart India Hackathon 2026 - SIH26090
 * Critical accessibility feature for low-literacy marginalized artisans.
 */

let speechRecognition = null;
let isRecognizing = false;
let currentUtterance = null;
let isSpeaking = false;

// Initialize Speech Recognition
function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.warn("Speech Recognition API is not supported in this browser.");
    return null;
  }

  const recognizer = new SpeechRecognition();
  recognizer.continuous = false;
  recognizer.interimResults = true;
  recognizer.maxAlternatives = 1;

  recognizer.onstart = () => {
    isRecognizing = true;
    updateMicButtonState(true);
  };

  recognizer.onresult = (event) => {
    const transcript = Array.from(event.results)
      .map(result => result[0])
      .map(result => result.transcript)
      .join('');

    const notesInput = document.getElementById('artisanNotes');
    if (notesInput) {
      notesInput.value = transcript;
    }
  };

  recognizer.onerror = (event) => {
    console.warn("Speech recognition error:", event.error);
    isRecognizing = false;
    updateMicButtonState(false);
  };

  recognizer.onend = () => {
    isRecognizing = false;
    updateMicButtonState(false);
  };

  return recognizer;
}

// Toggle Voice Recording
function toggleVoiceInput() {
  if (!speechRecognition) {
    speechRecognition = initSpeechRecognition();
    if (!speechRecognition) {
      alert("Voice input is not supported in this browser. Please use Chrome, Edge, or a modern mobile browser.");
      return;
    }
  }

  if (isRecognizing) {
    speechRecognition.stop();
  } else {
    // Set recognition language based on current app language
    speechRecognition.lang = currentLanguage === 'hi' ? 'hi-IN' : 'en-IN';
    try {
      speechRecognition.start();
    } catch (err) {
      console.warn("Recognition already started", err);
    }
  }
}

function updateMicButtonState(active) {
  const micBtn = document.getElementById('micButton');
  const micIcon = document.getElementById('micIcon');
  const micStatus = document.getElementById('micStatus');

  if (!micBtn) return;

  if (active) {
    micBtn.classList.add('recording-pulse');
    if (micStatus) {
      micStatus.classList.remove('hidden');
      micStatus.textContent = currentLanguage === 'hi' ? 'सुन रहे हैं... कृपया बोलें' : 'Listening... Speak now';
    }
  } else {
    micBtn.classList.remove('recording-pulse');
    if (micStatus) {
      micStatus.classList.add('hidden');
    }
  }
}

// Text-to-Speech (TTS) Narration for low-literacy users
function speakText(text, lang = null, onEndCallback = null) {
  if (!('speechSynthesis' in window)) {
    alert("Audio speech synthesis is not supported on this browser.");
    return;
  }

  stopSpeaking();

  if (!text || text.trim() === "") return;

  const utterance = new SpeechSynthesisUtterance(text);
  const targetLang = lang || (currentLanguage === 'hi' ? 'hi-IN' : 'en-IN');
  utterance.lang = targetLang;
  utterance.rate = 0.92; // Slightly slower pace for clear comprehension

  // Attempt to select an Indian English or Hindi voice if available
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    const match = voices.find(v => v.lang.startsWith(targetLang.substring(0, 2)));
    if (match) utterance.voice = match;
  }

  utterance.onstart = () => {
    isSpeaking = true;
    updateSpeakerButtonState(true);
  };

  utterance.onend = () => {
    isSpeaking = false;
    updateSpeakerButtonState(false);
    if (onEndCallback) onEndCallback();
  };

  utterance.onerror = () => {
    isSpeaking = false;
    updateSpeakerButtonState(false);
  };

  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

function stopSpeaking() {
  if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  }
  isSpeaking = false;
  updateSpeakerButtonState(false);
}

function toggleNarration(text, targetLang = null) {
  if (isSpeaking) {
    stopSpeaking();
  } else {
    speakText(text, targetLang);
  }
}

function updateSpeakerButtonState(active) {
  const speakerBtns = document.querySelectorAll('.speaker-btn');
  speakerBtns.forEach(btn => {
    const label = btn.querySelector('.speaker-label');
    const wave = btn.querySelector('.audio-wave');
    if (active) {
      btn.classList.add('border-terracotta-500', 'bg-terracotta-50', 'text-terracotta-600');
      if (label) label.textContent = currentLanguage === 'hi' ? 'ऑडियो रोकें' : 'Stop Audio';
      if (wave) wave.classList.remove('hidden');
    } else {
      btn.classList.remove('border-terracotta-500', 'bg-terracotta-50', 'text-terracotta-600');
      if (label) label.textContent = currentLanguage === 'hi' ? 'विवरण सुनें' : 'Listen';
      if (wave) wave.classList.add('hidden');
    }
  });
}

// Preload voices
if ('speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    // Voices cached
  };
}
