<script>
	import Tconture from './Tconture.svelte';
	import Tbody from './Tbody.svelte';
  // import logo from './assets/svelte.png'
  // import Counter from './lib/Counter.svelte'
    import { onMount, beforeUpdate, onDestroy, createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

	let map = nsGmx.leafletMap;
	let currentHole;
	let nep = 0;
	let decl = 2;
	let pt = {
		// ring: [
			// [15, 100, L.latLng(45, 60)],
			// [25, 100, L.latLng(46, 61)],
			// [15, 100, L.latLng(47, 62)],
			// [35, 100, L.latLng(48, 63)],
		// ],
		// snap: [
			// [15, 100, L.latLng(45, 60)],
			// [25, 100, L.latLng(46, 61)],
		// ],
		// decl,
		// startPoint: L.latLng(45, 60)
	};
	// let flag = true;
	let flag = false;
	// let arr = [["56°09.948'", "32°31.146'"], ["57°09.948'", "32°31.146'"], ["58°09.948'", "32°31.146'"]];
	const notify = (ev) => {
		console.log('notify', ev.detail);
	}
</script>

<main class='tconture les'>
	<Tconture on:notify={notify} {currentHole} {pt} {nep} {map} />
	
</main>

<style>
/* 7 495 655 65 77
// 539 30 00
*/
</style>
