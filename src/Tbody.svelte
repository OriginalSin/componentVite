<script>
	import Tr from './Tr.svelte';
	import Utils from './Utils.js';
	import { _setFocuse } from './stores.js';
	// import * as Config from './Config.js';
	// import * as EditorLib from './EditorLib.js';
	// import * as Requests from './Requests.js';
	// import * as Rings from './Rings.js';
    import { onMount, beforeUpdate, afterUpdate, onDestroy, getAllContexts, setContext, getContext, createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

	export let currentHole;
	export let nep;
	export let arr = [['', '', null]];
	export let decl = 0;
	export let type;
	export let snapGrd;
	export let ringGrd;
	export let snapLen;
	export let zakl;

	// export let gmxMap;
	// export let quadrantIds = [];

	// let arr = [["56°09.948'", "32°31.146'"], ["57°09.948'", "32°31.146'"], ["58°09.948'", "32°31.146'"]];
	let flag = type === 'ring' ? ringGrd : snapGrd;
	let flagZakl;
	let listArr = [];
	let listLen = 0;
	// let i = 0;
	// let snapLength = 1;
	// let holesFlag = true;
	
	// const DEFANGLE = 45,
		// DEFLEG = 200,
		// PATERNS = {
			// ring: /ring(\d+)/,
			// hole: /hole(\d+)/,
			// lat: /(\d+)_lat/,
			// lng: /(\d+)_lng/,
			// angle: /(\d*)\.?\d*_a/,
			// dist: /(\d+)_d/
			// ,
			// latlng: '\d*([\.]&#123;1&#125;\d*)?'
		// };
	let needFocuse;
	_setFocuse.subscribe(value => needFocuse = value);

	const clipboard = (attr) => {
		console.log('clipboard', attr);
		// L.DomEvent.stopPropagation(ev);
	}

	const enter = (attr) => {
		const node = attr.node;
		const ntype = node.className;
		let inputs = node.parentNode.getElementsByTagName('input');
		if (ntype === 'angle') { inputs[1].focus(); }
		else if (ntype === 'distance') {
			if (attr.nm < listLen - 1) {
				inputs = node.parentNode.nextElementSibling.getElementsByTagName('input');
				inputs[0].focus();
			} else {
				dispatch('notify', {type, nm: attr.nm, cmd: 'addLine'});
				_setFocuse.set({type, nm: attr.nm});
			}
		}
	}

	const notify = (ev) => {
		const {cmd, nm} = ev.detail;
		switch(cmd) {
			case 'enter': enter(ev.detail); break;
			case 'clipboard': clipboard(ev.detail); break;
			default:
				dispatch('notify', {type, nep, ...ev.detail});
		}
	}
	let start = 0;
	let end = 0;
	let last = 0;
	export const changeFlag = ({name, val}) => {
		flag = val;
		if (arr && arr.length) {
			listArr = Utils.getSnapList(arr, val);
		} else {
			listArr = [['', '']];
		}
		listLen = listArr.length;
		flagZakl = type === 'ring' && listArr.length > 1;
	}

	onMount(() => {
		const name = type === 'ring' ? 'ringGrd' : 'snapGrd';
		changeFlag({name, val: type === 'ring' ? ringGrd : snapGrd})
	});
		let sf;
	beforeUpdate(() => {
		const name = type === 'ring' ? 'ringGrd' : 'snapGrd';
		changeFlag({name, val: type === 'ring' ? ringGrd : snapGrd})
		if (type === 'ring') {
			if (listArr.length > 1) {
				last = 1;
				start = listArr.length + 1;
				end = snapLen ? 1 : 0;
			}
		}
		// sf = getContext('setFocuse');
	});
		// const tt = getAllContexts();
		// const answer = getContext('answer');
	let contDiv;
	afterUpdate(() => {
		let inputs = contDiv.getElementsByTagName('input');
		if (needFocuse && needFocuse.type === type) {
			let num = 2 * (needFocuse.nm + 1);
			inputs[num].focus();
			_setFocuse.set(null);
		}
	});
</script>
<div class="tbody" bind:this={contDiv}>
	{#each listArr || [['', '', null]] as item, nm}
		{@const start = nm + (type === 'ring' && snapLen ? 1 : 0)}
		{@const end = start + 1}
		<Tr {item} {nm} {start} {end} {flag} {nep} {listLen} {type} on:notify={notify} />
	{/each}
	{#if flagZakl}
		<Tr bind:item={zakl} bind:nm={snapLen} {start} {end} {flag} {nep} {listLen} {type} {last} on:notify={notify} />
	{/if}

</div>
