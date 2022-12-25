<script>
	import Tbodycont from './Tbodycont.svelte';
	import Utils from './Utils.js';
    import { onMount, beforeUpdate, afterUpdate, onDestroy, createEventDispatcher } from 'svelte';
	// import { _setFocuse } from './stores.js';
	const dispatch = createEventDispatcher();

	export let currentHole;
	export let pt;
	export let nep;
	export let map;
	export let holes;

	// export let gmxMap;
	// export let quadrantIds = [];

	let contInst;
	let holeFlag;
	let scrollBody;
	let needScroll = false;

	onMount(() => {
		// console.log('the component has mounted');
		// chkContextmenu(true);
	});
	beforeUpdate(() => {
		// if (!holeFlag
		// needScroll = false;
	});
	afterUpdate(() => {
		// console.log('afterUpdate', pt, holes);
		if (needScroll) scrollBody.scroll(0, scrollBody.scrollHeight);
		needScroll = false;
		// redrawItems();
	});

	// const clearDrawObjects = (item) => {
		// if (item.drawingPoint) {
			// item.drawingPoint._obj.off(cnf.pointEvents, item.drawingPoint._editor);
			// map.gmxDrawing.remove(item.drawingPoint);
		// }
		// if (item.snapFeature) {
			// item.snapFeature.off(cnf.lineEvents, item.snapFeature._editor);
			// map.gmxDrawing.remove(item.snapFeature);
		// }
		// if (item.feature) {
			// item.feature.off(cnf.lineEvents, item.feature._editor);
			// map.gmxDrawing.remove(item.feature);
		// }
	// }

	const save = () => {
		dispatch('destroy', {nep, pt: contInst.getPt()});
	}

	const editHole = (ev) => {
		const prnt = ev.target.parentNode;
		const ind = prnt.getAttribute('data-index');
		let vnm = ind ? Number(ind) : undefined;
		if (holes[vnm]) {
			dispatch('notify', {nm: vnm, decl: pt.decl, cmd: 'editHole'});
		}
		// console.log('editHole', vnm, holes);
	}

	const delHole = (ev) => {
		const prnt = ev.target.parentNode;
		const ind = prnt.getAttribute('data-index');
		let vnm = ind ? Number(ind) : undefined;
		if (holes[vnm]) {
			holes.splice(vnm, 1);
			holes = holes.slice(0);
		}
		// console.log('delHole', vnm, holes);
	}

	const notify = (ev) => {
		const {cmd, val} = ev.detail;
		switch(cmd) {
			case 'addHole': dispatch('notify', ev.detail); break;
			case 'holeFlag':
				needScroll = !holeFlag && val;
				holeFlag = val;
				break;
		}
		// console.log('notify', ev.detail);
	}

</script>
<div class="tconture">
	<div class="header">Добавление {nep ? 'контура НЭП' : 'делянки'}</div>
	<div class="scrollbar" bind:this={scrollBody}>
			{#if !nep}
		<div class="line">
			<div class="title">Шаг 1. Контур делянки</div>

		</div>
		
		<div class="line">
			<span class="draw">Нарисовать</span>
			<span class="info">Важно!
				<div class="cont">
					<div class="text">
						В сервисе уже учтено магнитное склонение. Дополнительные угловые корректировки выполняются в окне «Угловая поправка»
					</div>
				</div>
			</span>
		</div>
		<div class="line"><div class="title">Выберите тип известных вам данных</div></div>

		<div class="line"><div class="lcont"><label class="">Слой квартальной сети</label></div></div>
		<div class="line">
			<select name="quadrantLayerId" class="quadrantLayerId">
				<option value=""></option>
				<option value="6F9E47C1D549429C93D34CC46B9894BE" class="">ArcGIS_sample_polygons</option>
				<option value="F1D1EEB9142E409884D4233CF86085E2" class="">testHole</option>
			</select>
			<label for="profileVector" class="pop_upload" alt="pop_upload"></label>
			<input type="file" id="profileVector" class="" style="display: none;">
		</div>
				
		<div class="line"><div class="title"><label class="" for="defaultUnchecked">Квартал</label></div></div>
		<div class="line"><input name="kvartal" autocomplete="off" class="kvartal" list="kvartal" title="Указать квартал"></div>
			{/if}
		<Tbodycont bind:this={contInst} on:notify={notify} {currentHole} {pt} {nep} {map} />
		
			{#if !nep && holeFlag}
		<div class="line">Контура НЭП
			<span class="addHole center notActive" title="Добавить НЭП"></span>
			<div class="sub">(неэксплуатируемая площадь)</div>
			
			{#each (holes || []) as item, nm}
			<div class="hole" data-index={nm}><span class="setHole" on:click|stopPropagation={editHole} title="Редактировать НЭП">НЭП - {nm + 1}</span>
				<button class="delLine delItem" on:click|stopPropagation={delHole} title="Удалить строку"></button>
			</div>
			{/each}
		</div>
			{/if}
				
				
	</div>
	<div class="bottom">
		<div class="cancel" on:click|stopPropagation={() => {dispatch('destroy');}}>Отмена</div>
		<div class="save" on:click|stopPropagation={save}>{nep ? 'Сохранить' : 'Далее'}</div>
	</div>
</div>
