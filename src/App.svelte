<script>
	import Tconture from './Tconture.svelte';
	// import { _pt } from './stores.js';
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
	let holeCurr;
	let holes = [];
	const notify = (ev) => {
		const {cmd, type, nm, last, decl, pt} = ev.detail;
		if (holeCurr) return;
		const prp = {nep: nm, decl: decl};
		if (cmd === 'editHole') {
			// prp = holes[nm].startPoint;
			prp.pt = holes[nm].pt;
			prp.nep = holes[nm].nep;
			// prp.startPoint = holes[nm].startPoint;
		} else if (pt[type] && pt[type][nm]) {
			const it = pt[type][nm - 1 + last];
			// prp.startPoint = it ? it[2] : pt.startPoint;
			prp.pt = {
				startPoint: it ? it[2] : pt.startPoint,
				decl: pt.decl
			};
			prp.nep = holes.length + 1;
			// prp.decl = pt.decl;
		// console.log('notify',cmd , prp);
		}
		holeCurr = createPopup(prp);
	}
	const createPopup = ({nep, pt} = attr) => {
	// const createPopup = ({nep, startPoint, decl} = attr) => {
		const id = 'gmxPopup0' + (nep ? nep : '');
		const opt = {
			id,
			anchor: L.point(286 + (nep ? 320 : 0), 100),
			maxHeight: 0,
			position: 'document',
			closeOnMapClick: false
		};
		const gmxPopup = L.control.gmxPopup(opt).openOn(map);
		const site = new Tconture({
				target: gmxPopup._contentNode,
				props: {
					// pt: {startPoint, decl},
					pt,
					// currentHole,
					nep,
					map
				}
			});
		const off = site.$on('notify', notify);
		site.$on('destroy', (ev) => {
			gmxPopup.remove();
			const data = ev.detail;
			if (data) {
				if (holes[data.nep - 1]) {
					holes[data.nep - 1] = data;
				} else {
					holes.push(data);
				}
				mSite.$set({ holes });
		console.log('destroy', mSite, data);
			}
			holeCurr = false;
		});
		map.once('removeControl', (arg) => {
			if (arg.options.id === id) {
				site.$destroy();
				// site.clear();
				// node.classList.remove('active');
				map.gmxDrawing.clearCreate();
				const holePopup = map.gmxControlsManager.get('holePopup');
				if (holePopup && holePopup._map) L.Control.prototype.remove.call(holePopup);
			}
		});
		map.gmxControlsManager.add(gmxPopup);
		// this.gmxPopup = gmxPopup;
		return site;
	}
	let mSite = createPopup({nep: 0, pt: {}});
//	<Tconture on:notify={notify} {currentHole} {pt} {nep} {map} />
</script>

<main class='les leaflet-control'>
	
</main>

<style>
/* 7 495 655 65 77
// 539 30 00
*/
</style>
