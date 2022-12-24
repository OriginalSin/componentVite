import { writable } from 'svelte/store';

export const _setFocuse = writable({}, () => {
	console.log('got a subscriber');
	return () => console.log('no more subscribers');
});
