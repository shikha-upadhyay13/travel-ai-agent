// Voice input using Web Speech API

class VoiceInput {
    constructor() {
        this.recognition = null;
        this.isRecording = false;
        this.supported = false;

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.supported = true;

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                if (this.onResult) this.onResult(transcript);
                this.stop();
            };

            this.recognition.onerror = (event) => {
                let message = 'Voice recognition error.';
                if (event.error === 'not-allowed') {
                    message = 'Microphone access denied. Please allow microphone access.';
                } else if (event.error === 'no-speech') {
                    message = 'No speech detected. Please try again.';
                }
                if (this.onError) this.onError(message);
                this.stop();
            };

            this.recognition.onend = () => {
                this.isRecording = false;
                if (this.onStop) this.onStop();
            };
        }
    }

    setLanguage(langCode) {
        if (this.recognition) {
            this.recognition.lang = langCode;
        }
    }

    start() {
        if (!this.supported) {
            if (this.onError) this.onError('Voice input is not supported in this browser. Use Chrome or Edge.');
            return;
        }
        this.isRecording = true;
        this.setLanguage(document.getElementById('language-select').value);
        this.recognition.start();
        if (this.onStart) this.onStart();
    }

    stop() {
        if (this.recognition && this.isRecording) {
            this.recognition.stop();
            this.isRecording = false;
        }
    }

    toggle() {
        if (this.isRecording) {
            this.stop();
        } else {
            this.start();
        }
    }
}

window.voiceInput = new VoiceInput();
