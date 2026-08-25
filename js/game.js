import GameEngine from './core/engine.js';
import { setupControls } from './systems/input.js';
import { setupMenu } from './ui/menu.js';

// Initialisation
const engine = new GameEngine();
setupControls(engine);
setupMenu(engine);
