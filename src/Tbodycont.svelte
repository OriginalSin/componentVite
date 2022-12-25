<script>
	import Tbody from './Tbody.svelte';
	import Utils from './Utils.js';
    import { onMount, beforeUpdate, afterUpdate, onDestroy, createEventDispatcher } from 'svelte';
	import { _setFocuse, _pt } from './stores.js';
	const dispatch = createEventDispatcher();

	export let currentHole;
	export let pt;
	export let nep;
	export let map;

	// export let gmxMap;
	// export let quadrantIds = [];

	let startPointCont;
	$: ({ startPoint, ring, snap, decl } = pt);
	let startPointLat = '', startPointLng = '', startPointLatLng = '';
	const setStartPointAttr = () => {
		// console.log('setStartPointAttr', startPoint);
		if (startPoint) {
			startPointLat = Utils.formatDegrees(startPoint.lat, 3);
			startPointLng = Utils.formatDegrees(startPoint.lng, 3);
			startPointLatLng = L.gmxUtil.getCoordinatesString(startPoint, 1);
			if (startPointCont) startPointCont.classList.remove('warn');
			getLatlngs();
		}
	}
	$: startPoint && setStartPointAttr();

	const cnf = {
		pointEvents: 'dragend remove',
		lineEvents: 'editstop drawstop dragend rotateend remove',
		addLine: [45, 200],
		snapStyle: {pointStyle:{fillOpacity: 0.7, color: '#ff0000'}, lineStyle:{color: '#ff0000'}},
		ringStyle: {pointStyle:{fillOpacity: 0.7, shape: '' }, lineStyle:{color: '#0000ff'}},
	};
	if (nep) {
		cnf.ringStyle = {pointStyle:{fillOpacity: 0.7, shape: 'box', color: 'black'}, lineStyle:{color: 'aqua'}};
	}
	let snapBody;
	let ringBody;
	let person = {};
	let snapGrd, ringGrd;
	$: ({ snapGrd, ringGrd } = person);

	let snapLen = 0;
	let snapType = 'snap';
	let ringType = 'ring';
	
	const DEFANGLE = 45,
		DEFLEG = 101,
		PATERNS = {
			ring: /ring(\d+)/,
			hole: /hole(\d+)/,
			lat: /(\d+)_lat/,
			lng: /(\d+)_lng/,
			angle: /(\d*)\.?\d*_a/,
			dist: /(\d+)_d/
			// ,
			// latlng: '\d*([\.]&#123;1&#125;\d*)?'
		};

	const clipboard = (attr) => {
		console.log('clipboard', attr);
		// L.DomEvent.stopPropagation(ev);
	}
	const enter = (attr) => {
		console.log('enter', attr);
		// L.DomEvent.stopPropagation(ev);
	}
	const addLine = (type, nm) => {
		const itArr = (pt[type] || []).slice(0);
		let it = itArr[nm];
		if (it) {
			it = it.slice(0);
			it[0] = (it[0] * 2) % 360;
			itArr.splice(nm + 1, 0, it);
			pt[type] = itArr;
			_reCalcLatLngs();
			_setFocuse.set({type, nm});
		}
	}
	const delLine = (type, nm) => {
		const itArr = (pt[type] || []).slice(0);
		itArr.splice(nm, 1);
		pt[type] = itArr;
	}
	const _cloneObj = (pt) => {
		let out = {};
		if (pt.decl) out.decl = pt.decl;
		if (pt.snap) out.snap = pt.snap.slice(0);
		if (pt.ring) out.ring = pt.ring.slice(0);
		if (pt.startPoint) out.startPoint = pt.startPoint;
		return out;
	};
	const _chkDistVal = (type, nm, node) => {
		if (pt.startPoint) {
			const itArr = (pt[type] || []).slice(0);
			// const sArr = pt.snap || null;
			let val = node.value;
			if (val) {
				val = Number(val);
				let flag = type === 'ring' ? ringGrd : snapGrd;
				let isAngle = node.classList.contains('angle');
				let angle = isAngle ? val : 45, dist = !isAngle ? val : 100;
				let it = itArr[nm];
				if (it) {
					it = it.slice(0);
					// if (flag) angle = isAngle ? val : it[2].lat, dist = !isAngle ? val : it[2].lng;
					angle = isAngle ? val : it[2].lat, dist = !isAngle ? val : it[2].lng;
				} else {
					it = flag ? [[, , null]] : [[angle, dist, null]];
					if (!pt[type]) pt[type] = [];
					pt[type][nm] = it;
					// error = false;
				}
				if (flag) {
					let latlng = L.latLng(angle, dist);
					it[2] = latlng;
					pt[type][nm] = it;
					_reCalcAngleDist();
				} else {
					it[0] = angle;
					it[1] = dist;
					pt[type][nm] = it;
					_reCalcLatLngs();
				}
				pt = _cloneObj(pt);
				
			}
			// node.classList.remove('warn');
			startPointCont.classList.remove('warn');
		} else {
			// node.classList.add('warn');
			startPointCont.classList.add('warn');
		}
	}
	const _declinationChange = (ev) => {
		pt.decl = Number(ev.target.value);
		_reCalcLatLngs();
		_reCalcAngleDist();
	}

	const _setStartPoint = (latlng, notSetView) => {
		startPoint = L.latLng(latlng.lat, latlng.lng);
		pt.decl = decl === undefined ? Utils.geoMag(startPoint.lat, startPoint.lng, 0).dec - Utils.sblMer(startPoint.lat, startPoint.lng) : decl;
		pt.startPoint = startPoint;
		_reCalcLatLngs();
		map.gmxDrawing.clearCreate();
		// startPointNode.classList.remove('warning');
		// drawNode.classList.remove('active');
		if (!notSetView) map.setView(startPoint);
	}

	const _reCalcAngleDist = () => {
		let fromPoint = pt.startPoint;
		if (pt.snap && pt.snap.length) {
			pt.snap = Utils.setLatlngsToSnap(pt.snap, fromPoint);
			fromPoint = pt.snap[pt.snap.length - 1][2];
		}
		if (pt.ring && pt.ring.length) {
			pt.ring = Utils.setLatlngsToSnap(pt.ring, fromPoint);
		}
	}

	const _reCalcLatLngs = (decl) => {
		decl = decl === undefined ? pt.decl : decl;
		let fromPoint = pt.startPoint;
		if (pt.snap && pt.snap.length) {
			pt.snap = pt.snap.map(it => {
				fromPoint = L.GeometryUtil.destination(fromPoint, it[0] + decl, it[1]);;
				return [it[0], it[1], fromPoint];
			});
		}
		// if (pt.ring && pt.ring.length && !snapGrd) {
		if (pt.ring && pt.ring.length) {
			pt.ring = pt.ring.map(it => {
				let latlng = L.GeometryUtil.destination(fromPoint, it[0] + decl, it[1]);
				fromPoint = latlng;
				return [it[0], it[1], latlng];
			});
		}
	}
	const changeStartPoint = (ev) => {
		let target = ev.target;
		if (target.value) {
			let name = target.name;
			let val = Utils.parseCoordinate(target.value);
			pt.startPoint = L.latLng(name === 'lat' ? val : pt.startPoint.lat, name === 'lng' ? val : pt.startPoint.lng);
		} else {
			pt.startPoint = null;
		}
		// console.log('changeStartPoint', pt.startPoint. ev);
	}
	const changeGrdFlag = (ev) => {
		let target = ev.target;
		let val = target.checked;
		let name = target.name;
		changeGrd(name, val);
	}
	const changeGrd = (name, val) => {
		person[name] = val;
		if (name === 'ringGrd') ringBody.changeFlag({name, val});
		else snapBody.changeFlag({name, val});
	}
	const privaz = (ev, grawObj) => {
		L.DomEvent.stopPropagation(ev);
		// chkContextmenu();
		feature = grawObj;
		let lArr = Utils.latlngsFromDrawObj(feature);
		if (lArr[0][0] instanceof L.LatLng) {
			lArr = lArr[0];
		}
		let sp = lArr.shift();
		_setStartPoint(sp, true);
		lArr.push(sp);
		// latlngs = Utils.setLatlngsToSnap(lArr, sp, declination);
		// drawNode.classList.remove('active');
		chkContextmenu();
		redrawItems(true);
		// _scrollNeed = true;
	};
	const getCenter = (ev) => {
		_setStartPoint(ev.latlng, true);
		// snap.latlng = Requests.getLatlng(ev.latlng);
	};

	let _getCenterMenu;
	const chkContextmenu = (flag) => {
		const mcm = map.contextmenu,
			dcm = map.gmxDrawing.contextmenu;
			// ozu = map._gmxMap.layersByKind.ozu,
			// stand = map._gmxMap.layersByKind.stand;

		// mcm.hide();
		mcm.removeAllItems();
		_getCenterMenu = null;
		if (map._privazMenu) { dcm.removeItem(map._privazMenu, 'points'); map._privazMenu = null; }
		// stand.unbindContextMenu();

		if (flag) {
			map._privazMenu = {callback: privaz.bind(this), text: 'Привязать'};
			dcm.insertItem(map._privazMenu, 0, 'points');
		// mcm.insertItem(map._privazMenu, 0, 'points');
		_getCenterMenu = mcm.addItem({callback: getCenter.bind(this), text: 'Взять координату'});
		mcm.enable();
			const options = {
				contextmenuItems: [
					// { text: 'Включить для прилипания', callback: prilip.bind(this) },
					// { text: 'Отключить прилипание', callback: prilipOff.bind(this) },
					{ text: 'Взять координату', callback: (ev) => {_setStartPoint(ev.latlng, true);} }
				]
			};
			// ozu.bindContextMenu(options);
			// stand.bindContextMenu(options);
		}
	}
	const dragend = (ev) => {
		L.DomEvent.stopPropagation(ev.sourceTarget);
		if (ev.type === 'remove') {
			clearDrawObjects();
			startPoint = snap = latlngs = null;
		} else {
			startPoint = ev.target.getLatLng();
		}
		pt.startPoint = startPoint;
	};
	let lastPoint = startPoint;
	const editItem = (it) => {
		const obj = it.object;
		const isSnap = obj.options.snap;
		changeGrd('snapGrd', true);
		changeGrd('ringGrd', true);

		let lArr = Utils.latlngsFromDrawObj(obj);
		if (lArr) {
			lastPoint = startPoint;
			if (!isSnap && snap && snap.length) {
				lastPoint = snap[snap.length - 1][2];
			}
			let arr = Utils.getAngleDist(lastPoint, lArr, decl);
			arr.shift();
			if (isSnap) {
				pt.snap = arr;
			} else {
				arr.pop();
				pt.ring = arr;
			}
		} else if (!isSnap) {
			pt.ring = [[]];
		}
	};

	const clearDrawObjects = (item) => {
		// map.contextmenu.hide();
		if (item.drawingPoint) {
			item.drawingPoint._obj.off(cnf.pointEvents, item.drawingPoint._editor);
			map.gmxDrawing.remove(item.drawingPoint);
			// drawingPoint = null;
		}
		if (item.snapFeature) {
			item.snapFeature.off(cnf.lineEvents, item.snapFeature._editor);
			map.gmxDrawing.remove(item.snapFeature);
			// snapFeature = null;
		}
		if (item.feature) {
			item.feature.off(cnf.lineEvents, item.feature._editor);
			map.gmxDrawing.remove(item.feature);
			// feature = null;
		}
		drawItems = {};
		pt.drawItems = drawItems;
	}

	let drawItems = {};
	let zakl;
	const getLatlngs = () => {
		let arr = [];
		let fromPoint = pt.startPoint;
		if (pt.snap) {
			arr = Utils.getLatLngsFromPt(pt.snap, fromPoint, snapGrd, decl);
			arr.unshift(fromPoint);
			fromPoint = arr[arr.length - 1];
		}
		let arr1 = [];
		if (pt.ring) {
			arr1 = Utils.getLatLngsFromPt(pt.ring, fromPoint, ringGrd, decl);
			arr1.unshift(fromPoint);
			let ep = arr1[arr1.length - 1];
			let angle = L.GeometryUtil.bearing(ep, fromPoint) - decl;
			zakl = Utils.getSnapList([[
				angle < 0 ? angle + 360 : angle,
				L.gmxUtil.distVincenty(ep.lng, ep.lat, fromPoint.lng, fromPoint.lat),
				fromPoint
			]], ringGrd)[0];
		// console.log('zakl', zakl);
			arr1.push(fromPoint);
		}
		return {arr, arr1};
	}
	const redrawItems = () => {
		clearDrawObjects(drawItems);
		const {arr, arr1} = getLatlngs();
		const drawPar = {
			map,
			editable: true,
			snapStyle: cnf.snapStyle,
			ringStyle: cnf.ringStyle,
			icon: nep ? L.divIcon({html: '<span>' + nep + '</span>', className: 'svgFlag', iconSize: [48, 48], iconAnchor: [6, 42]}) : '',
			dragend,
			editItem,
			latlng: pt.startPoint,
			snap: arr,
			ring: arr1
		};
		drawItems = Utils.drawItems(drawPar);
		pt.drawItems = drawItems;
	}
	onMount(() => {
		// console.log('the component has mounted');
		chkContextmenu(true);
		// redrawItems();
	});
	beforeUpdate(() => {
		snapLen = pt.snap ? pt.snap.length : 0;
	});
	afterUpdate(() => {
		redrawItems();
		console.log('the component just updated', zakl, pt);
	});
	onDestroy(() => {
		// console.log('the component is being destroyed');
		clearDrawObjects(drawItems);
	});
	export const getPt = () => {
		return pt;
	}

	const notify = (ev) => {
		const {cmd, type, nm, node} = ev.detail;
		switch(cmd) {
			case 'enter': enter(ev.detail); break;
			case 'clipboard': clipboard(ev.detail); break;
			case 'delLine': delLine(type, nm); break;
			case 'addLine': addLine(type, nm); break;
			case 'addHole': dispatch('notify', {pt, ...ev.detail}); break;
			case 'angle':
			case 'distance':
				_chkDistVal(type, nm, node);
				break;
		}
		dispatch('notify', {cmd: 'holeFlag', val: pt && pt.ring && pt.ring.length > 1});
	}

</script>
<div class="tbodycont">
		{#if nep}
	<div class="nep">
		<div class="title">Контур НЭП - <span>{nep}</span>
			<div class="sub" style="font-weight: 400;">(неэксплуатируемая площадь)</div>
		</div>
	</div>
		{/if}

	<div class="line">Координаты опорной точки{#if nep} НЭП{/if}</div>
	<div class="startPoint" bind:this={startPointCont}>
		<input name="lat" class="lat" placeholder="lat" type="text" value={startPointLat} on:change={changeStartPoint} />
		<input name="lng" class="lng" placeholder="long" type="text" value={startPointLng} on:change={changeStartPoint} />
		<div class="string">{startPointLatLng}</div>
	</div>
	<div class="ugol">
		<div class="title">Угловая поправка</div>
		<input name="deltaUgol" class="deltaUgol" type="number" min="-90" max="90" step="1" value={decl} on:change={_declinationChange} />
	</div>

	<div class="block snap">
		<div class="line"><span class="title">Привязочный ход{#if nep} НЭП{/if}</span>
			<div class="grd">
				<input type="checkbox" checked={snapGrd} name="snapGrd" on:click|stopPropagation={changeGrdFlag} />
				<label for="snapGrd">координаты</label>
			</div>
		</div>
		<Tbody on:notify={notify} bind:this={snapBody} bind:arr={snap} bind:decl={decl} bind:type={snapType} {zakl} {snapLen} {nep} {currentHole} {snapGrd} {ringGrd} />
	</div>

	<div class="block ring">
		<div class="line"><span class="title">Контур{#if nep} НЭП{/if}</span>
			<div class="grd">
				<input type="checkbox" checked={ringGrd} name="ringGrd" on:click|stopPropagation={changeGrdFlag} />
				<label for="ringGrd">координаты</label>
			</div>
		</div>
		<Tbody on:notify={notify} bind:this={ringBody} bind:arr={ring} bind:decl={decl} bind:type={ringType} {zakl} {snapLen} {nep} {currentHole} {snapGrd} {ringGrd} />
	</div>
</div>
