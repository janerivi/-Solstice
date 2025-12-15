import { writable } from 'svelte/store';
import type { SphericalCoords } from './astronomy';

export const currentDate = writable<Date>(new Date());
export const observerLocation = writable<SphericalCoords>({ lat: 51.5074, lon: -0.1278 }); // London default
export const observerName = writable<string | null>(null);
export const isPlaying = writable<boolean>(false);
export const timeSpeed = writable<number>(1); // Days per second? Or generic// View mode: 'sky' or 'orbit'
export const viewMode = writable<"sky" | "orbit">("orbit");

// Camera projection: 'perspective' or 'orthographic'
export const cameraMode = writable<"perspective" | "orthographic">("orthographic"); // Default to Orthographic as requested
