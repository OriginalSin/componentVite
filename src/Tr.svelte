<script>
	import Utils from './Utils.js';
    import { onMount, beforeUpdate, onDestroy, tick, createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let item = ['', ''];
	export let nm = 0;
	export let start = 0;
	export let end = 0;
	export let type;
	export let flag;
	export let nep;
	export let listLen = 0;
	export let last = 0;

	let skipChangeEvent;
	const onKeyUp = (ev) => {
		if (ev.key === 'Enter') {
			const node = ev.target;
			const attr = _getAttr(node);
			attr.cmd = 'enter';
			dispatch('notify', attr);
		}
	}
	const clipboard = (ev) => {
		const node = ev.target;
		const attr = _getAttr(node);
		const clipboardData = ev.clipboardData;
		const str = clipboardData.getData('text/plain');
		clipboardData.clearData();
		const arr = Utils.parseCoordsList(str);
		setTimeout(() => { node.value = arr[0][0]; }, 5);
		attr.arr = arr;
		attr.cmd = 'clipboard';
		dispatch('notify', attr);
		skipChangeEvent = true;
		// await tick();
		// node.value = arr[0][0];

		// console.log('clipboard', attr);
	}
	const _getAttr = (node) => {
		const prnt = node.parentNode.parentNode;
		const ind = node.parentNode.getAttribute('data-index') || prnt.getAttribute('data-index');
		return {
			cmd: node.name,
			nm: ind ? Number(ind) : undefined,
			node
		};
	}
	const _sendCmd = (ev) => {
		const node = ev.target;
		if (skipChangeEvent && node.tagName === 'INPUT') {
			skipChangeEvent = false;
			return;
		}
		dispatch('notify', _getAttr(node));
	}
	// beforeUpdate(() => {
			// if (type === 'ring') {
				// if (last) { nm = nm + 1; next = snapLen ? 1 : 0; }
			// }
	// });

</script>
<div class='tr snap {last ? "last" : ""}' data-index={nm}>
	<span class='nm'>{start}-{end}</span>
	<input type='text' disabled={last} value={item[0]} name='angle' placeholder={flag ? 'lat' : 'angle'} class='angle' on:keyup={onKeyUp} on:change={_sendCmd} on:paste={clipboard} />
	<span class=''>-</span>
	<input type='text' disabled={last} value={item[1]} name='distance' placeholder={flag ? 'lng' : 'distance'} class='distance' on:keyup={onKeyUp} on:change={_sendCmd} on:paste={clipboard} />
	<span class="buttons">
		{#if !nep && type === 'ring' && listLen > 1}<button name='addHole' class='addHole' on:click|stopPropagation={_sendCmd}></button>{/if}
		<button name='addLine' class='addLine' on:click|stopPropagation={_sendCmd}></button>
		<button name='delLine' class='delLine' on:click|stopPropagation={_sendCmd}></button>
	</span>
</div>
