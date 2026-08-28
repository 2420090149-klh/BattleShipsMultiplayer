export class AudioManager {
    private static instance: AudioManager;
    
    // Placeholder audio URLs - In a real app these would be local assets
    private sounds = {
        click: 'https://actions.google.com/sounds/v1/ui/button_click.ogg',
        hover: 'https://actions.google.com/sounds/v1/ui/navigation_bloop_1.ogg',
        splash: 'https://actions.google.com/sounds/v1/water/water_splash.ogg',
        explosion: 'https://actions.google.com/sounds/v1/weapons/explosion_layer.ogg',
    };

    private constructor() {}

    static getInstance() {
        if (!AudioManager.instance) {
            AudioManager.instance = new AudioManager();
        }
        return AudioManager.instance;
    }

    play(soundName: keyof typeof AudioManager.instance.sounds) {
        try {
            const audio = new Audio(this.sounds[soundName]);
            audio.volume = 0.5;
            audio.play().catch(e => console.log('Audio play failed (browser policy likely)', e));
        } catch (e) {
            console.error(e);
        }
    }
}

export const audio = AudioManager.getInstance();
