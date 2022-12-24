// import geoMag from './GeoMag.js'

const FILE_EXTENSIONS = {
	vector: ['.geojson','.shp','.dbf','.prj','.sbn','.sbx','.shx','.dat','.mif','.mid','.csv','.gpx','.kml','.kmz','.sxf','.sqlite','.gdbtable',].join(','),
	raster: ['.tif','.tiff','.tfw','.xml','.jpg','.jgw','.png','.pgw','.jp2','.j2w',].join(','),
};
let _uploadFileSize = 500 * 1024;
function _createParts(files) {
	let upfiles = [];
	for (let i = 0; i < files.length; i++) {
		let partsCount = Math.ceil(files[i].size / _uploadFileSize);
		let parts = [];
		for (let j = 0; j < partsCount - 1; ++j){
			parts.push({ xhr: null, status:'none', size: _uploadFileSize, send: 0, needSend: _uploadFileSize });
		}
		let lastSize = files[i].size - (_uploadFileSize * (partsCount - 1));
		parts.push({ xhr: null, status:'none', size: lastSize, send: 0, needSend: lastSize });
		let p = {
			item: files[i],
			name: files[i].name,
			parts,
			totalBytes: files[i].size,
			status: 'none'
		};
		upfiles.push(p);
	}
	return upfiles;
}

const Utils = {
	createGeometryIcon: (parentStyle, type) => {
		parentStyle = parentStyle || {};
		const out = {};
		if (parentStyle.outline) {
			const opacity = typeof parentStyle.outline.opacity != 'undefined' ? parentStyle.outline.opacity / 100 : 1;
			out.borderColor = L.gmxUtil.dec2rgba(typeof parentStyle.outline.color != 'undefined' ? parentStyle.outline.color : 255, opacity);
		}
		if (parentStyle.fill) {
			const opacity = typeof parentStyle.fill.opacity != 'undefined' ? parentStyle.fill.opacity / 100 : 1;
			out.fillColor = L.gmxUtil.dec2rgba(typeof parentStyle.fill.color != 'undefined' ? parentStyle.fill.color : 16777215, opacity);
		}
		return out;
	},
	toggleClassList: (classList, flag) => {
		let active = classList.contains('active');
		if (flag !== undefined) {
			active = flag;
		}
		if (active) {
			classList.remove('active');
		} else {
			classList.add('active');
		}
		return !active;
	},
	pad: (x, len) => {
		x = String(x);
		while (x.length < len) x = `0${x}`;
		return x;
	},
	fmt_m: v => (v && parseFloat(v) || 0).toLocaleString('ru-RU', {minimumFractionDigits: 0, maximumFractionDigits: 0}),
	fmt_value: val => `${Utils.fmt_m(parseFloat(val))} куб. м`,
	fmt_total: w => Utils.fmt_value(w.globals.seriesTotals.reduce((a, b) => a + b, 0)),
	// addChart: addChart
	toIdent: () => {
		let CallbackUrl = '//' + location.host + '/ident/CallbackAuth';
		location.href = '/auth/Login?CallbackUrl=' + CallbackUrl;
	},
	logout: () => {
		let url = '/ident/Logout';
		fetch(url, { method: 'POST', mode: 'cors', credentials: 'include' })
		.then(claims => {
			// console.log('logout', url, claims);
			location.href = '//' + location.host;
		})
		.catch(err => {
			// console.log('logout err', url, claims, err);
			location.href = '//' + location.host;
		});
	},
	getFile: (opt) => {
		opt = opt || {};
		return new Promise(resolve => {
			const files = document.createElement('input');
			files.setAttribute('type', 'file');
			if (opt.multiple) { files.setAttribute('multiple', opt.multiple); }
			files.setAttribute('accept', opt.ext || FILE_EXTENSIONS[opt.type || 'vector']);
			document.body.appendChild(files);
			files.addEventListener('change', (ev) => {
				const farr = ev.target.files;
				document.body.removeChild(files);
				const promises = [];
				for(let i = 0; i < farr.length; i++) {
					const it = farr[i];
					promises.push(new Promise(resolve1 => {
						const reader = new FileReader();
						reader.onload = function(evt) {
							it.result = evt.target.result;
							// it.res = JSON.parse(evt.target.result);
							// console.log(it.res);
							resolve1();
						};
						reader.readAsText(it);
					}));
				}
				Promise.all(promises).then(ev => {
					resolve(farr);
				});
			});
			files.click();
		});
	},
	delay: timeout => new Promise((resolve) => {
		const id = window.setInterval(() => {
			window.clearInterval(id);
			resolve({});
		}, timeout);
	}),
	geoMag,
	
	sblMer: (lat, lon) => {
		let zone = Math.round(lon / 6) + 1,
			l0 = zone * 6 - 3;
		return (lon - l0) * Math.sin(lat);
	},
	parseAngle: (str) => {		// С, СВ, В, ЮВ, Ю, ЮЗ, З, СЗ
		str = str.trim();
		let angle = 0,
			np = '',
			p1 = (str[0] || '').toUpperCase(),
			p2 = (str[1] || '').toUpperCase(),
			d = (p2 === 'З' ? 45 : (p2 === 'В' || p2 === 'B' ? -45 : 0)),
			fMinus = false,
			s = 1;

		if (p1 === 'C' || p1 === 'С') {
			np = 'С';
			if (p2 === 'З') {
				// angle = 360;
				s = 2;
				np = 'СЗ';
				fMinus = true;
			} else if (p2 === 'В' || p2 === 'B') {
				s = 2;
				np = 'СВ';
			}
		} else if (p1 === 'Ю') {
			np = 'Ю';
			angle = 180;
			if (p2 === 'З') {
				s = 2;
				np = 'ЮЗ';
			} else if (p2 === 'В' || p2 === 'B') {
				s = 2;
				np = 'ЮВ';
				fMinus = true;
			}
		} else if (p1 === 'З') {
			np = 'З';
			angle = 270;
		} else if (p1 === 'В' || p1 === 'B') {
			np = 'В';
			angle = 90;
		} else {
			s = 0;
		}
		let rumb = Number(str.substr(s));
		return {
			np: np,
			rumb: rumb,
			angle: angle + (fMinus ? -rumb : rumb)
		};
	},
	/* обработка углов, дистанций вида
св55 400
св15 200
юз45 300
	*/
	parseAngleDistList: (str) => {
		str = str || '';
		let out = [];
		const lines = str.split('\n');
		lines.forEach((st, i) => {
			if (st) {
				const arr = st.split(' ');
				const rmb = Utils.parseAngle(arr[0]);
				let angle = !isNaN(rmb.angle) ? rmb.angle : '';
				if (!isNaN(rmb.angle)) { angle = rmb.angle; }
				out.push([angle, Number(arr[1])]);
			}
		});
		return out;
	},
	/* обработка строк координат вида
64°48'03.99" N, 45°54'47.97" E
64°48'03.99" N, 47°54'47.97" W
66°48'03.99" N, 45°54'47.97" E
64°48'03.99" N, 45°54'47.97" E
	*/
	parseCoordsList: (str) => {
		str = str || '';
		let out = [];
		const lines = str.replace(/,\[/g, ',\n[').split('\n');
		const reg = /[+-]?\d+(\.\d+)?/g;
		lines.forEach((st, i) => {
			if (st) {
				let arr = st.match(reg);
				if (arr) {
					let num = arr.length;
					let zn0 = st.indexOf('S') === -1 ? 1 : -1;
					let zn1 = st.indexOf('W') === -1 ? 1 : -1;
					if (st.match(/°/)) {
						if (num === 6) {
							// num = 2;
							arr[0] = Number(arr[0]) + Number(arr[1]) / 60 + Number(arr[2]) / 3600;
							arr[1] = Number(arr[3]) + Number(arr[4]) / 60 + Number(arr[5]) / 3600;
							out.push([Number(zn0 * arr[0]), Number(zn1 * arr[1])]);
						} else if (num === 4) {
							// num = 2;
							arr[0] = Number(arr[0]) + Number(arr[1]) / 60;
							arr[1] = Number(arr[2]) + Number(arr[3]) / 60;
							out.push([Number(zn0 * arr[0]), Number(zn1 * arr[1])]);
						} else if (num === 3) {
							// num = 1;
							arr[0] = Number(arr[0]) + Number(arr[1]) / 60 + Number(arr[2]) / 3600;
							out.push([Number(zn0 * arr[0])]);
						} else if (num === 2) {
							// num = 1;
							arr[0] = Number(arr[0]) + Number(arr[1]) / 60;
							out.push([Number(zn0 * arr[0])]);
						}
					} else if (num === 1) {
						out.push([Number(arr[0])]);
					} else if (num === 2) {
						out.push([Number(arr[0]), Number(arr[1])]);
					}
				}
			}
		});
		return out;
	},
	parseCoordinate: function(text) {
		if (text.match(/[йцукенгшщзхъфывапролджэячсмитьбюЙЦУКЕНГШЩЗХЪФЫВАПРОЛДЖЭЯЧСМИТЬБЮqrtyuiopadfghjklzxcvbmQRTYUIOPADFGHJKLZXCVBM_:]/)) {
			return null;
		}
		text = text.replace(/,/g, '.');
		let regex = /(-?\d+(\.\d+)?)([^\d\-]*)/g,
			t = regex.exec(text),
			results = [];

		while (t) {
			results.push(t[1]);
			t = regex.exec(text);
		}
		if (!results.length) {
			return null;
		}
		var ii = Math.floor(results.length),
			y = 0,
			mul = 1,
			i;
		for (i = 0; i < ii; i++) {
			y += parseFloat(results[i]) * mul;
			mul /= 60;
		}

		if (text.indexOf('S') !== -1 || text.indexOf('W') !== -1) {
			y = -y;
		}
		return y;
	},

	getMidlePoint: (map, p1, p2) => {
		let bearing = L.GeometryUtil.bearing(p1, p2);
		let distance = L.GeometryUtil.distance(map, p1, p2);
		return L.GeometryUtil.destination(p1, bearing, distance / 2);
	},
	getAngleDist: (latlng, latlngs, dec = 0) => {
		// delta = delta || 1;
		let p = latlng;
		let ring = latlngs.map((latlng) => {
			let bearing = L.GeometryUtil.bearing(p, latlng),
				distance = L.gmxUtil.distVincenty(p.lng, p.lat, latlng.lng, latlng.lat);

			p = latlng;
			//console.log('dec', dec, bearing)
			if (dec) {
				bearing -= dec;
			}
			bearing = bearing + (bearing < 0 ? 360 : 0);
			bearing = Math.floor(bearing * 100) / 100;
			return [bearing, distance, latlng];
			// return [bearing, distance,, latlng.lat, latlng.lng, Utils.formatDegrees(latlng.lat, 3), Utils.formatDegrees(latlng.lng, 3)];
			// return [bearing, distance * delta];
		});
		return ring;
	},
	getLatLngsFromPt: (pt, p, flag, dec = 0) => {
		let arr = [];
		pt.forEach((it) => {
			if (it.length) {
				if (flag) {
					if (it[2]) arr.push(it[2]);
				} else {
					p = L.GeometryUtil.destination(p, dec + (it[0] || 0), it[1] || 0);
					it[2] = p;
					arr.push(p);
				}
			}
		});
		return arr;
	},
	getLatlngsFromSnap: arr => {
		return arr.reduce((p, c) => {
			p.push(c[2]);
			return p;
		}, []);
	},
    /** Получение [[азимут, дист, latlng], ...] из массива координат
     * @memberof Utils
     * @param [coords] array L.LatLng - массив координат
     * @return [Array] - [[азимут, дист, latlng], ...]
    */
	// latlngsToPt: (coords) => {
		// const out = [];
		// let f;
		// coords.forEach((lp, i) => {
			// if (i) {
				// const bearing = L.GeometryUtil.bearing(f, lp);
				// const distance = L.gmxUtil.distVincenty(f.lng, f.lat, lp.lng, lp.lat);
				// out.push([Math.ceil(bearing), Math.ceil(distance), lp]);
				// f = lp;
			// } else {
				// f = lp;
			// }
		// });
		// return out;
	// },
	setLatlngsToSnap: (arr, fromPoint, dec = 0) => {
		return arr.reduce((p, c) => {
			let latlng = c instanceof L.LatLng ? c : c[2];
			let pt = [
				L.GeometryUtil.bearing(fromPoint, latlng) - dec,
				L.gmxUtil.distVincenty(fromPoint.lng, fromPoint.lat, latlng.lng, latlng.lat),
				latlng
			];
			fromPoint = latlng;
			p.push(pt);
			return p;
		}, []);
	},
	getLine: (fromPoint, item, decl, flag) => {
		let pt;
		decl = decl || 0;
		let angle = item[0] == undefined ? cnf.addLine[0] : item[0];
		if (typeof(angle) === 'string') angle = Number(angle);
		let dist = item[1] === undefined ? cnf.addLine[1] : item[1];
		if (typeof(dist) === 'string') dist = Number(dist);
		if (flag) {
			let latlng = L.GeometryUtil.destination(fromPoint, angle + decl, dist);
			const bearing = L.GeometryUtil.bearing(fromPoint, latlng);
			const distance = L.gmxUtil.distVincenty(fromPoint.lng, fromPoint.lat, latlng.lng, latlng.lat);
			pt = [Math.ceil(bearing), Math.ceil(distance), latlng];
		} else {
			// angle = angle ? Number(angle) : cnf.addLine[0]; dist = dist ? Number(dist) : cnf.addLine[1];
			pt = [angle, dist, L.GeometryUtil.destination(fromPoint, angle + decl, dist)];
		}
		return pt;
	},
	getSnapList: (snArr, flag) => {
		let arr = [];
		if (flag) {
			arr = Utils.getLatlngsFromSnap(snArr).map(p => [Utils.formatDegrees(p.lat, 3), Utils.formatDegrees(p.lng, 3)]);
		} else {
			arr = snArr.length ? snArr.map(p => [Math.ceil(p[0] < 0 ? p[0] + 360 : p[0]), Math.ceil(p[1])]) : [[null, null]];
		}
		return arr;
	},

	pad3: (t) => {
		return (t >= 0 && t < 10) ? ('00' + t) : ((t >= 10 && t < 100) ? ('0' + t) : ('' + t));
	},
	formatDegrees: (angle, format) => {
		angle = Math.round(10000000 * angle) / 10000000 + 0.00000001;
		var a1 = Math.floor(angle),
			a2 = Math.floor(60 * (angle - a1)),
			a3 = L.gmxUtil.toPrecision(3600 * (angle - a1 - a2 / 60), 2),
			st = L.gmxUtil.pad2(a1) + '°';

		if (format ===  undefined ) { format = 2; }
		if (format === 3) {
			st += L.gmxUtil.pad2(a2) + '.';
			a3 = Math.round(1000 * (60 * (angle - a1) - a2));
			if (a3 > 999) { a3 -= 1000; }
			st += Utils.pad3(a3) + '\'';
			// st += L.gmxUtil.toPrecision(60 * (angle - a1), 3) + '\'';
		} else {
			if (format > 0) {
				st += L.gmxUtil.pad2(a2) + '\'';
			}
			if (format > 1) {
				st += L.gmxUtil.pad2(a3) + '"';
			}
		}
		return st;
	},
    removeDocument: (obj, type, id) => {
        switch (type) {
            case 'scan':
                return obj.filter(el => el.id !== id);
            default:
                return obj.filter(el => el.id !== id);
        }
    },
    downloadDocument: (obj, type, id) => {
        let doc;
        switch (type) {
            case 'scan':
                doc = obj;
                break;
            default:
                [doc] = obj.filter(el => el.id === id);
                break;
        }
		let username = doc.username;
		let name = doc.file.name;
		const format = name.match(/\.[0-9a-z]+$/i)[0];
		let link = document.createElement('a');
		link.download = username ? username + format : name;
		if (doc.server) {
				fetch(`/forest/GetDocument?documentId=${id}`, {
					method: 'GET',
					credentials: 'include',
					headers: {
						'Content-Type': 'application/json'
					},            
				})
				.then(response => response.blob())
				.then(blob => {
					link.href = window.URL.createObjectURL(blob);
					link.click();
				});
		} else {
			let blob = new Blob([doc.file], {type: 'application/json'});
			link.href = window.URL.createObjectURL(blob);
			link.click();
		}
    },
    uploadDocument: async (obj, id, type) => {
        const file = document.createElement('input');
        file.setAttribute('type', 'file');
        file.setAttribute('multiple', 'true');
        file.style.width = '0px';
        file.style.height = '0px';
        document.body.appendChild(file);
        return await new Promise(resolve => {
            file.addEventListener('change', e => {
                let date = new Date();
                const d = date.getDate();
                const m = date.getMonth();
                const y = date.getFullYear();
                date = `${String(d).padStart(2, 0)} . ${String(m+1).padStart(2, 0)} . ${y}`;
                e.target.files.forEach(el => {
                    switch (type) {
                        case 'scan':
                            resolve({ id: el.name, file: el, username: '', date });
                            break;
                        default:
                            obj = [...obj, { id: el.name, file: el, username: '', date }];
                            break;
                    }
                })
                document.body.removeChild(file);
                resolve(obj);
            });
            file.click();
        });
    },
	poll: (taskID) => {
		return new Promise((resolve, reject) => {
			const id = window.setInterval(async () => {
				fetch(`/gis/AsyncTask.ashx?WrapStyle=None&TaskID=${taskID}`, {
					method: 'GET',
					credentials: 'include',
					headers: {
						'Content-Type': 'application/json'
					},            
				})
				.then(response => response.json())
				.then(data => {
					if (data) {
						const {Status, Result} = data;
						if (Status === 'ok') {
							if (Result.Completed) {
								window.clearInterval(id);
								resolve(Result);
							}                        
						}                        
					}
					else {
						window.clearInterval(id);
						reject();
					}
				})
				.catch(() => {
					window.clearInterval(id);
					reject();
				});
			}, 3000);        
		});        
    },
    createSandbox: async () => {
        return await fetch('/gis/sandbox/createSandbox', {
            credentials: 'include'
        }).then(async res => {
            const { sandbox } = await res.json();
            return sandbox;
        });
    },
    postData: async (url, fd, format = 'json') => {
        return new Promise(resolve => {
            fetch(url, {
                method: 'POST',
                credentials: 'include',
                body: fd
            })
            .then(response => format === 'json' ? response.json() : response.text())
            .then(data => resolve(data))
            .catch(e => resolve());            
        }); 
    },
    createLayer: async (sandboxId, title, url, myLayerFlag) => {
        const fd = new FormData();
        fd.append('SourceType', 'sandbox');
        fd.append('SandboxId', sandboxId);
		if(myLayerFlag) fd.append('MetaProperties', `{"myLayer":{"Type":"String","Value":"true"}`);
        fd.append('title', title || 'myLayer');
        const data = await Utils.postData(url, fd);
        return data || false;
    },
    uploadFiles: async (files, resolve, name, type, myLayerFlag) => {
		const sandbox = await Utils.createSandbox();
		const _upfiles = _createParts(files);
		let _upfilesStatus = '';
		function _percent(t) {
			return Math.round(t.parts.reduce((a, p) => a + (p.size / t.totalBytes) * (p.send / p.needSend), 0) * 100);
		}
		async function _finishUpload() {
			// console.log('_finishUpload', _upfilesStatus);
			if (_upfilesStatus === 'finish') return;
			if (_upfilesStatus === 'progress') {
				_upfilesStatus = 'finish';
				let out;
				let layerName = name;
				if (!layerName && _upfiles.length) {
					let fileName = _upfiles[0].name;
					let suf = fileName.lastIndexOf('.');
					layerName = fileName.substr(0, suf === -1 ? undefined : suf);
				}
				let url = 'gis/' + (type === 'vector' ? 'VectorLayer' : 'RasterLayer') + '/Insert.ashx';
				const {Result: {TaskID}} = await Utils.createLayer(sandbox, layerName, url, myLayerFlag);
				const {Result} = await Utils.poll(TaskID);
				if (Result) {
					const layerID = Result.properties.LayerID;
					out = await Utils.postData(`/gis/Layer/GetLayerJson.ashx?WrapStyle=None&srs=3857&LayerName=${layerID}`);
				}
				resolve(out);
			}
		}
		const _sendNextPart = () => {
			if (_upfilesStatus === 'error') {
				return false;
			}
			for (let i = 0; i < _upfiles.length; ++i) {
				let t = _upfiles[i];
				for (let j = 0; j < t.parts.length; ++j) {
					if (t.parts[j].status === 'none') {
						let startByte = _uploadFileSize * j;
						let countBytes = _uploadFileSize;
						if ((startByte + countBytes) > t.totalBytes) {
							countBytes = t.totalBytes - startByte;
						}
						if (t.status === 'none') t.status = 'progress';
						t.parts[j].status = 'progress';

						const chunk = t.item.slice(startByte, startByte + countBytes + 1);
						let chunkFile = new File([chunk], t.name, );
						let fd = new FormData();
						fd.append('sandbox', sandbox);
						fd.append('startByte', startByte);
						fd.append('file', chunkFile);
						let req = new XMLHttpRequest();
						req.open('post', 'gis/sandbox/upload');
						t.parts[j].xhr = req;

						req.upload.onerror = async () => {
							t.parts[j].status = 'error';
							t.parts[j].xhr = null;
							t.status = 'error';
							// await _errorUpload();
						}
						let lastSend = 0;
						req.upload.onprogress = e => {
							t.parts[j].send = e.loaded;
							t.parts[j].needSend = e.total;
							const p = _percent(t);
							// this._currentSendBytes += (e.loaded - lastSend);
							lastSend = e.loaded;
						}

						req.onload = async () => {
							t.parts[j].xhr = null;
							if (req.status !== 200) {
								t.parts[j].status = 'error';
								t.status = 'error';
								// this._progress.error(i);
								// await _errorUpload();
							} else {
								if (_upfilesStatus === 'error') {
									t.parts[j].status = 'error';
									t.status = 'error';
									// this._progress.error(i);
									// await _errorUpload();                            
								} else {
									t.parts[j].status = 'finish';                            
									let oksum = t.parts.reduce((a, { status }) => status === 'finish' ? a + 1 : a, 0);
									if (oksum === t.parts.length) {
										t.status = 'finish';
										const p = _percent(t);
										// this._progress.completed(i, p);
									}
									_sendNextPart(_upfiles);
									let sumFilesOk = _upfiles.reduce((a, { status }) => status === 'finish' ? a + 1 : a, 0);                            
									if (sumFilesOk === _upfiles.length) {
										await _finishUpload();
									}
								}                            
							}
						};
						req.send(fd);
						return true;
					}
				}
			}
			return false;
		};
		_upfilesStatus = 'progress';
		for (let i = 0; i < 8; i++) {
			_sendNextPart();
		}
    },
	uploadLayer: (opt) => {
        return new Promise(resolve => {
			Utils.getFile({type: opt.type, multiple: true}).then(files => {
				Utils.uploadFiles(files, resolve, opt.name, opt.type, opt.myLayerFlag);
			});
		});
	},
	formatDate: (date, reverse = true) => {
		if (reverse) {
			const [d, m, y] = date.split(' . ');
			return new Date(y, m-1, d, 12);
		}
		if (typeof date === 'string') return date;
		let day = date.getDate();
		let month = date.getMonth() + 1;
		const year = date.getFullYear();
		if (day < 10) { day = '0' + day; }
		if (month < 10) { month = '0' + month; }
		return [day, month, year].join(' . ');
	},
	getContour: (map) => {
        return new Promise(resolve => {
			Utils.uploadLayer({type: 'vector', name: 'contur', map: map}).then(data => {
				const arr = [];
				if (data) {
					let res = data.Result;
					let layerId = res.properties.LayerID;
					// let lb = map.options.maxBounds;
					// let sw = lb._southWest, ne = lb._northEast;
					// let coords = [[sw.lat, sw.lng], [sw.lat, ne.lng], [ne.lat, ne.lng], [ne.lat, sw.lng], [sw.lat, sw.lng]];
					// let border = L.gmxUtil.convertGeometry({type:'Polygon', coordinates:[coords]});
					// border.type = 'Polygon';
						// let tt = L.gmxUtil.convertGeometry(geoJSON.geometry)
					// let geo = data.Result.geometry;
					 
					// fetch(`/gis/VectorLayer/Search.ashx?WrapStyle=json&geometry=true&layer=${layerId}&border=${JSON.stringify(border)}'`)
					// fetch(`/gis/VectorLayer/Search.ashx?WrapStyle=None&pagesize=20&columns=[{"Value":"gmx_geometry"}]&geometry=true&layer=${layerId}&border=${JSON.stringify(border)}`)
					fetch(`/gis/VectorLayer/Search.ashx?WrapStyle=None&pagesize=50&columns=[{"Value":"gmx_geometry"}]&geometry=true&layer=${layerId}`)
						.then(res => res.json())
						.then(res => {
							if (res.Status === 'ok') {
								let geoJson;
								res.Result.values.forEach(it => {
									const geo = L.gmxUtil.convertGeometry(it[0], true);
									if (geo.type === 'MULTIPOLYGON') {
										geo.coordinates.forEach(coords => { arr.push(coords); });
									} else if (geo.type === 'POLYGON') {
										// const geo1 = L.gmxUtil.transformGeometry(geo, it => it.reverse());
										// arr.push(geo1.coordinates);
										arr.push(geo.coordinates);
									}
								});
								resolve(arr);
								/*
								return arr;
								if (arr.length) {
									// const opt = {pointStyle:{shape: 'circle'}, lineStyle:{color: '#ff0000'}};
									const opt = {pointStyle:{shape: 'circle'}};
									const poly = L.polygon(arr);
									const feature = map.gmxDrawing.add(poly, opt);
									// geoJSON = poly.toGeoJSON();
									geoJson = feature.toGeoJSON();
									// _getLocation();
									// values.geometry = geoJSON;
									// edit = true;

								// } else {
									// map._notification.view('Контур не обнаружен!', 'info', 5000);
									
								}
								return geoJson;
								*/
							}
						});
				} else {
					resolve(arr);
				}
			});
		});
    },
    fileToBase64: file => new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = () => resolve(reader.result.replace('data:', '').replace(/^.+,/, ''));
		reader.onerror = error => reject(error);
	}),
    saveDocument: (file, opt) => {
		return new Promise((resolve, reject) => {
			Utils.fileToBase64(file).then(data => {
				opt.FileData = data;
				fetch('/forest/SaveDocument', {
					method: 'POST',
					credentials: 'include',
					headers: { 'Content-Type': 'application/json' },            
					body: JSON.stringify(opt)
				  })
				.then(res => res.json())
				.then(json => resolve(json));
			});
		});
	},
	isError: (val, val1, rmb) => {
		if (rmb && rmb.np) {
			if (rmb.np.length === 1 && rmb.rumb !== 0) {
				return true;
			} else if (rmb.rumb < 0 || rmb.rumb >= 90) {
			// } else if (isNaN(val) || rmb.rumb < 0 || rmb.rumb >= 90) {
				return true;
			} else {
				val = rmb.rumb;
			}
		}
		return isNaN(val) || (val !== null && (val < 0 || val >= 360)) ? true : (val1 !== undefined && val1 <= 0 ? true : false);
	},
	drawItems: ({map, icon, dragend, editItem, latlng, snap, ring, ringStyle, snapStyle, editable, nmHole = 0, iconUrl = '/img/flag_blau1.png'} = par) => {
		const out = {};
		if (latlng) {
			icon = icon || L.icon({iconUrl, className: 'flag', iconSize: [48, 48], iconAnchor: [10, 42]});
			let marker = L.marker(latlng, {draggable: editable, interactive: true, title: 'Точка привязки', nmHole})
				.setIcon(icon)
				.on('preclick', ev => {
					ev.target.unbindPopup();
				}, map);
				// .on('click', ev => {
					// L.DomEvent.stop(ev);
				// })
				// .on('dragend remove', dragend, map);
			// marker.unbindPopup();
			out.drawingPoint = map.gmxDrawing.add(marker, {nmHole});
			if (!editable) {
				out.drawingPoint._obj.dragging.disable();
			} else {
				marker.on('dragend remove', dragend, map);
			}
		}
		if (ring) {
			ringStyle = ringStyle || {pointStyle:{shape: ''}, lineStyle: {color: 'green'}};
			// out.feature = map.gmxDrawing.add(L.polyline(ring), {pointStyle:{shape: ''}, snap: false, nmHole, lineStyle: {color: 'green'}} )
			out.feature = map.gmxDrawing.add(L.polyline(ring, editable ? {} : ringStyle.lineStyle), {...ringStyle, editable, nmHole, snap: false} )
			.on('editstop drawstop dragend rotateend', editItem);
		}
		if (snap) {
			snapStyle = snapStyle || {pointStyle:{shape: 'circle'}, lineStyle: {color: '#ff0000'}};
			out.snapFeature = map.gmxDrawing.add(L.polyline(snap, editable ? {} : snapStyle.lineStyle), {...snapStyle, editable, nmHole, snap: true} )
			.on('editstop drawstop dragend rotateend', editItem);
			// snapFeature.bringToFront();
		}
		return out;
	},
	closestSegment: (chkPoint, coords) => { // ближайший сегмент Merc
        var out = false,
			lastNm = coords.length - 1,
			minDistance = Infinity,
            p = L.point(chkPoint[0], chkPoint[1]),
            p1;

		coords.forEach((it, i) => {
			let p2 = L.point(it[0], it[1]);
			if (p1) {
				let sqDist = L.LineUtil._sqClosestPointOnSegment(p, p1, p2, true);
				if (sqDist < minDistance) {
					minDistance = sqDist;
					let nm = i === lastNm ? 0 : i + 1;
					let p3 = L.point(coords[nm][0], coords[nm][1]);
					let x = p3.x - p1.x, y = p3.y - p1.y;
					let mp = L.point(p3.x - x / 2, p3.y - y / 2);
					
					out = {nm: i - 1, p, p1, p2, p3, mp};
				}
			}
			p1 = p2;
		});
		return out;
	},
	isPointInPolygonArr: (chkPoint, coords) => { // Проверка точки на принадлежность полигону в виде массива
        var isIn = false,
            x = chkPoint[0],
            y = chkPoint[1],
            vectorSize = 1,
            p1 = coords[0];

        if (typeof coords[0] === 'number') {
            vectorSize = 2;
            p1 = [coords[0], coords[1]];
        }

        for (var i = vectorSize, len = coords.length; i < len; i += vectorSize) {
            var p2 = vectorSize === 1 ? coords[i] : [coords[i], coords[i + 1]],
                xmin = Math.min(p1[0], p2[0]),
                xmax = Math.max(p1[0], p2[0]),
                ymax = Math.max(p1[1], p2[1]);
            if (x > xmin && x <= xmax && y <= ymax && p1[0] !== p2[0]) {
                var xinters = (x - p1[0]) * (p2[1] - p1[1]) / (p2[0] - p1[0]) + p1[1];
                if (p1[1] === p2[1] || y <= xinters) { isIn = !isIn; }
            }
            p1 = p2;
        }
        return isIn;
    },
	isHoleIntersect: ({shift, vnArr, hArr, lArr} = attr) => {
		let center = L.gmxUtil.bounds(vnArr).getCenter();
		for (let i = 0, len = hArr.length; i < len; i++) {
			let hp = hArr[i];
			let isIn = Utils.isPointInPolygonArr(hp, vnArr);
			if (!isIn) {
				let p = L.point(hp[0], hp[1]);
				let seg = Utils.closestSegment(hp, vnArr);
				let cp = L.LineUtil.closestPointOnSegment(seg.p, seg.p1, seg.p2);
				let np;
				if (seg.p.equals(seg.p2)) {
					let ratio = shift / cp.distanceTo(seg.mp);
					np = L.point(
						(cp.x * (1 - ratio)) + (ratio * seg.mp.x),
						(cp.y * (1 - ratio)) + (ratio * seg.mp.y)
					);
					let isIn1 = Utils.isPointInPolygonArr([np.x, np.y], vnArr);
					if (!isIn1) {
						let x = seg.mp.x - cp.x, y = seg.mp.y - cp.y;
						let mp = L.point(cp.x - x / 2, cp.y - y / 2);
						np = L.point(
							(cp.x * (1 - ratio)) + (ratio * mp.x),
							(cp.y * (1 - ratio)) + (ratio * mp.y)
						);
					}
				} else {
					let dp = L.point(
						shift * (p.x > center[0] ? -1 : 1),
						shift * (p.y > center[1] ? -1 : 1)
					);
					np = L.point(cp.x, cp.y)._add(dp);
					let isIn1 = Utils.isPointInPolygonArr([np.x, np.y], vnArr);
					if (!isIn1) np = L.point(cp.x, cp.y)._subtract(dp);
				}
				lArr[i] = L.CRS.EPSG3857.unproject(np);
			}
		}
		return lArr;
	},

	latlngsFromDrawObj: (obj) => {
		return obj.rings[0] ? obj.rings[0].ring.points._latlngs[0] : obj._obj._latlngs;
	},

	latlngsToPolygon: (arr) => {
		return {
			coordinates: arr.map(it => {
				return it.map(it1 => [it1.lng, it1.lat]);
			}),
			type: 'Polygon'
		};
	},

	latlngsToLineString: (arr) => {
		return { type: 'LineString', coordinates: arr.map(it => [it.lng, it.lat])};
	},

	latlngsToGeoJSON: (arr) => {
		return {
			geometry: {
				coordinates: arr.map(it => {
					return it.map(it1 => [it1.lng, it1.lat]);
				}),
				type: 'Polygon'
			}
		};
	}
};

export default Utils;
