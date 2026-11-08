import { createNewGame } from './sim/game';
import { GameStore } from './sim/store';

/** Single shared store for the running game (rendering reads from here). */
export const store = new GameStore(createNewGame());
