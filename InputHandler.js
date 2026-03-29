/**
 * Manages player inputs by tracking active keys.
 * This ensures smooth diagonal movement and action holding rather than 
 * relying on individual keydown/keyup events firing at browser-dictated rhythms.
 */
export default class InputHandler {
    constructor() {
        // Dictionary mapping key strings to booleans (true if pressed, false/undefined if not)
        this.keys = {};

        // Listen for key presses
        window.addEventListener('keydown', (e) => {
            // e.key returns values like 'w', 'a', 'W', 'A', ' ', etc.
            // We'll normalize to lowercase string
            const keyStr = e.key.toLowerCase();
            this.keys[keyStr] = true;

            // Prevent spacebar from scrolling the page down (default browser behavior)
            if (keyStr === ' ' || e.code === 'Space') {
                e.preventDefault();
            }
            
            // Allow arrow keys just in case user prefers them
            if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(keyStr)) {
                e.preventDefault();
            }
        });

        // Listen for key releases
        window.addEventListener('keyup', (e) => {
            const keyStr = e.key.toLowerCase();
            this.keys[keyStr] = false;
        });
    }

    /**
     * Checks if a specific key is currently held down.
     * @param {string} key - e.g. 'w', 'a', 's', 'd', ' ', 'arrowup', etc.
     * @returns {boolean} True if the requested key is down, otherwise false.
     */
    isPressed(key) {
        return !!this.keys[key];
    }
}
