// Life RPG sound cues built with Web Audio so no audio files are required.
(function () {
    let audioContext;

    function getContext() {
        audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
        if (audioContext.state === "suspended") audioContext.resume();
        return audioContext;
    }

    function tone(frequency, duration, type, volume, offset = 0) {
        const context = getContext();
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const start = context.currentTime + offset;

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(volume, start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(start);
        oscillator.stop(start + duration + 0.02);
    }

    const cues = {
        click() {
            tone(520, 0.055, "sine", 0.025);
        },
        authSuccess() {
            tone(392, 0.1, "sine", 0.04);
            tone(523, 0.1, "sine", 0.04, 0.09);
            tone(784, 0.2, "sine", 0.04, 0.18);
        },
        questCreated() {
            tone(260, 0.08, "square", 0.025);
            tone(390, 0.15, "square", 0.03, 0.08);
        },
        questComplete() {
            tone(440, 0.08, "triangle", 0.04);
            tone(660, 0.08, "triangle", 0.04, 0.08);
            tone(990, 0.24, "triangle", 0.05, 0.16);
        },
        reward() {
            tone(480, 0.1, "triangle", 0.045);
            tone(640, 0.1, "triangle", 0.045, 0.08);
            tone(900, 0.24, "triangle", 0.05, 0.16);
        },
        purchase() {
            tone(680, 0.08, "sine", 0.04);
            tone(840, 0.16, "sine", 0.04, 0.08);
        },
        error() {
            tone(180, 0.18, "sawtooth", 0.035);
        },
        levelUp() {
            tone(330, 0.12, "sawtooth", 0.035);
            tone(494, 0.12, "sawtooth", 0.04, 0.11);
            tone(659, 0.12, "sawtooth", 0.04, 0.22);
            tone(988, 0.35, "triangle", 0.05, 0.33);
        }
    };

    window.lifeRpgSounds = {
        play(name) {
            try {
                cues[name]?.();
            } catch (error) {
                console.debug("Sound unavailable:", error);
            }
        }
    };

    document.addEventListener("click", (event) => {
        if (event.target.closest("button")) window.lifeRpgSounds.play("click");
    });
})();
