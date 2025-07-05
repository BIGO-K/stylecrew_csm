'use strict';

/**
 * 범용 UI/모듈
 * mm 오브젝트에 구성되어 있습니다.
**/

//< mm선언
var __mm__ = {
	// 내부사용
	__: {
		_isTouch: false,// ? :boolean - 화면 터치
		_publishMainUrl: 'main.html',// ? :string - 퍼블 메인
		_realMainUrl: 'main',// ? :string - 개발 메인
	},
};

Object.defineProperty(window, 'mm', {
	get: function () {

		return __mm__;

	},
});
//> mm선언

//< 문자열 변환
mm.string = (function () {

	// public
	return {
		//- 템플릿 문자열
		template: function (__template, __replace) {

			// ? __template:string - 한 줄 문자열
			// ? __template:array - 여러 줄 문자열
			// ? __replace:object - 교체 할 내용
			// template은 기본적으로 string 타입으로 사용
			// \n 줄바꿈이 필요할 때 template을 array 타입으로 하고 내용을 string으로 넣음
			// 백틱 템플릿 리터럴처럼 ${VAR}로 구분하여 문자열을 변환(줄바꿈 제외)
			// 백틱 템플릿 리터럴에서 가능한 ${a + b} 계산식은 __raplaces.var에 적용
			// 'A/B/C/D/E'와 같은 반복 구문은 ,,,을 넣어 ${,,,VAR(/)}처럼 사용하고, 문자 사이 구분자는 VAR 뒤에 (문자열)로 붙여 넣은 후, __replace.VAR 값을 배열로 적용
			// mm.string.template('div[${A}] .${B}', { A: 'class=box', B: 'inner' }); > 'div[class=box] .inner'로 변환
			// mm.string.template('abc ${A} and ${B}', { A: 'de' + 1, B: 2 * 3 + 4 }); > 'abc de1 and 10'으로 변환
			// mm.string.template('abc ${,,,A(/)} def', { A: [1, 2, 3, 4] }); > abc 1/2/3/4 def로 변환
			// mm.string.template(['abc ${A}', 'def ${B}', 'gh'], { A: 1, B: 2 }); > abc 1(줄바꿈\n)def 2(줄바꿈\n)gh

			var _result = '';
			var strings = (Array.isArray(__template)) ? __template : [__template];

			_.forEach(strings, function (__string, __index) {

				if (__index > 0) _result += '\n';// 줄바꿈

				var splits = __string.split('${');
				_.forEach(splits, function (__item, __i) {

					var _lastIndex = (__i === 0) ? -1 : __item.indexOf('}');// 1번째 항목은 제외
					// ,,,배열타입
					if (_lastIndex > -1 && __item.startsWith(',,,')) {
						var _delimiterIndex = __item.indexOf('(');
						var _delimiter = __item.slice(_delimiterIndex + 1, __item.lastIndexOf(')'));
						var words = __replace[__item.slice(3, _delimiterIndex)];

						_.forEach(words, function (__val, __i) {

							_result += (__i === 0) ? __val : _delimiter + __val;
							if (__i === words.length - 1) _result += __item.slice(_lastIndex + 1);

						});
					}
					// 문자열
					else _result += (_lastIndex > -1) ? __replace[__item.slice(0, _lastIndex)] + __item.slice(_lastIndex + 1) : __item;

				});

			});

			return _result;

		},
		//- 문자열 연결
		join: function (__string1, __string2, __strings) {

			// ? __string:string
			// arguments 모든 문자열을 연결

			return mm.object.values(arguments).join('');

		},
		//- escape RegExp
		escape: function (__string) {

			// ? __string:string

			return __string.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

		},
		//- constructor name
		constructor: function (__value) {

			// ? __value:any
			// * ie 대응으로 constructor.name 값 변환

			return (typeof(__value) === 'function' && __value.name) ? __value.name : __value.constructor.toString().trim().replace(/^\S+\s+(\w+)[\S\s]+$/, '$1');

		},
	};

})();
//> 문자열 변환

//< 셀렉터 문자열 변환
mm.selector = function (__selector, __type) {

	// ? __selector:string
	// ? __selector:array - 다중 셀렉터(,로 나뉨)
	// ? __type:string - .(클래스), #(아이디), [](속성)
	// __type 값이 없으면 셀렉터만 묶어서 리턴

	var _selector = (typeof(__selector) === 'string') ? [__selector] : __selector;
	var _type = (typeof(__type) === 'string') ? __type : '';
	if (Array.isArray(_selector)) {
		switch (_type) {
			case '.':
				return mm.string.template('.${,,,LIST(, .)}', { LIST: _selector });
				// break;
			case '#':
				return mm.string.template('#${,,,LIST(, #)}', { LIST: _selector });
				// break;
			case '[]':
				return mm.string.template('[${,,,LIST(], [)}]', { LIST: _selector });
				// break;
			default:
				return mm.string.template(mm.string.template('${TYPE}${WORD}LIST(, ${TYPE})}', { TYPE: _type, WORD: '${,,,' }), { LIST: _selector });
		}
	}
	else return null;

}
//> 셀렉터 문자열 변환

//< 숫자 변환
mm.number = (function () {

	// public
	return {
		//- 3자리 콤마 표시
		comma: function (__value) {

			// ? __value:number/string

			if (Number.isFinite(__value)) return __value.toLocaleString();// toLocaleString이 속도가 빠름
			else return __value.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');

		},
		//- 단위 추가
		unit: function (__number, __unit) {

			// ? __number:number
			// ? __unit:string - 단위(기본 값 px)

			return mm.string.join(__number, __unit || 'px');

		},
	};

})();
//> 숫자 변환

//< 쿼리스트링 변환
mm.query = (function () {

	// location.search에 활용
	// Array 지원, Object 지원 안함

	// public
	return {
		//- 문자열을 object로 변환
		parse: function (__string) {

			// ? __string:string - aa=1&bb=2&cc[]=3&cc[]=4 형식의 문자열

			if (typeof(__string) !== 'string' || !__string.includes('=')) return {};

			var _queryString = (__string.charAt(0) === '?') ? __string.slice(1) : __string;
			var queries = _queryString.split('&');
			var splits = _.partition(queries, function (__value) {

				return __value.includes('[');

			});

			var datas = _.chain(splits[1])
			.map(function (__value) {

				if (__value) return __value.split('=');

			})
			.fromPairs()
			.value();

			// 이름에 []이 있을 경우 배열로 변경
			_.forEach(splits[0], function (__value) {

				var _index = __value.indexOf('[');
				var _key = __value.slice(0, _index);
				var _value = __value.split('=')[1];

				if (Array.isArray(datas[_key])) datas[_key].push(_value);
				else datas[_key] = [_value];

			});

			// 값 디코드
			_.forEach(datas, function (__value, __key) {

				if (typeof(__value) === 'string') datas[__key] = decodeURIComponent(__value);

			});

			return datas;

		},
		//- object를 문자열로 변환
		stringify: function (__object, __isUrlSearch) {

			// ? __object:object
			// ? __isUrlSearch:boolean - location.search처럼 결과 값 앞에 ?를 추가

			if (!mm.is.object(__object)) return '';

			var _str = (__isUrlSearch === true) ? '?' : '';
			_.forEach(__object, function (__value, __key) {

				// ~ Object 타입 지원
				if (Array.isArray(__value)) {
					_.forEach(__value, function (__val) {

						_str += mm.string.template('&${KEY}[]=${VALUE}', { KEY: __key, VALUE: __val });

					});
				}
				else _str += mm.string.template('&${KEY}=${VALUE}', { KEY: __key, VALUE: encodeURIComponent(__value) });

			});

			return _str.replace('&', '');

		}
	};

})();
//> 쿼리스트링 변환

//< 컬러 변환
mm.color = (function () {

	// public
	return {
		//- rgb/rgba 컬러를 hex로 변환
		hex: function (__value) {

			// __value:string - rgb/rgba 등 hex로 바꿀 값

			if (typeof(__value) !== 'string') return;

			if (__value.startsWith('rgb')) {
				var values = _.compact(__value.split(/rgb\(|rgba\(|\,|\)/g));
				var _value = '#';

				_.forEach(values, function (__val, __index) {

					var _number = (__index < 3) ? parseFloat(__val) : Math.round(parseFloat(__val) * 255);
					var _hex = _number.toString(16);
					_value += _hex.padStart(2, '0');

				});

				return _value;
			}
			else return __value;

		},
		/*
		//- hex 컬러를 rgb로 변환
		rgb: function (__value) {

			// __value:string - hex 등 rgb로 바꿀 값

			if (typeof(__value) !== 'string') return;

		},
		hsl: function (__value) {

			//

		},
		*/
	};

})();
//> 컬러 변환

//< 오브젝트 변환
mm.object = (function () {

	// public
	return {
		//- 오브젝트 키만 배열로 리턴(ie 대응)
		keys: function (__value) {

			if (typeof(__value) === 'object') {
				var keys = Object.keys(__value);
				if (mm.is.ie()) keys = _.reject(keys, function (__key) { return __key === 'forEach' });
				return keys;
			}
			else return [__value];
		},
		//- 오브젝트 값만 배열로 리턴(ie 대응)
		values: function (__value) {

			if (typeof(__value) === 'object') {
				if (Array.isArray(__value)) return __value;
				else {
					var values = Object.values(__value);
					if (mm.is.ie()) values = _.reject(values, function (__val) { return typeof(__val) === 'function' && __val.name === 'forEach' });
					return values;
				}
			}
			else return [__value];
		},
	};

})();
//> 오브젝트 변환

//< 오브젝트 깊은 복제/병합
mm.extend = function (__origins, __extends) {

	// ? __origins:object(array) - 복제할 원본
	// ? __extends:object(array) - 복제한 원본에 병합할 대상

	// UI 고유 객체
	var base = {
		// __keys 값이 있으면 병합, 없으면 origins 복제
		clone: function (__objs, __keys) {

			if (!__objs || !['Object', 'Array'].includes(mm.string.constructor(__objs))) return __objs;

			var exts = (__keys) ? __keys : __objs.constructor();
			for (var _key in __objs) {
				if (__objs.hasOwnProperty(_key)) exts[_key] = base.clone(__objs[_key], exts[_key]);
			}

			return exts;

		},
	};

	var clones = base.clone(__origins);

	if (!clones || typeof(clones) !== 'object' || !__extends || typeof(__extends) !== 'object') return clones;
	else return base.clone(__extends, clones);

}
//> 오브젝트 깊은 복제/병합

//< 확인(true/false)
mm.is = (function () {

	// UI 고유 객체
	var base = {
		// 모바일확인
		isMobile: function (__type) {

			var type = {
				iphone: 'iphone',
				ipad: 'ipad',
				ipod: 'ipod',
				get ios() {
					return mm.string.template('${,,,IOS(|)}', { IOS: [this.iphone, this.ipad, this.ipod] });
				},
				android: 'android',
				blackberry: 'blackberry|bb10|playbook',
				window: 'iemobile|windows phone|windows mobile',
				opera: 'opera mini',
				// 앱에 userAgent 코드 추가 필요
				app_ios: 'app_ios',
				app_android: 'app_android',
				get app() {
					return mm.string.template('${,,,APP(|)}', { APP: [this.app_ios, this.app_android] });
				},
				app_kitkat: 'android 4.4',
				app_first: 'app_first',// 앱 최초실행
			}
			var _type = (!__type) ? mm.string.template('${,,,ALL(|)}|webos|bada|zunewp7|nokia', { ALL: [type.ios, type.android, type.blackberry, type.window, type.opera] }) : type[__type] || String(__type);

			return new RegExp(_type, 'i').test(navigator.userAgent);

		},
		// 익스, 엣지 확인
		isIE: function (__type) {

			var type = {
				ie6: 'msie 6',
				ie7: 'msie 7',
				ie8: 'msie 8',
				ie9: 'msie 9',
				ie10: 'msie 10',
				ie11: 'rv:11',
				get ie() {
					return mm.string.template('msie|${IE}', { IE: this.ie11 });
				},
				get ie9over() {
					return mm.string.template('${,,,IE(|)}', { IE: [this.ie9, this.ie10, this.ie11, this.edge] });
				},
				get ie10over() {
					return mm.string.template('${,,,IE(|)}', { IE: [this.ie10, this.ie11, this.edge] });
				},
				edge: 'edge',// 구 엣지(현재 크로미움 버전은 edg로 적용)
			}
			var _type = (!__type) ? mm.string.template('${,,,ALL(|)}', { ALL: [type.ie, type.edge] }) : type[__type] || String(__type);

			return new RegExp(_type, 'i').test(navigator.userAgent);

		},
	};

	// private
	(function () {

		var classes = [];

		// 모바일
		if (base.isMobile()) {
			classes.push('__mobile');

			if (base.isMobile('ios')) classes.push('__ios');
			if (base.isMobile('app')) {
				classes.push('__app');// 앱으로 접속 (앱에 userAgent 코드 추가 필요)

				if (base.isMobile('app_kitkat')) classes.push('__kitkat');// 안드로이드 4.4.x 킷캣버전
			}
		}
		// pc
		else {
			classes.push('__pc');

			// IE
			if (base.isIE()) {
				if (base.isIE('ie6')) classes.push('__ie6');
				else if (base.isIE('ie7')) classes.push('__ie7');
				else if (base.isIE('ie8')) classes.push('__ie8');
				else if (base.isIE('ie9')) classes.push('__ie9');
				else if (base.isIE('ie10')) classes.push('__ie10');
				else if (base.isIE('ie11')) classes.push('__ie11');
				else if (base.isIE('edge')) classes.push('__edge');
			}

			// whale
			if (/whale/i.test(navigator.userAgent)) classes.push('__whale');
		}

		_.forEach(classes, function (__class) {

			document.documentElement.classList.add(__class);

		});

	})();

	// public
	return {
		//- 모바일
		mobile: base.isMobile,
		//- 익스, 엣지
		ie: base.isIE,
		//- 홀수
		odd: function (__number) {

			// ? __number:number

			var _number = parseFloat(__number);
			if (Number.isFinite(_number)) return (_number & 1) ? true : false;
			else return false;

		},
		//- 짝수
		even: function (__number) {

			// ? __number:number

			var _number = parseFloat(__number);
			if (Number.isFinite(_number)) return (_number & 1) ? false : true;
			else return false;

		},
		//- 빈 값
		empty: function (__value, __excepts) {

			// ? __value:any
			// ? __excepts:array - 예외어를 설정하면 결과가 반대로 적용
			// 0도 값이 있는 것으로 반영

			var _is = false;

			if (['undefined', 'null', 'NaN', 'Infinity'].includes(String(__value))) {
				_is = true;
			}
			else {
				switch (mm.string.constructor(__value)) {
					case 'String':
						if (__value.trim().length === 0) _is = true;
						break;
					case 'Function':
					case 'Window':
						_is = false;
						break;
					case 'Object':
						if (mm.object.keys(__value).length === 0) _is = true;
						break;
					default:
						if (__value.length === 0) _is = true;// HTMLCollection, NodeList, Array, jQuery Selector
				}
			}

			// 예외
			if (Array.isArray(__excepts) && __excepts.includes(__value)) _is = !_is;

			return _is;

		},
		//- 순수 오브젝트 {}
		object: function (__value) {

			// ? __value:any

			return __value && mm.string.constructor(__value) === 'Object';

		},
		//- 순수 단일 엘리먼트 (jquery 제외)
		element: function (__value, __isExceptWindow) {

			// ? __value:any
			// ? __isExceptWindow:boolean - window 객체 제외

			if (!__value) return false;

			var _is = /(?=.*^HTML)(?=.*Element$)|HTMLDocument|Window/.test(mm.string.constructor(__value));
			if (__isExceptWindow === true && __value.window) _is = false;

			return _is;

		},
		//- html 레이아웃
		layout: function (__type) {

			// ? __type:string

			return document.documentElement.classList.contains(mm.string.template('__layout_${TYPE}__', { TYPE: __type }));

		},
		//- 화면 노출(display:none, append 전)
		display: function (__elements) {

			// ? __elements:element

			var $elements = mm.find(__elements);
			if ($elements.length === 0) return false;

			return _.every($elements, function (__$el) {

				return __$el.offsetParent || __$el.offsetWidth;// mm.element.style(__$el, 'display') === 'none';

			});

		},
		//- visibility
		visible: function (__elements) {

			// ? __elements:element

			var $elements = mm.find(__elements);
			if ($elements.length === 0) return false;

			return _.every($elements, function (__$el) {

				return mm.element.style(__$el, 'visibility') === 'visible';

			});

		},
		//- 포커스
		focus: function (__element) {

			// ? __elements:element - 단일 요소

			var $element = mm.find(__element)[0];
			return document.activeElement === $element;

		},
	};

})();
//> 확인

//< 변수
mm._isPublish = location.host.startsWith('publish') || location.host.startsWith('127.0.0.1');// 퍼블 테스트
mm._isModal = mm.is.layout('modal');// 모달
mm._isPopup = mm.is.layout('popup');// 팝업
mm._isFrame = mm.is.layout('frame');// 컨텐츠 아이프레임(스크롤 없음, 높이 자동)
mm._isError = mm.is.layout('error');// 에러
// mm._isPrint = mm.is.layout('print');// 프린트
mm._isReview = mm.is.layout('review');// 리뷰

Object.defineProperties(mm, {
	//- 화면 터치
	_isTouch: {
		get: function () {

			return top.mm.__._isTouch;

		},
		set: function (__boolean) {

			top.mm.__._isTouch = __boolean;

		},
	},
	//- 메인페이지 경로
	_mainUrl: {
		get: function () {

			if (mm._isPublish) {
				var paths = location.pathname.split('/');
				paths.splice(-1);
				return mm.string.template('${PATH}/${PAGE}', { PATH: paths.join('/'), PAGE: mm.__._publishMainUrl });
			}
			else return mm.string.template('/${PATH}', { PATH: mm.__._realMainUrl });

		},
	},
});
//> 변수

//< 시간(초, css transition)
mm.time = (function () {

	// UI 고유 객체
	var base = {
		_faster: 0.1,
		_fast: 0.2,
		_base: 0.4,
		_slow: 0.7,
		_slower: 1,
		stamp: {},// 시간 간격
	};

	// public
	return {
		get _faster() {

			return base._faster;

		},
		get _fast() {

			return base._fast;

		},
		get _base() {

			return base._base;

		},
		get _slow() {

			return base._slow;

		},
		get _slower() {

			return base._slower;

		},
		// 시간 간격 저장(가져오기)
		stamp: function (__key) {

			// ? __key:string

			if (!__key) return 0;

			if (!base.stamp[__key]) {
				base.stamp[__key] = [window.performance.now()];

				return 0;
			}
			else {
				var stamps = base.stamp[__key];
				stamps.push(window.performance.now());

				return stamps[stamps.length - 1] - stamps[stamps.length - 2];
			}

		},
		// 시간 간격 종료(가져오기)
		stampEnd: function (__key) {

			// ? __key:string

			if (!__key || !base.stamp[__key]) return 0;

			var stamps = base.stamp[__key];
			var _timeGap = window.performance.now() - stamps[stamps.length - 1];

			delete base.stamp[__key];

			return _timeGap;

		},
	};

})();
//> 시간

//< 지연함수(setTimeout 1ms)
mm.delay = (function () {

	// UI 고유 객체
	var base = {
		delays: [],// 실행 중인 딜레이 목록
		_count: 0,// ? :number - _name이 없을 때 이름 중복을 피하기 위해 사용
		// 실행 중지
		off: function (__name) {

			// ? __name:string - 딜레이 이름

			var temp = { _name: __name };

			var _i = 0;
			while (_i < base.delays.length) {
				var delayItem = base.delays[_i];
				if (_.isMatch(delayItem, temp)) {
					clearTimeout(delayItem.timeout);
					base.delays.splice(_i, 1);
				}
				else _i++;
			}

		},
	};

	// public
	return {
		on: function (__callback, __option) {

			// ? __callback:function
			// * option._name 값이 있으면 setTimeout과 다르게 중복으로 적용 안됨
			// * option._name 값이 있을 때 _isOverwrite 값이 true 이면 이전 delay를 멈추고 새로 실행

			var option = mm.extend({
				_time: 1,// ? :number - 딜레이 시간(ms)
				_isSec: false,// ? :boolean - 딜레이 시간 단위를 sec(초)로 적용
				_name: null,// ? :string - on/off 컨트을 위한 이름
				_isOverwrite: false,// ? :boolean - 중복 적용될 때 덮어쓰기(_name과 같이 사용)
				thisEl: null,// ? :element - 콜백 this 요소
				params: [],// ? :array - 콜백 파라미터
			}, __option);
			var _time = (option._isSec) ? option._time * 1000 : option._time;
			var _name = (typeof(option._name) === 'string') ? option._name : mm.string.template('DELAY_${COUNT}', { COUNT: base._count++ });
			var temp = { _name: _name };
			var _is = false;

			var _i = 0;
			while (_i < base.delays.length) {
				var delayItem = base.delays[_i];
				// 중복
				if (_.isMatch(delayItem, temp)) {
					// 덮어쓰기 위해 삭제
					if (option._isOverwrite === true) {
						clearTimeout(delayItem.timeout);
						base.delays.splice(_i, 1);
					}
					// 제외
					else {
						_is = true;
						break;
					}
				}
				else _i++;
			}

			if (_is === true) return;

			base.delays.push({ _name: _name, timeout: setTimeout(function () {

					base.off(_name);
					mm.apply(__callback, option.thisEl, option.params);

				}, _time),
			});

		},
		off: function (__name) {

			// ? __name:string - 딜레이 이름
			if (typeof(__name) !== 'string') return;

			base.off(__name);

		},
	};

})();
//> 지연함수(setTimeout 1ms)

//< DOM 요소 검색
mm.find = function (__elements, __parents) {

	// ? __elements:element - 검색할 요소(HTMLCollection, NodeList, HTML...Element, CSS selector, jQuery Selector) 또는 셀렉터
	// ? __parents:element - 검색을 위한 부모 요소(HTMLCollection, NodeList, HTML...Element)

	var elements = [];
	if (!__elements || (arguments.length === 2 && !__parents)) return elements;

	function findString(__$parent) {

		var $parent = (__$parent.window) ? __$parent.document : __$parent;
		var _trim = __elements.trim();

		switch (_trim) {
			case 'html':
				return [$parent.documentElement];
				// break;
			case 'body':
				return [$parent.body];
				// break;
			default:
				if (_trim.startsWith('data-')) return $parent.querySelectorAll(mm.selector(_trim, '[]'));// data attribute
				else {
					var splits = _trim.split(/\#|\.|\s|\[|\]/g);
					var splitTotal = (/\:|\,/.test(_trim)) ? 0 : splits.length;// querySelector 강제 적용

					if (splitTotal === 1) return $parent.getElementsByTagName(_trim);
					else if (splitTotal === 2 && splits[0] === '') {
						if (_trim.charAt(0) === '.') return $parent.getElementsByClassName(splits[1]);
						else if (_trim.charAt(0) === '#') {
							var $id = (mm.string.constructor($parent) === 'HTMLDocument') ? $parent.getElementById(splits[1]) : $parent.querySelector(_trim);
							return ($id) ? [$id] : [];
						}
					}
					else {
						// :scope(> + ~ 셀렉터 대응)
						if (mm.string.constructor($parent) === 'HTMLDocument') $parent = document.documentElement;
						return $parent.querySelectorAll(mm.string.template(':scope ${SELECTOR}', { SELECTOR: _trim.replace(/\,/g, ', :scope ') }));
					}
				}
		}

	}

	if (typeof(__elements) === 'string') {
		if (__parents) {
			if (typeof(__parents) !== 'object') return elements;

			// 복수 요소
			if (['HTMLCollection', 'NodeList'].includes(mm.string.constructor(__parents)) || Array.isArray(__parents)) {
				elements = _.chain(__parents).map(function (__$parent) {

					return (typeof(__$parent) === 'string') ? [] : mm.object.values(findString(__$parent.contentDocument || __$parent));

				}).flatten().uniq().value();
			}
			// 단일 요소
			else elements = findString(__parents.contentDocument || __parents);
		}
		else elements = findString(document);
	}
	else {
		switch (mm.string.constructor(__elements)) {
			case 'HTMLCollection':
			case 'NodeList':
				elements = __elements;
				break;
			default:
				if (mm.is.element(__elements)) elements = [__elements];
				else if (__elements.jquery || Array.isArray(__elements)) elements = _.filter(__elements, function (__$el) { return mm.is.element(__$el); });// 숨겨진 요소 제외
		}

		if (__parents) {
			var $parents = (mm.is.element(__parents)) ? [__parents] : __parents;
			elements = _.filter(elements, function (__$el) {

				return _.some($parents, function (__$parent) { return __$parent !== __$el && __$parent.contains(__$el); });

			});
		}
	}

	return (elements.length === 0) ? [] : elements;

}
//> DOM 요소 검색

//< DOM 형제 요소 검색
mm.siblings = function (__elements, __siblings) {

	// ? __elements:element - 검색을 위한 대상 요소(HTMLCollection, NodeList, HTML...Element)
	// ? __siblings:string - 검색할 요소 셀렉터
	// __siblings 값이 없으면 요소의 형제 요소 전체를 리턴

	var elements = [];
	if (!__elements || typeof(__elements) === 'string') return elements;

	var $elements = (['HTMLCollection', 'NodeList'].includes(mm.string.constructor(__elements)) || Array.isArray(__elements)) ? __elements : [__elements];

	elements = _.chain($elements).map(function (__$el) {

		if (typeof(__$el) === 'string' || !__$el.parentElement) return [];
		else {
			return _.filter(__$el.parentElement.children, function (__$child) {

				if (__siblings) {
					try {
						return __$child !== __$el && __$child.matches(__siblings);
					}
					catch (__error) {
						return false;
					}
				}
				else return __$child !== __$el;

			});
		}

	}).flatten().uniq().value();

	return (elements.length === 0) ? [] : elements;

}
//> DOM 형제 요소 검색

//< 상위 요소 검색
mm.closest = function (__elements, __closest) {

	// ? __elements:element - 검색을 위한 대상 요소(HTMLCollection, NodeList, HTML...Element)
	// ? __closest:string - 검색할 요소 셀렉터

	var elements = [];
	if (!__elements || typeof(__elements) === 'string' || typeof(__closest) !== 'string') return elements;

	var $elements = (['HTMLCollection', 'NodeList'].includes(mm.string.constructor(__elements)) || Array.isArray(__elements)) ? __elements : [__elements];

	elements = _.chain($elements).map(function (__$el) {

		if (typeof(__$el) === 'string' || !mm.is.element(__$el)) return [];
		else return __$el.closest(__closest);

	}).flatten().uniq().value();

	return (elements.length === 0) ? [] : elements;

}
//> 상위 요소 검색

//< 콜백함수 실행
mm.apply = function (__callback, __thisEl, __params) {

	// ? __callback:function
	// ? __thisEl:element - 콜백 내부 this 요소
	// ? __params:array - 콜백 파라미터
	// __callback 값이 없으면 window 적용

	var $this = __thisEl || window;
	var applyWindow = (__thisEl === top) ? top : ($this.window) ? $this.window : ($this.ownerDocument) ? $this.ownerDocument.defaultView : window;

	// 함수
	if (typeof(__callback) === 'function') {
		if (applyWindow.__callback) return applyWindow.__callback.apply($this, __params);
		else return __callback.apply($this, __params);
	}
	// 문자열 함수
	else if (typeof(__callback) === 'string') {
		var callback = applyWindow;
		var splits = __callback.split('.');

		_.forEach(splits, function (__value) {

			if (callback !== undefined && __value) callback = callback[__value];

		});

		if (typeof(callback) === 'function') return callback.apply($this, __params);
		else return callback;
	}
	// 함수가 아닐 때
	else return __callback;

}
//> 콜백함수 실행

//< 이벤트
mm.event = (function () {

	// UI 고유 객체
	var base = {
		events: [],// ? :array - 연결된 이벤트 목록
		types: [],// ? :array - 커스텀 이벤트 타입 목록
		// 이벤트 해제
		off: function (__$element, __type, __callback) {

			// ? __$element:element - 단일 요소
			// ? __type:string - 이벤트 단일 타입
			// ? __callback:function
			// ? __callback:string - 타입이 string이면 function.name 값으로 비교

			var temp = { $el: __$element, _type: __type };
			if (typeof(__callback) === 'function') temp.callback = __callback;

			var _i = 0;
			while (_i < base.events.length) {
				var eventItem = base.events[_i];
				if (_.isMatch(eventItem, temp)) {
					if (typeof(__callback) !== 'string' || (typeof(__callback) === 'string' && __callback === eventItem.callback.name)) {
						eventItem.$el.removeEventListener(eventItem._type, eventItem.handler);
						base.events.splice(_i, 1);
					}
					else _i++;
				}
				else _i++;
			}

		},
	};

	// public
	return {
		//- 연결
		on: function (__elements, __types, __callback, __option) {

			// ? __elements:element
			// ? __types:string - 이벤트 타입으로 띄어쓰기로 여러 타입 연결 가능
			// ? __callback:function

			var $elements = mm.find(__elements);
			if ($elements.length === 0 || !__types || !__callback) return;

			var option = mm.extend({
				data: {},// ? :object - __callback의 2번째 아규먼트(object)로 전달
				_isOnce: false,// ? :boolean - 이벤트를 한 번만 실행
				_isCapture: false,// ? :boolean - 버블링 방향 반대
				_isPassive: null,// ? :boolean - 스크롤 성능을 위해 true일 때, preventDefault 사용 불가(기본 값은 false 이지만 touch와 wheel 이벤트일 때 true로 기본 값이 적용)
				_isOverwrite: false,// ? :boolean - 중복 적용될 때 덮어쓰기(__callback.name 필요, function () 방식 안됨)
			}, __option);
			var types = __types.split(' ');

			if (option._isOverwrite === true) mm.apply(mm.event.off, this, [__elements, __types, (__callback.name && __callback.name.trim().length > 0) ? __callback.name : __callback]);// 중복 삭제

			_.forEach($elements, function (__$el) {

				_.forEach(types, function (__type) {

					function eventHandler(__e) {

						if (__e.detail === -100) return;

						mm.apply(__callback, __$el, [__e, option.data]);
						if (option._isOnce) base.off(__$el, __type, __callback);// 한 번만 실행

					}

					var eventOption = (mm.is.ie() || typeof(option._isPassive) !== 'boolean') ? option._isCapture : { capture: option._isCapture, passive: option._isPassive };// ie가 아닐 때 eventOption으로 isOnce 적용?
					__$el.addEventListener(__type, eventHandler, eventOption);
					base.events.push({ $el: __$el, _type: __type, callback: __callback, handler: eventHandler });

				});

			});

		},
		//- 해제
		off: function (__elements, __types, __callback) {

			// ? __elements:element
			// ? __types:string - 이벤트 타입으로 띄어쓰기로 여러 타입 연결 가능
			// ? __callback:function
			// ? __callback:string - 타입이 string이면 function.name 값으로 비교
			// __callback 값이 없으면 __element + __types에 연결된 전체 이벤트 해제

			var $elements = mm.find(__elements);
			if ($elements.length === 0 || !__types) return;

			var types = __types.split(' ');

			_.forEach($elements, function (__$el) {

				_.forEach(types, function (__type) {

					base.off(__$el, __type, __callback);

				});

			});

		},
		//- 실행
		dispatch: function (__elements, __types, __option) {

			// ? __elements:element
			// ? __types:string - 이벤트 타입으로 띄어쓰기로 여러 타입 연결 가능

			var $elements = mm.find(__elements);
			if ($elements.length === 0 || !__types) return;

			var option = mm.extend({
				data: {},// ? :object - __callback의 1번째 아규먼트(event).detail로 전달
			}, __option);
			var types = __types.split(' ');

			_.forEach($elements, function (__$el) {

				_.forEach(types, function (__type) {

					// 기본 이벤트(UIEvent, MouseEvent, KeyboardEvent 등)는 event.detail로 사용자 지정 값을 전달할 수 없어 이중 적용 필요
					// mm.event.on에서 중복 적용을 방지하기 위해 event.detail 값이 -100이면 콜백을 실행하지 않도록 적용
					if (__type === 'click') __$el.dispatchEvent(new MouseEvent(__type, { detail: -100 }));

					__$el.dispatchEvent(new CustomEvent(__type, { detail: option.data, bubbles: true }));

				});

			});

		},
		//- 확인
		get: function (__element) {

			// ? __element:element - 단일 요소
			// __element 값이 없으면 mm.event에 연결된 전체 이벤트 리턴

			if (!__element) return base.events;

			var $element = mm.find(__element)[0];
			var returns = mm.extend(_.filter(base.events, { $el: $element }));

			return (returns.length === 0) ? [] : returns;

		},
		//- 커스텀 타입
		type: {
			set: function (__type) {

				// ? __type:string - 단일 타입
				// 공통된 관리 및 중복 방지를 위한 커스텀 이벤트 타입
				// mm.event.type.{__type} 으로 사용(MM_EVENT_{__TYPE} 형식으로 값 저장)

				if (typeof(__type) !== 'string') return;

				base.types[__type] = mm.string.template('MM_EVENT_${TYPE}', { TYPE: __type.toUpperCase() });

				Object.defineProperty(this, __type, {
					get: function () {

						return base.types[__type];

					}
				});

				return base.types[__type];

			},
		},
	}

})();
//> 이벤트

//< 이벤트 커스텀
// mm.event.type.set('popup_open');
// mm.event.type.set('popup_close');
// mm.event.type.set('modal_open');
// mm.event.type.set('modal_close');
mm.event.type.set('frame_ready');// 팝업, 모달 등 iframe 노출 시 ready 상태를 부모 창에 알림
//> 이벤트 커스텀

//< 이벤트 레디
mm.ready = function (__callback) {

	// ? __callback:function

	if (typeof(__callback) !== 'function') return;
	mm.event.on(document, 'DOMContentLoaded', __callback, { _isOnce: true });

}
//> 이벤트 레디

//< 이벤트 로드
mm.load = function (__callback, __option) {

	// ? __callback:function
	// __option.el 값이 없으면 window에 적용

	if (typeof(__callback) !== 'function') return;

	var option = mm.extend({
		el: window,// ? :element
		_isOnce: true,// ? :boolean - 한 번만 실행
	}, __option);
	var $elements = mm.find(option.el);
	if ($elements.length === 0) return;

	_.forEach($elements, function (__$el) {

		mm.event.on(__$el, 'load', __callback, { _isOnce: option._isOnce });

	});

}
//> 이벤트 로드

//< 이벤트 위임
mm.delegate = (function () {

	// UI 고유 객체
	var base = {
		events: [],// ? :array - 연결된 이벤트 목록
		// 연결 해제
		off: function (__$parent, __delegator, __type, __callback) {

			// ? __parent:element - 부모 단일 요소
			// ? __delegator:string - 위임할 요소 셀렉터
			// ? __type:string - 이벤트 단일 타입
			// ? __callback:function
			// ? __callback:string - 타입이 string이면 function.name 값으로 비교

			var temp = { $parent: __$parent, _type: __type };
			var _eventIndex = _.findIndex(base.events, temp);
			var event = base.events[_eventIndex];

			var target = { _delegator: __delegator };
			if (typeof(__callback) === 'function') target.callback = __callback;

			var _i = 0;
			while (_i < event.targets.length) {
				var targetItem = event.targets[_i];
				if (_.isMatch(targetItem, target)) {
					if (typeof(__callback) !== 'string' || (typeof(__callback) === 'string' && __callback === targetItem.callback.name)) {
						event.targets.splice(_i, 1);
					}
					else _i++;
				}
				else _i++;
			}

			if (event.targets.length === 0) {
				event.$parent.removeEventListener(event._type, event.handler);
				base.events.splice(_eventIndex, 1);
			}

		},
	};

	// public
	return {
		//- 연결
		on: function (__parents, __delegator, __types, __callback, __option) {

			// ? __parents:element - 부모 요소
			// ? __delegator:string - 위임할 요소 셀렉터
			// ? __types:string - 이벤트 타입으로 띄어쓰기로 여러 타입 연결 가능
			// ? __callback:function

			var $parents = mm.find(__parents);
			if ($parents.length === 0 || !__delegator || !__types || !__callback) return;

			var option = mm.extend({
				data: {},// ? :object - __callback의 3번째 아규먼트(object)로 전달
				_isOnce: false,// ? :boolean - 이벤트를 한 번만 실행
			}, __option);
			var types = __types.split(' ');

			_.forEach($parents, function (__$parent) {

				var $parent = (__$parent.window) ? __$parent.document : __$parent;

				_.forEach(types, function (__type) {

					var temp = { $parent: $parent, _type: __type };
					var event = _.find(base.events, temp);

					// $parent에 연결된 type 이벤트가 있으면 항목 추가
					if (event) {
						var target = { _delegator: __delegator, callback: __callback };
						if (!_.some(event.targets, target)) event.targets.push(target);// 중복 방지
					}
					else {
						var eventHandler = function (__e) {

							var $element = __e.target;
							event = _.find(base.events, temp);

							while ($parent.contains($element) && $element.tagName !== 'BODY') {
								var targets = _.filter(event.targets, function (__target) { return $element.matches(__target._delegator); });

								_.forEach(targets, function (__target) {

									mm.apply(__target.callback, $element, [__e, $parent, option.data]);
									if (option._isOnce) base.off($parent, __target._delegator, __type, __target.callback);// 한 번만 실행

								});

								$element = $element.parentElement;
							}

						}

						$parent.addEventListener(__type, eventHandler, false);
						base.events.push({ $parent: $parent, _type: __type, targets: [{ _delegator: __delegator, callback: __callback }], handler: eventHandler });
					}

				});

			});

		},
		//- 해제
		off: function (__parents, __delegator, __types, __callback) {

			// ? __parents:element - 부모 요소
			// ? __delegator:string - 위임할 요소 셀렉터
			// ? __types:string - 이벤트 타입으로 띄어쓰기로 여러 타입 연결 가능
			// ? __callback:function
			// ? __callback:string - 타입이 string이면 function.name 값으로 비교
			// __callback 값이 없으면 __parents + __delegator + __types에 연결된 전체 이벤트 해제

			var $parents = mm.find(__parents);
			if ($parents.length === 0 || !__delegator || !__types) return;

			var types = __types.split(' ');

			_.forEach($parents, function (__$parent) {

				_.forEach(types, function (__type) {

					base.off(__$parent, __delegator, __type, __callback);

				});

			});

		},
		//- 확인
		get: function (__parent, __delegator) {

			// ? __parents:element - 부모 단일 요소
			// ? __delegator:string - 위임할 요소 셀렉터
			// __parent 값이 없으면 mm.event에 연결된 전체 이벤트 리턴

			if (!__parent || !__delegator) return base.events;

			var $parent = mm.find(__parent)[0];
			var returns = mm.extend(_.filter(base.events, { $parent: $parent }));

			if (__delegator) {
				_.forEach(returns, function (__return) {

					__return.targets = _.filter(__return.targets, { _delegator: __delegator });

				});
			}

			return (returns.length === 0) ? [] : returns;

		},
	}

})();
//> 이벤트 위임

//< 이벤트 옵저버
mm.observer = (function () {

	// mm.observer.on(__element, 'CUSTOM_EVENT', callback function, { data: {}, _isOnce: false, _isOverwrite: false });// 저장
	// mm.observer.off(__element);// 요소에 연결된 전체 이벤트 해제
	// mm.observer.off(null, 'CUSTOM_EVENT');// 이벤트 타겟에 연결된 전체 이벤트 해제
	// mm.observer.off(__element, 'CUSTOM_EVENT');// 지정 삭제
	// mm.observer.dispatch('CUSTOM_EVENT', { data: {} });// 이벤트 실행
	// mm.observer.get();// 저장 목록 보기
	// * 요소에 같은 타입의 이벤트 중복 연결 안됨(overwrite 가능)

	// UI 고유 객체
	var base = {
		events: [],// 연결된 이벤트 목록
		// 연결 해제
		off: function (__$element, __type) {

			// ? __$element:element - 단일 요소
			// ? __type:string - 커스텀 이벤트 단일 타입

			var temp = {};
			if (__$element) temp.$el = __$element;
			if (__type) temp._type = __type;

			var _i = 0;
			while (_i < base.events.length) {
				var eventItem = base.events[_i];
				if (_.isMatch(eventItem, temp)) {
					eventItem.$el.removeEventListener(eventItem._type, eventItem.handler);
					base.events.splice(_i, 1);
				}
				else _i++;
			}

		},
	};

	// public
	return {
		//- 연결
		on: function (__elements, __type, __callback, __option) {

			// ? __elements:element
			// ? __type:string - 커스텀 이벤트 단일 타입
			// ? __callback:function

			var $elements = mm.find(__elements);
			if ($elements.length === 0 || !__type || !__callback) return;
			if (frameElement) {
				var params = [$elements].concat(mm.object.values(arguments).splice(1));
				mm.apply('mm.observer.on', top, params);// 최상위에서 실행
				return;
			}

			var option = mm.extend({
				data: {},// ? :object - __callback의 2번째 아규먼트(object)로 전달
				_isOnce: false,// ? :boolean - 한 번만 실행
				_isOverwrite: false,// ? :boolean - 중복 적용될 때 덮어쓰기
			}, __option);

			_.forEach($elements, function (__$el) {

				var temp = { $el: __$el, _type: __type };
				var _is = false;

				var _i = 0;
				while (_i < base.events.length) {
					var eventItem = base.events[_i];
					// 중복
					if (_.isMatch(eventItem, temp)) {
						// 덮어쓰기 위해 삭제
						if (option._isOverwrite === true) {
							eventItem.$el.removeEventListener(eventItem._type, eventItem.handler);
							base.events.splice(_i, 1);
						}
						// 제외
						else {
							_is = true;
							break;
						}
					}
					else _i++;
				}

				if (_is === true) return;

				function eventHandler(__e) {

					mm.apply(__callback, __$el, [__e, option.data]);
					if (option._isOnce) base.off(__$el, __type);// 한 번만 실행

				}

				__$el.addEventListener(__type, eventHandler, false);
				base.events.push({ $el: __$el, _type: __type, callback: __callback, handler: eventHandler });

			});

		},
		//- 해제
		off: function (__elements, __type) {

			// ? __elements:element
			// ? __type:string - 커스텀 이벤트 단일 타입
			// __elements 값이 없으면 __type에 연결된 전체 이벤트 해제
			// __type 값이 없으면 __elements에 연결된 전체 이벤트 해제
			// * 해제할 때 __callback은 확인 안함

			var $elements = mm.find(__elements);
			if ($elements.length === 0 && !__type) return;
			if (frameElement) {
				var params = [$elements].concat(mm.object.values(arguments).splice(1));
				mm.apply('mm.observer.off', top, params);// 최상위에서 실행
				return;
			}

			if ($elements.length > 0) {
				_.forEach($elements, function (__$el) {

					base.off(__$el, __type);

				});
			}
			else if (__type) base.off(null, __type);

		},
		//- 실행
		dispatch: function (__type, __option) {

			// ? __type:string - 커스텀 이벤트 단일 타입
			// 고유 이벤트로 버블링 되지 않습니다.

			if (!__type) return;
			if (frameElement) {
				mm.apply('mm.observer.dispatch', top, [__type, mm.extend(__option || {}, { $frameWindow: window })]);// 최상위에서 실행
				return;
			}

			var option = mm.extend({
				_isLocal: false,// ? :boolean - 현재 document 안에 연결된 이벤트만 실행(지역)
				$frameWindow: null,// ? :element - dispatch를 실행한 프레임의 window(frameElement 일 때 저장)
				data: {},// ? :object - __callback의 1번째 아규먼트(event).detail로 전달
			}, __option);
			var customEvent = new CustomEvent(__type, { detail: option.data, bubbles: false });
			var $document = (option.$frameWindow) ? option.$frameWindow.document : document;

			_.forEach(base.events, function (__event, __index) {

				if (!__event || __event._type !== __type) return;

				var _isContains = (__event.$el.window) ? $document.defaultView === __event.$el : $document.contains(__event.$el);
				if (option._isLocal === false || (option._isLocal === true && _isContains)) __event.$el.dispatchEvent(customEvent);

			});

		},
		//- 확인
		get: function (__target) {

			// ? __target:element - 단일 요소
			// ? __target:string - 이벤트 타입
			// __target 값이 없으면 mm.observer에 연결된 전체 이벤트 리턴

			if (!__target) return base.events;

			var $element = mm.find(__target)[0];
			if (frameElement) {
				var params = ($element) ? $element : arguments;
				return mm.apply('mm.observer.get', top, params);// 최상위에서 실행
			}

			var returns = mm.extend(_.filter(base.events, ($element) ? { $el: $element } : { _type: __target }));

			return (returns.length === 0) ? [] : returns;

		},
	};

})();
//> 이벤트 옵저버

//< 인터섹션
mm.intersection = (function () {

	// UI 고유 객체
	var base = {
		observers: [],// ? :array - 감시 영역 목록
		targets: [],// ? :array - 감시 대상 목록
		// 실행 함수
		intersectionHandler: function (__entry, __io, __isForce) {

			// ? __entry:object - IO의 entry 객체 또는 base.targets의 단일 객체
			// ? __io:object - IO
			// ? __isForce:boolean - 강제 실행
			// __isForce 값이 true 이면 임의로 entry를 생성하여 적용
			// * entry.boundingClientRect는 리플로우 없이 사용 가능
			// entry.intersectionRatio로 노출 비율 확인 가능

			var target = (__isForce === true) ? __entry : _.find(base.targets, { $el: __entry.target, io: __io });
			var entry = (__isForce === true) ? {
				target: target.$el,
				boundingClientRect: target.$el.getBoundingClientRect(),
				_isForce: true,
			} : __entry;

			// 보임
			if (__entry.isIntersecting || __isForce === true) {
				mm.apply(target.callback, __io, [entry, true, target.option.data]);
				if (target.option._isOnce) base.removeObserve(_.findIndex(base.targets, { $el: target.$el, callback: target.callback, io: target.io }));// 한 번만 실행
			}
			else mm.apply(target.callback, __io, [entry, false, target.option.data]);

		},
		// 감시 제거
		removeObserve: function (__index) {

			// ? __index:number - 감시를 제거할 타겟 인덱스

			var target = base.targets[__index];
			if (!target) return false;

			target.io.unobserve(target.$el);
			// target.io.disconnect();// 감시 대상 전체 제거
			base.targets.splice(__index, 1);
			return true;

		},
	};

	// public
	return {
		//- 연결
		on: function (__elements, __callback, __option) {

			// ? __elements:element
			// ? __callback:function

			var $elements = mm.find(__elements);
			if ($elements.length === 0 || !__callback) return;

			var option = mm.extend({
				data: {},// ? :object - __callback의 3번째 아규먼트(object)로 전달
				_isOnce: false,// ? :boolean - 한 번만 실행
				_isOverwrite: false,// ? :boolean - 중복 적용될 때 덮어쓰기
				config: {// ? :object - IO 설정
					root: null,// ? :element - 감시 영역(부모 요소, null/document/element)
					rootMargin: '0px 0px 0px 0px',// ? :string - 감시 영역의 확대/축소('0px 0px 0px 0px'), 음수 값이 커질 수록 화면 안으로 영역이 작아짐
					threshold: [0, 1],// ? :array - 감시 대상의 노출 비율 구간([0, 0.5, 1])
				}
			}, __option);
			if (__option.config && !mm.is.empty(__option.config.threshold)) option.config.threshold = __option.config.threshold;

			_.forEach($elements, function (__$el) {

				var io = _.find(base.observers, function (__io) { return _.isMatch(__io, option.config); });
				var temp = { $el: __$el, callback: __callback, option: option };

				// 중복
				var _index = _.findIndex(base.targets, temp);
				if (_index > -1) {
					if (option._isOverwrite === true) base.removeObserve(_index);
					else return;
				}

				if (!io) {
					io = new IntersectionObserver(function (__entries, __io) {

						_.forEach(__entries, function (__entry) {

							base.intersectionHandler(__entry, __io);

						});

					}, option.config);
					base.observers.push(io);
				}

				io.observe(__$el);
				temp.io = io;
				base.targets.push(temp);

			});

		},
		//- 해제
		off: function (__elements, __callback, __io) {

			// ? __elements:element
			// ? __callback:function
			// ? __io:object - IO
			// __callback, __io 값이 없으면 전체 __io에 연결된 __elements 감시 해제

			var $elements = mm.find(__elements);
			if ($elements.length === 0) return;

			_.forEach($elements, function (__$el) {

				var temp = { $el: __$el };
				if (typeof(__callback) === 'function') temp.callback = __callback;
				if (__io) temp.io = __io;

				var _i = 0;
				while (_i < base.targets.length) {
					var targetItem = base.targets[_i];
					if (_.isMatch(targetItem, temp)) {
						if (typeof(__callback) !== 'string' || (typeof(__callback) === 'string' && __callback === targetItem.callback.name)) {
							base.removeObserve(_i);
						}
						else _i++;
					}
					else _i++;
				}

			});

		},
		//- 강제 실행
		force: function (__elements, __io) {

			// ? __elements:element
			// ? __io:object - IO
			// __io 값이 없으면 저장된 전체 __io에 연결된 __elements 실행

			var $elements = mm.find(__elements);
			if ($elements.length === 0) return;

			_.forEach($elements, function (__$el) {

				var temp = { $el: __$el };
				if (__io) temp.io = __io;

				var targets = _.filter(base.targets, temp);
				_.forEach(targets, function (__target) {

					base.intersectionHandler(__target, __target.io, true);

				});

			});

		},
		//- 확인
		get: function (__element) {

			// ? __element:element - 단일 요소
			// __element 값이 없으면 mm.intersection에 연결된 전체 타겟 리턴

			if (!__element) return base.targets;

			var $element = mm.find(__element)[0];
			var returns = mm.extend(_.filter(base.targets, { $el: $element }));

			return (returns.length === 0) ? [] : returns;

		},
	}

})();
//> 인터섹션

//< 포커스
mm.focus = (function () {

	// public
	return {
		//- 지정
		in: function (__element, __option) {

			// ? __element:element - 단일 요소

			var $element = mm.find(__element)[0];
			if (!$element) return;

			var option = mm.extend({
				_outline: '',// ? :string - 포커스 됐을 때 적용할 outline 스타일 값(thin dotted)
			}, __option);

			mm.element.attribute($element, { 'tabindex': '-1', 'style': { 'outline': option._outline } });
			mm.event.on($element, 'focusout', function () {

				mm.element.attribute($element, { 'tabindex': '', 'style': { 'outline': '' } });

			}, { _isOnce: true });

			$element.focus();
			mm.event.dispatch($element, 'focusin focus');

		},
		//- 해제
		out: function (__element) {

			// ? __element:element - 단일 요소

			var $element = mm.find(__element)[0];
			if (!$element) return;

			if (mm.is.focus($element)) {
				$element.blur();
				mm.event.dispatch($element, 'focusout blur');
			}

		}
	};

})();
//> 포커스

//< 스크롤
mm.scroll = (function () {

	// UI 고유 객체
	var base = {
		_classNo: '__noscroll',// ? :string - 스크롤 차단 클래스
		// 스크롤 검색
		find: function (__$element, __isClosest) {

			// ? __$element:element - 스크롤을 검색할 단일 요소
			// ? __isClosest:boolean - 하위 요소가 아닌 상위 요소로 스크롤 검색

			if (!__$element || __$element.tagName === 'HTML' || __$element.tagName === 'BODY') {
				var $scroll = mm.find('.mm_page > .mm_scroller')[0];
				return ($scroll) ? $scroll : window;
				// return (mm.element.style(document.documentElement, 'overflow') !== 'hidden') ? window : mm.find('.mm_page .mm_scroller')[0];
			}
			else if (__$element.classList.contains('mm_scroller')) return __$element;
			else return (__isClosest === true) ? __$element.closest('.mm_scroller') || window : mm.find('.mm_scroller', __$element)[0];

		},
		// 스크롤 이동
		to: function (__target, __option) {

			// ? __target:element - 단일 요소
			// ? __target:number - 스크롤 지정 위치(px)

			var option = mm.extend({
				scroller: null,// ? :element - 스크롤 요소
				_direction: 'vertical',// ? :string - vertical(가로), horizontal(세로)
				_margin: 0,// ? :number - 스크롤 위치 조정(px)
				_time: mm.time._fast,// ? :number - 스크롤 시간(초), 값이 0이면 바로 이동
				_isFocus: false,// ? :boolean - __target이 단일 요소일 때 이동 후 포커싱 여뷰
				onStart: null,// ? :function
				onStartParams: [],// ? :array
				onComplete: null,// ? :function
				onCompleteParams: [],// ? :array
			}, __option);
			if (!option.scroller) option.scroller = base.find();

			mm.apply(option.onStart, option, option.onStartParams);

			var _scroll = (function (__isNumber) {

				if (__isNumber) return __target;
				else {
					var $target = mm.find(__target)[0];
					var position = mm.element.position($target);
					return (option._direction === 'vertical') ? position.top : position.left;
				}

			})(Number.isFinite(__target));

			if (mm.is.empty(_scroll)) return;
			_scroll -= option._margin;

			var tweenOption = { duration: option._time, ease: 'sine.out',
				onComplete: function () {

					if (option._isFocus === true) mm.delay.on(mm.focus.in, { _name: 'DELAY_FOCUS_SCROLL', _isOverwrite: true, params: [$target] });// 중복 실행 방지
					mm.apply(option.onComplete, option, option.onCompleteParams);

				},
			};
			tweenOption[(option._direction === 'vertical') ? 'scrollTop' : 'scrollLeft'] = _scroll;
			if (option.scroller === window) option.scroller = document.documentElement;

			gsap.to(option.scroller, tweenOption);

		},
		// 스크롤 위치
		offset: function (__$element) {

			// ? __$element:element - 스크롤 단일 요소

			if (mm.is.element(__$element)) return (__$element.window) ? { top: __$element.pageYOffset, left: __$element.pageXOffset } : { top: __$element.scrollTop, left: __$element.scrollLeft };
			else return { top: 0, left: 0 };

		},
		// 스크롤 토글
		toggle: function (__is) {

			// ? __is:boolean - 스크롤 가능 여부
			// * pc에서 스크롤이 없어지면서 화면이 흔들리는 이슈로 스크립트에서 위치 조절(fixed로 하면 가로 스크롤 적용 안됨)

			var $html = document.documentElement;
			if (mm.class.some($html, ['__bom', '__modal'])) return;// BOM 이나 모달이 있으면 false로 유지

			var _is = (typeof(__is) === 'boolean') ? __is : $html.classList.contains(base._classNo);

			if (_is === false) {
				if (mm.is.ie() && $html.scrollTop < 1) $html.scrollTop = 1;
				$html.classList.add(base._classNo);

				mm.element.style('.mm_app', { 'top': mm.number.unit(-document.documentElement.scrollTop) });
				mm.element.style(document.body, { 'overflow': 'hidden' });
			}
			else if (_is === true) {
				$html.classList.remove(base._classNo);

				var offset = mm.element.offset('.mm_app');
				mm.element.style('.mm_app', { 'top': '' });
				mm.element.style(document.body, { 'overflow': '' });

				$html.scrollTop = -offset.top;
			}

		},
	};

	// public
	return {
		//- 기본 스크롤
		get el() {

			return base.find();

		},
		//- 스크롤 요소 검색
		find: function (__element, __isClosest) {

			// ? __element:element - 단일 요소
			// ? __isClosest:boolean - __element 기준 상위 요소로 검색

			var $element = mm.find(__element)[0];
			if (__element && !$element) return null;
			else return base.find($element, __isClosest);

		},
		//- 위치/앵커 이동
		to: function (__target, __option) {

			// ? __target:element - 단일 요소
			// ? __target:number - 스크롤 지정 위치(px)
			// ? __option:object
			// ? __option.scroller:element - 스크롤 요소
			// ? __option._direction:string - vertical(가로), horizontal(세로)
			// ? __option._margin:number - 스크롤 위치 조정(px)
			// ? __option._time:number - 스크롤 시간(초), 값이 0이면 바로 이동
			// ? __option._isFocus:boolean - __target이 단일 요소일 때 이동 후 포커싱 여뷰
			// ? __option.onStart:function
			// ? __option.onStartParams:array
			// ? __option.onComplete:function
			// ? __option.onCompleteParams:array

			if (arguments.length === 0) return;

			base.to(__target, __option);

		},
		//- 스크롤 위치
		offset: function (__element) {

			// ? __element:element - 단일 요소

			return base.offset(mm.find(__element)[0]);

		},
		//- 스크롤 허용
		on: function () {

			base.toggle(true);

		},
		//- 스크롤 차단
		off: function () {

			base.toggle(false);

		},
		//- 스크롤 토글
		toggle: function () {

			base.toggle();

		},
	}

})();
//> 스크롤

//< 아이프레임 리사이즈
mm.frameResize = function (__frameElements, __option) {

	// ? __frameElements:element - 아이프레임 요소

	var $iframes = mm.find(__frameElements);

	// 아이프레임 밖에서 실행
	if ($iframes.length > 0) {
		_.forEach($iframes, function (__$iframe) {

			var $frameWindow = __$iframe.contentWindow;
			if ($frameWindow) {
				if ($frameWindow.mm) $frameWindow.mm.frameResize(null, __option);
				else {
					mm.load(function () {

						try {
							$frameWindow.mm.frameResize(null, __option);
						}
						// mm 객체 없음
						catch (__error) {
							console.log(__error);
						}

					}, { el: __$iframe });
				}
			}

		});
	}
	// 아이프레임 안에서 실행
	else if (frameElement) {
		// width는 스타일에서 적용하고, %일 때 홀수만 짝수로 적용
		var option = mm.extend({
			_isLoad: false,// ? :boolean - 페이지 ready, load로 실행
			_isEven: false,// ? :boolean - 짝수로 맞춤
			_extraHeight: null,// ? :number - 세로 추가 조정 값
		}, __option);

		// 새로고침 대응으로 로드를 제외한 함수를 직접 실행할 때 _extra 값이 있으면 프레임에 저장
		if (option._isLoad === false && Number.isFinite(option._extraHeight)) mm.element.attribute(frameElement, { 'data-iframe': { _extraHeight: option._extraHeight } });
		// 새로고침 시 이전에 저장해 놓은 extra 값이 있으면 적용
		else option = mm.extend(option, mm.data.get(frameElement, 'data-iframe', true));

		var $target = (mm.scroll.el === window) ? mm.find('.mm_page')[0] : mm.scroll.el;// mm.find('.mm_page-content')[0];
		var style = { 'height': '', 'width': '' };

		// mm.element.style(frameElement, style);// iframe 높이를 초기화하면 부모 스크롤 위치가 달라지는 이슈
		mm.element.style(document.body, { 'height': 0, 'min-height': 0 });

		var _frameHeight = Math.ceil($target.scrollHeight + mm.element.offset($target).top);
		if (Number.isFinite(option._extraHeight)) _frameHeight += option._extraHeight;
		if (option._isEven && mm.is.odd(_frameHeight)) _frameHeight += 1;
		style['height'] = mm.number.unit(_frameHeight + 2);// android iframe 영역 스크롤이 잘 되지 않는 이슈로 + 2 적용

		var _frameWidth = Math.ceil($target.scrollWidth);
		if (option._isEven && mm.is.odd(_frameWidth)) _frameWidth += 1;
		style['width'] = mm.number.unit(_frameWidth);

		mm.element.style(document.body, { 'height': '', 'min-height': '' });
		mm.element.style((mm._isModal) ? frameElement.parentElement : frameElement, style);
	}

}
//> 아이프레임 리사이즈

//< DOM data-속성
mm.data = (function () {

	// * mm.data.get으로 리턴받은 객체에 값을 추가/변경 시 바로 저장된 값이 변경 됨

	// UI 고유 객체
	var base = {
		get _mmKey() { return '__mm.data__'; },// element에 저장할 key name
	};

	// public
	return {
		//- 저장 후 결과 리턴
		set: function (__element, __dataName, __option) {

			// ? __element:element - 단일 요소
			// ? __dataName:string - data-attribute 속성 이름

			var $element = mm.find(__element)[0];
			if (!$element || !__dataName) return null;

			var option = mm.extend({
				initial: null,// ? :obejct - extend 할 기본 값
				_isOverwrite: false,// ? :boolean - 값이 true면 mmData[__dataName] 값이 있을 때 변경된 값만 덮어쓰고, 없거나 false면 새로 저장
				append: null,// ? :object -추가로 extend 할 값
			}, __option);
			var mmData = $element[base._mmKey];
			if (!mmData) mmData = $element[base._mmKey] = {}
			var _ui = __dataName.replace('data-', '');

			return mmData[_ui] = (function () {

				var data = mm.extend({}, option.initial);
				if (option._isOverwrite === true && mmData[_ui]) data = mm.extend(data, mmData[_ui]);// overwrite
				if (option.append) data = mm.extend(data, option.append);

				var _attr = $element.getAttribute(__dataName);
				if (_attr && _attr.charAt(0) === '{') data = mm.extend(data, JSON.parse(_attr.replace(/\'/g, '"').replace(/\t/g, ' ').replace(/\n/g, '\\n')));

				return data;

			})();

		},
		//- 가져오기
		get: function (__element, __dataName, __isDataAttr) {

			// ? __element:element - 단일 요소
			// ? __dataName:string - data-attribute 속성 이름
			// ? __isDataAttr:boolean - 저장된 값이 아닌 순수 data-name 값을 리턴
			// __dataName 값이 없으면 요소에 저장된 데이터 전체를 리턴

			var $element = mm.find(__element)[0];
			if (!$element) return null;

			if (__isDataAttr === true) {
				var _attr = $element.getAttribute(__dataName);
				return (_attr && _attr.startsWith('{')) ? JSON.parse(_attr.replace(/\'/g, '"').replace(/\t/g, ' ').replace(/\n/g, '\\n')) : (!_attr || _attr.length === 0) ? {} : _attr;
			}
			else {
				var mmData = $element[base._mmKey];
				if (!mmData) mmData = $element[base._mmKey] = {}
				var _ui = (__dataName) ? __dataName.replace('data-', '') : null;

				return (!_ui) ? mmData : mmData[_ui];
			}

		},
		//- 삭제
		remove: function (__element, __dataName) {

			// ? __element:element - 단일 요소
			// ? __dataName:string - data-attribute 속성 이름

			var $element = mm.find(__element)[0];
			if (!$element || !__dataName) return;

			var mmData = $element[base._mmKey];
			if (mmData) delete mmData[__dataName.replace('data-', '')];

		},
		//- 병합
		extend: function (__element, __dataName, __data) {

			// ? __element:element - 단일 요소
			// ? __dataName:string - data-속성
			// ? __data:object - 교체할 객체 값

			var $element = mm.find(__element)[0];
			if (!$element || !__dataName) return null;

			var mmData = $element[base._mmKey];
			var _ui = __dataName.replace('data-', '');
			if (!mmData || !mmData[_ui]) return null;

			return mmData[_ui] = mm.extend(mmData[_ui], __data);

		}
	}

})();
//> DOM data-속성

//< 요소
mm.element = (function () {

	// UI 고유 객체
	var base = {
		// 노드 생성
		createNode: function (__html) {

			// ? __html:string - 요소를 생성할 html 코드

			__html = __html.trim();

			var $template = document.createElement('template');
			$template.insertAdjacentHTML('afterbegin', __html);

			// * IE 와 표준 브라우저에서 table 내부 요소(caption, colgroup, col, thead, tfoot, tbody, tr, th, td) 가져오는 방식이 다름
			if (mm.is.ie() && /^<caption|^<colgroup|^<col|^<thead|^<tfoot|^<tbody|^<tr|^<th|^<td/i.test(__html.trim())) {
				$template.insertAdjacentHTML('afterbegin', mm.string.template('<table>${HTML}</table>', { HTML: __html }));

				if (/^<caption|^<colgroup|^<thead|^<tfoot|^<tbody/i.test(__html.trim())) $template = $template.firstElementChild;// table
				else if (/^<col|^<tr/i.test(__html.trim())) $template = $template.firstElementChild.firstElementChild;// table > colgroup, tbody
				else if (/^<th|^<td/i.test(__html.trim())) $template = $template.firstElementChild.firstElementChild.firstElementChild;// table > tr
			}

			return mm.object.values($template.childNodes);

		},
		// 단일 요소에 DOM 추가
		insertNode: function (__$element, __appends, __local) {

			// ? __$element:element - 단일 요소
			// ? __appends:string = html 코드
			// ? __appends:element
			// ? __local:string - before, after, prepend, append

			if (!__$element || !__appends) return;

			var appends = [];
			switch (mm.string.constructor(__appends)) {
				case 'String':
					appends = base.createNode(__appends);
					break;
				case 'HTMLCollection':
				case 'NodeList':
					// appends 타입이 HTMLCollection, NodeList이면 이동되면서 자동으로 appends 목록에서 삭제되는 이슈로 배열로 변경
					appends = mm.object.values(__appends);
					break;
				case 'Array':
					appends = _.forEach(__appends, function (__append) {

						if (__append.nodeName) appends.push(__append);

					});
					break;
				default:
					if (__appends.nodeName) appends.push(__appends);
			}

			if (['after', 'prepend'].includes(__local)) appends.reverse();

			_.forEach(appends, function (__append) {

				switch (__local) {
					case 'after':
						__$element.parentElement.insertBefore(__append, __$element.nextSibling);
						break;
					case 'before':
						__$element.parentElement.insertBefore(__append, __$element);
						break;
					case 'append':
						__$element.append(__append);
						break;
					case 'prepend':
						__$element.prepend(__append);
						break;
				}

			});

		},
		// 스타일 적용
		setStyle: function (__$element, __style) {

			// ? __$element:element - 단일 요소
			// ? __style:object - 적용할 스타일 객체

			_.forEach(__style, function (__value, __key) {

				__$element.style[__key] = __value;

			});

		},
		// 디스플레이
		toggleDisplay: function (__$element, __is) {

			// ? __$element:element - 단일 요소
			// ? __is:boolean = 노출 여부

			var _is = (typeof(__is) === 'boolean') ? __is : !mm.is.display(__$element);
			if (_is) {
				if (mm.is.display(__$element)) return;

				base.setStyle(__$element, { 'display': (function (__value) {

					if (__value.includes('display:none')) return '';

					var _value = 'block';
					switch (__$element.tagName) {
						case 'LI':
							_value = 'list-item';
							break;
						case 'TABLE':
							_value = 'table';
							break;
						case 'CAPTION':
							_value = 'table-caption';
							break;
						case 'COLGROUP':
							_value = 'table-column-group';
							break;
						case 'COL':
							_value = 'table-column';
							break;
						case 'THEAD':
							_value = 'table-header-group';
							break;
						case 'TFOOT':
							_value = 'table-footer-group';
							break;
						case 'TBODY':
							_value = 'table-row-group';
							break;
						case 'TR':
							_value = 'table-row';
							break;
						case 'TD':
							_value = 'table-cell';
							break;
					}

					return _value;

				})(String(__$element.getAttribute('style')).replace(/ /g, '')) });
			}
			else {
				if (!mm.is.display(__$element)) return;

				base.setStyle(__$element, { 'display': 'none' });
			}

		},
		// 인덱스 검색
		findIndex: function (__$lists, __element) {

			// ? __$lists:element - 인덱스를 검색할 요소 목록
			// ? __element:element - 단일 요소 또는 셀렉터

			if (__$lists.length === 0 || !__element) return -1;

			if (mm.is.element(__element)) return __$lists.indexOf(__element);
			else if (typeof(__element) === 'string') return __$lists.indexOf(_.find(__$lists, function (__$item) { return __$item.matches(__element); }));

		},
	};

	// public
	return {
		//- 속성
		attribute: function (__elements, __attribute) {

			// ? __elements:element
			// ? __attribute:object - 요소에 적용할 속성 객체
			// 속성 값이 없거나 false면 삭제, true면 빈 값('') 없이 속성만 적용
			// 속성 값 타입이 object면 JSON.stringify로 적용(단, 더블퀏(")이 싱글퀏(')으로 변경)
			// * 여러 속성을 추가하거나, data-속성 또는 attr='' 가 아닌 값이 없는 attr만 적용할 때 사용

			if (!mm.is.object(__attribute)) return;

			var $elements = mm.find(__elements);

			_.forEach($elements, function (__$el) {

				_.forEach(__attribute, function (__value, __key) {

					// 값이 없거나 false이면 삭제
					if (mm.is.empty(__value) || __value === false) {
						__$el.removeAttribute(__key);
						return;
					}

					switch (__key) {
						case 'style':
							base.setStyle(__$el, (function () {

								if (mm.is.object(__value)) return __value;
								else if (typeof(__value) === 'string') {
									return _.chain(__value.split(';'))
									.map(function (__split) {

										return _.map(__split.split(':'), function (__bit) { return __bit.trim(); });

									}).fromPairs().value();
								}
								else return {};

							})());
							break;
						default:
							__$el.setAttribute(__key, (__value === true) ? '' : (typeof(__value) === 'object') ? JSON.stringify(__value).replace(/"/g, '\'') : __value);
					}

				});

			});

		},
		//- 프로퍼티
		property: function (__elements, __property) {

			// ? __elements:element
			// ? __property:object - 요소에 적용할 프로퍼티 객체
			// 속성 값이 없으면 false로 적용
			// * 여러 프로퍼티를 관리할 때 사용

			if (!mm.is.object(__property)) return;

			var $elements = mm.find(__elements);

			_.forEach($elements, function (__$el) {

				_.forEach(__property, function (__value, __key) {

					__$el[__key] = (mm.is.empty(__value)) ? false : __value;

				});

			});

		},
		//- 스타일
		style: function (__elements, __style) {

			// ? __elements:element
			// ? __style:object - 요소에 적용할 스타일 객체
			// ? __style:string - 요소에 적용된 스타일 값 리턴
			// __elements가 단일 요소일 때 스타일 객체 또는 값 리턴
			// __style이 없거나 타입이 object면 전체 스타일 객체 리턴
			// __style 타입이 string이면 해당 스타일 값 리턴

			var $elements = mm.find(__elements);
			if ($elements.length === 0) return null;

			// 스타일 적용
			if (mm.is.object(__style)) {
				_.forEach($elements, function (__$el) {

					base.setStyle(__$el, __style);

				});
			}

			// 단일 요소일 때 스타일 리턴
			if ($elements.length === 1) {
				var style = getComputedStyle($elements[0]);
				return (typeof(__style) === 'string') ? style[__style] : style;
			}
			else return null;

		},
		//- 브라우저에서 보여지는 위치
		offset: function (__element) {

			// ? __element:element - 단일 요소

			var $element = mm.find(__element)[0];
			if (!mm.is.element($element)) return {};

			var rect = $element.getBoundingClientRect();

			return { top: rect.top, left: rect.left };

		},
		// 스크롤 영역에서 보여지는 위치
		client: function (__element) {

			// ? __element:element - 단일 요소
			// ~ 다중 스크롤 시 영역위치 테스트 필요(상위 스크롤의 scrollTop 계산 필요?)

			var $element = mm.find(__element)[0];
			if (!mm.is.element($element)) return {};

			var $scroll = mm.scroll.find($element, true);
			var elementRect = $element.getBoundingClientRect();
			var scrollRect = (!$scroll || $scroll === window) ? { top: 0, left: 0 } : $scroll.getBoundingClientRect();

			return { top: elementRect.top - scrollRect.top, left: elementRect.left - scrollRect.left };

		},
		//- 스크롤 영역 내 실제 위치(scroll + offset)
		position: function (__element) {

			// ? __element:element - 단일 요소
			// ~ 다중 스크롤 시 영역위치 테스트 필요(상위 스크롤의 scrollTop 계산 필요?)

			var $element = mm.find(__element)[0];
			if (!mm.is.element($element)) return {};

			var $scroll = mm.scroll.find($element, true);
			var elementRect = $element.getBoundingClientRect();
			var scrollRect = (!$scroll || $scroll === window) ? { top: 0, left: 0 } : $scroll.getBoundingClientRect();
			var scrollOffset = mm.scroll.offset($scroll);

			return { top: scrollOffset.top + elementRect.top - scrollRect.top, left: scrollOffset.left + elementRect.left - scrollRect.left };

		},
		//- 요소 인덱스
		index: function (__lists, __element) {

			// ? __lists:array
			// ? __element:element - 단일 요소 또는 셀렉터

			if (typeof(__lists) !== 'object') return -1;

			var lists = (Array.isArray(__lists)) ? __lists : mm.object.values(__lists);
			return base.findIndex(lists, __element);

		},
		lastIndex: function (__lists, __element) {

			// ? __lists:array
			// ? __element:element - 단일 요소 또는 셀렉터

			if (typeof(__lists) !== 'object') return -1;

			var lists = (Array.isArray(__lists)) ? __lists : mm.object.values(__lists);
			return base.findIndex(lists.reverse(), __element);

		},
		//- 보기/숨김
		show: function (__elements) {

			// ? __elements:element

			var $elements = mm.find(__elements);

			_.forEach($elements, function (__$el) {

				base.toggleDisplay(__$el, true);

			});

		},
		hide: function (__elements) {

			// ? __elements:element

			var $elements = mm.find(__elements);

			_.forEach($elements, function (__$el) {

				base.toggleDisplay(__$el, false);

			});

		},
		toggle: function (__elements) {

			// ? __elements:element

			var $elements = mm.find(__elements);

			_.forEach($elements, function (__$el) {

				base.toggleDisplay(__$el);

			});

		},
		//- 생성
		create: function (__html) {

			// ? __html:string - 요소를 생성할 html 코드
			// string 타입 HTML 코드를 NodeList로 리턴

			if (typeof(__html) !== 'string') return null;

			return base.createNode(__html);

		},
		// 추가/이동
		after: function (__elements, __appends) {

			// ? __elements:element
			// ? __appends:element

			var $elements = mm.find(__elements);

			_.forEach($elements, function (__$el) {

				base.insertNode(__$el, __appends, 'after');

			});

		},
		before: function (__elements, __appends) {

			// ? __elements:element
			// ? __appends:element

			var $elements = mm.find(__elements);

			_.forEach($elements, function (__$el) {

				base.insertNode(__$el, __appends, 'before');

			});

		},
		append: function (__elements, __appends) {

			// ? __elements:element
			// ? __appends:element

			var $elements = mm.find(__elements);

			_.forEach($elements, function (__$el) {

				base.insertNode(__$el, __appends, 'append');

			});

		},
		prepend: function (__elements, __appends) {

			// ? __elements:element
			// ? __appends:element

			var $elements = mm.find(__elements);

			_.forEach($elements, function (__$el) {

				base.insertNode(__$el, __appends, 'prepend');

			});

		},
		//- wrap/upwrap
		wrap: function (__elements, __wrapper, __isInner) {

			// ? __elements:element
			// ? __wrapper:string - __elements를 포장할 tagName
			// ? __isInner:boolean - 내용만 포장

			var $elements = mm.find(__elements);
			if ($elements.length === 0 || typeof(__wrapper) !== 'string') return;

			var wrappers = [];

			_.forEach($elements, function (__$el) {

				var $wrapper = document.createElement(__wrapper);
				wrappers.push($wrapper);

				if (__isInner === true) {
					base.insertNode(__$el, $wrapper, 'prepend');
					base.insertNode($wrapper, _.drop(__$el.childNodes), 'append');
				}
				else {
					base.insertNode(__$el, $wrapper, 'before');
					base.insertNode($wrapper, __$el, 'append');
				}

			});

			return wrappers;

		},
		unwrap: function (__elements, __isParent) {

			// ? __elements:element
			// ? __isParent:boolean - 부모를 제거

			var $elements = mm.object.values(mm.find(__elements));

			_.forEach($elements, function (__$el) {

				var $wrap = (__isParent === true) ? __$el.parentElement : __$el;
				base.insertNode($wrap, $wrap.childNodes, 'before');
				$wrap.remove();

			});

		},
		//- 다중 요소 삭제
		remove: function (__elements) {

			// ? __elements:element
			// $elements 타입이 HTMLCollection, NodeList이면 삭제되면서 자동으로 $elements 목록에서 삭제되는 이슈로 배열로 변경

			var $elements = mm.object.values(mm.find(__elements));

			_.forEach($elements, function (__$el) {

				__$el.remove();

			});

		},
	}

})();
//> 요소

//< 클래스
mm.class = (function () {

	// UI 고유 객체
	var base = {
		// 토글 클래스 또는 spread syntax(...array)를 지원하지 않을 때 사용
		toggle: function (__$element, __classes, __toggle) {

			// ? __$element:element - 단일 요소
			// ? __classes:array
			// ? __toggle:string - add, remove, toggle

			_.forEach(__classes, function (__class) {

				__$element.classList[__toggle](__class);

			});

		},
	};

	// public
	return {
		// 클래스 추가
		add: function (__elements, __classes) {

			// ? __elements:element
			// ? __classes:string - 단일 클래스
			// ? __classes:array - 다중 클래스

			var classes = (typeof(__classes) === 'string') ? [__classes] : __classes;
			if (!Array.isArray(classes)) return;

			var $elements = mm.object.values(mm.find(__elements));

			_.forEach($elements, function (__$el) {

				base.toggle(__$el, classes, 'add');

			});

		},
		// 클래스 삭제
		remove: function (__elements, __classes) {

			// ? __elements:element
			// ? __classes:string - 단일 클래스
			// ? __classes:array - 다중 클래스

			var classes = (typeof(__classes) === 'string') ? [__classes] : __classes;
			if (!Array.isArray(classes)) return;

			var $elements = mm.object.values(mm.find(__elements));

			_.forEach($elements, function (__$el) {

				base.toggle(__$el, classes, 'remove');

			});

		},
		// 클래스 토글
		toggle: function (__elements, __classes) {

			// ? __elements:element
			// ? __classes:string - 단일 클래스
			// ? __classes:array - 다중 클래스

			var classes = (typeof(__classes) === 'string') ? [__classes] : __classes;
			if (!Array.isArray(classes)) return;

			var $elements = mm.object.values(mm.find(__elements));

			_.forEach($elements, function (__$el) {

				base.toggle(__$el, classes, 'toggle');

			});

		},
		// 클래스 전체 포함 여부
		every: function (__element, __classes) {

			// ? __element:element - 단일 요소
			// ? __classes:string - 단일 클래스
			// ? __classes:array - 다중 클래스

			var $element = mm.find(__element)[0];
			var classes = (typeof(__classes) === 'string') ? [__classes] : __classes;
			if (!$element || !Array.isArray(classes)) return;

			return _.every(classes, function (__class) {

				return $element.classList.contains(__class);

			});

		},
		// 클래스 일부 포함 여부
		some: function (__element, __classes) {

			// ? __element:element - 단일 요소
			// ? __classes:string - 단일 클래스
			// ? __classes:array - 다중 클래스

			var $element = mm.find(__element)[0];
			var classes = (typeof(__classes) === 'string') ? [__classes] : __classes;
			if (!$element || !Array.isArray(classes)) return;

			return _.some(classes, function (__class) {

				return $element.classList.contains(__class);

			});

		},
	};

})();
//> 클래스

//< 링크
mm.link = function (__url, __option) {

	// ? __url:string

	if (typeof(__url) !== 'string') return false;

	if (/^\/\/|^http\:|^https\:|www\./.test(__url) && !new RegExp(location.host, 'i').test(__url)) {
		console.log('도메인이 다릅니다.\nlocation.href/window.open/target="_blank"로 연결해주세요.');
		return false;
	}

	var _urlPathname = __url.replace(location.origin, '').split('#')[0];
	var option = mm.extend({
		_type: (_urlPathname === '/') ? 'home' : 'link',// :string - link, popup, modal, anchor, home
		// states: {},// :object - history.state에 추가로 저장할 값(object)
	}, __option);
	if (_urlPathname === '/') option._type = 'home';

	switch (option._type) {
		case 'anchor':
			mm.scroll.to(__url, option);
			break;
		case 'modal':
			mm.modal.open(__url, option);
			break;
		case 'popup':
			mm.popup.open(__url, option);
			break;
		case 'link':
			mm.modal.close();
			mm.loading.show();

			// 로딩 모션 적용으로 딜레이 필요
			var _delay = (mm.is.mobile()) ? 100 : 1;
			setTimeout(function () {

				// url이 같으면 리로드
				if (__url === top.location.href) top.location.reload();
				else top.location.href = __url;

				if (mm.is.mobile('ios') || /firefox/i.test(navigator.userAgent)) mm.loading.hide();// ios, firefox에서 뒤로가기 시 로딩바가 사라지지 않는 이슈로 hide 적용

			}, _delay);
			break;
		case 'home':
			top.location.href = '/';
			break;
	}

}
//> 링크

//< 클립보드복사
mm.copy = function (__text, __message) {

	// ? __text:string - 복사할 내용
	// ? __message:string - 복사 후 노출할 얼럿 내용

	var $copy = document.createElement('textarea');
	$copy.value = __text;
	mm.element.style($copy, { 'position': 'absolute', 'z-index': '-1', 'top': '-100px', 'left': '-100%', 'pointer-events': 'none' });
	document.body.append($copy);

	$copy.select();
	document.execCommand('copy');
	$copy.remove();

	if (__message && __message.trim().length > 0) mm.bom.alert(__message);

}
//> 클립보드복사

//< (디)싱커 전환
mm.changeSyncer = function (__elements, __is, __dataName) {

	// ? __elements:element - 싱커를 연결할 요소
	// ? __is:boolean - 활성 여부
	// ? __dataName:string - data-attribute 속성 이름

	var _class = mm.string.template('__${NAME}-use', { NAME: __dataName.replace('data-', '') });
	var $elements = mm.find(__elements);

	_.forEach($elements, function (__$el) {

		var data = mm.data.get(__$el, __dataName);
		if (mm.is.empty(data)) return;

		var $display = (__$el.tagName === 'OPTION') ? __$el.closest('select') : __$el;

		// 싱커 연결
		var $syncers = mm.find(data.syncer);
		_.forEach($syncers, function (__$syncer) {

			if (__is && mm.is.display($display)) {
				__$syncer.classList.add(_class);
				if (data._isSyncerUpdate === true) mm.ui.update(__$syncer);
			}
			else {
				__$syncer.classList.remove(_class);
				if (data._isSyncerUpdate === true) mm.form.update(__$syncer);
			}

		});

		// 디싱커 연결
		var $desyncers = mm.find(data.desyncer);
		_.forEach($desyncers, function (__$desyncer) {

			if (__is && mm.is.display($display)) {
				__$desyncer.classList.add(_class);
				if (data._isDesyncerUpdate === true) mm.form.update(__$desyncer);
			}
			else {
				__$desyncer.classList.remove(_class);
				if (data._isDesyncerUpdate === true) mm.ui.update(__$desyncer);
			}

		});

	});

}
//> (디)싱커 전환

//< ajax(axios)
mm.ajax = (function () {

	// public
	return {
		//- 로드 + html append
		load: function (__url, __option) {

			// ? __url:string

			if (typeof(__url) !== 'string') return;

			var option = mm.extend({
				config: {// ? :object - axios 설정
					url: __url,
					method: 'get',
					// baseURL: '',
					// params: {},
					// data: {},
					responseType: 'html',
					// responseEncoding: 'utf8',
					// timeout: 1000,
					maxContentLength: 2000,// 보안 취약점 발견으로 추가
				},
				container: null,// ? :element - responseType이 html일 때 로드한 html을 append할 대상
				_isAppend: true,// ? :boolean - 완료 후 자동으로 append
				_isClear: true,// ? :boolean - append 전 container 내용 삭제
				_isLoading: true,// ? :boolean - 로딩 노출
				_loadingHeight: null,// ? :number - 로딩이 노출되는 동안 적용할 container 높이
				onAppendBefore: null,// ? :function
				onAppendBeforeParams: [],// ? :array
				onComplete: null,// ? :function
				onCompleteParams: [],// ? :array
				onError: null,// ? :function
				onErrorParams: [],// ? :array
			}, __option);
			var $container = mm.find(option.container)[0];

			if ($container && option._isClear) $container.innerHTML = '';// 로딩 제외 필요?
			if ($container && option._isLoading) mm.loading.show($container, { _minHeight: option._loadingHeight });// 로딩이 있으면 무시 필요?

			// ajax 로드 추가
			axios(option.config)
			.then(function (__response) {

				var _data = __response.data;
				var _returnValue = mm.apply(option.onAppendBefore, option, [_data].concat(option.onAppendBeforeParams));
				if (_returnValue) _data = _returnValue;// _data 가공이 필요할 경우 onAppendBefore로 연결한 함수에서 가공하여 리턴

				if ($container && option._isAppend) {
					mm.element.append($container, _data);
					mm.ui.update($container);// 로드된 부분만 UI 업데이트
				}

				mm.apply(option.onComplete, option, [_data].concat(option.onCompleteParams));
				mm.loading.hide($container);

			})
			.catch(function (__error) {

				console.log(mm.string.template('${URL}\n${ERROR}', { URL: __url, ERROR: __error }));
				mm.apply(option.onError, option, [__error].concat(option.onErrorParams));
				mm.loading.hide($container);

			});

		},
	};

})();
//> ajax(axios)

//< 브라우저 쿠키
mm.cookie = (function () {

	// 브라우저에서 쿠키설정을 막으면 저장안됨
	// 4kb까지 저장 가능

	// UI 고유 객체
	var base = {
		cookie: function (__key, __value, __day, __isMidnight) {

			// ? __key:string
			// ? __value:string
			// ? __day:number - 유지 기간
			// ? __isMidnight:boolean - 자정(0시)를 기준으로 설정

			var _day = parseFloat(__day);
			var date = new Date();
			if (__isMidnight === true) date.setHours(0, 0, 0, 0);
			date.setTime(date.getTime() + (_day * 24 * 60 * 60 * 1000));

			var _value = (__value === undefined) ? true : __value;
			var _expireDay = (_day) ? mm.string.template('expires=${DATE}', { DATE: date.toUTCString() }) : '';
			document.cookie = mm.string.template('${KEY}=${VALUE}; ${EXPIRE}; path=/; domain=${DOMAIN}', { KEY: __key, VALUE: encodeURIComponent(_value), EXPIRE: _expireDay, DOMAIN: location.hostname });

		},
	};

	// public
	return {
		//- 쿠키 저장
		set: function (__key, __value, __day, __isMidnight) {

			// ? __key:string
			// ? __value:string
			// ? __day:number - 유지 기간
			// ? __isMidnight:boolean - 자정(0시)를 기준으로 설정
			// __value 값이 없으면 true로 저장

			if (!__key) return;

			base.cookie(__key, __value, __day, __isMidnight);

		},
		//- 쿠키 가져오기
		get: function (__key) {

			// ? __key:string

			if (!__key) return;

			var _result = null;
			var cookies = document.cookie.split(';');

			_.forEach(cookies, function (__value) {

				var cookie = __value.trim().split('=');
				if (cookie[0] === __key) {
					_result = cookie[1];
					return false;
				}

			});

			return decodeURIComponent(_result);

		},
		//- 쿠키 삭제
		remove: function (__key) {

			// ? __key:string

			if (!__key) return;

			base.cookie(__key, null, -1);

		},
	};

})();
//> 브라우저 쿠키

//< 로컬 쿠키(스토리지)
mm.local = (function () {

	// mm.cookie와 사용방법과 같음
	// 도메인 기준으로 저장
	// 브라우저를 닫아도 설정 유지
	// 개인정보 등 저장 위험
	// 5mb까지 저장 가능

	// UI 고유 객체
	var base = {
		remove: function (__key) {

			// ? __key:string

			mm.storage.remove('local', __key);

		},
	};

	// public
	return {
		//- 로컬 저장
		set: function (__key, __value, __day, __isMidnight) {

			// ? __key:string
			// ? __value:string
			// ? __day:number - 유지 기간
			// ? __isMidnight:boolean - 자정(0시)를 기준으로 설정
			// __value 값이 없으면 true로 저장

			if (!__key) return;

			var _day = parseFloat(__day);
			var date = new Date();
			if (__isMidnight === true) date.setHours(0, 0, 0, 0);
			date.setTime(date.getTime() + (_day * 24 * 60 * 60 * 1000));

			var _value = (__value === undefined) ? true : __value;
			var _expireDay = (_day) ? date.toUTCString() : null;
			mm.storage.set('local', __key, { value: _value, _expire: _expireDay });

		},
		//- 로컬 가져오기
		get: function (__key) {

			// ? __key:string

			if (!__key) return;

			var data = mm.storage.get('local', __key);
			if (!data) return null;// 저장된 키가 없음

			var date = new Date();
			// 폐기
			if (data._expire && data._expire < date.toUTCString()) {
				base.remove(__key);
				return undefined;
			}
			// 값 리턴
			else return data.value;

		},
		//- 로컬 삭제
		remove: function (__key) {

			// ? __key:string

			if (!__key) return;

			base.remove(__key);

		},
	};

})();
//> 로컬 쿠키(스토리지)

//< 스토리지 관리
mm.storage = (function () {

	// storage 값은 string만 지원(JSON으로 변환하여 저장)
	// 도메인을 기준으로 저장
	// session은 브라우저를 닫으면 삭제됨
	// local은 브라우저를 닫아도 설정 유지(보안이 필요없는 부분에만 사용)
	// 5mb까지 저장 가능

	// UI 고유 객체
	var base = {
		storage: function (__type) {

			// ? __type:string - session, local

			return (__type === 'session') ? sessionStorage : (__type === 'local') ? localStorage : null;

		},
	};

	// public
	return {
		//- 스토리지 저장
		set: function (__type, __key, __value) {

			// ? __type:string - session, local
			// ? __key:string
			// ? __value:string

			var storage = base.storage(__type);
			if (!storage || arguments.length < 3) return;

			var item = { _type: Array.isArray(__value) ? 'array' : typeof(__value), value: __value };
			storage.setItem(__key, JSON.stringify(item));

		},
		//- 스토리지 가져오기
		get: function (__type, __key) {

			// ? __type:string - session, local
			// ? __key:string

			var storage = base.storage(__type);
			if (!storage || arguments.length < 2) return;

			var item = JSON.parse(storage.getItem(__key));
			if (!item) return;

			return (mm.is.empty(item.value)) ? null : item.value;

		},
		//- 스토리지 삭제
		remove: function (__type, __key) {

			// ? __type:string - session, local
			// ? __key:string

			var storage = base.storage(__type);
			if (!storage || arguments.length < 2) return;

			storage.removeItem(__key);

		},
		//- 스토리지 전체삭제
		clear: function (__type) {

			// ? __type:string - session, local

			var storage = base.storage(__type);
			if (!storage) return;

			storage.clear();

		}
	};

})();
//> 스토리지 관리

//< 히스토리
mm.history = (function () {

	// url과 history index를 기준으로 저장
	// url이 같아도 history index가 다르면 별도로 저장
	// 브라우저를 닫으면 삭제됨
	// 640kb까지 저장 가능

	// UI 고유 객체
	var base = {
		// 최상위 히스토리 state
		get state() {

			// return mm.extend(top.history.state);// set으로면 변경 가능
			return top.history.state;// 직접 변경 가능

		},
		set state(__value) {

			// ? __value:boolean - history.state

			base.replace(__value);

		},
		// 최상위 히스토리 세션
		get session() {

			var state = base.state;
			var sessionHistories = mm.storage.get('session', 'history');

			if (!sessionHistories) return {};
			if (!state || mm.is.empty(state._sessionIndex)) return { histories: sessionHistories };

			var sessionHistory = sessionHistories[state._sessionIndex];

			return {
				histories: sessionHistories,
				history: sessionHistory,
				pages: sessionHistory.pages,
				page: sessionHistory.pages[state._pageIndex],
			};

		},
		set session(__value) {

			// ? __value:object - session.histories

			mm.storage.set('session', 'history', __value);

		},
		// 히스토리 변경
		replace: function (__state, __url, __option) {

			// ? __state:object - history.state
			// ? __url:string - 변경할 경로

			var option = mm.extend({
				_isTop: true,// ? :boolean - 최상위 window.history에 적용
				_title: '',// ? :history - history.pushState/replaceState에 적용할 값
			}, __option);

			var $window = (frameElement && option._isTop) ? top : window;// 최상위
			var state = (__state === null || __state === 'null') ? null : mm.extend($window.history.state || {}, __state);
			var _url = __url || $window.location.href;

			$window.history.replaceState(state, option._title, _url);

		},
		// 히스토리 추가
		push: function (__state, __url, __option) {

			// ? __state:object - history.state
			// ? __url:string - 변경할 경로

			var option = mm.extend({
				_isTop: true,// ? :boolean - 최상위 window.history에 적용
				_title: '',// ? :history - history.pushState/replaceState에 적용할 값
			}, __option);

			var $window = (frameElement && option._isTop) ? top : window;// 최상위
			var state = (__state === null || __state === 'null') ? null : mm.extend(__state || {}, { _sessionIndex: ($window.history.state) ? $window.history.state._sessionIndex : null });
			var session = base.session;

			session.pages.splice(session.history._stageIndex + 1);
			var sessionPage = {};

			state._pageIndex = session.history._stageIndex += 1;
			if (state._isNew) {
				state._keepIndex = 0;
				sessionPage.changes = [];
			}
			else {
				state._keepIndex = $window.history.state._keepIndex + 1;
				sessionPage.changes = _.last(session.pages).changes;
				sessionPage._pageType = 'keep';
			}
			$window.history.pushState(state, option._title, __url);

			sessionPage._pageUrl = $window.location.href.replace(location.origin, '');
			session.pages[state._pageIndex] = sessionPage;
			base.session = session.histories;

			mm.storage.set('session', 'stateBackup', state);// 새로고침 비교를 위한 세션에 저장

		},
		// 히스토리 이동
		go: function (__index, __callback, __params) {

			// ? __index:number - 이동할 히스토리 수
			// ? __callback:function
			// ? __params:array - 콜백 파라미터

			top.history.go(__index);

			if (__callback) mm.apply(__callback, window, __params);

		},
	};

	// public
	return {
		//- 히스토리 state
		get state() {

			return base.state;

		},
		set state(__value) {

			// ? __value:any

			base.state = __value;

		},
		//- 히스토리가 저장된 세션 검색
		get session() {

			return base.session;

		},
		set session(__value) {

			// ? __value:object

			base.session = (__value.hasOwnProperty('histories')) ? __value.histories : __value;

		},
		//- 뒤로 가기
		back: function (__step, __callback, __params) {

			// ? __step:number - 이동할 히스토리 수
			// ? __callback:function
			// ? __params:array - 콜백 파라미터
			// __step 값이 없으면 1 적용

			if (__step === 0) return;

			base.go(-parseFloat(__step) || -1, __callback, __params);

		},
		//- 앞으로 가기
		forward: function (__step, __callback, __params) {

			// ? __step:number - 이동할 히스토리 수
			// ? __callback:function
			// ? __params:array - 콜백 파라미터
			// __step 값이 없으면 1 적용

			if (__step === 0) return;

			base.go(parseFloat(__step) || 1, __callback, __params);

		},
		//- 히스토리 변경
		replace: function (__state, __url, __option) {

			// ? __state:object - history.state에 저장할 값
			// ? __url:string
			// ? __option:object
			// ? __option._isTop:boolean - 최상위 window.history에 적용
			// ? __option._title:history - history.pushState/replaceState에 적용할 값
			// __state 값이 null이면 history.state 초기화
			// __url 없이 __state만 넣어 사용 가능

			if (!__state && !__url) return;

			base.replace(__state, __url, __option);

		},
		//- 히스토리 추가
		push: function (__state, __url, __option) {

			// ? __state:object - history.state에 저장할 값
			// ? __url:string
			// ? __option:object
			// ? __option._isTop:boolean - 최상위 window.history에 적용
			// ? __option._title:string - history.pushState/replaceState에 적용할 값
			// __state 값이 null이면 history.state 초기화

			if (!__url) return;

			base.push(__state, __url, __option);

		},
	};

})();
//> 히스토리

//< 로딩
mm.loading = (function () {

	// UI 고유 객체
	var base = {
		// 로딩 숨김
		hide: function (__$element, __delay) {

			// ? __$element:element
			// ? __delay:number - 삭제 딜레이 시간(초)

			var $loadings = mm.find('.mm_loading', __$element);
			if ($loadings.length === 0) return;

			_.forEach($loadings, function (__$loading) {

				gsap.to(__$loading, {
					alpha: 0,
					duration: mm.time._fast,
					delay: (Number.isFinite(__delay) && __delay > 0) ? __delay : 0,
					ease: 'cubic.in',
					onComplete: function () {

						__$loading.remove();
						if (mm.find('.mm_loading', __$element).length === 0) mm.element.style(__$element, { 'position': '', 'min-height': '' });

					},
				});

			});

		},
	};

	// public
	return {
		//- 보기
		show: function (__element, __option) {

			// ? __element:element - 로딩을 표시할 단일 요소
			// * ios에서 링크 이동 시 css keyframes로 적용된 모션 중 :before, :after 가상 요소는 움직이지 않음
			// __element 값이 없으면 .mm_app 전체 영역에 적용

			var $element = mm.find(__element || '.mm_app')[0];
			if (!$element) return;

			var option = mm.extend({
				_minHeight: 0,// ? :number - 로딩이 노출되는 동안 적용할 요소 높이
				_top: 0,// ? :number - 로딩 아이콘 top 위치 조절
				_text: null,// ? :text - 로딩 아이콘 하단에 노출할 텍스트
				_size: null,// ? :number - 로딩 아이콘 폰트 사이즈
				_background: '',// ? :string - background-color 스타일 값
			}, __option);
			var _isApp = ($element.tagName === 'HTML' || $element.tagName === 'BODY' || $element.classList.contains('mm_app')) ? true : false;

			base.hide($element);

			var $loading = mm.element.create(mm.string.template([
				'<div class="mm_loading">',
				'	<div class="mm_loading-inner">',
				'		<i class="ico_loading __ani-spin"></i>',
				'		<p class="mm_ir-blind">Loading...</p>',
				'	</div>',
				'</div>',
			]))[0];
			$element.append($loading);

			var elementStyle = mm.element.style($element);
			mm.element.style($element, {
				'position': (!['absolute', 'relative'].includes(elementStyle['position'])) ? 'relative' : '',
				'min-height': (option._minHeight) ? mm.number.unit(option._minHeight) : '',
			});

			mm.element.style($loading, {
				'position': (!_isApp) ? 'absolute' : '',
				'top': (option._top) ? mm.number.unit(option._top) : '',
				'background-color': option._background,
			});

			if (Number.isFinite(option._size)) mm.element.style(mm.find('.ico_loading', $loading)[0], { 'font-size': mm.number.unit(option._size) });
			if (typeof(option._text) === 'string') {
				var $text = mm.find('.mm_ir-blind', $loading)[0];
				$text.classList.remove('mm_ir-blind');
				$text.innerHTML = option._text;
			}

			return $loading;

		},
		//- 숨김/삭제
		hide: function (__elements, __delay) {

			// ? __elements:element - 삭제할 로딩의 부모 요소
			// ? __delay:number - 딜레이 시간(초)
			// __elements 값이 없으면 .mm_app 전체 영역에 적용

			var $elements = mm.find(__elements || '.mm_app');
			if ($elements.length === 0) return;

			_.forEach($elements, function (__$element) {

				base.hide(__$element, __delay);

			});

		},
	};

})();
//> 로딩

//< 프로그레스
// ~ 프로그레스 필요 여부에 따라 제작
/*
mm.progress = (function () {

	// public
	return {
		//- 보기
		show: function (__element, __option) {

			// ? __element:element - 프로그레스를 표시할 단일 요소

		},
		//- 숨김/삭제
		hide: function (__elements, __delay) {

			// ? __elements:element - 삭제할 프로그레스의 부모 요소
			// ? __delay:number - 딜레이 시간(초)
			// __elements 값이 없으면 .mm_app 전체 영역에 적용

		},
		//- 업데이트
		update: function (__element, __option) {

			// ? __element:element - 보여지는 프로그레스의 부모 단일 요소

		},
	};

})();
*/
//> 프로그레스

//< 소셜태그
mm.socialtag = (function () {

	// UI 고유 객체
	var base = {
		get _selector() { return 'meta[property^=og]'; },// 소셜 메타 태그
		// 소셜태그 추가
		append: function (__html) {

			// ? html:string - meta html 코드

			var $metas = mm.find(base._selector, document.head);
			if ($metas.length === 0) $metas = mm.find('meta', document.head);

			if ($metas.length === 0) mm.element.append(document.head, __html);
			else mm.element.after(_.last($metas), __html);

		},
	};

	// public
	return {
		//- 가져오기
		get: function (__parents) {

			// ? __parents:element - og meta 요소를 검색할 부모 요소
			// __parents 값이 없으면 페이지 전체에서 검색

			var $parents = mm.find(__parents);
			$parents = ($parents.length === 0) ? mm.find(base._selector, document.head) : mm.find(base._selector, $parents);

			return _.map($parents, function (__$parent) {

				return __$parent.outerHTML;

			}).join('\n');

		},
		//- 추가
		set: function (__html) {

			// ? __html:string - meta html 코드
			// head의 마지막 meta 요소 다음 또는 마지막에 추가

			if (!__html) return;

			// if (frameElement) {
			// 	mm.apply('mm.socialtag.set', top, arguments);// 최상위에서 실행 필요?
			// 	return;
			// }

			base.append(__html);

		},
		//- 변경
		change: function (__html) {

			// ? __html:string - meta html 코드
			// 현재 전체 meta 요소를 __html로 변경

			if (!__html) return;

			// if (frameElement) {
			// 	mm.apply('mm.socialtag.change', top, arguments);// 최상위에서 실행 필요?
			// 	return;
			// }

			var $meta = mm.find(base._selector);

			base.append(__html);
			mm.element.remove($meta);

		},
	};

})();
//> 소셜태그

//< 이미지
mm.image = (function () {

	// public
	return {
		//- 투명 1px gif
		get _empty() {

			return 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';

		},
		//- 없음 이미지
		none: function (__elements, __option) {

			// ? __elements:element
			// ? __option:object
			// ? __option._classNone:string - 없음 아이콘 클래스

			var $elements = mm.find(__elements);
			if ($elements.length === 0) return;

			var option = mm.extend({
				_classNone: 'ico_image',// 없음 아이콘 클래스
			}, __option);
			var _noneHtml = mm.string.template('<i class="ico_none ${NONE}"></i>', { NONE: option._classNone });

			_.forEach($elements, function (__$el) {

				var $parent = __$el.parentElement;

				if (__$el.tagName === 'I') __$el.classList.add('ico_none', option._classNone);
				else if (__$el.tagName === 'IMG') {
					mm.element.after(__$el, _noneHtml);
					mm.element.attribute(__$el.parentElement, { 'data-ir': __$el.getAttribute('alt') });// 이미지 alt를 부모에 전달
					__$el.remove();
				}
				else {
					mm.element.append(__$el, _noneHtml);
					$parent = __$el;
				}

				$parent.classList.add('mm_image-none');

			});

		},
	};

})();
//> 이미지

//< 요소(이미지, 아이프레임) 로드
mm.loadElement = function (__element, __dataName) {

	// ? __element:element - 단일 요소
	// ? __dataName:string - data-attribute 속성 이름
	// __dataName 값이 없으면 data-preload로 적용

	var $element = mm.find(__element)[0];
	var _dataName = (typeof(__dataName) === 'string') ? __dataName : 'data-preload';
	var data = mm.data.get($element, _dataName);
	if (!$element || !data) return;

	var _isIframe = $element.tagName === 'IFRAME';
	var _isImage = $element.tagName === 'IMG';
	var $event = $element;// 이벤트를 연결할 요소
	var mui = mm[_dataName.replace('data-', '')];

	// iframe
	if (_isIframe) {
		if (!$element.getAttribute('scrolling')) $element.setAttribute('scrolling', 'no');// scrolling 속성 웹표준 오류로 스크립트로 적용
	}
	// 배경
	else if (!_isImage) {
		$event = document.createElement('img');
		var attr = {};
		attr[_dataName] = data;
		mm.element.attribute($event, attr);
	}

	// 로드 전
	$element.classList.add(mui._classLoading);
	mm.apply(data.onBefore, $element, data.onBeforeParams);

	mm.event.on($event, 'load error', function (__e) {

		mm.event.off($event, 'load error');

		switch (__e.type) {
			// 로드 완료
			case 'load':
				mm.class.remove($element, [mui._classLoading, mui._classError]);
				$element.classList.add(mui._classLoaded);

				// iframe
				if (_isIframe) {
					if (mm.is.ie() && $element.getAttribute('scrolling') === 'no') $element.contentDocument.body.scroll = 'no';

					// * iframe 오류 상태 개발에서 적용
					/*
					var _iframeTitle = $element.getAttribute('title') || $element.contentDocument.title || '';
					$element.setAttribute('title', _iframeTitle);

					// 에러 화면 title로 확인
					if (/404 not found|불편을 드려 죄송합니다|페이지를 찾을 수 없습니다|^error$/i.test(_iframeTitle)) {
						mm.class.remove($element, [mui._classLoading, mui._classLoaded]);
						$element.classList.add(mui._classError);
						console.log('error src : ' + $element.getAttribute('src'));

						mm.apply(data.onError, $element, data.onErrorParams);
						return;
					}
					*/
				}
				else {
					if (data._isRatio === true) {
						var _ratio = $event.naturalWidth / $event.naturalHeight;
						var _classRatio = '__image-square';
						if (_ratio > 1) _classRatio = (_ratio > 8) ? '__image-landscape-4x' : (_ratio > 4) ? '__image-landscape-3x' : (_ratio > 2) ? '__image-landscape-2x' : '__image-landscape';
						else if (_ratio < 1) _classRatio = (_ratio < 0.25) ? '__image-portrait-3x' : (_ratio < 0.5) ? '__image-portrait-2x' : '__image-portrait';

						$element.classList.add(_classRatio);
					}

					// 배경
					if (!_isImage) {
						mm.element.style($element, { 'background-image': mm.string.template('url("${SRC}")', { SRC: $event.getAttribute('src') }) });
						$event.remove();
					}
				}

				// 모달 리사이징
				if ($element.closest('.mm_modal')) mm.modal.resize();

				// $element.removeAttribute('data-preload');
				mm.apply(data.onComplete, $element, data.onCompleteParams);
				break;
			// 로드 에러(iframe은 load에서 에러 처리)
			case 'error':
				mm.class.remove($element, [mui._classLoading, mui._classLoaded]);

				// 보조 경로가 있으면 다시 로드
				if (data._src2) {
					data._src = data._src2;
					data._src2 = null;
					if ($element !== $event) $event.remove();// 임시로 생성된 이미지 요소 삭제

					mm.loadElement($element, _dataName);
				}
				else {
					$element.classList.add(mui._classError);
					console.log('error src : ' + $event.getAttribute('src'));

					if (data._isErrorImage === true) mm.image.none($element);// 없음 이미지

					mm.apply(data.onError, $element, data.onErrorParams);
				}
				break;
		}

	});

	var _loadSrc = data._src.trim();
	if (_loadSrc.length === 0 || _loadSrc === 'null') mm.event.dispatch($event, 'error');
	else $event.setAttribute('src', _loadSrc);

};
//> 요소(이미지, 아이프레임) 로드

//< 프리로드
mm.preload = (function () {

	// $el['__mm.data__'].name에 저장할 기본 값
	var initial = {
		_src: null,// ? :string - 이미지 경로
		_src2: null,// ? :string - _src가 없을 때 추가로 불러올 이미지 경로
		_isErrorImage: true,// ? :boolean - 오류 이미지 노출
		_isRatio: false,// ? : boolean - 프리로드 완료 시 비율에 따라 클래스 추가(landscape, portrait, square)
		_isPass: false,// ? :boolean - 프리로드 업데이트에서 제외
		onBefore: null,// ? :function
		onBeforeParams: [],// ? :array
		onComplete: null,// ? :function
		onCompleteParams: [],// ? :array
		onError: null,// ? :function
		onErrorParams: [],// ? :array
	};

	// UI 고유 객체
	var base = {
		get _dataName() { return 'data-preload'; },// 데이타 속성 이름
		get _classLoading() { return '__preload-loading'; },
		get _classLoaded() { return '__preload-loaded'; },
		get _classError() { return '__preload-error'; },
	};

	// public
	return {
		_classLoading: base._classLoading,
		_classLoaded: base._classLoaded,
		_classError: base._classError,
		//- 프리로드 연결
		update: function (__elements, __option) {

			// ? __elements:element
			// ? __option:object - initial과 병합

			var $elements = mm.ui.element(base._dataName, __elements);
			$elements = _.filter($elements, function (__$el) { return mm.is.display(__$el); });// 숨겨진 요소 제외

			_.forEach($elements, function (__$el) {

				if (mm.class.some(__$el, [base._classLoading, base._classLoaded, base._classError])) return;// 진행 중인 요소는 제외

				var data = mm.data.get(__$el, base._dataName);
				if (mm.is.empty(data)) data = mm.data.set(__$el, base._dataName, { initial: initial });
				if (mm.is.object(__option)) data = mm.data.extend(__$el, base._dataName, __option);
				if (data._isPass === true) return;

				mm.loadElement(__$el, base._dataName);

			});

		},
		//- 프리로드 강제연결
		force: function (__elements, __option) {

			// ? __elements:element
			// ? __option:object - initial과 병합
			// * 숨겨진 요소, _isPass 상관없이 강제로 연결

			var $elements = mm.ui.element(base._dataName, __elements);

			_.forEach($elements, function (__$el) {

				if (mm.class.some(__$el, [base._classLoading, base._classLoaded, base._classError])) return;// 진행 중인 요소는 제외

				var data = mm.data.get(__$el, base._dataName);
				if (mm.is.empty(data)) data = mm.data.set(__$el, base._dataName, { initial: initial });
				if (mm.is.object(__option)) data = mm.data.extend(__$el, base._dataName, __option);

				mm.loadElement(__$el, base._dataName);

			});

		},
		//- 프리로드 해제
		destroy: function (__elements) {

			// ? __elements:element
			// 이미 로드가 완료됐거나 오류가 있는 요소 제외

			var $elements = mm.ui.element(base._dataName, __elements);

			_.forEach($elements, function (__$el) {

				if (__$el.classList.contains(base._classLoaded) || __$el.classList.contains(base._classError)) return;

				__$el.removeAttribute('src');
				__$el.classList.remove(base._classLoading);// _classLoading 상태만 적용

			});

		},
	};

})();
//> 프리로드

//< 레이지로드
mm.lazyload = (function () {

	// $el['__mm.data__'].name에 저장할 기본 값
	var initial = {
		_src: null,// ? :string - 이미지 경로
		_src2: null,// ? :string - _src가 없을 때 추가로 불러올 이미지 경로
		_isErrorImage: true,// ? :boolean - 오류 이미지 노출
		_isRatio: false,// ? : boolean - 레이지로드 완료 시 비율에 따라 클래스 추가(landscape, portrait, square)
		_isPass: false,// ? :boolean - 레이지로드 업데이트에서 제외
		config: {// :object - IO 설정
			rootMargin: '50% 0px 50% 0px',// ? :string - 감시 영역의 확대/축소('0px 0px 0px 0px'), 음수 값이 커질 수록 화면 안으로 영역이 작아짐
		},
		onBefore: null,// ? :function
		onBeforeParams: [],// ? :array
		onComplete: null,// ? :function
		onCompleteParams: [],// ? :array
		onError: null,// ? :function
		onErrorParams: [],// ? :array
	};

	// UI 고유 객체
	var base = {
		get _dataName() { return 'data-lazyload'; },// 데이타 속성 이름
		get _classLoading() { return '__lazyload-loading'; },
		get _classLoaded() { return '__lazyload-loaded'; },
		get _classError() { return '__lazyload-error'; },
		load: function (__entry, __is) {

			// ? entry:object - IO entry
			// ? __is:boolean - IO isIntersecting
			// ? ___data:object

			if (__is !== true) return;
			if (mm.class.some(__entry.target, [base._classLoading, base._classLoaded, base._classError])) return;// 진행 중인 요소는 제외

			if (__is) mm.loadElement(__entry.target, base._dataName);

		},
	};

	// public
	return {
		_classLoading: base._classLoading,
		_classLoaded: base._classLoaded,
		_classError: base._classError,
		//- 레이지로드 연결
		update: function (__elements, __option) {

			// ? __elements:element
			// ? __option:object - initial과 병합

			var $elements = mm.ui.element(base._dataName, __elements);
			// $elements = _.filter($elements, function (__$el) { return mm.is.display(__$el); });// 숨겨진 요소 제외(레이지로드에는 제외)

			_.forEach($elements, function (__$el) {

				if (mm.class.some(__$el, [base._classLoading, base._classLoaded, base._classError])) return;// 진행 중인 요소는 제외

				var data = mm.data.get(__$el, base._dataName);
				if (mm.is.empty(data)) data = mm.data.set(__$el, base._dataName, { initial: initial });
				if (mm.is.object(__option)) data = mm.data.extend(__$el, base._dataName, __option);
				if (data._isPass === true) return;

				mm.intersection.on(__$el, base.load, { data: data, _isOnce: true, config: data.config });

			});

		},
		//- 레이지로드 해제
		destroy: function (__elements) {

			// ? __elements:element
			// 이미 로드가 완료됐거나 오류가 있는 요소 제외

			var $elements = mm.ui.element(base._dataName, __elements);

			_.forEach($elements, function (__$el) {

				if (__$el.classList.contains(base._classLoaded) || __$el.classList.contains(base._classError)) return;

				__$el.removeAttribute('src');
				__$el.classList.remove(base._classLoading);// _classLoading 상태만 적용

				mm.intersection.off(__$el, base.load);

			});

		},
	};

})();
//> 레이지로드

//< 스위치(토글)
mm.switch = (function () {

	// $el['__mm.data__'].name에 저장할 기본 값
	var initial = {
		_classOn: '__switch-on',// ? :string
		_title: '선택됨',// ? :string - on일 때 적용할 title 속성 값
		_defaultTitle: null,// ? :string - 기본 title 속성 값
		syncer: null,// ? :element - 토글될 때 연결할 요소
		_isSyncerUpdate: true,// ? :boolean - 싱커 내부 UI 업데이트 여부
		desyncer: null,// ? :element - 토글이 해제될 때 연결할 요소
		_isDesyncerUpdate: true,// ? :boolean - 디싱커 내부 UI 업데이트 여부
		_isParent: false,// ? :boolean - 부모 요소에 _classOn 적용
		_isParentUpdate: false,// ? :boolean - 부모 요소dp _classOn이 적용되면 ui update 적용
		_parentSelector: null,// ? :string - _classOn을 적용할 closest 요소
		_isReturnParams: true,// ? :boolean - onChange의 1번째 인자로 true/false 전달 여부
		onChange: null,// ? :function
		onChangeParams: [],// ? :array - onChange의 2번째 이후 아규먼트로 전달
	};
	// initial._isParent 값이 true이고, initial._parentSelector 값이 없으면 부모 요소에 적용
	// * onChange의 1번째 argumants(boolean)로 상태 전달(true 활성, false 비활성)

	// UI 고유 객체
	var base = {
		get _dataName() { return 'data-switch'; },// 데이타 속성 이름
		toggle: function (__$switch, __is) {

			// ? __$switch:element - 스위치 단일 요소
			// ? __is:boolean - 활성 여부

			if (!__$switch) return;

			var data = mm.data.get(__$switch, base._dataName);
			if (mm.is.empty(data)) data = mm.data.set(__$switch, base._dataName, { initial: initial });

			var $switch = (data._isParent !== true) ? __$switch : (typeof(data._parentSelector) === 'string') ? __$switch.closest(data._parentSelector) : __$switch.parentElement;
			var _is = (typeof(__is) === 'boolean') ? __is : !$switch.classList.contains(data._classOn);

			if (_is) {
				$switch.classList.add(data._classOn);
				__$switch.setAttribute('title', data._title);

				if (data._isParent && data._isParentUpdate) mm.ui.update(__$switch.parentElement);
			}
			else {
				$switch.classList.remove(data._classOn);
				if (data._defaultTitle) __$switch.setAttribute('title', data._defaultTitle);
				else __$switch.removeAttribute('title');
			}

			mm.changeSyncer($switch, _is, base._dataName);

			var params = (data._isReturnParams) ? [_is].concat(data.onChangeParams) : data.onChangeParams;
			mm.apply(data.onChange, __$switch, params);

			if (mm._isFrame) mm.frameResize();// 컨텐츠 아이프레임 리사이즈

		},
	};

	// private
	(function () {

		mm.delegate.on(document, mm.selector(base._dataName, '[]'), 'click', function (__e) {

			__e.preventDefault();

			base.toggle(this);

		});

	})();

	// public
	return {
		//- 스위치 활성
		on: function (__elements) {

			// ? __elements:element

			var $elements = mm.ui.element(base._dataName, __elements);

			_.forEach($elements, function (__$el) {

				base.toggle(__$el, true);

			});

		},
		//- 스위치 비활성
		off: function (__elements) {

			// ? __elements:element

			var $elements = mm.ui.element(base._dataName, __elements);

			_.forEach($elements, function (__$el) {

				base.toggle(__$el, false);

			});

		},
		//- 스위치 토글
		toggle: function (__elements) {

			// ? __elements:element

			var $elements = mm.ui.element(base._dataName, __elements);

			_.forEach($elements, function (__$el) {

				base.toggle(__$el);

			});

		},
	};

})();
//> 스위치(토글)

//< 드롭다운(아코디언)
mm.dropdown = (function () {

	// $el['__mm.data__'].name에 저장할 기본 값
	var initial = {
		_classOn: '__dropdown-on',// ? :string
		_time: 0,// ? :number/string - 모션 시간(초), 'auto'(mm.time.fast)
		_group: null,// ? :string - 아코디언으로 연결할 고유 값
		_isGroupToggle: true,// ? :boolean - 아코디언에서 열려있는 요소 닫기 가능
		_isReturnParams: true,// ? :boolean - onChange의 1번째 인자로 true/false 전달 여부
		onChange: null,// ? :function
		onChangeParams: [],// ? :array - onChange의 2번째 이후 아규먼트로 전달
		// 내부사용
		__: {
			_is: null,// ? boolean - 변경된 항목 확인 용도
		},
	};
	// 드롭다운 요소가 table 요소이면, initial._time 값이 0으로 적용
	// initial._isGroupToggle 값이 false이면, 아코디언에서 열려있는 요소 닫기 불가
	// onChange의 1번째 argumants(boolean)로 상태 전달(true 열림, false 닫힘)

	// UI 고유 객체
	var base = {
		get _dataName() { return 'data-dropdown'; },// 데이타 속성 이름
		// 내부 요소 검색
		find: function (__elements, __$ui) {

			// ? __elements:element
			// ? __$ui:element - 드롭다운 단일 요소

			var $elements = mm.find(__elements, __$ui);
			return _.find($elements, function (__$el) { return __$el.closest(mm.selector(base._dataName, '[]')) === __$ui; });

		},
		toggle: function (__$ui, __is, __time) {

			// ? __$ui:element - 드롭다운 단일 요소
			// ? __is:boolean - 드롭다운 열림 여부
			// ? __time:number - 토글되는 시간(초)
			// __is 값이 없으면 토글 적용

			if (!__$ui) return;

			var data = mm.data.get(__$ui, base._dataName);
			if (mm.is.empty(data)) data = mm.data.set(__$ui, base._dataName, { initial: initial });

			if (typeof(__is) === 'boolean' && data.__._is === __is) return;// 중복 방지를 위해 변경이 안된 요소 제외

			var $btn = base.find('.btn_dropdown', __$ui);
			var $item = base.find('.mm_dropdown-item', __$ui);
			var _isTable = $item.tagName === 'TBODY' || $item.tagName === 'TR';
			var _is = (typeof(__is) === 'boolean') ? __is : !__$ui.classList.contains(data._classOn);
			var _time = (Number.isFinite(__time)) ? __time : (__time === 'auto' || data._time === 'auto') ? mm.time._fast : 0;

			data.__._is = __is;

			if (_isTable) _time = 0;

			if (_is) {
				__$ui.classList.add(data._classOn);
				$btn.setAttribute('title', '접어놓기');

				if (_isTable) mm.element.show($item);
				else {
					if (_time > 0) gsap.to($item, { height: mm.find('> .mm_dropdown-item-inner', $item)[0].offsetHeight, duration: _time, ease: 'cubic.out' });
					else mm.element.style($item, { 'height': 'auto' });
				}

				// 그룹 닫기(아코디언 모션)
				var $groups = mm.find(mm.string.template('[${KEY}*="\'_group\'"][${KEY}*="${GROUP}"]', { KEY: base._dataName, GROUP: data._group }));
				$groups = _.reject($groups, function (__$group) { return __$group === __$ui; });// 현재 요소 제외

				_.forEach($groups, function (__$group) {

					base.toggle(__$group, false, _time);

				});

				mm.ui.update($item);
			}
			else {
				__$ui.classList.remove(data._classOn);
				$btn.setAttribute('title', '펼쳐보기');

				if (_isTable) mm.element.hide($item);
				else {
					if (_time > 0) gsap.to($item, { height: 0, duration: _time, ease: 'cubic.out' });
					else mm.element.style($item, { 'height': '' });
				}
			}

			var params = (data._isReturnParams) ? [_is].concat(data.onChangeParams) : data.onChangeParams;
			mm.apply(data.onChange, __$ui, params);

			if (__$ui.closest('.mm_modal')) mm.modal.resize();// 모달팝업 리사이즈
			else if (mm._isFrame) mm.frameResize();// 컨텐츠 아이프레임 리사이즈

		},
	};

	// private
	(function () {

		mm.delegate.on(document, mm.string.template('[${UI}] .btn_dropdown', { UI: base._dataName }), 'click', function (__e) {

			__e.preventDefault();

			var $dropdown = this.closest(mm.selector(base._dataName, '[]'));
			var data = mm.data.get($dropdown, base._dataName);
			if (mm.is.empty(data)) data = mm.data.set($dropdown, base._dataName, { initial: initial });

			if (!data._group || data._isGroupToggle === true) base.toggle($dropdown);
			else if (!$dropdown.classList.contains(data._classOn)) base.toggle($dropdown, true);

		});

	})();

	// public
	return {
		//- 드롭다운 연결
		update: function (__elements) {

			// ? __elements:element

			var $elements = mm.ui.element(base._dataName, __elements);
			$elements = _.filter($elements, function (__$el) { return mm.is.display(__$el); });// 숨겨진 요소 제외

			_.forEach($elements, function (__$el) {

				var data = mm.data.get(__$el, base._dataName);
				if (mm.is.empty(data)) data = mm.data.set(__$el, base._dataName, { initial: initial });

				base.toggle(__$el, __$el.classList.contains(data._classOn), 0);

			});

		},
		//- 드롭다운 열기
		open: function (__elements, __time) {

			// ? __elements:element
			// ? __time:number - 토글되는 시간(초)

			var $elements = mm.ui.element(base._dataName, __elements);

			_.forEach($elements, function (__$el) {

				base.toggle(__$el, true, __time);

			});

		},
		//- 드롭다운 닫기
		close: function (__elements, __time) {

			// ? __elements:element
			// ? __time:number - 토글되는 시간(초)

			var $elements = mm.ui.element(base._dataName, __elements);

			_.forEach($elements, function (__$el) {

				base.toggle(__$el, false, __time);

			});

		},
		//- 드롭다운 토글
		toggle: function (__elements, __time) {

			// ? __elements:element
			// ? __time:number - 토글되는 시간(초)

			var $elements = mm.ui.element(base._dataName, __elements);

			_.forEach($elements, function (__$el) {

				base.toggle(__$el, null, __time);

			});

		},
	};

})();
//> 드롭다운(아코디언)

//< 탭
mm.tab = (function () {

	// $el['__mm.data__'].name에 저장할 기본 값
	var initial = {
		_classOn: '__tab-on',// ? :string
		_classBtn: 'btn_tab',// ? :string
		_title: '선택됨',// ? :string - on일 때 적용할 title 속성 값
		_isToggle: false,// ? :boolean - 열려있는 요소 닫기 가능
		onChange: null,// ? :function
		onChangeParams: [],// ? :array - onChange의 1번째 이후 아규먼트로 전달
	};

	// UI 고유 객체
	var base = {
		get _dataName() { return 'data-tab'; },// 데이타 속성 이름
		// 탭 내부 요소 검색
		find: function (__elements, __$ui) {

			// ? __elements:element
			// ? __$ui:element - 탭 단일 요소

			var $elements = mm.find(__elements, __$ui);

			return _.filter($elements, function (__$el) { return __$el.closest(mm.selector(base._dataName, '[]')) === __$ui; });

		},
		// 탭 변경
		change: function (__$ui, __target) {

			// ? __$ui:element - 탭 단일 요소
			// ? __target:number - 변경할 인덱스
			// ? __target:element - 클릭한 탭 메뉴 또는 변경할 탭 컨텐츠
			// __target 값이 없으면 tagIndex의 해당 요소에 적용

			var data = mm.data.get(__$ui, base._dataName);
			if (mm.is.empty(data)) data = mm.data.set(__$ui, base._dataName, { initial: initial });

			var $btns = base.find(mm.selector(data._classBtn, '.'), __$ui);
			var $items = base.find('.mm_tab-item', __$ui);
			var _isTarget = !mm.is.empty(__target);

			var _index;
			if (!_isTarget) _index = base.index(__$ui);
			else {
				if (Number.isFinite(__target)) _index = (__target < 0) ? 0 : __target;
				else if (mm.is.element(__target, true)) {
					if (__target.classList.contains(data._classBtn)) _index = mm.element.index($btns, __target);
					else if (__target.classList.contains('mm_tab-item')) _index = mm.element.index($items, __target);
				}
			}
			if (!Number.isFinite(_index)) return;

			if (_isTarget && _index === mm.element.index($btns, mm.selector(data._classOn, '.'))) {
				if (data._isToggle === true) _index = -1;
				else return;
			}

			_.forEach($btns, function (__$btn, __i) {

				if (__i === _index) {
					__$btn.setAttribute('title', data._title);
					__$btn.classList.add(data._classOn);
					$items[__i].classList.add(data._classOn);
				}
				else {
					__$btn.removeAttribute('title');
					__$btn.classList.remove(data._classOn);
					$items[__i].classList.remove(data._classOn);
				}

			});

			if (_index > -1) mm.ui.update($items[_index]);
			if (mm._isFrame) mm.frameResize();// 컨텐츠 아이프레임 리사이즈

			mm.apply(data.onChange, __$ui, [{ _index: _index, $buttons: $btns, $items: $items }].concat(data.onChangeParams));

		},
		// 탭 인덱스
		index: function (__$ui) {

			// ? __$ui:element - 탭 단일 요소

			var data = mm.data.get(__$ui, base._dataName);
			if (mm.is.empty(data)) data = mm.data.set(__$ui, base._dataName, { initial: initial });

			var $btns = base.find(mm.selector(data._classBtn, '.'), __$ui);
			var _index = mm.element.index($btns, mm.selector(data._classOn, '.'));

			return (_index < 0) ? 0 : _index;

		},
	};

	// private
	(function () {

		mm.delegate.on(document, mm.string.template('[${UI}] a, [${UI}] button', { UI: base._dataName }), 'click', function (__e) {

			var $ui = this.closest(mm.selector(base._dataName, '[]'));
			var data = mm.data.get($ui, base._dataName);
			if (mm.is.empty(data)) data = mm.data.set($ui, base._dataName, { initial: initial });

			if (this.classList.contains(data._classBtn)) {
				__e.preventDefault();

				base.change($ui, this);
			}

		});

	})();

	// public
	return {
		//- 탭 연결
		update: function (__elements) {

			// ? __elements:element

			var $elements = mm.ui.element(base._dataName, __elements);
			$elements = _.filter($elements, function (__$el) { return mm.is.display(__$el); });// 숨겨진 요소 제외

			_.forEach($elements, function (__$el) {

				base.change(__$el);

			});

		},
		//- 탭 변경
		change: function (__elements, __target) {

			// ? __elements:element
			// ? __target:number - 노출할 탭 index
			// ? __target:element - 노출할 탭 요소
			// __target 값이 없으면 mm_tab에서 __tab-on 클래스가 있는 요소의 index에 적용

			var $elements = mm.ui.element(base._dataName, __elements);

			_.forEach($elements, function (__$el) {

				base.change(__$el, __target);

			});

		},
		//- 탭 인덱스
		index: function (__element) {

			// ? __element:element - 단일 요소

			var $element = mm.ui.element(base._dataName, __element)[0];
			if (!$element) return -1;

			return base.index($element);

		},
	};

})();
//> 탭

//< 캐러셀(영역 전체 이동)
mm.carousel = (function () {

	// $el['__mm.data__'].name에 저장할 기본 값
	var initial = {
		_index: 0,// ? :number
		_effect: 'slide',// ? :string - slide, fade, cover/strip, none(직접 제어)
		_direction: 'horizontal',// ? :string - horizontal, vertical
		_autoDelay: 0,// ? :number - 자동 롤링 간격(초), 값이 0이면 자동 롤링 안함
		_speed: 0.2,// ? :number - 움직임 시간(초)
		_sensitiveTime: 0.2,// ? :number - 짧게 움직였을 때 반응할 시간(초)
		_isAutoHeight: false,// ? :boolean - 높이 자동 조절
		_isPreload: true,// ? :boolean - 재정렬 될 때 노출되는 요소 미리 로드
		_isErrorRemove: false,// ? :boolean - 프리로드 요소가 오류일 때 mm_carousel-item 요소 삭제
		_isMoreSide: false,// ? :boolean - 보여지는 요소 외 추가 이동(update)
		_classOn: '__carousel-on',// ? :string
		_classClone: '__carousel-clone',// ? :string
		pagination: {
			_isInner: true,// ? :boolean - 페이지네이션 버튼을 ui 안에서 찾기
			_el: '.btn_carousel-page',
		},
		control: {
			_isInner: true,// ? :boolean - 컨트롤 버튼을 ui 안에서 찾기
			_prev: '.btn_carousel-prev',// ? :string - 이전 버튼 셀렉터
			_next: '.btn_carousel-next',// ? :string - 다음 버튼 셀렉터
		},
		count: {
			_isInner: true,// ? :boolean - 카운터를 ui 안에서 찾기
			_pad: '0',// ? :string - 자리수가 적을 때 padStart 적용할 문자
			_el: '.mm_carousel-count',
		},
		onReady: null,// ? :function - 캐러셀 준비 상태
		onReadyParams: [],// ? :array
		onUpdate: null,// ? :function - 캐러셀 이동 중
		onUpdateParams: [],// ? :array - 1번째 파라미터로 nextIndex, 2번째 파라미터로 directionIndex 전달
		onStart: null,// ? :function - 캐러셀 이동 시작
		onStartParams: [],// ? :array - 1번째 파라미터로 변경여부(boolean) 전달
		onComplete: null,// ? :function - 캐러셀 이동 완료
		onCompleteParams: [],// ? :array - 1번째 파라미터로 변경여부(boolean) 전달
		// 내부사용
		__: {
			_oldIndex: null,// ? :number - 이동에 따른 이전 _index 값
			_updateValue: null,// ? :number - motion이 진행되면서 변경되는 값
			_isDirection: null,// ? :boolean - 터치 이동 방향이 맞음(app_page-common에서 iframe 내부 터치 스크롤에서도 사용)
			interval: null,// ?
			$items: [],// ? :array
			$pages: [],// ? :array
			$count: null,// ? :element
		},
	};

	// UI 고유 객체
	var base = {
		get _dataName() { return 'data-carousel'; },// 데이타 속성 이름
		// 업데이트
		update: function (__$element) {

			// ? __$element:element - 단일 요소

			var data = mm.data.get(__$element, base._dataName);
			if (data.__.$items.length > 0) return;// 이미 업데이트

			var $inner = mm.find('.mm_carousel-inner', __$element)[0];
			var $items = data.__.$items = mm.find('.mm_carousel-item', $inner);
			if ($items.length === 0) return;

			var $btnPages = (data.pagination._isInner) ? mm.find(data.pagination._el, __$element) : mm.find(data.pagination._el);
			var $btnPrev = (data.control._isInner) ? mm.find(data.control._prev, __$element)[0] : mm.find(data.control._prev)[0];
			var $btnNext = (data.control._isInner) ? mm.find(data.control._next, __$element)[0] : mm.find(data.control._next)[0];
			var $count = (data.count._isInner) ? mm.find(data.count._el, __$element)[0] : mm.find(data.count._el)[0];

			if ($btnPages.length > 0) data.__.$pages = $btnPages;
			if ($count) data.__.$count = $count;

			__$element.classList.add('__carousel-ready');// update가 적용될 때 figcaption 노출

			// 요소가 1개일 때
			if ($items.length === 1) {
				$items[0].classList.add(data._classOn);
				mm.element.remove([$btnPrev, $btnNext, $count]);
				mm.element.remove($btnPages);
				base.set(__$element);

				mm.apply(data.onReady, __$element, data.onReadyParams);
				return;
			}

			data.__._oldIndex = data._index;

			_.forEach($items, function (__$item, __index) {

				if (__index === data._index) {
					__$item.classList.add(data._classOn);
					if ($btnPages.length > 0) $btnPages[__index].classList.add(data._classOn);
				}

			});

			// 부족한 개수 복제
			// data.__.$items.constructor가 HTMLCollection으로 clone 요소가 data.__.$items에 자동으로 추가 됨
			if ($items.length === 2 || (data._effect === 'slide' && $items.length === 3)) {
				_.forEach($items, function (__$item) {

					if (__$item.parentElement.classList.contains('mm_carousel-group')) return false;// 그룹으로 묶여 있으면 클론 안됨

					var $clone = __$item.cloneNode(true);
					$clone.classList.remove(data._classOn);
					$clone.classList.add(data._classClone);
					mm.element.attribute($clone, { 'tabindex': '-1' });
					__$item.parentElement.append($clone);

					mm.preload.destroy($clone);
					mm.preload.update($clone);
					mm.lazyload.destroy($clone);
					mm.lazyload.update($clone);

				});
			}

			// touch event
			mm.event.on($inner, 'mousedown', function carouselTouchStartInlineHandler(__e) {

				if (gsap.isTweening(data.__)) return;// 움직임 중에는 리턴

				clearInterval(data.__.interval);
				mm.time.stamp('carousel');

				var startTouch = { screenX: __e.clientX, screenY: __e.clientY };
				var _touchCount = 0;// 터치 이벤트 실행 감도(순간 터치 시 이동 방지)
				data.__._isDirection = null;

				mm.event.on(document, 'mousemove mouseup', function carouselTouchInlineHandler(__e) {

					__e.preventDefault();

					var touch = { screenX: __e.clientX, screenY: __e.clientY };

					if (data.__._isDirection === null) {
						var _moveX = Math.abs(touch.screenX - startTouch.screenX);
						var _moveY = Math.abs(touch.screenY - startTouch.screenY);
						var _limit = 0.7;

						if (data._direction === 'horizontal' && _moveX / _moveY > _limit) data.__._isDirection = true;
						else if (data._direction === 'vertical' && _moveY / _moveX > _limit) data.__._isDirection = true;
						else mm.event.off(document, 'mousemove mouseup', carouselTouchInlineHandler);

						return;
					}
					else if (data.__._isDirection === true) {
						data.__._updateValue = (data._direction === 'horizontal') ? (startTouch.screenX - touch.screenX) / $inner.offsetWidth : (startTouch.screenY - touch.screenY) / $inner.offsetHeight;

						var _index = (data.__._updateValue > 0) ? data._index + 1 : data._index - 1;
						var _direction = (_index > data._index) ? 'next' : 'prev';
						_index = (_index < 0) ? data.__.$items.length - 1 : (_index > data.__.$items.length - 1) ? 0 : _index;

						if (__e.type === 'mousemove') base.gsapUpdate(__$element, _index, data._index, _direction);
						else {
							var _touchTime = mm.time.stampEnd('carousel') / 1000;// 빠른 드래그 확인
							var _threshold = (_touchCount > 1 && _touchTime < data._sensitiveTime) ? 0.005 : 0.5;// 화면의 0.5% : 50%

							base.gsapTo(__$element, _index, _direction, 'cubic.out', Math.abs(data.__._updateValue) < _threshold);
						}

						_touchCount++;
					}

					if (__e.type === 'mouseup') {
						mm.event.off(document, 'mousemove mouseup', carouselTouchInlineHandler);
						base.interval(__$element);
					}

				});

			});

			// mouse event
			mm.event.on($inner, 'mouseover mouseleave', function carouselMouseInlineHandler(__e) {

				switch (__e.type) {
					case 'mouseover':
						clearInterval(data.__.interval);
						break;
					case 'mouseleave':
						base.interval(__$element);
						break;
				}

			});
			mm.event.on($inner, 'click', function carouselMouseInlineHandler(__e) {

				// 클릭 링크 방지
				if (data.__._isDirection) {
					__e.preventDefault();
					__e.stopPropagation();
				}

			}, { _isCapture: true });

			// control
			if ($btnPrev) {
				mm.event.on($btnPrev, 'click', function carouselPrevInlineHandler(__e) {

					var _index = data._index - 1;
					if (_index < 0) _index = data.__.$items.length - 1;
					base.change(__$element, _index, 'prev');
					base.interval(__$element);

				}, { _isOverwrite: true });
			}
			if ($btnNext) {
				mm.event.on($btnNext, 'click', function carouselNextInlineHandler(__e) {

					var _index = data._index + 1;
					if (_index > data.__.$items.length - 1) _index = 0;
					base.change(__$element, _index, 'next');
					base.interval(__$element);

				}, { _isOverwrite: true });
			}

			// pagination
			if ($btnPages.length > 0) {
				mm.event.on($btnPages, 'click', function carouselPageInlineHandler(__e) {

					var _index = mm.element.index($btnPages, this);
					if (_index !== base._index) {
						base.change(__$element, _index);
						base.interval(__$element);
					}

				}, { _isOverwrite: true });
			}

			base.reposition(__$element);
			base.set(__$element);
			base.interval(__$element);

			mm.apply(data.onReady, __$element, data.onReadyParams);

		},
		// 모션
		gsapTo: function (__$element, __index, __direction, __ease, __isBack) {

			// ? __$element:element - 단일 요소
			// ? __index:number - 변경할 인덱스
			// ? __direction:string - next, prev
			// ? __ease:string
			// ? __isBack:boolean - 제자리로 되돌아감

			var data = mm.data.get(__$element, base._dataName);

			gsap.to(data.__, {
				_updateValue: (__isBack === true) ? 0 : (__direction === 'next') ? 1 : -1,
				duration: data._speed,
				ease: __ease,
				onUpdate: function () {

					if (__isBack === true) base.gsapUpdate(__$element, __index, data._index, __direction, __isBack);
					else base.gsapUpdate(__$element, data._index, data.__._oldIndex, __direction, __isBack);

				},
				onStart: function () {

					if (!__isBack) {
						data.__._oldIndex = data._index;
						data._index = __index;

						mm.element.hide(_.reject(data.__.$items, function (__$item, __index) { return __index === data.__._oldIndex || __index === data._index; }));
						if (!mm.is.display(data.__.$items[data._index])) mm.element.show(data.__.$items[data._index]);

						base.set(__$element);
					}

					mm.apply(data.onStart, __$element, [!__isBack].concat(data.onStartParams));

				},
				onComplete: function () {

					base.reposition(__$element);

					mm.apply(data.onComplete, __$element, [!__isBack].concat(data.onCompleteParams));

				}
			});

		},
		// 모션 진행 중
		gsapUpdate: function (__$element, __index, __oldIndex, __direction, __isBack) {

			// ? __$element:element - 단일 요소
			// ? __index:number
			// ? __oldIndex:number
			// ? __direction:string - next, prev
			// ? __isBack:boolean - 제자리로 되돌아감

			var data = mm.data.get(__$element, base._dataName);
			var $oldItem = data.__.$items[__oldIndex];
			var $item = data.__.$items[__index];
			var _value;

			if (!mm.is.display($item)) {
				mm.element.show($item);
				mm.preload.update($item);
			}

			mm.element.style(data.__.$items, { 'z-index': '' });

			if (data._direction === 'horizontal') {
				switch (data._effect) {
					case 'slide':
						_value = -data.__._updateValue * 100;
						mm.element.style($oldItem, { 'transform': mm.string.template('translateX(${VALUE}%)', { VALUE: _value }) });
						mm.element.style($item, { 'z-index': 2, 'transform': mm.string.template('translateX(${VALUE}%)', { VALUE: (__direction === 'next') ? _value + 100 : _value - 100 }) });

						if (data.__.$items.length > 2) {
							var $sideItem = _.nth(data.__.$items, (__direction === 'next') ? __oldIndex - 1 : __oldIndex + 1 - data.__.$items.length);
							mm.element.style($sideItem, { 'z-index': 2, 'transform': mm.string.template('translateX(${VALUE}%)', { VALUE: (__direction === 'next') ? _value - 100 : _value + 100 }) });

							if (data._isMoreSide === true) {
								var $moreItem = _.nth(data.__.$items, (__direction === 'next') ? __index + 1 - data.__.$items.length : __index - 1);
								mm.element.show($moreItem);
								mm.element.style($moreItem, { 'transform': mm.string.template('translateX(${VALUE}%)', { VALUE: (__direction === 'next') ? _value + 200 : _value - 200 }) });
							}
						}
						break;
					case 'fade':
						if (__direction === 'next') {
							mm.element.style($oldItem, { 'opacity': 1 });
							mm.element.style($item, { 'z-index': 2, 'opacity': data.__._updateValue });
						}
						else {
							mm.element.style($item, { 'opacity': 1 });
							mm.element.style($oldItem, { 'z-index': 2, 'opacity': data.__._updateValue + 1 });
						}
						break;
					case 'cover':
						if (__direction === 'next') {
							mm.element.style($oldItem, { 'transform': 'translateX(0%)' });
							mm.element.style($item, { 'z-index': 2, 'transform': mm.string.template('translateX(${VALUE}%)', { VALUE: -data.__._updateValue * 100 + 100 }) });

							if (data._isMoreSide === true) {
								var $moreItem = _.nth(data.__.$items, __index + 1 - data.__.$items.length);
								mm.element.show($moreItem);
								mm.preload.update($moreItem);
							}
						}
						else {
							mm.element.style($item, { 'transform': 'translateX(0%)' });
							mm.element.style($oldItem, { 'z-index': 2, 'transform': mm.string.template('translateX(${VALUE}%)', { VALUE: -data.__._updateValue * 100 }) });
						}
						break;
					case 'strip':
						if (__direction === 'next') {
							mm.element.style($item, { 'transform': 'translateX(0%)' });
							mm.element.style($oldItem, { 'z-index': 2, 'transform': mm.string.template('translateX(${VALUE}%)', { VALUE: -data.__._updateValue * 100 }) });
						}
						else {
							mm.element.style($oldItem, { 'transform': 'translateX(0%)' });
							mm.element.style($item, { 'z-index': 2, 'transform': mm.string.template('translateX(${VALUE}%)', { VALUE: -data.__._updateValue * 100 - 100 }) });
						}
						break;
					case 'none':
						break;
				}
			}
			else {
			}

			mm.apply(data.onUpdate, __$element, [__index, __oldIndex, __direction].concat(data.onUpdateParams));

		},
		// 변경
		change: function (__$element, __index, __direction) {

			// ? __$element:element - 단일 요소
			// ? __index:number - 변경할 인덱스
			// ? __direction:string - next, prev
			// __direction 값이 없으면 __index 값을 비교하여 방향 적용

			var data = mm.data.get(__$element, base._dataName);
			if (gsap.isTweening(data.__) || data._index === __index) return;// 모션 중 또는 값이 같으면 변경 안됨

			var _direction = (__direction) ? __direction : (__index > data._index) ? 'next' : 'prev';
			data.__._updateValue = 0;
			base.gsapTo(__$element, __index, _direction, (data._effect === 'fade') ? 'sine.out': 'sine.inOut');

		},
		// 변경 값 적용(count, autoHeight)
		set: function (__$element) {

			// ? __$element:element - 단일 요소

			var data = mm.data.get(__$element, base._dataName);

			// pagination
			if (data.__.$pages.length > 0) {
				mm.class.remove(data.__.$pages, data._classOn);

				if (data.__.$items[data._index].classList.contains(data._classClone) && data._index >= data.__.$pages.length) data.__.$pages[data._index - data.__.$pages.length].classList.add(data._classOn);// clone
				else data.__.$pages[data._index].classList.add(data._classOn);
			}

			// count
			if (data.__.$count) {
				var _total = _.reject(data.__.$items, function (__$item) { return __$item.classList.contains(data._classClone); }).length;
				var _index = data._index + 1;
				var _pad = data.count._pad || '';
				if (_index > _total) _index -= _total;
				mm.find('.text_carousel-index', data.__.$count)[0].textContent = String(_index).padStart(_pad.length, _pad);
				mm.find('.text_carousel-total', data.__.$count)[0].textContent = String(_total).padStart(_pad.length, _pad);
			}

			// autoHeight
			if (data._isAutoHeight) {
				gsap.to(mm.find('.mm_carousel-list', __$element)[0], { height: data.__.$items[data._index].offsetHeight, duration: data._speed, ease: 'cubic.out' });
			}

		},
		// 재정렬
		reposition: function (__$element) {

			// ? __$element:element - 단일 요소

			var data = mm.data.get(__$element, base._dataName);
			var $items = data.__.$items;

			mm.class.remove($items, data._classOn);
			mm.element.hide($items);

			for (var _i = 0; _i < $items.length; _i++) {
				// 0 현재, 1 이전, length - 1 다음
				var $item = _.nth($items, data._index - _i);
				if (_i === 0) $item.classList.add(data._classOn);

				if (data._direction === 'horizontal') {
					switch (data._effect) {
						case 'slide':
							mm.element.style($item, { 'transform': mm.string.template('translateX(${VALUE}%)', { VALUE: (_i === 0) ? 0 : (_i === 1) ? -100 : 100 }) });
							if (_i < 2 || _i === $items.length - 1) mm.element.show($item);
							break;
						case 'fade':
							mm.element.style($item, { 'z-index': '', 'opacity': (_i === 0) ? 1 : 0 });
							if (_i < 2 || _i === $items.length - 1) mm.element.show($item);
							break;
						case 'cover':
							mm.element.style($item, { 'transform': mm.string.template('translateX(${VALUE}%)', { VALUE: (_i === 0) ? 0 : 100 }) });
							if (_i === 0 || _i === $items.length - 1) mm.element.show($item);
							break;
						case 'strip':
							mm.element.style($item, { 'transform': mm.string.template('translateX(${VALUE}%)', { VALUE: (_i === 0) ? 0 : -100 }) });
							if (_i < 2) mm.element.show($item);
							break;
						case 'none':
							break;
					}
				}
				else {
				}
			}

			if (data._isPreload === true) mm.preload.update($items);// 이전/다음 요소 미리 로드

			return;

		},
		// 자동롤링
		interval: function (__$element) {

			// ? __$element:element - 단일 요소

			var data = mm.data.get(__$element, base._dataName);
			clearInterval(data.__.interval);

			if (data._autoDelay > 0) {
				data.__.interval = setInterval(function () {

					if (!mm.is.display(__$element)) return;// 화면에서 안보일 때는 변경 안됨

					var _index = data._index + 1;
					if (_index > data.__.$items.length - 1) _index = 0;

					base.change(__$element, _index, 'next');

				}, data._autoDelay * 1000);
			}

		},
	};

	// private
	(function () {

		//

	})();

	// public
	return {
		//- 캐러셀 연결
		update: function (__elements) {

			// ? __elements:element

			var $elements = mm.ui.element(base._dataName, __elements);
			$elements = _.filter($elements, function (__$el) { return mm.is.display(__$el); });// 숨겨진 요소 제외

			_.forEach($elements, function (__$el) {

				var data = mm.data.get(__$el, base._dataName);
				if (mm.is.empty(data)) data = mm.data.set(__$el, base._dataName, { initial: initial });
				var $inner = mm.find('.mm_carousel-inner', __$el)[0];
				var $loadItems = mm.find(mm.selector(['data-preload', 'data-lazyload'], '[]'), $inner);

				// 프리로드 확인(전체 미리 로드)
				if ($loadItems.length > 0 && (data._isErrorRemove === true || data._isAutoHeight === true)) {
					_.forEach($loadItems, function (__$item) {

						// 확인을 위해 lazyload 대신 preload 사용하고 _isPass 적용
						var itemData = mm.data.get(__$item, (__$item.hasAttribute('data-lazyload')) ? 'data-lazyload' : 'data-preload', true);
						itemData._isPass = true;
						mm.element.attribute(__$item, { 'data-lazyload': '', 'data-preload': itemData });

					});
					var _loadCount = 0;

					(function callee(__is) {

						// 성공, 오류
						if (typeof(__is) === 'boolean') {
							if (__is === false && data._isErrorRemove === true) this.closest('.mm_carousel-item').remove();// 오류 아이템 삭제

							_loadCount++;
							if (_loadCount === $loadItems.length) {
								data._isPreload = false;
								data._isErrorRemove = false;
								base.update(__$el);
							}
						}
						else mm.preload.force($loadItems, { onComplete: callee, onCompleteParams: [true], onError: callee, onErrorParams: [false] });

					})();
				}
				else base.update(__$el);

			});

		},
		//- 캐러셀 변경
		change: function (__elements, __index, __direction) {

			// ? __elements:element
			// ? __index:number - 변경할 인덱스
			// ? __direction:string - next, prev
			// __direction 값이 없으면 __index 값을 비교하여 방향 적용

			var $elements = mm.ui.element(base._dataName, __elements);

			_.forEach($elements, function (__$el) {

				var data = mm.data.get(__$el, base._dataName);
				if (!data || data._index === __index || __index > data.__.$items.length - 1 || __index < 0) return;

				base.change(__$el, __index, __direction);

			});

		},
		//- 캐러셀 항목 추가/삭제로 인한 재정렬
		reload: function (__elements) {

			// ? __elements:element

			var $elements = mm.ui.element(base._dataName, __elements);

			_.forEach($elements, function (__$el) {

				var data = mm.data.get(__$el, base._dataName);
				if (!data) return;// 적용된 캐럴셀이 없음

				clearInterval(data.__.interval);
				gsap.killTweensOf(data.__);

				var _itemTotal = data.__.$items.length;
				_.forEach(mm.object.values(data.__.$items), function (__$item, __index) {

					if (__$item.classList.contains(data._classClone)) {
						__$item.remove();
						if (__index === data._index) data._index = Math.floor(__index / (_itemTotal / 2));
					}

				});

				data.__.$items = [];
				data.__$pages = [];
				data.__$count = null;

				var $inner = mm.find('.mm_carousel-inner', __$el)[0];
				mm.event.off($inner, 'mousedown', 'carouselTouchStartInlineHandler');
				mm.event.on($inner, 'mouseenter mouseleave click', 'carouselMouseInlineHandler');

				base.update(__$el);

			});

		},
		//- autoplay
		play: function (__elements, __autoDelay) {

			// ? __elements:element
			// ? __autoDelay:number - 자동 롤링 간격(초), 값이 0이면 자동 롤링 안함

			var $elements = mm.ui.element(base._dataName, __elements);

			_.forEach($elements, function (__$el) {

				if (Number.isFinite(__autoDelay)) {
					var data = mm.data.get(__$el, base._dataName);
					data._autoDelay = __autoDelay;
				}
				base.interval(__$el);

			});

		},
		stop: function (__elements) {

			// ? __elements:element

			var $elements = mm.ui.element(base._dataName, __elements);

			_.forEach($elements, function (__$el) {

				var data = mm.data.get(__$el, base._dataName);
				clearInterval(data.__.interval);

			});

		},
	};

})();
//> 캐러셀

//< 슬라이더(영역 좌우 이동, 모바일에서는 기본 가로 스크롤로 사용)
mm.slider = (function () {

	// $el['__mm.data__'].name에 저장할 기본 값
	var initial = {
		_index: 0,// ? :number
		_direction: 'horizontal',// ? :string - horizontal, vertical
		_autoDelay: 0,// ? :number - 자동 롤링 간격(초), 값이 0이면 자동 롤링 안함
		_speed: 0.2,// ? :number - 움직임 시간(초)
		_sensitiveTime: 0.2,// ? :number - 짧게 움직였을 때 반응할 시간(초)
		_rootMargin: '10px 0px',// ? :string - intersection observer 영역의 rootMargin
		_isLoop: true,// ? : boolean - 슬라이더 반복
		_isErrorRemove: false,// ? :boolean - 프리로드 요소가 오류일 때 mm_slider-item 요소 삭제
		_classIntersecting: '__slider-intersecting',// ? :string - 영역 내 intersecting 된 전체 요소
		_classOn: '__slider-on',// ? :string - 영역 내 온전히(ratio 1) 노출된 전체 요소
		_classClone: '__slider-clone',// ? :string
		pagination: {
			_isInner: true,// ? :boolean - 페이지네이션 버튼을 ui 안에서 찾기
			_el: '.btn_slider-page',
		},
		control: {
			_isInner: true,// ? :boolean - 컨트롤 버튼을 ui 안에서 찾기
			_prev: '.btn_slider-prev',// ? :string - 이전 버튼 셀렉터
			_next: '.btn_slider-next',// ? :string - 다음 버튼 셀렉터
		},
		onReady: null,// ? :function - 슬라이더 준비 상태
		onReadyParams: [],// ? :array
		onUpdate: null,// ? :function - 슬라이더 이동 중
		onUpdateParams: [],// ? :array - 1번째 파라미터로 nextIndex, 2번째 파라미터로 directionIndex 전달
		onStart: null,// ? :function - 슬라이더 이동 시작
		onStartParams: [],// ? :array - 1번째 파라미터로 변경여부(boolean) 전달
		onComplete: null,// ? :function - 슬라이더 이동 완료
		onCompleteParams: [],// ? :array - 1번째 파라미터로 변경여부(boolean) 전달
		onActive: null,// ? :function - 이동 후 영역 내 첫 번째 항목에 active 클래스 추가
		onActiveParams: [],// ? :array - 1번째 파라미터로 변경여부(boolean) 전달
		// 내부사용
		__: {
			_total: 0,// ? :number - 클론을 제외한 items 개수
			_updateValue: null,// ? :number - motion이 진행되면서 변경되는 값
			_isDirection: null,// ? :boolean - 터치 이동 방향이 맞음(app_page-common에서 iframe 내부 터치 스크롤에서도 사용)
			interval: null,// ?
			$items: [],// ? :array - 클론 포함
			$activeItem: null,// ? :element
			$pages: [],// ? :array
			$inner: null,
			$list: null,
			$btnPrev: null,
			$btnNext: null,
			innerPadding: {
				left: 0,
				right: 0,
			}
		},
	};

	// UI 고유 객체
	var base = {
		get _dataName() { return 'data-slider'; },// 데이타 속성 이름
		// 업데이트
		update: function (__$element) {

			// ? __$element:element - 단일 요소

			var data = mm.data.get(__$element, base._dataName);
			if (data.__.$items.length > 0) return;// 이미 업데이트

			var $btnPages = (data.pagination._isInner) ? mm.find(data.pagination._el, __$element) : mm.find(data.pagination._el);
			var $inner = data.__.$inner = mm.find('.mm_slider-inner', __$element)[0];
			var $list = data.__.$list = mm.find('.mm_slider-list', __$element)[0];
			var $items = data.__.$items = mm.find('.mm_slider-item', $list);
			if ($items.length === 0) return;

			var $btnPrev = data.__.$btnPrev = (data.control._isInner) ? mm.find(data.control._prev, __$element)[0] : mm.find(data.control._prev)[0];
			var $btnNext = data.__.$btnNext = (data.control._isInner) ? mm.find(data.control._next, __$element)[0] : mm.find(data.control._next)[0];

			if ($btnPages.length > 0) data.__.$pages = $btnPages;

			data.__._total = $items.length;
			__$element.classList.add('__slider-ready');// update가 적용될 때 figcaption 노출

			var innerStyle = mm.element.style($inner);
			data.__.innerPadding = { left: parseFloat(innerStyle.paddingLeft), right: parseFloat(innerStyle.paddingRight) }

			// 요소 width가 영역보다 작을 때
			if ($list.offsetWidth <= $inner.offsetWidth - data.__.innerPadding.left - data.__.innerPadding.right) {
				mm.class.add($items, [data._classIntersecting, data._classOn]);
				mm.element.remove([$btnPrev, $btnNext]);
				mm.element.remove($btnPages);
				mm.element.style($inner, { 'text-align': 'center' });

				mm.apply(data.onReady, __$element, data.onReadyParams);

				return;
			}

			// index 적용
			_.forEach($items, function (__$item, __index) {

				__$item.dataset.sliderIndex = __index;

			});

			// 앞뒤로 복제
			if (data._isLoop === true) {
				var $firstItem = $items[0];
				_.forEach(mm.object.values($items), function (__$item, __index) {

					var $clone = __$item.cloneNode(true);
					$clone.classList.add(data._classClone);
					mm.class.remove($clone, [data._classIntersecting, data._classOn]);
					mm.element.attribute($clone, { 'tabindex': '-1' });

					__$item.parentElement.append($clone);

					var $cloneBefore = $clone.cloneNode(true);
					mm.element.before($firstItem, $cloneBefore);

					mm.preload.destroy([$clone, $cloneBefore]);
					mm.preload.update([$clone, $cloneBefore]);
					mm.lazyload.destroy([$clone, $cloneBefore]);
					mm.lazyload.update([$clone, $cloneBefore]);

				});

				mm.element.style($list, { 'margin-left': mm.number.unit(-$list.offsetWidth / 3) });
			}

			// intersection event (index 및 위치 확인)
			mm.intersection.on($items, function (__entry, __is) {

				// ? entry:object - IO entry
				// ? __is:boolean - IO isIntersecting

				if (__is === true) {
					__entry.target.classList.add(data._classIntersecting);

					if (__entry.intersectionRatio === 1) {
						__entry.target.classList.add(data._classOn);
						base.set(__$element);
					}
					else __entry.target.classList.remove(data._classOn);
				}
				else mm.class.remove(__entry.target, [data._classIntersecting, data._classOn]);

			}, { config: {
				root: $inner,
				rootMargin: data._rootMargin,// root의 높이(범위)가 실제 높이보다 조금이라도 작게 잡히면 ratio가 1이 안되는 이슈로 위/아래 마진 추가
			}});

			// touch event
			mm.event.on($inner, 'mousedown', function sliderTouchStartInlineHandler(__e) {

				if (gsap.isTweening(data.__)) return;// 움직임 중에는 리턴

				clearInterval(data.__.interval);

				var startTouch = { screenX: __e.clientX, screenY: __e.clientY };
				var _startValue = data.__._updateValue || 0;

				data.__._isDirection = null;

				mm.event.on(document, 'mousemove mouseup', function sliderTouchInlineHandler(__e) {

					__e.preventDefault();

					var touch = { screenX: __e.clientX, screenY: __e.clientY };

					if (data.__._isDirection === null) {
						var _moveX = Math.abs(touch.screenX - startTouch.screenX);
						var _moveY = Math.abs(touch.screenY - startTouch.screenY);
						var _limit = 0.7;

						if (data._direction === 'horizontal' && _moveX / _moveY > _limit) data.__._isDirection = true;
						else if (data._direction === 'vertical' && _moveY / _moveX > _limit) data.__._isDirection = true;
						else mm.event.off(document, 'mousemove mouseup', sliderTouchInlineHandler);

						return;
					}
					else if (data.__._isDirection === true) {
						data.__._updateValue = ((data._direction === 'horizontal') ? startTouch.screenX - touch.screenX : startTouch.screenY - touch.screenY) + _startValue;
						var _direction = (data.__._updateValue > _startValue) ? 'next' : 'prev';

						if (__e.type === 'mousemove') base.gsapUpdate(__$element, _direction);
						else base.gsapTo(__$element, _direction, 'cubic.out');
					}

					if (__e.type === 'mouseup') {
						mm.event.off(document, 'mousemove mouseup', sliderTouchInlineHandler);
						base.interval(__$element);
					}

				});

			});

			// mouse event
			mm.event.on($inner, 'mouseover mouseleave', function sliderMouseInlineHandler(__e) {

				switch (__e.type) {
					case 'mouseover':
						clearInterval(data.__.interval);
						break;
					case 'mouseleave':
						base.interval(__$element);
						break;
				}

			});
			mm.event.on($inner, 'click', function sliderMouseInlineHandler(__e) {

				// 클릭 링크 방지
				if (data.__._isDirection) {
					__e.preventDefault();
					__e.stopPropagation();
				}

			}, { _isCapture: true });

			// control
			if ($btnPrev) {
				mm.event.on($btnPrev, 'click', function sliderPrevInlineHandler(__e) {

					var _index = data._index - 1;
					if (_index < 0) _index = data.__._total - 1;
					base.change(__$element, _index, 'prev');
					base.interval(__$element);

				}, { _isOverwrite: true });
			}
			if ($btnNext) {
				mm.event.on($btnNext, 'click', function sliderNextInlineHandler(__e) {

					var _index = data._index + 1;
					if (_index > data.__._total - 1) _index = 0;
					base.change(__$element, _index, 'next');
					base.interval(__$element);

				}, { _isOverwrite: true });
			}

			// pagination
			if ($btnPages.length > 0) {
				mm.event.on($btnPages, 'click', function carouselPageInlineHandler(__e) {

					var _index = mm.element.index($btnPages, this);
					if (_index !== base._index) {
						base.change(__$element, _index);
						base.interval(__$element);
					}

				}, { _isOverwrite: true });
			}

			// 초기 위치(왼쪽 기준)
			data.__._updateValue = $items[(data._isLoop === true) ? data._index + data.__._total : data._index].getBoundingClientRect().left - $inner.getBoundingClientRect().left - data.__.innerPadding.left;
			mm.element.style($list, { 'transform': mm.string.template('translateX(${VALUE}px)', { VALUE: -data.__._updateValue }) });

			base.interval(__$element);

			mm.apply(data.onReady, __$element, data.onReadyParams);

		},
		// 모션
		gsapTo: function (__$element, __direction, __ease, __index) {

			// ? __$element:element - 단일 요소
			// ? __direction:string - next, prev
			// ? __ease:string
			// ? __index:number - 변경할 순서

			var data = mm.data.get(__$element, base._dataName);
			var _value = 0;

			// 직접 이동
			if (Number.isFinite(__index)) {
				var $targetItem = (function () {

					var $items = mm.object.values(data.__.$items);
					var _itemIndex = mm.element.index($items, data.__.$activeItem);
					var _selector = mm.string.template('[data-slider-index="${INDEX}"]', { INDEX: __index });

					if (__direction === 'next') return _.find($items.slice(_itemIndex), function (__$item) { return __$item.matches(_selector); });
					else return _.findLast($items.slice(0, _itemIndex), function (__$item) { return __$item.matches(_selector); });

				})();
				_value = $targetItem.getBoundingClientRect().left - data.__.$activeItem.getBoundingClientRect().left;
			}
			// 가까운 쪽으로 이동
			else {
				var $firstItem = _.filter(data.__.$items, function (__$item) { return __$item.classList.contains(data._classIntersecting); })[0];
				var innerRect = data.__.$inner.getBoundingClientRect();
				var _target = innerRect.left + data.__.innerPadding.left - $firstItem.getBoundingClientRect().left;
				_value = (_target > $firstItem.offsetWidth / 2) ? $firstItem.offsetWidth - _target : -_target;
			}
			_value = data.__._updateValue + _value;

			if (data._isLoop !== true) {
				var _max = data.__.$list.offsetWidth - data.__.$inner.offsetWidth + data.__.innerPadding.left + data.__.innerPadding.right;
				if (_value < 0) _value = 0;
				else if (_value > _max) _value = _max;
			}

			gsap.to(data.__, {
				_updateValue: _value,
				duration: data._speed,
				ease: __ease,
				onUpdate: function () {

					base.gsapUpdate(__$element, __direction);

				},
				onStart: function () {

					mm.apply(data.onStart, __$element, data.onStartParams);

				},
				onComplete: function () {

					base.set(__$element);

					mm.apply(data.onComplete, __$element, data.onCompleteParams);

				}
			});

		},
		// 모션 진행 중
		gsapUpdate: function (__$element, __direction, __isBack) {

			// ? __$element:element - 단일 요소
			// ? __index:number
			// ? __oldIndex:number
			// ? __direction:string - next, prev
			// ? __isBack:boolean - 제자리로 되돌아감

			var data = mm.data.get(__$element, base._dataName);

			if (data._direction === 'horizontal') mm.element.style(data.__.$list, { 'transform': mm.string.template('translateX(${VALUE}px)', { VALUE: -data.__._updateValue }) });
			else {}

			mm.apply(data.onUpdate, __$element, [__direction].concat(data.onUpdateParams));

		},
		// 변경
		change: function (__$element, __index, __direction) {

			// ? __$element:element - 단일 요소
			// ? __index:number - 변경할 인덱스
			// ? __direction:string - next, prev
			// __direction 값이 없으면 __index 값을 비교하여 방향 적용

			var data = mm.data.get(__$element, base._dataName);
			if (gsap.isTweening(data.__) || __index === data._index) return;// 모션 중 또는 값이 같으면 변경 안됨

			var _direction = (__direction) ? __direction : (function () {

				if (__index > data._index) return (__index - data._index < data._index + data.__._total - __index) ? 'next' : 'prev';
				else return (__index - data._index < __index + data.__._total - data._index) ? 'prev' : 'next';

			})();

			base.gsapTo(__$element, _direction, 'sine.inOut', __index);

		},
		// 변경 값 적용(active, control)
		set: function (__$element) {

			// ? __$element:element - 단일 요소

			var data = mm.data.get(__$element, base._dataName);
			var $firstItem = _.filter(data.__.$items, function (__$item) { return __$item.classList.contains(data._classOn); })[0];
			if (!$firstItem) return;

			data._index = parseFloat($firstItem.dataset.sliderIndex);
			data.__.$activeItem = $firstItem;

			// pagination
			if (data.__.$pages.length > 0 && !mm._isTouch) {
				mm.class.remove(data.__.$pages, data._classOn);
				data.__.$pages[data._index].classList.add(data._classOn);
			}

			// 버튼 숨김
			if (data._isLoop !== true) {
				var _max = data.__.$list.offsetWidth - data.__.$inner.offsetWidth;
				mm.element.attribute([data.__.$btnPrev, data.__.$btnNext], { 'disabled': false });

				// updateValue 오차로 0.5 차이 적용
				if (data.__._updateValue < 0.5) mm.element.attribute(data.__.$btnPrev, { 'disabled': true });
				else if (data.__._updateValue > _max - 0.5) mm.element.attribute(data.__.$btnNext, { 'disabled': true });
			}

			base.reposition(__$element);

			mm.apply(data.onActive, __$element, data.onActiveParams);

		},
		// 재정렬
		reposition: function (__$element) {

			// ? __$element:element - 단일 요소

			var data = mm.data.get(__$element, base._dataName);
			if (data._isLoop !== true) return;

			// 정렬
			var $items = data.__.$items;
			var $onItems = _.filter($items, function (__$item) { return __$item.classList.contains(data._classOn); });
			if ($onItems.length < 1) return;

			var _beforeTotal = mm.element.index($items, $onItems[0]);
			var _afterTotal = $items.length - $onItems.length - _beforeTotal;
			var _appendTotal = Math.floor(Math.abs(_beforeTotal - _afterTotal) / 2);
			var _margin = 0;

			if (_appendTotal > 0) {
				var _count = 0;
				while (_count < _appendTotal) {
					var $item;
					if (_beforeTotal > _afterTotal) {
						$item = $items[0];
						_margin += (data._direction === 'horizontal') ? $item.offsetWidth : $item.offsetHeight;
						$item.parentElement.append($item);
					}
					else {
						$item = $items[$items.length - 1];
						_margin -= (data._direction === 'horizontal') ? $item.offsetWidth : $item.offsetHeight;
						$item.parentElement.prepend($item);
					}
					_count++;
				}

				if (data._direction === 'horizontal') mm.element.style($item.parentElement, { 'margin-left': mm.number.unit(parseFloat(mm.element.style($item.parentElement, 'margin-left')) + _margin) });
				else mm.element.style($item.parentElement, { 'margin-top': mm.number.unit(parseFloat(mm.element.style($item.parentElement, 'margin-top')) + _margin) });
			}

			return;

		},
		// 자동롤링
		interval: function (__$element) {

			// ? __$element:element - 단일 요소

			var data = mm.data.get(__$element, base._dataName);
			clearInterval(data.__.interval);

			if (data._autoDelay > 0) {
				data.__.interval = setInterval(function () {

					if (!mm.is.display(__$element)) return;// 화면에서 안보일 때는 변경 안됨

					var _index = data._index + 1;
					if (_index > data.__._total - 1) _index = 0;

					base.change(__$element, _index, 'next');

				}, data._autoDelay * 1000);
			}

		},
	};

	// private
	(function () {

		//

	})();

	// public
	return {
		//- 슬라이더 연결
		update: function (__elements) {

			// ? __elements:element

			var $elements = mm.ui.element(base._dataName, __elements);
			$elements = _.filter($elements, function (__$el) { return mm.is.display(__$el); });// 숨겨진 요소 제외

			_.forEach($elements, function (__$el) {

				var data = mm.data.get(__$el, base._dataName);
				if (mm.is.empty(data)) data = mm.data.set(__$el, base._dataName, { initial: initial });
				var $loadItems = mm.find(mm.selector(['data-preload', 'data-lazyload'], '[]'), __$el);

				// 프리로드 확인(전체 미리 로드)
				if ($loadItems.length > 0 && (data._isErrorRemove === true || data._isAutoHeight === true)) {
					_.forEach($loadItems, function (__$item) {

						// 확인을 위해 lazyload 대신 preload 사용하고 _isPass 적용
						var itemData = mm.data.get(__$item, (__$item.hasAttribute('data-lazyload')) ? 'data-lazyload' : 'data-preload', true);
						itemData._isPass = true;
						mm.element.attribute(__$item, { 'data-lazyload': '', 'data-preload': itemData });

					});
					var _loadCount = 0;

					(function callee(__is) {

						// 성공, 오류
						if (typeof(__is) === 'boolean') {
							if (__is === false && data._isErrorRemove === true) this.closest('.mm_slider-item').remove();// 오류 아이템 삭제

							_loadCount++;
							if (_loadCount === $loadItems.length) {
								data._isPreload = false;
								data._isErrorRemove = false;
								base.update(__$el);
							}
						}
						else mm.preload.force($loadItems, { onComplete: callee, onCompleteParams: [true], onError: callee, onErrorParams: [false] });

					})();
				}
				else base.update(__$el);

			});

		},
		//- 슬라이더 변경
		change: function (__elements, __index, __direction) {

			// ? __elements:element
			// ? __index:number - 변경할 인덱스
			// ? __direction:string - next, prev
			// __direction 값이 없으면 __index 값을 비교하여 방향 적용

			var $elements = mm.ui.element(base._dataName, __elements);

			_.forEach($elements, function (__$el) {

				var data = mm.data.get(__$el, base._dataName);
				if (!data || data._index === __index || __index > data.__._total - 1 || __index < 0) return;

				base.change(__$el, __index, __direction);

			});

		},
		//- 슬라이더 항목 추가/삭제로 인한 재정렬
		reload: function (__elements) {

			// ? __elements:element

			var $elements = mm.ui.element(base._dataName, __elements);

			_.forEach($elements, function (__$el) {

				var data = mm.data.get(__$el, base._dataName);
				if (!data) return;// 적용된 슬라이더가 없음

				clearInterval(data.__.interval);
				gsap.killTweensOf(data.__);

				_.forEach(mm.object.values(data.__.$items), function (__$item, __index) {

					if (__$item.classList.contains(data._classClone)) __$item.remove();

				});

				mm.intersection.off(data.__.$items);
				data.__.$items = [];

				mm.event.off(data.__.$inner, 'mousedown', 'sliderTouchStartInlineHandler');
				mm.event.on(data.__.$inner, 'mouseenter mouseleave click', 'sliderMouseInlineHandler');

				base.update(__$el);

			});

		},
		//- autoplay
		play: function (__elements, __autoDelay) {

			// ? __elements:element
			// ? __autoDelay:number - 자동 롤링 간격(초), 값이 0이면 자동 롤링 안함

			var $elements = mm.ui.element(base._dataName, __elements);

			_.forEach($elements, function (__$el) {

				if (Number.isFinite(__autoDelay)) {
					var data = mm.data.get(__$el, base._dataName);
					data._autoDelay = __autoDelay;
				}
				base.interval(__$el);

			});

		},
		stop: function (__elements) {

			// ? __elements:element

			var $elements = mm.ui.element(base._dataName, __elements);

			_.forEach($elements, function (__$el) {

				var data = mm.data.get(__$el, base._dataName);
				clearInterval(data.__.interval);

			});

		},
	};

})();
//> 슬라이더

//< 수량 스테퍼
mm.stepper = (function () {

	// $el['__mm.data__'].name에 저장할 기본 값
	var initial = {
		_min: 1,// ? :number - 최소 수량
		_max: 99,// ? :number - 최대 수량
		onChange: null,// ? :function
		onChangeParams: [],// ? :array
	};

	// UI 고유 객체
	var base = {
		get _dataName() { return 'data-stepper'; },// 데이타 속성 이름
		// 수량 변경
		change: function (__$ui, __target) {

			// ? __$ui:element - 스테퍼 단일 요소

			var data = mm.data.get(__$ui, base._dataName);
			if (mm.is.empty(data)) data = mm.data.set(__$ui, base._dataName, { initial: initial });

			var $formText = mm.find('.text_stepper', __$ui)[0];
			var _value = (Number.isFinite(__target) && __target > -1) ? __target : parseFloat($formText.value);
			_value = Math.max(Math.min(_value, data._max), data._min);
			if (!_value) _value = (__target && __target.type === 'keyup') ? '' : data._min;

			$formText.value = _value;

			mm.element.attribute(mm.find('.btn_stepper-subtract', __$ui)[0], { 'disabled': _value <= data._min });
			mm.element.attribute(mm.find('.btn_stepper-add', __$ui)[0], { 'disabled': _value >= data._max });

			mm.apply(data.onChange, __$ui, data.onChangeParams);

		},
	};

	// private
	(function () {

		// 버튼 클릭
		mm.delegate.on(document, mm.string.template('[${UI}] .btn_stepper-subtract, [${UI}] .btn_stepper-add', { UI: base._dataName }), 'click', function (__e) {

			__e.preventDefault();

			var $stepper = this.closest(mm.selector(base._dataName, '[]'));
			if (!$stepper) return;

			var $formText = mm.find('.text_stepper', $stepper)[0];
			var _value = parseFloat($formText.value) || 1;

			if (this.classList.contains('btn_stepper-subtract')) _value--;
			else _value++;

			base.change($stepper, _value);

		});

	})();

	// public
	return {
		//- 수량 연결
		update: function (__elements) {

			// ? __elements:element

			var $elements = mm.ui.element(base._dataName, __elements);
			$elements = _.filter($elements, function (__$el) { return mm.is.display(__$el); });// 숨겨진 요소 제외

			_.forEach($elements, function (__$el) {

				base.change(__$el);

			});

		},
		//- 수량 변경
		change: function (__elements, __target) {

			// ? __elements:element
			// ? __target:number - 적용할 수량 직접 입력
			// ? __target:object - event object로 keyup으로 수량 변경 감지

			if (__target && __target.type === 'keyup' && !/(\d)|\.|\-/.test(__target.key)) return;// 키가 숫자/./-가 아닐 때

			var $elements = mm.ui.element(base._dataName, __elements);

			_.forEach($elements, function (__$el) {

				base.change(__$el, __target);

			});

		},
	};

})();
//> 수량 스테퍼

//< 폼 요소
mm.form = (function () {

	// UI 고유 객체
	var base = {
		get checkers() { return ['data-text', 'data-check', 'data-radio', 'data-select', 'data-file', 'data-multiple']; },
		get _classAlert() { return 'text_alert' },
		get _classValid() { return 'text_valid' },
		// 폼 요소 검색
		formElement: function (__elements) {

			// ? __elements:element

			var _checker = mm.selector(base.checkers, '[]');
			var $elements = mm.find(__elements);
			var $filtered = _.filter($elements, function (__$el) { return __$el.matches(_checker); });

			if ($filtered.length > 0) return $filtered;
			else return mm.find(_checker, $elements);

		},
		// 폼 상태 텍스트 추가
		appendFormText: function (__$form, __messageHtml) {

			// ? __$form:element - 폼 단일 요소
			// ? __messageHtml:string - 노출할 상태 텍스트 html 코드

			base.liftFormText(__$form);

			var $text = mm.element.create(__messageHtml)[0];
			mm.element.after(__$form.closest('label'), $text);

			var $btn = mm.find('> button', __$form.closest('[class*="mm_form-"]'));
			_.forEach($btn, function (__$btn) {

				var _btnTop = parseFloat(mm.element.style(__$btn, 'margin-top')) || 0;
				mm.element.style(__$btn, { 'margin-top': mm.number.unit(-$text.offsetHeight / 2 + _btnTop) });

			});

			return $text;

		},
		// 폼 상태 해제
		liftFormText: function (__$element) {

			// ? __$element:element - 폼 또는 오류/유효성 텍스트 단일 요소

			var _selector = mm.selector([base._classAlert, base._classValid], '.');
			var $label = (__$element.matches(_selector)) ? mm.siblings(__$element, 'label')[0] : __$element.closest('label');
			var $ui = $label.closest('[class*="mm_form-"]');

			var _i = 0;
			while (_i < $ui.classList.length) {
				var _class = $ui.classList[_i];
				if (_class.startsWith('__text-alert') || _class.startsWith('__text-valid')) $ui.classList.remove(_class);
				else _i++;
			}

			var $btn = mm.find('> button', $ui);
			_.forEach($btn, function (__$btn) {

				mm.element.style(__$btn, { 'margin-top': '' });

			});

			mm.element.remove(mm.find(_selector, $ui));

		},
	};

	// private
	(function () {

		// 포커스(모바일 키패드, 셀렉트 등 노출에 따른 스크롤 이동)
		mm.delegate.on(document, mm.selector(['data-text', 'data-select'], '[]'), 'focusin focusout', function (__e) {

			if (this.tagName === 'INPUT' && !['text', 'password', 'email', 'number', 'search', 'tel', 'url', 'date', 'month', 'time', 'week'].includes(this.type)) return;
			if (mm.is.mobile('ios') && (this.readOnly || this.disabled)) mm.focus.out(this);// ios에서 date 타입일 때 선택되는 이슈가 있어 포커스아웃 적용(접근성 탭이동 문제가 있을 경우 변경 필요)

			switch (__e.type) {
				case 'focusin':
					if (this.hasAttribute('data-text')) document.documentElement.classList.add('__focus');
					if (!this.hasAttribute('autocomplete')) this.setAttribute('autocomplete', 'off');

					var $scroll = mm.scroll.find(this, true);

					// 안드로이드 포커싱 위치 스크롤
					if (mm.is.mobile('android') && $scroll && this.tagName !== 'SELECT') {
						mm.scroll.to(this, { scroller: $scroll, _margin: (function () {

							var $header = mm.find('.mm_header')[0];
							var _space = 50;
							return ($header) ? $header.offsetHeight + _space : _space;

						})() });
					}

					// 모바일 화면 스크롤 시 포커스 해제
					if (mm.is.mobile()) {
						mm.event.on($scroll, 'scroll', function formScrollInlineHandler(__e) {

							var $focus = document.activeElement;
							if ($focus && mm._isTouch) {
								mm.focus.out($focus);
								mm.event.off($scroll, 'scroll', formScrollInlineHandler);
							}

						});
					}
					break;
				case 'focusout':
					document.documentElement.classList.remove('__focus');
					break;
			}

		});

	})();

	// public
	return {
		//- 폼 요소 업데이트
		update: function (__elements) {

			// ? __elements:element - 폼 요소
			// __elements 값이 없으면 페이지 전체 적용
			// __elements 값이 폼 요소가 아니면 자식 요소에 적용
			// __elements 값이 폼 요소면 선택한 요소에 적용

			var $elements = base.formElement(__elements || '.mm_app');
			$elements = _.filter($elements, function (__$el) { return mm.is.display(__$el); });// 숨겨진 요소 제외

			mm.event.dispatch($elements, 'update');

		},
		//- 폼 요소 값 변경
		value: function (__elements, __value) {

			// ? __elements:element - 폼 요소
			// ? __value:any - 값

			var $elements = base.formElement(__elements);
			if ($elements.length === 0 || __value === undefined) return;

			_.forEach($elements, function (__$el) {

				if (__$el.matches(mm.selector('data-text', '[]'))) {
					__$el.value = __value;
				}
				else if (__$el.matches(mm.selector(['data-check', 'data-radio'], '[]'))) {
					__$el.checked = __value;
				}
				else if (__$el.matches(mm.selector('data-select', '[]'))) {
					__$el.value = __value;
					if (__$el.selectedIndex < 0) __$el.selectedIndex = 0;
				}
				// file은 value 값 강제로 변경 불가, 삭제는 ie 대응을 위해 mm.form.file.clear() 사용
				// else if (__$el.matches(mm.selector('data-file', '[]'))) {
				// }
				// else if (__$el.matches(mm.selector('data-multiple', '[]'))) {
				// }

			});

			mm.event.dispatch($elements, 'change');

		},
		//- 폼 요소 오류
		alert: function (__elements, __message) {

			// ? __elements:element - 폼 요소
			// ? __message:string - 오류 메시지
			// 텍스트, 셀렉트, 파일에만 적용 됨

			var $elements = base.formElement(__elements);
			if ($elements.length === 0 || typeof(__message) !== 'string') return;

			var _message = __message.replace(/\n/ig, '<br>');

			_.forEach($elements, function (__$el) {

				base.appendFormText(__$el, mm.string.template('<p class="${CLASS}">${MESSAGE}</p>', { CLASS: base._classAlert, MESSAGE: _message }));

				var $ui = __$el.closest('[class*="mm_form-"]');
				$ui.classList.add('__text-alert');

				mm.scroll.to($ui, { scroller: mm.scroll.find(__$el, true), _margin: (function () {

					var $header = mm.find('.mm_header')[0];
					var _space = 50;
					return ($header) ? $header.offsetHeight + _space : _space;

				})() });

			});

		},
		//- 폼 요소 유효
		valid: function (__elements, __message, __condition) {

			// ? __elements:element - 폼 요소
			// ? __message:string - 유효 메시지
			// ? __condition:string - 상태 색상
			// 텍스트, 셀렉트, 파일에만 적용 됨

			var $elements = base.formElement(__elements);
			if ($elements.length === 0 || typeof(__message) !== 'string') return;

			var _message = __message.replace(/\n/ig, '<br>');

			_.forEach($elements, function (__$el) {

				var $text = base.appendFormText(__$el, mm.string.template('<p class="${CLASS}"><i class="ico_form-valid"></i>${MESSAGE}</p>', { CLASS: base._classValid, MESSAGE: _message }));

				var $ui = __$el.closest('[class*="mm_form-"]');
				var _condition;

				// 상태 클래스 직접 적용
				if (__condition) _condition = __condition.toLowerCase();
				// 시작 문자열에 따라 자동 적용
				else {
					if (__message.startsWith('보통')) _condition = 'normal';
					else if (__message.startsWith('위험')) _condition = 'danger';
					else if (__message.startsWith('사용불가')) _condition = 'invalid';
					else _condition = 'valid';
				}

				$text.classList.add(mm.string.template('__valid-${CLASS}', { CLASS: _condition }));
				$ui.classList.add(mm.string.template('__text-valid-${CONDITION}', { CONDITION: _condition }));

			});

		},
		//- 오류/유효 해제
		lift: function (__elements) {

			// ? __elements:element - 폼 요소
			// __elements 값이 없으면 페이지 내 전체 .text_alert, .text_valid 해제

			var $elements = (__elements) ? base.formElement(__elements) : mm.find(mm.selector([base._classAlert, base._classValid], '.'));

			_.forEach($elements, function (__$el) {

				base.liftFormText(__$el);

			});

		},
	};

})();
//> 폼 요소

//< 폼 요소(텍스트)
mm.form.text = (function () {

	// $el['__mm.data__'].name에 저장할 기본 값
	var initial = {
		_default: '',// ? :string - 내용이 없을 때 적용할 기본 값
		_classOn: '__text-on',// ? :string - value 값이 있을 때 클래스
		_classOff: '__text-off',// ? :string - value 값이 있고, readonly, disabled 상태일 때 클래스
		_format: null,// ? :string - 날짜, 시간에 사용, 보여지는 포멧 형식으로 input과 다름 (YYYY년 MM월 DD일)
		_isResize: false,// ? :boolean - textarea, 내용에 따른 자동 높이 조절
		_resizeMin: null,// ? :number - textarea, 최소 높이 라인 수
		_resizeMax: null,// ? :number - textarea, 최대 높이 라인 수(설정된 값보다 라인이 많으면 스크롤)
		_isAutoComplete: false,// ? :boolean - value값 입력시 연관검색어 자동완성
		// 내부사용
		__: {
			$autocomplete: null,// ? :element - 자동완성 객체(자동완성 적용 여부 확인으로 사용)
		},
	};
	// * value를 스크립트로 직접 변경할 때, mm.event.dispatch(this, 'update');를 실행하면 value 유/무에 따라 placeholder 텍스트가 노출
	// * btn_text-clear 버튼으로 내용을 삭제하면 change 이벤트 후에 clear 커스텀 이벤트 발생

	// UI 고유 객체
	var base = {
		get _dataName() { return 'data-text'; },// 데이타 속성 이름
		// 자동완성
		autocomplete: function (__$text) {

			var $ui = __$text.closest('.mm_form-text, .mm_form-textarea');
			var data = mm.data.get(__$text, base._dataName);
			if (!$ui || data.__.$autocomplete) return;

			var _classOn = '__auto-on';
			var DELAY_CLOSE = mm.string.template('DELAY_AUTOCOMPLETE_CLOSE_${ID}', { ID: new Date().valueOf() });

			data.__.$autocomplete = mm.find('.mm_form-text-autocomplete', $ui)[0];
			if (!data.__.$autocomplete) {
				data.__.$autocomplete = mm.element.create(mm.string.template([
					'<div class="mm_form-text-autocomplete">',
					'	<div class="mm_scroller">',
					'		<ul>',
					// '			<li><button type="button"><b>자동<strong class="mm_text-primary">완성</strong>샘플, 내용(li 요소) 교체 필요</b></button></li>',// 개발에서 직접 적용
					'			<li></li>',
					'		</ul>',
					'	</div>',
					'</div>',
				]))[0];
				$ui.append(data.__.$autocomplete);
			}

			// 키보드 방향키 제어
			function keyDownFocus(__e, __$el) {

				__e.preventDefault();// 스크롤 움직임 방지

				mm.delay.on(function () {

					mm.class.remove(mm.find('.__over', data.__.$autocomplete), '__over');
					__$el.classList.add('__over');

					__$text.value = _.last(mm.find('b:not(.text_date)', __$el)).textContent;

				});

			}

			mm.event.on(__$text, 'change keyup', function (__e) {

				switch (__e.type) {
					case 'change':
						if (__e.detail && __e.detail._isUpdate === true) return;
					case 'keyup':
						if (__e.type === 'keyup' && __e.keyCode > 36 && __e.keyCode < 41) return;// 방향키

						if (this.value.trim().length > 0) data.__.$autocomplete.classList.add(_classOn);
						else data.__.$autocomplete.classList.remove(_classOn);
						break;
				}

			});

			mm.event.on($ui, 'keydown mouseover mouseenter mouseleave focusin focusout', function (__e) {

				mm.delay.off(DELAY_CLOSE);
				if (!data.__.$autocomplete.classList.contains(_classOn)) return;

				switch (__e.type) {
					case 'keydown':
						var $active = mm.find('.__over', data.__.$autocomplete)[0] || document.activeElement;
						var $items = mm.find('li > button', data.__.$autocomplete);
						var _itemIndex = mm.element.index($items, $active);
						var _isText = $active.matches('[data-text]');

						// 방향키 상
						if (__e.keyCode === 38) {
							if (_isText) return;

							if ($active.tagName !== 'BUTTON' || _itemIndex === 0) keyDownFocus(__e, $items[$items.length - 1]);
							else keyDownFocus(__e, $items[_itemIndex - 1]);
						}
						// 방향키 하
						else if (__e.keyCode === 40) {
							if ($active.tagName === 'BUTTON' && _itemIndex === $items.length - 1) keyDownFocus(__e, $items[0]);
							else keyDownFocus(__e, $items[_itemIndex + 1]);
						}
						break;
					case 'mouseover':// 리스트 아이템에 hover시 포커스
						mm.class.remove(mm.find('.__over', data.__.$autocomplete), '__over');
						if (document.activeElement.tagName === 'BUTTON') mm.focus.in(__$text);

						var $autoItem = __e.target.closest('button');
						if ($autoItem) $autoItem.classList.add('__over');
						break;
					// case 'mouseenter':
					// case 'focusin':
					// 	break;
					case 'mouseleave':
					case 'focusout':
						mm.delay.on(function () {

							data.__.$autocomplete.classList.remove(_classOn);

						}, { _time: (__e.type === 'mouseleave') ? 1 : 0, _isSec: true, _name: DELAY_CLOSE, _isOverwrite: true });
						break;
				}

			});

		},
	};

	// private
	(function () {

		// 텍스트 입력 (플레이스홀더)
		mm.delegate.on(document, mm.selector(base._dataName, '[]'), 'update change paste keydown keyup focusout', function (__e) {

			var $text = this;
			var $ui = $text.closest('.mm_form-text, .mm_form-textarea');
			if (!$ui) return;

			var data = mm.data.get($text, base._dataName);
			if (mm.is.empty(data)) data = mm.data.set($text, base._dataName, { initial: initial });
			var _classToggle = ($text.readOnly || $text.disabled) ? data._classOff : data._classOn;
			var _value = $text.value;

			switch (__e.type) {
				case 'paste':
					// var _pasteText = (__e.clipboardData || window.clipboardData).getData('text');
					// _value = _pasteText;
				case 'keydown':
					$ui.classList.add(_classToggle);
					break;
				case 'update':
					// 모바일 numberpad 노출 (w3c validation 검사를 위해 스크립트로 처리)
					if ($text.type === 'number' && mm.is.empty($text.inputMode)) {
						$text.pattern = '[0-9]*';
						$text.inputMode = 'numeric';
					}
					if (!mm.is.mobile() && ['tel', 'number', 'date', 'month', 'time'].includes($text.type)) $text.type = 'text';// pc에서는 date 등 브라우저 고유기능을 사용할 수 없어 text 타입으로 변경
					if (data._isAutoComplete) base.autocomplete($text);
					// break 없음 (계속진행)
				case 'focusout':
					// 기본 값
					if (_value.trim().length === 0) $text.value = data._default;
					mm.event.dispatch($text, 'change', { data: { _isUpdate: true } });
					break;
				case 'change':
					$text.value = _value = _value.trim();
					// break 없음 (계속진행)
				case 'keyup':
					if (_value.length > 0) {
						var _maxlength = parseFloat($text.getAttribute('maxlength'));
						if ((mm.is.mobile('android') || mm.is.mobile('ios') && $text.type === 'number') && Number.isFinite(_maxlength) && _value.length > _maxlength) $text.value = _value.substr(0, _maxlength);
						$ui.classList.add(_classToggle);
					}
					else $ui.classList.remove(_classToggle);

					// _default 와 value 가 다르면 변경 클래스 추가
					if (data._default.trim().length > 0) {
						if (data._default !== _value) $ui.classList.add('__text-changed');
						else $ui.classList.remove('__text-changed');
					}

					// textarea 자동 높이
					if ($text.tagName === 'TEXTAREA' && data._isResize === true) {
						var textStyle = mm.element.style($text);
						var _padding = parseFloat(textStyle.paddingTop) + parseFloat(textStyle.paddingBottom);
						var _lineHeight = parseFloat(textStyle.lineHeight);
						var $scroller = mm.scroll.find($text, true);
						var _scrollTop = $scroller.scrollTop;

						mm.element.style($text, { 'height': mm.number.unit(_padding + _lineHeight + 2) });// 초기화

						if (!data._resizeMin) data._resizeMin = 2;// 초기 값
						if (!data._resizeMax) data._resizeMax = 99999;// 초기 값

						var _lineTotal = ($text.scrollHeight === $text.offsetHeight) ? data._resizeMin : Math.ceil(($text.scrollHeight - _padding) / _lineHeight);// 1줄일 때 min을 1로 적용 (scrollHeight === offsetHeight 같음)
						var _lineNum = (_lineTotal < data._resizeMin) ? data._resizeMin : (_lineTotal > data._resizeMax) ? data._resizeMax : _lineTotal;

						mm.element.style($text, { 'height': mm.number.unit(_padding + _lineNum * _lineHeight) });
						$scroller.scrollTop = _scrollTop;// focus out 될 때 스크롤이 올라가는 이슈 수정
					}

					// 날짜확인 (모바일)
					if (['date', 'month'].includes($text.type)) {
						// todo: format 적용
						// if (!data._format) data._format = 'YYYY-MM-DD';

						// var _txt = (_value.length > 0) ? mm.form.dateFormat(_value, data._format) : '\u00a0';
						// $text.siblings('.text_date').text(_txt);
						mm.siblings($text, '.text_date')[0].textContent = _value;
					}

					// 시간확인 (모바일)
					if ($text.type === 'time') {
						// todo: format 적용
						// if (!data._format) data._format = 'HH:mm';// a hh:mm, A h:mm

						// var _txt = (_value.length > 0) ? mm.form.dateFormat('2000-01-01 ' + _value, data._format) : '\u00a0';
						// _txt = _txt.replace(/am/gi, '오전').replace(/pm/gi, '오후');// 한글
						// $text.siblings('.text_date').text(_txt);
						mm.siblings($text, '.text_date')[0].textContent = _value;
					}

					// 수량변경
					if ($text.classList.contains('text_stepper')) mm.stepper.change($text.closest('[data-stepper]'), __e);
					break;
			}

		});

		// 텍스트 내용 삭제
		mm.delegate.on(document, '.btn_text-clear', 'click', function (__e) {

			__e.preventDefault();

			var $text = mm.find(base._dataName, this.closest('.mm_form-text, .mm_form-textarea'))[0];
			if (!$text || $text.readOnly || $text.disabled) return;

			var data = mm.data.get($text, base._dataName);
			mm.form.value($text, data._default);

			mm.event.dispatch($text, 'clear');
			mm.focus.in($text);

		});

		// 비밀번호 토글
		mm.delegate.on(document, '.btn_text-pw', 'click', function (__e) {

			__e.preventDefault();

			var $text = mm.find(base._dataName, this.closest('.mm_form-text'))[0];
			if (!$text || $text.readOnly || $text.disabled) return;

			if ($text.type === 'password') $text.type = 'text';
			else $text.type = 'password';

			var $mco = mm.find('.ico_show, .ico_hide', this)[0];
			if ($mco) {
				mm.class.toggle($mco, ['ico_show', 'ico_hide']);
				$mco.nextElementSibling.textContent = ($mco.classList.contains('ico_show')) ? '비밀번호 숨기기' : '비밀번호 보기';
			}

		});

	})();

})();
//> 폼 요소(텍스트)

//< 폼 요소(체크박스)
mm.form.check = (function () {

	// $el['__mm.data__'].name에 저장할 기본 값
	var initial = {
		_type: 'check_box',// ? :string - check_box(일반), check_all(전체), check_count(개수)
		_group: null,// ? :string - _type 요소를 연결할 고유 값
		_min: null,// ? :number - check_all, 전체 체크가 표시되기 위한 최소 충족 개수
		syncer: null,// ? :element - 체크될 때 연결할 요소
		_isSyncerUpdate: true,// ? :boolean - 싱커 내부 UI 업데이트 여부
		desyncer: null,// ? :element - 언체크될 때 연결할 요소
		_isDesyncerUpdate: true,// ? :boolean - 디싱커 내부 UI 업데이트 여부
		onChange: null,// ? :function
		onChangeParams: [],// ? :array - onChange의 1번째 이후 아규먼트로 전달
	};
	// _group 값이 없으면 name으로 연결
	// check_count는 _group으로만 연결 가능
	// * 전체 체크박스 내 전체 체크박스가 또 있는 다중 구조에는 _group을 공백으로 구분하여 적용(_group: 'depth1 depth2')
	// * (디)싱커는 전체 체크박스의 상태에 따라 그룹 전체 또는 선택한 요소와 전체 체크박스에만 적용되
	// * 그룹이 있어도 onChange는 선택한 요소만 실행

	// UI 고유 객체
	var base = {
		get _dataName() { return 'data-check'; },// 데이타 속성 이름
		// 그룹에서 일반 체크박스를 선택했을 때 전체 체크박스 확인
		checkGroup: function (__$groups, __group) {

			// ? __$groups:element - 연결된 체크박스 요소
			// ? __group:string - 체크박스를 연결할 고유 값

			var allData;
			var $all = _.find(__$groups, function (__$group) {

				var groupData = mm.data.get(__$group, base._dataName);
				if (mm.is.empty(groupData)) groupData = mm.data.set(__$group, base._dataName, { initial: initial });

				var _isAll = false;
				if (groupData._type === 'check_all') {
					if (groupData._group) _isAll = groupData._group === __group;
					else _isAll = (__$group.name.includes('[')) ? __$group.name.startsWith(__group) : __$group.name === __group;
				}
				if (_isAll) allData = groupData;

				return _isAll;

			});

			if ($all) {
				var _min = (Number.isFinite(allData._min)) ? allData._min : __$groups.length - 1;
				var _count = _.filter(__$groups, function (__$group) {

					var groupData = mm.data.get(__$group, base._dataName);
					if (mm.is.empty(groupData)) groupData = mm.data.set(__$group, base._dataName, { initial: initial });

					if (!__$group.checked || __$group === $all) return false;
					else {
						if (groupData._group) return groupData._group.includes(__group);
						else return (__$group.name.includes('[')) ? __$group.name.startsWith(__group) : __$group.name === __group;
					}

				}).length;

				var _isChecked = $all.checked;
				if (_count < _min) $all.checked = false;
				else $all.checked = true;

				if (_isChecked !== $all.checked) mm.changeSyncer($all, $all.checked, base._dataName);
			}

		},
		// 체크 개수 표시
		checkCount: function (__group) {

			// ? __group:string - 체크박스를 연결할 고유 값

			if (!__group) return;

			var $groups = mm.find(mm.string.template('[${KEY}*="\'_group\'"][${KEY}*="${GROUP}"]', { KEY: base._dataName, GROUP: __group.split(' ')[0] }));
			var $counts = _.filter($groups, function (__$group) {

				var groupData = mm.data.get(__$group, base._dataName);
				if (mm.is.empty(groupData)) groupData = mm.data.set(__$group, base._dataName, { initial: initial });

				return groupData._type === 'check_count';

			});

			_.forEach($counts, function (__$count) {

				var countData = mm.data.get(__$count, base._dataName);
				if (mm.is.empty(countData)) countData = mm.data.set(__$count, base._dataName, { initial: initial });

				var _count = _.filter($groups, function (__$group) {

					var groupData = mm.data.get(__$group, base._dataName);
					if (mm.is.empty(groupData)) groupData = mm.data.set(__$group, base._dataName, { initial: initial });

					if (!__$group.checked || (groupData._group === countData._group && groupData._type === 'check_all')) return false;
					else return __$group.type === 'checkbox' && groupData._group.includes(countData._group);

				}).length;

				if (__$count.tagName === 'INPUT' || __$count.tagName === 'TEXTAREA') mm.form.value(__$count, _count);
				else __$count.textContent = _count;

			});

		},
	};

	// private
	(function () {

		mm.delegate.on(document, mm.selector(base._dataName, '[]'), 'update change', function (__e) {

			var $check = this;
			if ($check.type !== 'checkbox') return;

			var data = mm.data.get($check, base._dataName);
			if (mm.is.empty(data)) data = mm.data.set($check, base._dataName, { initial: initial });

			var _name = $check.name;
			var $groups = (function () {

				if (data._group) return mm.find(mm.string.template('[${KEY}*="\'_group\'"][${KEY}*="${GROUP}"]', { KEY: base._dataName, GROUP: data._group }));
				else {
					if (mm.is.empty(_name)) return [];

					var _index = _name.indexOf('[');
					if (_index > 0) _name = _name.slice(0, _index + 1);

					return mm.find(mm.string.template('[${KEY}][name^="${NAME}"]', { KEY: base._dataName, NAME: _name }));
				}

			})();

			$groups = _.reject($groups, function (__$group) { return __$group.type !== 'checkbox'; });// checkbox가 아닌 요소 제외(check_count)

			if ($groups.length > 1) {
				// 전체
				if (data._type === 'check_all') {
					_.forEach($groups, function (__$group) {

						// 일반 체크박스 중 checked가 다를 때만 실행
						if (__$group !== $check && __$group.checked !== $check.checked) {
							var groupData = mm.data.get(__$group, base._dataName);
							if (mm.is.empty(groupData)) groupData = mm.data.set(__$group, base._dataName, { initial: initial });

							// update일 때는 전체 체크가 있을 때만 적용
							if (__e.type === 'update') {
								if ($check.checked) __$group.checked = true;
							}
							else __$group.checked = $check.checked;

							mm.changeSyncer(__$group, __$group.checked, base._dataName);
						}

					});
				}
				// 일반
				else base.checkGroup($groups, (data._group) ? data._group : _name);

				// 다중 구조
				if (data._group) {
					var _parentGroup = data._group;
					while (_parentGroup.includes(' ')) {
						_parentGroup = _parentGroup.slice(0, _parentGroup.lastIndexOf(' '));// 'one two three ...' 순서에서 마지막 그룹을 삭제하면서 상위 그룹으로 이동
						var $parentGroups = mm.find(mm.string.template('[${KEY}*="\'_group\'"][${KEY}*="${GROUP}"]', { KEY: base._dataName, GROUP: _parentGroup }));
						$parentGroups = _.reject($parentGroups, function (__$group) { return __$group.type !== 'checkbox'; });// checkbox가 아닌 요소 제외(check_count)

						base.checkGroup($parentGroups, _parentGroup);
					}
				}

				base.checkCount(data._group);
			}

			mm.changeSyncer($check, $check.checked, base._dataName);
			mm.apply(data.onChange, $check, data.onChangeParams);

			if (mm._isFrame) mm.frameResize();// 컨텐츠 아이프레임 리사이즈

		});

	})();

})();
//> 폼 요소(체크박스)

//< 폼 요소(라디오)
mm.form.radio = (function () {

	// $el['__mm.data__'].name에 저장할 기본 값
	var initial = {
		syncer: null,// ? :element - 체크될 때 연결할 요소
		_isSyncerUpdate: true,// ? :boolean - 싱커 내부 UI 업데이트 여부
		desyncer: null,// ? :element - 언체크될 때 연결할 요소
		_isDesyncerUpdate: true,// ? :boolean - 디싱커 내부 UI 업데이트 여부
		onChange: null,// ? :function
		onChangeParams: [],// ? :array - onChange의 1번째 이후 아규먼트로 전달
	};
	// * (디)싱커는 그룹 전체에 적용
	// * 그룹이 있어도 onChange는 클릭이 아닌 checked 요소만 실행

	// UI 고유 객체
	var base = {
		get _dataName() { return 'data-radio'; },// 데이타 속성 이름
	};

	// private
	(function () {

		mm.delegate.on(document, mm.selector(base._dataName, '[]'), 'update change', function (__e) {

			var $radio = this;
			var data = mm.data.get($radio, base._dataName);
			if (mm.is.empty(data)) data = mm.data.set($radio, base._dataName, { initial: initial });

			var _name = $radio.name;
			var $groups = (function () {

				if (mm.is.empty(_name)) return [];

				var _index = _name.indexOf('[');
				if (_index > 0) _name = _name.slice(0, _index + 1);

				return mm.find(mm.string.template('[${KEY}][name^="${NAME}"]', { KEY: base._dataName, NAME: _name }));

			})();

			$groups = _.reject($groups, function (__$group) { return __$group.type !== 'radio'; });// radio가 아닌 요소 제외

			var $checked = $radio;
			var checkedData = data;

			if ($groups.length > 1) {
				// 선택된 라디오가 숨겨져 있으면 첫번째 라디오 선택
				$checked = _.find($groups, function (__$group) { return __$group.checked; });

				var $displayed = _.find($groups, mm.is.display);
				if ($checked && !mm.is.display($checked)) {
					$checked = $displayed;
					$checked.checked = true;
				}

				// 반복적으로 실행되는 것을 방지하기 위해 선택된 요소 또는 선택이 안된 그룹의 노출된 1번째 요소만 실행
				var _radioIndex = mm.element.index($groups, $radio);
				if ((!$checked && $radio !== $displayed) || ($checked && mm.element.index($groups, $checked) !== _radioIndex)) return;

				_.forEach($groups, function (__$group) {

					var groupData = mm.data.get(__$group, base._dataName);
					if (mm.is.empty(groupData)) groupData = mm.data.set(__$group, base._dataName, { initial: initial });

					if (__$group !== $checked) mm.changeSyncer(__$group, __$group.checked, base._dataName);// 선택안된 요소
					else checkedData = groupData;

				});
			}

			// 선택된 요소
			if ($checked) {
				mm.changeSyncer($checked, $checked.checked, base._dataName);
				mm.apply(checkedData.onChange, $checked, checkedData.onChangeParams);
			}

			if (mm._isFrame) mm.frameResize();// 컨텐츠 아이프레임 리사이즈

		});

	})();

})();
//> 폼 요소(라디오)

//< 폼 요소(셀렉트)
mm.form.select = (function () {

	// $el['__mm.data__'].name에 저장할 기본 값
	var initial = {
		select: {
			onChange: null,// ? :function
			onChangeParams: [],// ? :array - onChange의 1번째 이후 아규먼트로 전달
			// 내부사용
			__: {
				_beforeIndex: null,// ? number - 이전에 선택된 옵션 인덱스
			},
		},
		option: {
			syncer: null,// ? :element - 체크될 때 연결할 요소
			_isSyncerUpdate: true,// ? :boolean - 싱커 내부 UI 업데이트 여부
			desyncer: null,// ? :element - 언체크될 때 연결할 요소
			_isDesyncerUpdate: true,// ? :boolean - 디싱커 내부 UI 업데이트 여부
			onSelect: null,// ? :function
			onSelectParams: [],// ? :array - onSelect의 1번째 이후 아규먼트로 전달
		},
	};
	// * (디)싱커 연결은 option 요소에 적용
	// * data-select 속성은 모든 select 요소어 추가하고, data-option 속성은 필요한 option 요소에만 적용

	// UI 고유 객체
	var base = {
		get _dataName() { return 'data-select'; },// 데이타 속성 이름
		get _optionDataName() { return 'data-option'; },// 옵션 데이타 속성 이름
		// 옵션 확인
		checkOption: function (__$option) {

			// ? __$option:element - 옵션 단일 요소

			if (!__$option || !__$option.hasAttribute(base._optionDataName)) return;

			var $select = __$option.closest(mm.selector(base._dataName, '[]'));
			var data = mm.data.get(__$option, base._optionDataName);
			if (mm.is.empty(data)) data = mm.data.set(__$option, base._optionDataName, { initial: initial.option });

			mm.changeSyncer(__$option, __$option.selected, base._optionDataName);

			// 선택된 요소
			if (__$option.index === $select.selectedIndex) mm.apply(data.onSelect, __$option, data.onSelectParams);

		},
	};

	// private
	(function () {

		mm.delegate.on(document, mm.selector(base._dataName, '[]'), 'update change', function (__e) {

			var $select = this;
			if ($select.selectedIndex < 0) return;

			var data = mm.data.get($select, base._dataName);
			if (mm.is.empty(data)) data = mm.data.set($select, base._dataName, { initial: initial.select });

			$select.nextElementSibling.textContent = $select.options[$select.selectedIndex].text;

			// 이전에 선택된 요소
			if (Number.isFinite(data.__._beforeIndex)) base.checkOption($select.options[data.__._beforeIndex]);
			else {
				_.forEach($select.options, function (__$option) {

					if (__$option.index !== $select.selectedIndex) base.checkOption(__$option);// 선택안된 요소

				});
			}

			// 선택된 요소
			if ($select.selectedIndex > -1) {
				base.checkOption($select.options[$select.selectedIndex]);
				data.__._beforeIndex = $select.selectedIndex;
			}

			mm.apply(data.onChange, $select, data.onChangeParams);

			if (mm._isFrame) mm.frameResize();// 컨텐츠 아이프레임 리사이즈

		});

	})();

})();
//> 폼 요소(셀렉트)

//< 폼 요소(파일)
mm.form.file = (function () {

	// $el['__mm.data__'].name에 저장할 기본 값
	var initial = {
		file: {
			_classOn: '__file-on',// ? :string
			_fileName: null,// ? :string - 파일명 제한
			_fileSize: null,// ? :number - 용량 제한(kb)
			_default: null,// ? :string - 초기 값
			onChange: null,// ? :function
			onChangeParams: [],// ? :array - onChange의 1번째 이후 아규먼트로 전달
			onCancel: null,// ? :function
			onCancelParams: [],// ? :array - onCancel의 1번째 이후 아규먼트로 전달
			onError: null,// ? :function
			onErrorParams: [],// ? :array - onError의 1번째 이후 아규먼트로 전달
			file: {},// ? :Object - 선택된 파일 객체
			// 내부사용
			__: {
				clone: null,// ? :file - 취소로 인한 복구용
			},
		},
		image: {
			_classOn: '__image-on',// ? :string
			_fileName: null,// ? :string - 파일명 제한
			_fileSize: null,// ? :number - 용량 제한(kb)
			_orientation: null,// ? :string - landscape, portrait, square
			_imageRatio: null,// ? :string/number - 이미지 가로/세로 비율 고정
			_imageSize: 'fit',// ? :string - contain, cover, full, fit
			_imagePosition: 'center center',// ? :string - _imageSize가 cover, contain 일 때, background-position과 같은 방식으로 이미지 위치 이동
			_imageBgColor: '#fff',// ? :string - _imageSize가 contain 일 때 이미지 여백 색상
			_default: null,// ? :string - 초기 값
			onChange: null,// ? :function
			onChangeParams: [],// ? :array - onChange의 1번째 이후 아규먼트로 전달
			onCancel: null,// ? :function
			onCancelParams: [],// ? :array - onCancel의 1번째 이후 아규먼트로 전달
			onError: null,// ? :function
			onErrorParams: [],// ? :array - onError의 1번째 이후 아규먼트로 전달
			file: {},// ? :Object - 선택된 파일 객체
			// 내부사용
			__: {
				clone: null,// ? :file - 취소로 인한 복구용
				$canvas: null,// ? :canvas - loadImage로 생성한 canvas 요소
			}
		},
	};

	// UI 고유 객체
	var base = {
		get _dataName() { return 'data-file'; },// 데이타 속성 이름
		get _classFull() { return '__image-full'; },
		get _classFit() { return '__image-fit'; },
		// initial type
		initial: function (__$file) {

			// ? __$file:element - 파일 단일 요소

			if (__$file.closest('.mm_form-image')) return initial.image;
			else return initial.file;

		},
		//- 파일 유효성 확인
		check: function (__$file) {

			// ? __$file:element - 파일 단일 요소

			var data = mm.data.get(__$file, base._dataName);
			if (mm.is.empty(data)) data = mm.data.set(__$file, base._dataName, { initial: base.initial(__$file) });

			var _accept = __$file.getAttribute('accept');
			if (_accept && _accept.includes('.')) {
				var accepts = _accept.split(',');
				var _isAccept = _.some(accepts, function (__accept) {

					return data.file.name.toLowerCase().endsWith(__accept.trim().toLowerCase());

				});

				if (!_isAccept) {
					base.error(__$file, mm.string.template('${EXTENSION} 확장자의 파일만<br>등록할 수 있습니다.', { EXTENSION: _accept }));
					return;
				}
			}

			if (data._fileName && !data.file.name.endsWith(data._fileName, data.file.name.lastIndexOf('.'))) {
				base.error(__$file, mm.string.template('${NAME} 이름의 파일만<br>등록할 수 있습니다.', { NAME: data._fileName }));
				return;
			}

			if (data._fileSize && data.file.size > data._fileSize * 1024) {
				var _size = data._fileSize / 1000;
				_size = (_size < 1) ? mm.number.unit(data._fileSize, 'kb') : mm.number.unit(_size, 'mb');
				base.error(__$file, mm.string.template('${SIZE}까지 등록할 수 있습니다.', { SIZE: mm.number.comma(_size) }));
				return;
			}

			base.load(__$file, base.set);

		},
		//- 파일 변경 적용
		set: function (__$file) {

			// ? __$file:element - 파일 단일 요소

			var data = mm.data.get(__$file, base._dataName);
			if (mm.is.empty(data)) data = mm.data.set(__$file, base._dataName, { initial: base.initial(__$file) });

			var $ui = __$file.closest('.mm_form-file, .mm_form-image');
			if (mm.is.empty(data.file)) $ui.classList.remove(data._classOn);// 파일 데이터 없음
			else $ui.classList.add(data._classOn);// 파일 데이터 있음

			base.preview(__$file);

			mm.apply(data.onChange, __$file, data.onChangeParams);

		},
		// 파일 로드
		load: function (__$file, __callback) {

			// ? __$file:element - 파일 단일 요소
			// ? __callback: function

			var data = mm.data.get(__$file, base._dataName);

			// 미리보기 이미지
			if (__$file.closest('.mm_form-image')) {
				var target = (data.file.type) ? data.originFile : data.file.result;
				var config = {
					orientation: true,
					canvas: true,
					crossOrigin: 'Anonymous',// ? :boolean - 외부 경로
					imageSmoothingQuality: 'high',// ? :string - low(기본 값), medium, high
					// crop: data._isCrop,// maxWidth, maxHeight 조건으로 자름
				}

				// metadata 정보
				loadImage(target, function (__$canvas, __meta) {

					// __$canvas = <canvas>
					// __$canvas.toDataURL() base64 원본 데이터
					// __$canvas.toDataURL('image/jpeg', 0.5)) 이미지 타입('image/png', 'image/jpeg'), 퀄리티 변경 가능
					// __$canvas.width/height = oriantation 적용된 사이즈
					// __meta.exif.getAll() = exif 전체 불러오기
					// __$canvas.getContext('2d').getImageData(0, 0, __$canvas.width, __$canvas.height)

					if (__$canvas.type === 'error') {
						// 초기 url
						if (typeof(target) === 'string') {
							var $preview = mm.find('.mm_form-image-preview', __$file.closest('.mm_form-image'))[0];
							mm.image.none($preview);

							mm.apply(data.onError, __$file, data.onErrorParams);
						}
						// 파일 선택
						else base.error(__$file, '이미지만 등록할 수 있습니다.');
						return;
					}

					switch (data._orientation) {
						case 'landscape':
							if (__$canvas.width <= __$canvas.height) {
								base.error(__$file, '가로형 이미지만 등록할 수 있습니다.');
								return;
							}
							break;
						case 'portrait':
							if (__$canvas.width >= __$canvas.height) {
								base.error(__$file, '세로형 이미지만 등록할 수 있습니다.');
								return;
							}
							break;
						case 'square':
							if (__$canvas.width !== __$canvas.height) {
								base.error(__$file, '정방형 이미지만 등록할 수 있습니다.');
								return;
							}
							break;
					}

					data.file.result = __$canvas.toDataURL();
					data.file.width = __$canvas.width;
					data.file.height = __$canvas.height;
					data.file.orientation = (!__meta.exif) ? 1 : __meta.exif.get('Orientation');
					data.__.$canvas = __$canvas;

					delete data.originFile;

					// 파일 등록
					mm.apply(__callback, __$file, [__$file, __$canvas]);

				}, config);
			}
			// 일반 파일
			else {
				var target = (data.file.type) ? data.file : data.file.result;
				var reader = new FileReader();
				reader.onload = function (__e) {

					data.file.result = reader.result;

					// 파일 등록
					mm.apply(__callback, __$file, [__$file, __e]);

				}
				reader.onerror = function (__e) {

					base.error(__$file, '파일을 불러올 수 없습니다.');

				}
				reader.readAsDataURL(target);
			}

		},
		// 파일 유효성 확인 오류
		error: function (__$file, __alert) {

			// ? __$file:element - 파일 단일 요소
			// ? __alert:string - 오류 문구

			base.clear(__$file);// 파일 업로드 실패 후 같은 파일 재 업로드시 이미지 업로드가 동작하지 않는 이슈로 파일 초기화
			mm.bom.alert(__alert);

			var data = mm.data.get(__$file, base._dataName);
			data.file = data.__.clone;
			data.__.clone = null;

			mm.apply(data.onError, __$file, data.onErrorParams);

		},
		// 파일 내용 삭제
		clear: function (__$file, __isSet) {

			// ? __$file:element - 파일 단일 요소
			// ? __isSet:boolean - 삭제 후 base.set 실행 여부

			var data = mm.data.get(__$file, base._dataName);
			if (mm.is.empty(data)) data = mm.data.set(__$file, base._dataName, { initial: base.initial(__$file) });
			data.file = {};

			// ie9 이상에서 파일 초기화
			if (mm.is.ie('ie9over')) {
				__$file.type = 'text';
				__$file.type = 'file';
			}
			else __$file.value = '';

			if (__isSet === true) base.set(__$file);

		},
		//- 미리보기
		preview: function (__$file) {

			// ? __$file:element - 파일 단일 요소

			var data = mm.data.get(__$file, base._dataName);

			// 미리보기 이미지
			var $ui = __$file.closest('.mm_form-image');
			if ($ui) {
				var $preview = mm.find('.mm_form-image-preview', $ui)[0];
				if (!$preview) return;

				mm.element.style($ui, { 'width': '' });
				mm.class.remove($ui, [base._classFit, base._classFull]);
				$preview.innerHTML = '';
				$preview.classList.remove('mm_image-none');
				if (mm.is.empty(data.file)) return;

				if (data.__.$canvas) base.appendImage(__$file, data.__.$canvas);// 파일 선택
				else base.load(__$file, base.appendImage);// 미리보기 직접 실행
			}
			// 일반 파일
			else {
				var $preview = mm.find('.text_path', __$file.closest('.mm_form-file'))[0];
				if (!$preview) return;

				$preview.innerHTML = '';
				if (mm.is.empty(data.file)) return;

				$preview.textContent = data.file.name;
			}

		},
		// 이미지 미리보기 생성
		appendImage: function (__$file, __$canvas) {

			// ? __$file:element - 파일 단일 요소
			// ? __$canvas:element - 캔버스 단일 요소

			var data = mm.data.get(__$file, base._dataName);
			var $ui = __$file.closest('.mm_form-image');
			var $preview = mm.find('.mm_form-image-preview', $ui)[0];

			// 고정비율
			if (typeof(data._imageRatio === 'string')) data._imageRatio = new Function(mm.string.template('return ${RATIO}', { RATIO: data._imageRatio }))();
			if (Number.isFinite(data._imageRatio)) {
				data._imageSize = 'cover';
				$ui.classList.add('__image-ratio');
				mm.element.style($preview, { 'padding-top': mm.number.unit(1 / data._imageRatio * 100, '%') });
			}

			var positions = data._imagePosition.split(' ');
			var _ratio = __$canvas.width / __$canvas.height;
			var _viewRatio = $preview.offsetWidth / $preview.offsetHeight;

			var context = __$canvas.getContext('2d');
			var $viewCanvas = document.createElement('canvas');
			var viewContext = $viewCanvas.getContext('2d');

			$viewCanvas.width = __$canvas.width;
			$viewCanvas.height = __$canvas.height;
			viewContext.drawImage(__$canvas, 0, 0);

			switch (data._imageSize) {
				case 'fit':
					var ratios = { x: __$canvas.width / $preview.offsetWidth, y: __$canvas.height / $preview.offsetHeight };
					__$canvas.width = __$canvas.width / Math.max(ratios.x, ratios.y);
					__$canvas.height = __$canvas.height / Math.max(ratios.x, ratios.y);
					$ui.classList.add(base._classFit);
					break;
				case 'full':
					mm.element.style($ui, { 'width': mm.number.unit(__$canvas.width) });
					$ui.classList.add(base._classFull);
					break;
				case 'contain':
					if (_ratio < _viewRatio) $viewCanvas.width = $viewCanvas.height * _viewRatio;// 세로 100%
					else $viewCanvas.height = $viewCanvas.width / _viewRatio;// 가로 100%

					var _x = (positions[0] === 'left') ? 0 : (positions[0] === 'right') ? $viewCanvas.width - __$canvas.width : ($viewCanvas.width - __$canvas.width) / 2;
					var _y = (positions[1] === 'top') ? 0 : (positions[1] === 'bottom') ? $viewCanvas.height - __$canvas.height : ($viewCanvas.height - __$canvas.height) / 2;
					viewContext.fillStyle = data._imageBgColor;
					viewContext.fillRect(0, 0, $viewCanvas.width, $viewCanvas.height);
					viewContext.drawImage(__$canvas, _x, _y, __$canvas.width, __$canvas.height);

					__$canvas.width = $preview.offsetWidth;
					__$canvas.height = $preview.offsetHeight;
					break;
				case 'cover':
					if (_ratio > _viewRatio) $viewCanvas.width = $viewCanvas.height * _viewRatio;// 세로 100%
					else $viewCanvas.height = $viewCanvas.width / _viewRatio;// 가로 100%

					var _x = (positions[0] === 'left') ? 0 : (positions[0] === 'right') ? $viewCanvas.width - __$canvas.width : ($viewCanvas.width - __$canvas.width) / 2;
					var _y = (positions[1] === 'top') ? 0 : (positions[1] === 'bottom') ? $viewCanvas.height - __$canvas.height : ($viewCanvas.height - __$canvas.height) / 2;
					viewContext.drawImage(__$canvas, _x, _y);

					__$canvas.width = $preview.offsetWidth;
					__$canvas.height = $preview.offsetHeight;
					break;
			}

			data.file.view = {
				result: $viewCanvas.toDataURL(),
				width: $viewCanvas.width,
				height: $viewCanvas.height
			}
			$viewCanvas.remove();

			context.imageSmoothingQuality = 'high';
			context.drawImage($viewCanvas, 0, 0, __$canvas.width, __$canvas.height);

			$preview.append(__$canvas);

		},
	};

	// private
	(function () {

		mm.delegate.on(document, mm.selector(base._dataName, '[]'), 'update change click', function (__e) {

			var $file = this;
			var data = mm.data.get($file, base._dataName);
			if (mm.is.empty(data)) data = mm.data.set($file, base._dataName, { initial: base.initial($file) });

			mm.form.lift($file);// 오류 알림이 있을 때 해제

			switch (__e.type) {
				// 클론
				case 'click':
					data.__.clone = $file.cloneNode();
					break;
				// 초기화
				case 'update':
					data.__.clone = null;
					if (!mm.is.display($file) || !mm.is.empty(data.file)) return;

					data.file = {};

					// 파일 초기값(url, string)
					if (data._default) {
						data.file.name = data._default;
						data.file.result = data._default;
						delete data._default;// 파일 삭제 후 update를 다시 하면 default가 노출되는 이슈로 제거
						base.set($file);// 파일 값 적용
					}
					break;
				// 파일 선택(변경)
				case 'change':
					if ($file.files.length > 0) {
						data.__.clone = data.file;

						// 미리보기 이미지
						if ($file.closest('.mm_form-image')) {
							data.originFile = $file.files[0];
							data.file = {};
							for (var __key in data.originFile) {
								data.file[__key] = data.originFile[__key];
							}
						}
						// 일반 파일
						else data.file = $file.files[0];

						base.check($file);
					}
					// 선택 취소
					else {
						$file.replaceWith(data.__.clone);
						$file = data.__.clone;

						// 클론 요소에는 mm.data 값이 없어 재설정
						var replaceData = mm.data.set($file, base._dataName, { initial: base.initial($file) });
						_.forEach(data, function (__value, __key) {

							replaceData[__key] = __value;

						});

						data.__.clone = null;

						mm.apply(data.onCancel, $file, data.onCancelParams);
					}
					break;
			}

		});

		// 파일 삭제
		mm.delegate.on(document, '.btn_remove-file', 'click', function (__e) {

			__e.preventDefault();

			var $file = mm.find(base._dataName, this.closest('.mm_form-file, .mm_form-image'))[0];
			if (!$file || $file.readOnly || $file.disabled) return;

			base.clear($file, true);

		});

	})();

	// public
	return {
		// 파일 데이터
		getData: function (__element) {

			// ? __element:element - 파일 단일 요소

			var $element = mm.ui.element(base._dataName, __element)[0];
			if (!$element) return null;

			var data = mm.data.get($element, base._dataName);
			if (mm.is.empty(data)) data = mm.data.set($element, base._dataName, { initial: base.initial($element) });

			return data;

		},
		// 파일 내용 삭제
		clear: function (__elements, __isSet) {

			// ? __elements:element
			// ? __isSet:boolean - 파일 변경 적용

			var $elements = mm.ui.element(base._dataName, __elements);

			_.forEach($elements, function (__$el) {

				base.clear(__$el, __isSet);

			});

		},
		// 파일 확인
		check: function (__elements) {

			// ? __elements:element

			var $elements = mm.ui.element(base._dataName, __elements);

			_.forEach($elements, function (__$el) {

				base.check(__$el);

			});

		},
		// 파일 적용
		set: function (__elements) {

			// ? __elements:element

			var $elements = mm.ui.element(base._dataName, __elements);

			_.forEach($elements, function (__$el) {

				base.set(__$el);

			});

		},
	};

})();
//> 폼 요소(파일)

//< 폼 요소(멀티 파일)
mm.form.multiple = (function () {

	// $el['__mm.data__'].name에 저장할 기본 값
	var initial = {
		_isMax: false,// ? :boolean - 리스트 항목 최대 개수 유지
		_isAuto: true,// ? :boolean - 빈 파일 자동 추가/삭제
		_max: 9,// ? :number - 최대 생성 개수
		_isDrop: false,// ? ::booeal - 드래그앤드롭으로 추가 가능
		defaults: [],// ? :array - 초기 값
		// 내부사용
		__: {
			_appendHTML: null,// ? :string - 파일 아이템 생성용
		},
	};
	// * mm_form-image만 지원, mm_form-file 필요 시 제작 필요
	// _isMax: true, _isAuto: true = 최대 개수 유지, 중간에 빈 칸 없이 자동 정렬
	// _isMax: true, _isAuto: false = 최대 개수 유지, 삭제 시 정렬 없이 빈 칸 유지
	// _isMax: false, _isAuto: true = 추가, 삭제 시 _max보다 요소가 적으면 마지막에 빈 칸 생성
	// _isMax: false, _isAuto: false = 수동으로 요소 생성

	// UI 고유 객체
	var base = {
		get _dataName() { return 'data-multiple'; },// 데이타 속성 이름
		// 파일 아이템 생성
		append: function (__$multiple, __total) {

			// ? __$multiple:element - multiple 파일 단일 요소
			// ? __total:number - 생성할 개수
			// __total 값이 없으면 1개 생성

			var _total = (Number.isFinite(__total)) ? __total : 1;
			if (_total < 1) return [];

			var data = mm.data.get(__$multiple, base._dataName);
			var $list = mm.find('> ul', __$multiple.closest('.mm_form-multiple'))[0];
			var $files = [];

			while ($files.length < _total) {
				var $item = mm.element.create(data.__._appendHTML)[0];
				$list.append($item);

				$files.push(mm.find('data-file', $item)[0]);
			}

			base.convert(__$multiple, $files);
			return $files;

		},
		// 멀티 파일에 맞게 기본 파일의 이벤트와 속성을 변환
		convert: function (__$multiple, __$files) {

			// ? __$multiple:element - multiple 파일 단일 요소
			// ? __$files:element - 파일 요소

			var data = mm.data.get(__$multiple, base._dataName);

			_.forEach(__$files, function (__$file) {

				var fileData = mm.form.file.getData(__$file);
				var onFileChange = fileData.onChange;
				var onFileChangeParams = fileData.onChangeParams;

				fileData.onChange = function () {

					mm.apply(onFileChange, __$file, onFileChangeParams);
					base.checkLast(__$multiple);

				}

				if (data._isMax === true && data._isAuto === false) return;// 전체 노출에서는 삭제 제외

				var $btnRemove = mm.find('.btn_remove-file', __$file.closest('.mm_form-file, .mm_form-image'))[0];
				mm.event.on($btnRemove, 'click', function btnRemoveInlineHandler(__e) {

					__e.preventDefault();
					__e.stopPropagation();

					this.closest('li').remove();
					base.checkLast(__$multiple);

				}, { _isOnce: true, _isOverwrite: true });

			});

			base.checkButton(__$multiple);

		},
		// 전체삭제, 순서편집 버튼 노출 확인
		checkButton: function (__$multiple) {

			var $ui = __$multiple.closest('.mm_form-multiple');

			if (mm.find('.__image-on', $ui).length > 1) mm.element.show(mm.find('.btn_remove-all, .mm_form-multiple-sortable', $ui));
			else mm.element.hide(mm.find('.btn_remove-all, .mm_form-multiple-sortable', $ui));

		},
		// 마지막 빈 파일 추가여부 확인
		checkLast: function (__$multiple) {

			// ? __$multiple:element - multiple 파일 단일 요소

			base.checkButton(__$multiple);

			var data = mm.data.get(__$multiple, base._dataName);
			if (data._isAuto !== true) return;// 수동

			var $files = mm.find('data-file', __$multiple.closest('.mm_form-multiple'));
			var lastData = ($files.length > 0) ? mm.form.file.getData(_.last($files)) : null;

			if ($files.length < data._max && (data._isMax === true || !lastData || !mm.is.empty(lastData.file))) base.append(__$multiple);

		},
		// 개수 초과
		exceed: function (__max) {

			// ? __max:number - 최대 생성 개수

			mm.bom.alert(mm.string.template('파일은 최대 ${MAX}개까지 추가할 수 있습니다.', { MAX: __max }));

		},
		// change, drop 으로 변경
		change: function (__$multiple, __files) {

			var data = mm.data.get(__$multiple, base._dataName);
			if (mm.is.empty(data)) data = mm.data.set(__$multiple, base._dataName, { initial: initial });

			var $ui = __$multiple.closest('.mm_form-multiple');

			var $files = mm.find('data-file', $ui);
			var $emptyFiles = _.filter($files, function (__$file) {

				var fileData = mm.form.file.getData(__$file);
				return mm.is.empty(fileData.file);

			});

			var _fileTotal = $files.length + __files.length - $emptyFiles.length;
			var _appendTotal = __files.length - $emptyFiles.length;
			if (_fileTotal > data._max) {
				_appendTotal -= _fileTotal - data._max;
				base.exceed(data._max);
			}

			$emptyFiles = $emptyFiles.concat(base.append(__$multiple, _appendTotal));

			// 선택한 이미지 적용
			_.forEach($emptyFiles, function (__$empty, __index) {

				var emptyData = mm.form.file.getData(__$empty);

				// 미리보기 이미지
				if (__$empty.closest('.mm_form-image')) {
					emptyData.originFile = __files[__index];
					emptyData.file = {};
					for (var __key in emptyData.originFile) {
						emptyData.file[__key] = emptyData.originFile[__key];
					}
				}
				// 일반 파일
				else emptyData.file = __files[__index];

				if (!mm.is.empty(emptyData.file)) mm.form.file.check(__$empty);

			});

		},
		// 전체 삭제
		remove: function (__$multiple) {

			var data = mm.data.get(__$multiple, base._dataName);
			var $ui = __$multiple.closest('.mm_form-multiple');

			// 최대 개수 유지
			if (data._isMax === true) mm.form.file.clear(mm.find('data-file', $ui), true);
			else {
				mm.element.remove(mm.find('li', $ui));
				base.checkLast(__$multiple);
			}

		},
	};

	// private
	(function () {

		mm.delegate.on(document, mm.selector(base._dataName, '[]'), 'update change click', function (__e) {

			var $multiple = this;
			var data = mm.data.get($multiple, base._dataName);
			if (mm.is.empty(data)) data = mm.data.set($multiple, base._dataName, { initial: initial });

			var $ui = $multiple.closest('.mm_form-multiple');

			switch (__e.type) {
				case 'click':
					// 같은 파일을 선택할 수 있도록 클릭 시 value 비움
					// ie9 이상에서 파일 초기화
					if (mm.is.ie('ie9over')) {
						$multiple.type = 'text';
						$multiple.type = 'file';
					}
					else $multiple.value = '';
					break;
				// 초기화
				case 'update':
					if (!mm.is.display($multiple)) return;

					var _isInit = (!data.__._appendHTML) ? true : false;// 첫 실행
					if (_isInit) data.__._appendHTML = mm.find('> ul > li', $ui)[0].outerHTML;

					var $files = mm.find('data-file', $ui);
					base.convert($multiple, $files);

					var $appends = [];

					// 초기 이미지 노출
					if (_isInit && Array.isArray(data.defaults) && data.defaults.length > 0) {
						if ($files.length < data.defaults.length) $appends = base.append($multiple, data.defaults.length - $files.length);// 이미지 개수 생성

						$files = mm.object.values($files).concat($appends);
						_.forEach($files, function (__$file, __index) {

							var fileData = mm.form.file.getData(__$file);
							fileData.file.name = data.defaults[__index];
							fileData.file.result = data.defaults[__index];
							mm.form.file.set(__$file);// 파일 값 적용

						});
					}

					if (data._isMax === true && $files.length < data._max) $appends = base.append($multiple, data._max - $files.length);// 최대 개수 생성
					break;
				// 파일 선택(변경)
				case 'change':
					if ($multiple.files.length === 0) return;// 선택 취소

					base.change($multiple, $multiple.files);
					break;
			}

		});

		// 전체 삭제
		mm.delegate.on(document, '.mm_form-multiple .btn_remove-all', 'click', function (__e) {

			__e.preventDefault();

			base.remove(mm.find(base._dataName, this.closest('.mm_form-multiple'))[0]);

		});

		// 드래그앤드롭
		mm.delegate.on(document, '.mm_form-multiple', 'dragover dragenter dragleave dragend drop', function (__e) {

			__e.preventDefault();
			__e.stopPropagation();

			var $ui = this;
			var $multiple = mm.find(base._dataName, $ui)[0];
			if (!$multiple) return;

			var data = mm.data.get($multiple, base._dataName);
			if (mm.is.empty(data)) data = mm.data.set($multiple, base._dataName, { initial: initial });
			if (data._isDrop !== true) return;

			switch (__e.type) {
				case 'drop':
					if (__e.dataTransfer.files.length === 0) return;// 선택 취소

					base.change($multiple, __e.dataTransfer.files);
					break;
			}

		});

		// 순서편집
		mm.delegate.on(document, '.mm_form-multiple [class*=btn_sort]', 'click', function (__e) {

			var $ui = this.closest('.mm_form-multiple');
			var $fileList = mm.find('> ul', $ui)[0];
			var $multiple = mm.find(base._dataName, $ui)[0];
			var data = mm.data.get($multiple, base._dataName);
			if (mm.is.empty(data)) data = mm.data.set($multiple, base._dataName, { initial: initial });

			// 순서편집
			if (this.classList.contains('btn_sort')) {
				$ui.classList.add('__multiple-sortable');
				mm.element.append(mm.find('.mm_form-image', $fileList), '<i class="ico_image-sortable"></i>');

				if (!data._isMax && data._isAuto) {
					var $reject = mm.closest(_.filter(mm.find('.mm_form-image', $ui), function (__$item) { return !__$item.classList.contains('__image-on'); }), 'li');
					mm.element.hide($reject);
				}

				data.Sortable = Sortable.create($fileList, { forceFallback: true });
				_.forEach(mm.find('li', $fileList), function (__$item, __index){

					mm.data.get(__$item)._sortIndex = __index;

				});
			}
			else {
				// 편집취소
				if (this.classList.contains('btn_sort-cancel')) {
					var $fileItems = _.sortBy(mm.find('li', $fileList), [function (__$item) { return mm.data.get(__$item)._sortIndex; }]);
					mm.element.append($fileList, $fileItems);
				}
				// 편집적용
				else if (this.classList.contains('btn_sort-apply')) {
					//
				}

				$ui.classList.remove('__multiple-sortable');
				mm.element.remove(mm.find('.mm_form-image .ico_image-sortable', $fileList));

				data.Sortable.destroy();
				delete data.Sortable;

				if (!data._isMax && data._isAuto) mm.element.show(mm.closest(mm.find('.mm_form-image', $ui), 'li'));
			}

		});

	})();

	// public
	return {
		// 파일 요소 추가
		append: function (__elements, __total) {

			// ? __elements:element - 멀티 파일 요소
			// ? __total:number - 생성할 개수

			var $elements = mm.ui.element(base._dataName, __elements);

			_.forEach($elements, function (__$el) {

				var data = mm.data.get(__$el, base._dataName);
				if (mm.is.empty(data)) data = mm.data.set(__$el, base._dataName, { initial: initial });

				var $files = mm.find('data-file', __$el.closest('.mm_form-multiple'));
				if ($files.length < data._max) base.append(__$el);
				else base.exceed(data._max);

			});

		},
		// 파일 요소 전체 삭제
		remove: function (__elements) {

			// ? __elements:element - 멀티 파일 요소

			var $elements = mm.ui.element(base._dataName, __elements);

			_.forEach($elements, function (__$el) {

				base.remove(__$el);

			});

		},
	};

})();
//> 폼 요소(멀티 파일)

//< 브라우저 팝업
mm.bom = (function () {

	// * 여러 개를 생성하면 차례로 노출

	// UI 고유 객체
	var base = {
		$bom: null,
		get _classOn() { return '__bom-on'; },
		// BOM 영역 생성
		appendBom: function () {

			base.$bom = mm.element.create(mm.string.template([
				// '<!-- 브라우저 팝업 -->',
				'<div class="mm_bom">',
				'	<div class="mm_bom-dim"></div>',
				'	<div class="mm_bom-items"></div>',
				'</div>',
				// '<!--// 브라우저 팝업 -->',
			]))[0];
			mm.find('.mm_app')[0].append(base.$bom);

		},
		// BOM 영역 삭제
		removeBom: function () {

			base.$bom.remove();
			base.$bom = null;

		},
		//- BOM 사이즈 재조정
		resizeBom: function (__$bomItem) {

			// ? __$bomItem:element - 팝업 단일 요소

			var $container = (__$bomItem) ? mm.find('> .mm_bom-item-inner', __$bomItem)[0] : mm.find('.mm_bom-item.__bom-on > .mm_bom-item-inner', base.$bom)[0];
			var containerStyle = mm.element.style($container, { 'height': '' });

			mm.element.style($container, { 'height': (function () {

					var _value = parseFloat(containerStyle.height);
					if (mm.is.odd(_value)) _value += 1;

					return mm.number.unit(_value);

				})(),
			});

		},
		// BOM 요소 생성
		appendItem: function (__text, __title, __buttons) {

			// ? __text:string/number - 내용
			// ? __title:string - 팝업 제목
			// ? __buttons:array - 변경할 버튼 이름으로 [확인, 취소] 순서로 적용

			if (!base.$bom) base.appendBom();

			var $items = mm.find('.mm_bom-item', base.$bom);
			mm.class.remove($items, base._classOn);

			if ($items.length === 0) mm.scroll.off();// 처음 생성할 때만 적용
			document.documentElement.classList.add('__bom');

			// 요소 생성
			var _text = (typeof(__text) === 'number') ? __text.toString() : __text;
			var $bomItem = mm.element.create(mm.string.template([
				'<div class="mm_bom-item">',
				'	<div class="mm_bom-item-inner">',
				'		<i class="ico_bom-alert"></i>',
				'		<div class="mm_box">',
				'			<div class="mm_bom-item-text">',
				'				<h2>${TITLE}</h2>',
				'				<p>${TEXT}</p>',
				'			</div>',
				'			<div class="mm_bom-item-btnbox">',
				'				<ul class="mm_flex __flex_equal__">',
				'					<li><button type="button" class="btn_no"><b>${CANCEL}</b></button></li>',
				'					<li><button type="button" class="btn_ok"><b>${OK}</b></button></li>',
				'				</ul>',
				'			</div>',
				'		</div>',
				'	</div>',
				'</div>',
			], { TITLE: __title, TEXT: _text.replace(/\n/ig, '<br>'), CANCEL: __buttons[1] || '취소', OK: __buttons[0] || '확인' }))[0];

			var $bomItemText = mm.find('.mm_bom-item-text', $bomItem)[0];
			if (__title.replace(/\<br\>/g, '').trim().length === 0) mm.find('h2', $bomItemText)[0].remove();
			if (_text.replace(/\<br\>/g, '').trim().length === 0) mm.find('p', $bomItemText)[0].remove();
			if ($bomItemText.children.length === 0) $bomItemText.remove();

			mm.find('.mm_bom-items', base.$bom)[0].append($bomItem);
			base.resizeBom($bomItem);

			mm.delay.on(mm.class.add, { params: [$bomItem, base._classOn] });// css 모션 딜레이 적용
			mm.delay.on(mm.focus.in, { _time: mm.time._faster, _isSec: true, _name: 'DELAY_FOCUS_BOM', _isOverwrite: true, params: [mm.find('.btn_ok', $bomItem)[0]] });

			return $bomItem;

		},
		// BOM 요소 닫기
		closeItem: function (__callback, __params, __isClose) {

			// ? __callback:function
			// ? __params:array - 콜백 파라미터

			var $items = mm.find('.mm_bom-item', base.$bom);
			if ($items.length === 0) return;

			var $lastItem = _.last($items);

			if (__isClose !== false) {
				mm.event.on($lastItem, 'transitionEnd webkitTransitionEnd MSTransitionEnd', function (__e) {

					mm.event.off($lastItem, 'transitionEnd webkitTransitionEnd MSTransitionEnd');
					$lastItem.remove();

					// BOM영역 삭제 step.2
					if ($items.length === 0) {
						base.removeBom();
						mm.scroll.on();
					}

				});

				try {
					mm.event.off(mm.find('.btn_ok, .btn_no', $lastItem), 'click');// ie에서 오류(닫기가 안되는 이슈)
				}
				catch (__error) {
					console.log(__error);
				}

				$lastItem.classList.remove(base._classOn);

				if ($items.length > 1) {
					var $prevItem = $lastItem.previousElementSibling;
					$prevItem.classList.add(base._classOn);
					mm.focus.in(mm.find('.btn_ok', $prevItem));
				}
				// BOM영역 삭제 step.1
				else {
					document.documentElement.classList.remove('__bom');
				}
			}

			mm.apply(__callback, window, __params);

		},
	};

	// private
	(function () {

		//

	})();

	// public
	return {
		//- 얼럿
		alert: function (__text, __callback, __option) {

			// ? __text:string - 내용
			// ? __callback:function - 확인/취소 버튼을 클릭할 때 실행할 함수
			// __option._title 값이 없으면 제목 요소 삭제
			// * 제목과 내용의 줄바꿈은 \n 또는 <br>로 적용
			// mm.bom.alert('내용');
			// mm.bom.alert('내용', 콜백함수, { _title: '제목', buttoms: ['확인'], params: [콜백 파라미터] });

			if (!['string', 'number'].includes(typeof(__text))) return;
			if (frameElement) return mm.apply('mm.bom.alert', top, arguments);// 최상위에서 실행

			var option = mm.extend({
				_isClose: true,// ? :boolean - 버튼 클릭 시 닫힘(값이 false면 수동으로 callback에서 닫아야 함)
				_title: '알림',// ? :string - 팝업 제목
				buttons: [],// ? :array - 변경할 버튼 이름으로 얼럿은 취소가 없어 [확인] 만 적용
				params: [],// ? :array - 콜백 파라미터
			}, __option);
			var $bomItem = base.appendItem(__text, option._title, option.buttons);

			mm.find('.btn_no', $bomItem)[0].closest('li').remove();
			mm.event.on(mm.find('.btn_ok', $bomItem), 'click', function (__e) {

				__e.preventDefault();

				base.closeItem(__callback, option.params, option._isClose);

			}, { _isOnce: option._isClose });

		},
		//- 컨펌
		confirm: function (__text, __callback, __option) {

			// ? __text:string - 내용
			// ? __callback:function - 확인/취소 버튼을 클릭할 때 실행할 함수
			// __option._title 값이 없으면 제목 요소 삭제
			// * 제목과 내용의 줄바꿈은 \n 또는 <br>로 적용
			// * __callback의 1번째 파라미터로 확인(true)/취소(false) 값 전달
			// mm.bom.confirm('내용');
			// mm.bom.confirm('내용', 콜백함수, { _title: '제목', buttoms: ['확인', '취소'], params: [콜백 파라미터] });

			if (!['string', 'number'].includes(typeof(__text))) return;
			if (frameElement) return mm.apply('mm.bom.confirm', top, arguments);// 최상위에서 실행

			var option = mm.extend({
				_isClose: true,// ? :boolean - 버튼 클릭 시 닫힘(값이 false면 수동으로 callback에서 닫아야 함)
				_title: '확인',// ? :string - 팝업 제목
				buttons: [],// ? :array - 변경할 버튼 이름으로 [확인, 취소] 순서로 적용
				params: [],// ? :array - 콜백 파라미터
			}, __option);
			var $bomItem = base.appendItem(__text, option._title, option.buttons);

			mm.event.on(mm.find('.btn_ok, .btn_no', $bomItem), 'click', function (__e) {

				__e.preventDefault();

				base.closeItem(__callback, [this.classList.contains('btn_ok')].concat(option.params), option._isClose);

			}, { _isOnce: option._isClose });

		},
		//- 프롬프트
		prompt: function (__text, __callback, __option) {

			// ? __text:string - 내용
			// ? __callback:function - 확인/취소 버튼을 클릭할 때 실행할 함수
			// __option._title 값이 없으면 제목 요소 삭제
			// __option.forms 값이 없으면 기본으로 input:text 1개만 노출
			// * 제목과 내용의 줄바꿈은 \n 또는 <br>로 적용
			// * __callback의 1번째 파라미터로 확인(true)/취소(false) 값 전달
			// * __callback의 2번째 파라미터로 폼 결과 값을 배열로 전달
			// mm.bom.prompt('내용');
			// mm.bom.prompt('내용', 콜백함수, { _title: '제목', buttoms: ['확인', '취소'], params: [콜백 파라미터], forms: [{ _type: 'tel', _placeholder: '휴대폰 번호' }, { _type: 'select', _value: 200, attribute: { 'style': 'border-width: 2px;' }, options: [{ _text: '옵션1', _value: 100 }, { _text: '옵션2', _value: 200 }] }] });

			if (!['string', 'number'].includes(typeof(__text))) return;
			if (frameElement) return mm.apply('mm.bom.prompt', top, arguments);// 최상위에서 실행

			var option = mm.extend({
				_isClose: true,// ? :boolean - 버튼 클릭 시 닫힘(값이 false면 수동으로 callback에서 닫아야 함)
				_title: '입력',// ? :string - 팝업 제목
				buttons: [],// ? :array - 변경할 버튼 이름으로 [확인, 취소] 순서로 적용
				params: [],// ? :array - 콜백 파라미터
				forms: [{ _type: 'text', _placeholder: '입력' }],
					// ? _type:string - 가능한 요소 input(text, tel, number, email, search, url, password, date, month, time), textarea, select
					// ? _value:string/number - 초기 값
					// ? _placeholder:string - 폼 안내 문구
					// ? _format:string - _type 값이 date, month, time일 때만 사용
					// ? attribute:object - 요소에 추가로 적용할 속성
					// ? options:array - _type 값이 select일 때만 사용
					// ? options[]._text:string - 옵션 문구
					// ? options[]._value:string - 옵션 값
			}, __option);
			var $bomItem = base.appendItem(__text, option._title, option.buttons);
			var $itemForm = mm.element.create('<ul class="mm_bom-item-form"></ul>')[0];

			mm.element.before(mm.find('.mm_bom-item-btnbox', $bomItem)[0], $itemForm);

			_.forEach(option.forms, function (__form) {

				var $form;
				var $li = mm.element.create('<li></li>')[0];
				$itemForm.append($li);

				switch (__form._type) {
					// data-select
					case 'select':
						if (mm.is.empty(__form.options)) return;

						var $item = mm.element.create(mm.string.template([
							'<div class="mm_form-select">',
							'	<label>',
							'		<select data-select></select>',
							'		<b class="text_selected"></b>',
							'		<i class="ico_form-select"></i>',
							'	</label>',
							'</div>',
						]))[0];
						$li.append($item);

						$form = mm.find('data-select', $item)[0];

						_.forEach(__form.options, function (__option) {

							mm.element.append($form, mm.string.template('<option value="${VALUE}">${TEXT}</option>', { VALUE: __option._value, TEXT: __option._text }));

						});
						break;
					// data-text
					default:
						var _isDate = ['date', 'month', 'time'].includes(__form._type);
						if (!mm.is.mobile() && !['textarea', 'password'].includes(__form._type)) __form._type = 'text';

						var itemTemplate = (__form._type === 'textarea') ? { CLASS: 'mm_form-textarea', FORM: '<textarea class="textfield" data-text></textarea>' } : { CLASS: 'mm_form-text', FORM: mm.string.template('<input type="${TYPE}" class="textfield" data-text>', { TYPE: __form._type }) };
						itemTemplate.PLACEHOLDER = (typeof(__form._placeholder) === 'string') ? __form._placeholder : (!_isDate) ? '입력' : (__form._type === 'time') ? '시간' : '날짜';

						var $item = mm.element.create(mm.string.template([
							'<div class="${CLASS}">',
							'	<button type="button" class="btn_text-clear"><i class="ico_form-clear"></i><b class="mm_ir-blind">지우기</b></button>',
							'	<label>',
							'		${FORM}<i class="bg_text"></i>',
							'		<span class="text_placeholder">${PLACEHOLDER}</span>',
							'	</label>',
							'</div>',
						], itemTemplate))[0];
						$li.append($item);

						$form = mm.find('data-text', $item)[0];

						// 비밀번호
						if (__form._type === 'password') mm.element.before(mm.find('.btn_text-clear', $item), '<button type="button" class="btn_text-pw"><i class="ico_hide"></i><b class="mm_ir-blind">비밀번호 보기</b></button>');

						// 날짜, 시간
						if (_isDate) {
							if (!mm.is.empty(__form._format)) mm.element.attribute($form, { 'data-text': { _format: __form._format } });
							if (mm.is.mobile()) mm.element.before($form, '<span class="textfield text_date"></span>');
							// pc datepicker 연결
							else if (mm.datepicker) {
								$item.classList.add('__text_calendar__');
								$form.setAttribute('data-datepicker', '');
								mm.element.append($form.closest('label'), '<i class="ico_datepicker-calendar"></i>');
								if (!mm.is.empty(__form._format)) mm.element.attribute($form, { 'data-datepicker': { _format: __form._format } });
							}
						}
				}

				// attribute 추가
				if (mm.is.object(__form.attribute)) {
					_.forEach(__form.attribute, function (__value, __key) {

						if (__key === 'class') {
							var classes = __value.split(' ');
							_.forEach(classes, function (__class) {

								$form.classList.add(__class);

							});
						}
						else $form.setAttribute(__key, __value);

					});
				}

				// value 적용
				if (!mm.is.empty(__form._value)) $form.value = __form._value;// _type이 select일 때 selectedIndex로 option 요소를 선택하는 기능 필요?

			});
			mm.form.update($itemForm);

			base.resizeBom($bomItem);

			mm.event.on(mm.find('.btn_ok, .btn_no', $bomItem), 'click', function (__e) {

				__e.preventDefault();

				var $forms = mm.find(mm.selector(['data-text', 'data-select'], '[]'), $itemForm);
				base.closeItem(__callback, [this.classList.contains('btn_ok'), _.map($forms, 'value')].concat(option.params), option._isClose);

			}, { _isOnce: option._isClose });

		},
		//- 닫기
		close: function (__callback, __params) {

			// ? __callback:function
			// ? __params:array - 콜백 파라미터

			if (frameElement) return mm.apply('mm.bom.close', top, arguments);// 최상위에서 실행

			base.closeItem(__callback, __params);

		},
	};

})();
//> 브라우저 팝업

//< 페이지 팝업
mm.popup = (function () {

	// private
	(function () {

		//

	})();

	// public
	return {
		//- 팝업열기
		open: function (__url, __option) {

			if (!__url) return;

			var option = mm.extend({
				_name: '',// :string - _blank, _parent, _self, _top, name
				specs: {
					_top: 0,
					_left: 0,
					_width: 0,// default window.innerWidth
					_height: 0,// default window.innerHeight
					_isTitlebar: false,
					_isMenubar: false,
					_isToolbar: false,
					_isLocation: false,
					_isScrollbars: true,
					_isStatus: false,
					_isResizable: false,
				},
				openEl: null,// :element - mm.popup.openEl로 리턴할 요소
			}, __option);

			var resizes = { _width: option.specs._width, _height: option.specs._height };// 값이 0이 아니면 팝업 로드 시 리사이즈 안함
			if (resizes._width === 0) option.specs._width = window.innerWidth;
			if (resizes._height === 0) option.specs._height = window.innerHeight;

			// ie에서만 사용
			var _specs = mm.string.template('${,,,SPECS(,)}', { SPECS: _.chain(option.specs)
				.map(function (__value, __key) {

					return mm.string.template('${KEY}=${VALUE}', { KEY: __key.replace(/_|is/gi, ''), VALUE: (__value === true) ? 'yes' : (__value === false) ? 'no' : __value });

				}).value() }).toLowerCase();

			var $popup = window.open(__url, option._name, _specs);
			if ($popup) {
				$popup.resizeTo(option.specs._width, option.specs._height);
				$popup.moveTo(option.specs._left, option.specs._top);

				mm.data.get($popup).popup = { openEl: option.openEl };
			}
			else {
				mm.bom.alert('브라우저에서 팝업차단을 해제해주세요');
				return false;// 팝업을 여러개 띄울 때 중복 방지(for, while 중지)
			}

			return $popup;
		},
		//- 팝업닫기
		close: function (__callback, __option) {

			// 닫기 콜백(우선순위 __callback)
			if (_.isFunction(__callback)) mm.apply(__callback, window, __option.args);

			window.close();

		},
		//- 팝업 사이즈 재조정(window 팝업만 적용)
		resize: function () {

			if (mm._isPopup) {
				var $frameContent = mm.find('.mm_page-content')[0];
				var _scrollWidth = (window.innerWidth === document.documentElement.offsetWidth) ? window.outerWidth - window.innerWidth : window.outerWidth - document.documentElement.offsetWidth;
				var _scrollHeight = window.outerHeight - window.innerHeight;

				// 리사이즈 과정에서 innerWidth 또는 innerHeight가 변경되지 않는 경우 resize 재실행힙니다.
				if (window.innerWidth > window.outerWidth || window.innerHeight > window.outerHeight) {
					mm.delay.on(function () { mm.popup.resize() });
					return;
				}

				// IE에서 border-width가 없는경우 0이 아닌 NaN 값이 들어기때문에 NaN인경우 0으로 재설정합니다.
				var _borderWidth = parseFloat(mm.element.style('.mm_view', 'border-width')) * 2;
				if (!_borderWidth) _borderWidth = 0;

				var _width = (window.__resizes__ && window.__resizes__._width > 0) ? window.outerWidth : $frameContent.offsetWidth + _scrollWidth + _borderWidth;
				var _height = (window.__resizes__ && window.__resizes__._height > 0) ? window.outerHeight : $frameContent.offsetHeight + mm.find('.mm_header')[0].offsetHeight + _scrollHeight + _borderWidth;
				window.resizeTo(_width, _height);

				return false;
			}

		},
		//- 오프너(window)
		get opener() {

			return window.opener;

		},
		//- 오픈엘리먼트(element, 팝업 열때 클릭한 요소)
		get openEl() {

			var data = mm.data.get(window).popup;
			return (window.opener && !mm.is.empty(data)) ? data.openEl : null;

		},
	};

})();
//> 페이지 팝업

//< 모달 팝업
mm.modal = (function () {

	// UI 고유 객체
	var base = {
		$modal: null,
		get _classOn() { return '__modal-on'; },
		get _classOld() { return '__modal-old'; },// 이전 모달
		//- 오프너(window)
		get opener() {

			if (mm._isModal) return window.opener;// window 모달

			var $openEl = base.openEl;
			var $openDoc = ($openEl) ? $openEl.ownerDocument : document;
			if (!$openDoc) $openDoc = ($openEl.document) ? $openEl.document : $openEl;

			return $openDoc.defaultView;

		},
		//- 오픈 요소(element, 모달 열때 클릭한 요소)
		get openEl() {

			if (mm._isModal) return window.opener;// window 모달

			var $modalItem = mm.find(mm.selector(base._classOn, '.'), base.$modal)[0];
			var data = mm.data.get($modalItem, 'modal');

			return (data) ? data.openEl : null;

		},
		// 모달영역 생성
		appendModal: function () {

			base.$modal = mm.element.create(mm.string.template([
				// '<!-- 모달 팝업 -->',
				'<div class="mm_modal">',
				'	<div class="mm_modal-items"></div>',
				'</div>',
				// '<!--// 모달 팝업 -->',
			]))[0];
			mm.find('.mm_app')[0].append(base.$modal);

		},
		// 모달영역 삭제
		removeModal: function () {

			base.$modal.remove();
			base.$modal = null;

		},
		// 모달 리사이즈
		resizeModal: function (__option) {

			// mm.frameResize의 parameter를 option으로 적용
			var option = mm.extend({
				// _isLoad: false,// ? :boolean - 페이지 ready, load로 실행
				_isEven: true,
				_extraHeight: null,
			}, __option);

			if (mm._isModal) {
				// window 모달
				if (!frameElement) {
					var $frameContent = mm.find('.mm_page-content')[0];
					var outerWidth = window.outerWidth - window.innerWidth;
					var outerHeight = window.outerHeight - window.innerHeight;

					window.resizeTo($frameContent.offsetWidth + outerWidth, $frameContent.offsetHeight + outerHeight + mm.find('.mm_header')[0].offsetHeight);;
				}
				// 페이지 모달 내부
				else mm.frameResize(null, option);
			}
			// 페이지 모달 외부
			else {
				var $frame = top.mm.find(mm.string.template('.${ITEM} iframe', { ITEM: base._classOn }), base.$modal)[0];
				mm.frameResize($frame, option);
			}

		},
	};

	// private
	(function () {

		//

	})();

	// public
	return {
		//- 모달 열기
		open: function (__url, __option) {

			// ? __url:string - 팝업 경로

			if (!__url) return;
			if (frameElement) return mm.apply('mm.modal.open', top, arguments);// 최상위에서 실행

			var option = mm.extend({
				openEl: null,// ? :element - mm.modal.openEl로 리턴할 요소
				_frameId: null,// ? :string - iframe의 id 값
				_frameName: null,// ? :string - iframe의 name 값
				_frameTitle: null,// ? :string - iframe의 title 값(값이 없으면 iframe이 로드되었을 때 내부 title 텍스트가 적용)
				_isFull: false,// ? :boolean - 전체화면 모달
				_isHeader: true,// ? :boolean - 헤더 노출여부
				_isCloseOutside: false,// ? :boolean - dim을 클릭해서 닫기
				classes: [],// ? :array - 생성된 mm_modal-item 요소에 추가할 클래스
				onReady: null,// ? :function
				onReadyParams: [],// ? :array
				onLoad: null,// ? :function
				onLoadParams: [],// ? :array
			}, __option);

			if (!base.$modal) base.appendModal();

			var $items = mm.find('.mm_modal-item', base.$modal);
			mm.class.remove($items, base._classOn);
			mm.class.add($items, base._classOld);

			if ($items.length === 0) mm.scroll.off();// 처음 생성할 때만 적용
			document.documentElement.classList.add('__modal');

			// 요소 생성
			var $modalItem = mm.element.create(mm.string.template([
				'<div class="mm_modal-item">',
				'	<div class="mm_modal-item-dim"></div>',
				'	<div class="mm_modal-item-inner">',
				'		<button type="button" class="btn_modal-close" onclick="mm.modal.close();">',
				'			<i class="ico_modal-close"></i>',
				'			<b class="mm_ir-blind">모달 닫기</b>',
				'		</button>',
				'		<iframe scrolling="no"></iframe>',// #앵커 url 지원 안함
				'	</div>',
				'</div>',
			]))[0];

			if (option._isCloseOutside) mm.element.attribute(mm.find('.mm_modal-item-dim', $modalItem), { 'tabindex': 0, 'onclick': 'mm.modal.close();' });
			if (option._isFull) $modalItem.classList.add('__modal-full');
			if (!mm.is.empty(option.classes)) mm.class.add($modalItem, option.classes);

			mm.data.set($modalItem, 'modal', { initial: { openEl: option.openEl} });
			mm.find('.mm_modal-items', base.$modal)[0].append($modalItem);

			// 흰화면이 오래 노출되는 이슈로 로드 전 레디 상태에서 팝업 노출
			mm.observer.on($modalItem, mm.event.type.frame_ready, function (__e) {

				$modalItem.classList.add(base._classOn);

				mm.apply(option.onReady, $modalItem, option.onReadyParams);

			}, { _isOnce: true });

			var $iframe = mm.find('iframe', $modalItem)[0];
			mm.element.attribute($iframe, (function () {

				var attr = { 'data-preload': { _src: __url.split('#')[0] } };
				if (option._frameId) attr.id = option._frameId;
				if (option._frameName) attr.name = option._frameName;
				if (option._frameTitle) attr.title = option._frameTitle;

				return attr;

			})());

			mm.preload.update($iframe, { onComplete: function () {

				var $modalItem = this.closest('.mm_modal-item');

				if (option._isHeader !== true) mm.find('.mm_header', this)[0].remove();
				if (mm.find('.btn_modal-close', this)[0]) mm.element.remove(mm.find('.btn_modal-close', $modalItem));// iframe 내부에 같은 버튼이 있으면 삭제
				base.resizeModal();

				mm.delay.on(mm.focus.in, { _time: mm.time._base, _isSec: true, _name: 'DELAY_FOCUS_MODAL', _isOverwrite: true, params: [$modalItem] });

				mm.apply(option.onLoad, $modalItem, option.onLoadParams);

			}, onError: mm.modal.close });

			return $modalItem;

		},
		//- 모달 닫기
		close: function (__callback, __params) {

			// ? __callback:function
			// ? __params:array - 콜백 파라미터

			if (frameElement) {
				mm.apply('mm.modal.close', top, arguments);// 최상위에서 실행
				return;
			}

			if (mm._isModal) {
				window.close();
				return;
			}

			if (!base.$modal) return;

			var $items = mm.find('.mm_modal-item', base.$modal);
			if ($items.length === 0) return;

			var $lastItem = _.last($items);

			mm.event.on($lastItem, 'transitionEnd webkitTransitionEnd MSTransitionEnd', function (__e) {

				mm.event.off($lastItem, 'transitionEnd webkitTransitionEnd MSTransitionEnd');
				$lastItem.remove();

				// 모달 영역 삭제 step.2
				if ($items.length === 0) {
					base.removeModal();
					mm.scroll.on();
				}

			});

			$lastItem.classList.remove(base._classOn);

			if ($items.length > 1) {
				var $prevItem = $lastItem.previousElementSibling;
				$prevItem.classList.remove(base._classOld);
				$prevItem.classList.add(base._classOn);
			}
			// 모달 영역 삭제 step.1
			else {
				document.documentElement.classList.remove('__modal');
			}

			mm.apply(__callback, window, __params);

		},
		//- 모달 리사이즈
		resize: function (__option) {

			base.resizeModal(__option);

		},
		//- 오프너(window)
		get opener() {

			if (frameElement) return top.mm.modal.opener;
			else return base.opener;

		},
		//- 오픈 요소(element, 모달 열때 클릭한 요소)
		get openEl() {

			if (frameElement) return top.mm.modal.openEl;
			else return base.openEl;

		},
	};

})();
//> 모달 팝업

//< 컬러픽커
mm.colorpicker = (function () {

	// $el['__mm.data__'].name에 저장할 기본 값
	var initial = {
		onChange: null,// ? :function
		onChangeParams: [],// ? :array - onChange의 2번째 이후 아규먼트로 전달
	};

	// UI 고유 객체
	var base = {
		get _dataName() { return 'data-colorpicker'; },// 데이타 속성 이름
		$picker: null,
		_classCheck: 'ico_colorpicker-check',
		// 픽커 생성
		appendPicker: function () {

			var colors = [
				['#ffebed', '#ffccd2', '#ef9998', '#e27570', '#ee5253', '#f6413a', '#e5383a', '#d32e34', '#c4282c', '#b61c1c'],
				['#fbe4ec', '#f9bbd0', '#f48fb1', '#f06292', '#ec407a', '#ea1e63', '#d81a60', '#c2175b', '#ad1457', '#890e4f'],
				['#f3e5f6', '#e1bee8', '#cf93d9', '#b968c7', '#aa47bc', '#9c28b1', '#8e24aa', '#7a1fa2', '#6a1b9a', '#4a148c'],
				['#eee8f6', '#d0c4e8', '#b39ddb', '#9675ce', '#7e57c2', '#673bb7', '#5d35b0', '#512da7', '#45289f', '#301b92'],
				['#e8eaf6', '#c5cae8', '#9ea8db', '#7986cc', '#5c6bc0', '#3f51b5', '#3949ab', '#303e9f', '#283593', '#1a237e'],
				['#e4f2fd', '#bbdefa', '#90caf8', '#64b5f6', '#42a5f6', '#2196f3', '#1d89e4', '#1976d3', '#1564c0', '#0e47a1'],
				['#e1f5fe', '#b3e5fc', '#81d5fa', '#4fc2f8', '#28b6f6', '#03a9f5', '#039be6', '#0288d1', '#0277bd', '#00579c'],
				['#dff7f9', '#b2ebf2', '#80deea', '#4dd0e2', '#25c6da', '#00bcd5', '#00acc2', '#0098a6', '#00828f', '#016064'],
				['#e0f2f2', '#b2dfdc', '#80cbc4', '#4cb6ac', '#26a59a', '#009788', '#00887a', '#00796a', '#00695b', '#004c3f'],
				['#e8f6e9', '#c8e6ca', '#a5d6a7', '#80c783', '#66bb6a', '#4bb050', '#43a047', '#398e3d', '#2f7d32', '#1c5e20'],
				['#f1f7e9', '#ddedc8', '#c5e1a6', '#aed582', '#9ccc66', '#8bc24c', '#7db343', '#689f39', '#548b2e', '#33691e'],
				['#f9fbe6', '#f0f4c2', '#e6ee9b', '#dde776', '#d4e056', '#cddc39', '#c0ca33', '#b0b42b', '#9e9e24', '#817716'],
				['#fffde8', '#fffac3', '#fff59c', '#fff176', '#ffee58', '#ffeb3c', '#fdd734', '#fac02e', '#f9a825', '#f47f16'],
				['#fef8e0', '#ffecb2', '#ffe083', '#ffd54f', '#ffc928', '#fec107', '#ffb200', '#ff9f00', '#ff8e01', '#ff6f00'],
				['#fff2df', '#ffe0b2', '#ffcc80', '#ffb64d', '#ffa827', '#ff9700', '#fb8c00', '#f67c01', '#ef6c00', '#e65100'],
				['#fbe9e7', '#ffccbb', '#ffab91', '#ff8a66', '#ff7143', '#fe5722', '#f5511e', '#e64a19', '#d64316', '#bf360c'],
				['#efebe8', '#d7ccc8', '#bcaba4', '#a0887e', '#8c6e63', '#795547', '#6d4d42', '#5d4038', '#4d342f', '#3e2622'],
				['#ebeff2', '#cfd8dd', '#b0bfc6', '#90a4ad', '#78909c', '#607d8b', '#546f7a', '#465a65', '#36474f', '#273238']
			];
			var grays = ['#ffffff', '#f6f6f6', '#ebebeb', '#dfdfdf', '#d6d6d6', '#cbcbcb', '#bebebe', '#b4b4b4', '#a7a7a7', '#949494', '#828282', '#737373', '#5e5e5e', '#535353', '#454545', '#2c2c2c', '#191919', '#000000'];

			base.$picker = mm.element.create(mm.string.template([
				'<div class="mm_colorpicker">',
				'	<div class="mm_colorpicker-list">',
				'		<ul></ul>',
				'		<ul></ul>',
				'	</div>',
				'	<div class="mm_colorpicker-foot">',
				'		<div class="mm_form-text">',
				'			<button type="button" class="btn_text-clear"><i class="ico_form-clear"></i><b class="mm_ir-blind">지우기</b></button>',
				'			<label>',
				'				<input type="text" class="textfield" data-text maxlength="6"><i class="bg_text"></i>',
				'				<span class="text_placeholder">직접입력(000000)</span>',
				'			</label>',
				'		</div>',
				'		<div class="mm_btnbox">',
				'			<div class="mm_inline">',
				'				<button type="button" class="mm_btn btn_color-cancel __btn_line__"><b>취소</b></button>',
				'				<button type="button" class="mm_btn btn_color-select"><b>적용</b></button>',
				'			</div>',
				'		</div>',
				'	</div>',
				'</div>',
			]))[0];
			var $colorLists = mm.find('.mm_colorpicker-list ul', base.$picker);
			var $pickerText = mm.find('.textfield', base.$picker)[0];

			mm.find('.mm_app')[0].append(base.$picker);

			for (var _i = 0; _i < 10; _i++) {
				_.forEach(colors, function (__items) {

					var $item = base.appendColor($colorLists[0], __items[_i]);
					if (_i > 3) mm.find('.btn_color-chip', $item)[0].classList.add('__check-white');

				});
			}

			_.forEach(grays, function (__gray, __index) {

				var $item = base.appendColor($colorLists[1], __gray, 1);
				if (__index > 5) mm.find('.btn_color-chip', $item)[0].classList.add('__check-white');

			});

			mm.event.on(mm.find('.btn_color-chip', base.$picker), 'click', function (__e) {

				if (mm.find(mm.selector(base._classCheck, '.'), this).length > 0) return base.selectColor();

				mm.class.remove(mm.find(mm.selector(base._classCheck, '.'), base.$picker), base._classCheck);
				mm.find('.bg_color', this)[0].classList.add(base._classCheck);

				mm.form.value($pickerText, mm.data.get(this, 'data-value', true));

			});

			mm.event.on(mm.find('.btn_color-select', base.$picker), 'click', base.selectColor);
			mm.event.on(mm.find('.btn_color-cancel', base.$picker), 'click', base.closePicker);

		},
		// 픽커 닫기
		closePicker: function () {

			mm.event.off(document, 'click', 'colorClickInlineHandler');
			mm.event.off(window, 'scroll', 'colorScrollInlineHandler');
			mm.element.style(base.$picker, { 'margin-top': '' });
			mm.find('.mm_app')[0].append(base.$picker);// 재사용

		},
		// 컬러칩 생성
		appendColor: function (__$parent, __color) {

			// ? __$parent:element - 단일 요소
			// ? __color:string - 컬러 코드

			var $item = mm.element.create(mm.string.template([
				'<li>',
				'	<button type="button" class="btn_color-chip" style="background-color:${COLOR}" data-value="${VALUE}">',
				'		<i class="bg_color"></i>',
				'		<b class="mm_ir-blind">${COLOR}</b>',
				'	</button>',
				'</li>',
			], { COLOR: __color, VALUE: __color.replace('#', '').toUpperCase() }))[0];

			__$parent.append($item);

			return $item;

		},
		// 컬러 선택
		selectColor: function () {

			var $ui = base.$picker.closest(mm.selector(base._dataName, '[]'));
			var $pickerText = mm.find('.textfield', base.$picker)[0];
			var $colorText = mm.siblings(base.$picker, '.colorfield')[0];
			var _color = $pickerText.value.trim();
			var _decimal = Number(mm.string.template('0x${COLOR}', { COLOR: _color }));

			if (_.isNaN(_decimal) || _decimal < 0 || _decimal > 16777215) return;

			$colorText.value = mm.string.join('#', _color);
			mm.element.style(mm.find('.bg_color', mm.siblings(base.$picker, '.btn_picker')[0]), { 'background-color': $colorText.value });

			base.closePicker();

			var data = mm.data.get($ui, base._dataName);
			if (mm.is.empty(data)) data = mm.data.set($ui, base._dataName, { initial: initial });
			mm.apply(data.onChange, $ui, [$colorText.value].concat(data.onChangeParams));

		},
	};

	// private
	(function () {

		mm.delegate.on(document, mm.string.template('[${UI}] .btn_picker', { UI: base._dataName }), 'click', function (__e) {

			__e.preventDefault();

			var $picker = mm.siblings(this, '.mm_colorpicker')[0];
			if ($picker) base.closePicker();
			else mm.colorpicker.open(this);

		});

	})();

	// public
	return {
		//- 열기
		open: function (__$element) {

			// ? __element:element - btn_picker 버튼 단일 요소

			base.closePicker();

			// 컬러픽커 생성
			if (!base.$picker) base.appendPicker();

			var $pickerText = mm.find('.textfield', base.$picker)[0];
			var $colorText = mm.siblings(__$element, '.colorfield')[0];
			var _color = $colorText.value.replace(/#/g, '').toUpperCase();

			mm.class.remove(mm.find(mm.selector(base._classCheck, '.'), base.$picker), base._classCheck);
			mm.class.add(mm.find(mm.string.template('[data-value="${COLOR}"] .bg_color', { COLOR: _color }), base.$picker)[0], base._classCheck);
			mm.form.value($pickerText, _color);

			mm.element.after(__$element, base.$picker);

			// 위치 보정
			var _marginTop = mm.element.offset(__$element).top - mm.element.offset(base.$picker).top + __$element.offsetHeight;
			mm.element.style(base.$picker, { 'margin-top': mm.number.unit(_marginTop) });
			if (window.innerHeight < mm.element.offset(base.$picker).top + base.$picker.offsetHeight) {
				_marginTop += window.innerHeight - (mm.element.offset(base.$picker).top + base.$picker.offsetHeight);
				mm.element.style(base.$picker, { 'margin-top': mm.number.unit(_marginTop) });
			}

			mm.event.on(document, 'click', function colorClickInlineHandler(__e) {

				if (!__e.target.closest('.mm_colorpicker')) base.closePicker();

			});

			mm.event.on(window, 'scroll', function colorScrollInlineHandler(__e) {

				base.closePicker();

			}, { _isCapture: true });

		},
		//- 닫기
		close: function () {

			base.closePicker();

		},
	};

})();
//> 컬러픽커

//< 데이트픽커
mm.datepicker = (function () {

	// $el['__mm.data__'].name에 저장할 기본 값
	var initial = {
		// 플러그인 옵션
		config: {
			weekdays: ['일', '월', '화', '수', '목', '금', '토'],
			_firstDay: 0,// ? :number - weekdays 기준 시작 요일(0~6, 0 일요일)
			_format: 'YYYY-MM-DD',// ? :string - 날짜형식
			_multiple: 1,// ? :number - 노출할 달 표시 개수
			_isMonth: false,// ? :boolean - 월만 사용
			_isInline: false,// ? :boolean - 인라인 달력
			_isDisabled: true,// ? :boolean - 시작일, 종료일에 따라 날짜 선택 비활성 처리(_disableBeforeDate, _disableAfterDate와 같이 사용할 경우 _disableBeforeDate, _disableAfterDate 옵션이 우선적용됩니다.)
			_disableBeforeDate: null,// ? :string - 이전 날짜 비활성(날짜 형식은 _format과 동일)
			_disableAfterDate: null,// ? :string - 이후 날짜 비활성(날짜 형식은 _format과 동일)
		},
		onSelect: null,// ? :function
		onSelectParams: [],// ? :array
		// 내부사용
		__: {
			_pickDate: null,// ? :string - 선택한 날짜
			_periodIndex: null,// ? :number - 기간 input의 index
			_periodStart: null,// ? :string - 기간 시작일
			_periodEnd: null,// ? :string - 기간 종료일
			onSelect: function () {},// ? :function - 날짜 선택 함수
			onDraw: function () {},// ? :function - 캘린더 이동 함수
			onOpen: function () {},// ? :function - 데이트피커 오픈
		},
	};

	// UI 고유 객체
	var base = {
		get _dataName() { return 'data-datepicker'; },// 데이타 속성 이름
		// date 형식 확인
		checkFormat: function (__date, __data) {

			// ? __date:string
			// ? __data:object
			// date 형식과 format이 다르면 null 리턴
			// date 형식과 format이 같아도 new Date()의 arguments로 사용할 수 없는 형식은 사용할 수 있는 형식으로 변환하여 리턴

			if (!isNaN(new Date(__date))) return base.changeFormat(__date, __data);
			var _format = __data.config._format.toUpperCase();

			var dateSplits = __date.match(/\d+/g);
			var dateSeparators = __date.match(/\D+/g);// date 구분자
			var formatSplits = _format.match(/[YMD]+/g);
			var formatSeparators = _format.match(/[^YMD]+/g);// 포맷 구분자

			if (!_.isEqual(formatSeparators, dateSeparators)) {
				console.log('datepicker의 날짜 형식이 포맷과 일치하지 않습니다.');
				return null;
			}
			else {
				var result = [];
				_.forEach(formatSplits, function (_format, __index) {

					var _index = (_format.startsWith === 'Y') ? 0 : (_format.startsWith === 'M') ? 1 : 2;
					result[_index] = (_format === 'YY') ? mm.string.join(Math.floor(new Date().getFullYear() / 100), dateSplits[__index]) : dateSplits[__index];

				});

				return base.changeFormat(result.join('/'), __data);
			}

		},
		// date 형식 변경
		changeFormat: function (__date, __data) {

			// ? __date:string
			// ? __data:object
			// __date 값이 없으면 현재 날짜 반영
			// __data 값이 없거나, __data._format 값이 없으면 YYYY-MM-DD 형식 적용
			// __data._isMonth 값이 true이면 _format에 DD가 있어도 제외하고 YYYY-MM만 적용

			var date = (__date) ? new Date(__date) : new Date();
			var _format = (function (__format) {

				// 월 선택일 경우 포맷 처리(포맷에서 DD제거)
				if (__data && __data.config._isMonth === true && __format.includes('D')) {
					var formatSplits = __format.match(/[YMD]+/g);
					var formatSeparators = __format.match(/[^YMD]+/g);// 포맷 구분자
					var _dayIndex = formatSplits.findIndex(function (__bit) { return __bit.includes('D'); });

					formatSplits.splice(_dayIndex, 1);

					if (!__format.split('').pop().match(/[YMD]+/g)) formatSeparators.splice(_dayIndex, 1);// 숫자 뒤에 구분자 있음
					else formatSeparators.splice((_dayIndex - 1 < 0) ? 0 : _dayIndex - 1, 1);// 숫자 사이에만 구분자 있음

					return _.chain(formatSplits)
					.flatMap(function (__bit, __index) {

						return [__bit, formatSeparators[__index]];

					})
					.join('').value();

				}
				else return __format;

			})((__data) ? __data.config._format.toUpperCase() : 'YYYY-MM-DD');

			return _format.replace(/YYYY|YY|MM|M|DD|D/g, function (__type) {

				switch (__type) {
					case "YYYY": return date.getFullYear();
					case "YY": return String(date.getFullYear() % 100).padStart(2, '0');
					case "MM": return String(date.getMonth() + 1).padStart(2, '0');
					case "M": return date.getMonth() + 1;
					case "DD": return String(date.getDate()).padStart(2, '0');
					case "D": return date.getDate();
				}
			});

		},
		// date object
		getDate: function (__date) {

			// ? __date:string/object
			// __date 값이 없으면 오늘 날짜로 리턴

			return (__date) ? new Date(__date) : new Date();

		},
		// datepicker 생성
		create: function (__data, __date, __$datepicker) {

			// ? __data:object - 필수
			// ? __date:string/object - 생성할 달력 날짜
			// ? __$datepicker:element - 생성한 달력으로 값이 없으면 생성

			var $datepicker = (__$datepicker) ? __$datepicker : mm.element.create('<div class="mm__datepicker"></div>')[0];

			// datepicker html구조 생성
			if (!__data.__._isOpen) {
				if (__data.config._isInline) $datepicker.classList.add('__datepicker-inline');
				else {
					if (frameElement) mm.find('.mm_page')[0].append($datepicker);
					else document.body.append($datepicker);
				}

				var _itemLength = (__data.config._isMonth) ? 1 : __data.config._multiple;
				for (var _i = 1; _i <= _itemLength; _i++) {
					var $template = mm.element.create(mm.string.template([
						'<div class="mm__datepicker-item">',
						'	<div class="mm__datepicker-item-head">',
						'		<div class="mm__datepicker__head-label">',
						'			<span></span>',
						'			<select tabindex="-1"></select>',
						'		</div>',
						'	</div>',
						'	<table>',
						'		<thead>',
						'			${TH}',
						'		</thead>',
						'		<tbody></tbody>',
						'	</table>',
						'</div>'
					], {
						TH: (function () {

							if (__data.config._isMonth) return '<th scope="col" colspan="4">월을 선택하세요</th>';
							else {
								return _.map(__data.config.weekdays, function (__week) {

									return mm.string.template('<th scope="col">${WEEK}</th>', { WEEK: __week });

								}).join('');
							}

						})(),
					}))[0];
					$datepicker.append($template);

					// 월선택 셀렉트을 추가하기 위해 클론
					if (!__data.config._isMonth) {
						var $headLabel = mm.find('.mm__datepicker__head-label', $template)[0];
						mm.element.after($headLabel, $headLabel.cloneNode(true))
					}
				}

				var _today = base.changeFormat(null, __data);

				var $pickerFoot = mm.element.create(mm.string.template([
					'<div class="mm__datepicker-foot">',
					'	<button type="button" class="mm_btn btn_today __btn_sm_line_lighter__" data-datepicker-date="${TODAY}"><b>오늘로 설정</b></button>',
					'</div>',
				], { TODAY: _today }))[0];
				$datepicker.append($pickerFoot);

				var $btnToday = mm.find('.btn_today', $pickerFoot)[0];
				mm.event.on($btnToday, 'click', __data.__.onSelect, { _isOverwrite: true });

				if (__data.__._periodEnd || __data.__._periodStart) {
					if ((__data.__._periodEnd <= _today && __data.__._periodIndex === 0) || (__data.__._periodStart >= _today && __data.__._periodIndex === 1)) $btnToday.disabled = true;
				}

				var $controls = mm.element.create(mm.string.template([
					'<button type="button" class="btn_prev-month"><b class="mm_ir-blind">이전 달</b></button>',
					'<button type="button" class="btn_next-month"><b class="mm_ir-blind">다음 달</b></button>',
					'<button type="button" class="btn_prev-year"><b class="mm_ir-blind">1년전</b></button>',
					'<button type="button" class="btn_next-year"><b class="mm_ir-blind">1년후</b></button>'
				]).replace(/\n/g, ''));// 월 선택으로 splice 할 때 줄바꿈(\n)을 text로 인식

				// 월 선택일 경우 이전달, 다음달 버튼 삭제
				if (__data.config._isMonth) $controls.splice(0, 2);
				mm.element.append($datepicker, $controls);
				mm.event.on($controls, 'click', __data.__.onDraw, { _isOverwrite: true });
			}

			var date = base.getDate(__date);
			_.forEach(mm.find('.mm__datepicker-item', $datepicker), function (__$item, __index) {

				var _year = date.getFullYear();
				var _month = date.getMonth() + 1;

				if (__data.__._isOpen) {
					_.forEach(mm.find('tbody', __$item), function (__$tbody) {

						__$tbody.innerHTML = '';

					})
				}

				_.forEach(mm.find('.mm__datepicker__head-label', __$item), function (__$label, __index) {

					var $select = mm.find('select', __$label)[0];
					$select.innerHTML = '';

					var _min = (__index === 0) ? _year - 5 : 1;
					var _max = (__index === 0) ? _year + 5 : 12;

					for (var _i = _min; _i <= _max; _i++) {
						var $option = mm.element.create(mm.string.template('<option value="${VALUE}">${VALUE}</option>', { VALUE: _i }))[0];
						$select.append($option);

						if (_i === _year || _i === _month) {
							$option.selected = true;
							$select.previousElementSibling.textContent = _i;
						}
					}

					mm.event.on($select, 'change', __data.__.onDraw, { _isOverwrite: true });

				});

				var dates = [];
				var startDate;// 캘린더 시작일자
				var endDate;// 캘린더 마지막일자
				var currentDate;

				if (__data.config._isMonth) {
					startDate = 1;
					endDate = 12;
					currentDate = startDate;

					while (currentDate <= endDate) {
						dates.push(mm.string.template('${YEAR}-${MONTH}-01', { YEAR: _year, MONTH: String(currentDate).padStart(2, '0') }));
						currentDate++;
					}
				}
				else {
					var _startIndex = -__data.config._firstDay + new Date(_year, _month - 1, 1).getDay();
					var _endIndex = new Date(_year, _month, 0).getDay() - __data.config._firstDay;

					// 시작일, 마지막일은 1일 및 30일이 아니며 이전월 다음월까지 계산한 일자입니다.
					// 해당 시작일, 마지막일 을 구하기 위해 new Date의 마지막 parameter는 1일, 마지막일의 getDay()를 기준으로 캘린더 시작일, 마지막일을 계산합니다.
					startDate = new Date(_year, _month - 1, (_startIndex < 0) ? -(_startIndex + 6) : -_startIndex + 1);// 캘린더 시작일자
					endDate = new Date(_year, _month, (_endIndex < 0) ? 6 - (_endIndex + 7) : 6 - _endIndex);// 캘린더 마지막일자
					currentDate = startDate;

					while (currentDate <= endDate) {
						dates.push(new Date(currentDate));
						currentDate.setDate(currentDate.getDate() + 1);
					}
				}

				var $row;
				_.forEach(dates, function (__date, __index) {

					var $btnDate;
					var dateItem = base.getDate(__date);
					var _dateString = base.changeFormat(__date, __data);

					// 달력 날짜 생성
					if (__data.config._isMonth) {
						if (__index % 4 === 0) $row = mm.find('tbody', __$item)[0].insertRow();

						$btnDate = mm.element.create(mm.string.template('<button type="button" class="btn_month" data-datepicker-date="${DATA}"><b>${MONTH}</b></button>', {
							DATA: _dateString,
							MONTH: dateItem.getMonth() + 1
						}))[0];
					}
					else {
						if (__index % 7 === 0) $row = mm.find('tbody', __$item)[0].insertRow();

						$btnDate = mm.element.create(mm.string.template('<button type="button" class="btn_date" data-datepicker-date="${DATA}"><b>${DATE}</b></button>', {
							DATA: _dateString,
							DATE: dateItem.getDate()
						}))[0];
					}

					mm.event.on($btnDate, 'click', __data.__.onSelect, { _isOverwrite: true });

					var $cell = $row.insertCell();
					$cell.append($btnDate);

					// 날짜에 해당하는 클래스 추가(이전달, 다음달, 기간, 선택된 날짜 등)
					if (!__data.config._isMonth && dateItem.getMonth() + 1 !== _month) $cell.classList.add('__datepicker-outside-month');

					if (__data.__._periodStart || __data.__._periodEnd) {
						$btnDate.disabled = (function () {

							return (__data.config._isDisabled) ? (__data.__._periodIndex === 1 && __data.__._periodStart > _dateString) || (__data.__._periodIndex === 0 && __data.__._periodEnd < _dateString) : __data.config._isDisabled;

						})();

						if (__data.__._periodStart === _dateString || __data.__._periodEnd === _dateString) $cell.classList.add('__datepicker-selected');
						else if (__data.__._periodStart < _dateString && __data.__._periodEnd > _dateString ) $cell.classList.add('__datepicker-period');
					}
					else if (_dateString === __data.__._pickDate) $cell.classList.add('__datepicker-selected');

					// 특정일(_disableBeforeDate, _disableAfterDate) 전후의 날짜는 disabled
					if (__data.config._disableBeforeDate || __data.config._disableAfterDate) {
						var _disableBefore = (__data.config._disableBeforeDate) ? base.checkFormat(__data.config._disableBeforeDate, __data) : null;
						var _disableAfter = (__data.config._disableAfterDate) ? base.checkFormat(__data.config._disableAfterDate, __data) : null;

						$btnDate.disabled = (function () {

							return (_disableBefore > _dateString) || (_disableAfter < _dateString);

						})();
					}

				});

				// 전월의 마지막일이 31일인경우 다음달에 31일이 없다면 다음달로 넘어가버리는 이슈로 다음월로 세팅하면서 일자는 1일로 세팅합니다.
				// date의 날짜를 1일로 바꾸더라도 현재 선택된 일자는 __data.__._pickDate로 가져오기 때문에 동작에 영향은 없습니다.
				date.setMonth(_month, 1);

			});

			return $datepicker;

		},
		// datepicker 열기
		open: function (__$element) {

			base.close();

			var data = mm.data.get(__$element, base._dataName);
			if (data.__._isOpen) return;

			// 기간
			var $period = __$element.closest('.mm_formmix-period');
			if ($period) {
				var $periodItems = mm.find(base._dataName, $period);
				data.__._periodIndex = mm.element.index($periodItems, __$element);
				data.__._periodStart = ($periodItems[0].value) ? mm.data.get($periodItems[0], base._dataName).__._pickDate : null;
				if ($periodItems.length > 1) data.__._periodEnd = ($periodItems[1].value) ? mm.data.get($periodItems[1], base._dataName).__._pickDate : null;
			}

			var $datepicker = base.create(data, data.__._pickDate);
			var offset = mm.element.offset(__$element);

			var _scrollTop = document.documentElement.scrollTop;
			var _top = offset.top + __$element.offsetHeight + _scrollTop + 2;
			var _left = offset.left + document.documentElement.scrollLeft;

			// 팝업에서 datepicker 오픈시 팝업 화면을 넘어가는 경우 offset 재조정
			if (mm._isPopup) {
				if (document.documentElement.scrollHeight < _top + $datepicker.offsetHeight) {
					if (_left === offset.left) _left = offset.left + __$element.offsetWidth;

					_top = document.documentElement.scrollHeight - $datepicker.offsetHeight;
				}

				if (document.body.offsetWidth < _left + $datepicker.offsetWidth) {
					if (_scrollTop + offset.top < _top) _top = offset.top + _scrollTop - 3;

					_left = offset.left - $datepicker.offsetWidth;
				}
			}

			mm.element.style($datepicker, { 'top': mm.number.unit(_top), 'left': mm.number.unit(_left) });

			data.__._isOpen = true;

			if (frameElement) mm.frameResize();

			mm.event.on(window, 'mousedown', function closeDatepickerInlineHandler(__e) {

				if ($datepicker.contains(__e.target)) return;

				base.close();

			});

			mm.event.on(__$element, 'keyup', function keyupDatapickerInlineHandler(__e) {

				if (__e.keyCode === 13) {
					var _value = base.checkFormat(__$element.value, data);
					if (_value === __$element.value) {
						data.__._pickDate = _value;
						base.close();
					}
					else console.log('datepicker의 날짜 형식이 올바르지 않습니다.');
				}
				else if (!data.__._isOpen) base.open(__$element);

			}, { _isOverwrite: true });

		},
		// datepicker 닫기
		close: function () {

			// mm__datepicker 요소는 하나만 생성
			// mm__datepicker가 생성된 상태에서 다른 datepicker를 클릭하면 전체 datepicker의 _isOpen 초기화

			_.forEach(mm.find(base._dataName), function (__$el) {

				var data = mm.data.get(__$el, base._dataName);
				if (mm.is.empty(data) || data.config._isInline) return;

				data.__._isOpen = false;

			});

			mm.element.remove(mm.find('.mm__datepicker:not(.__datepicker-inline)'));
			mm.event.off(window, 'mousedown', 'closeDatepickerInlineHandler');

			if (frameElement) mm.frameResize();

		},
	};

	// private
	(function () {

		//

	})();

	return {
		//- 데이트픽커 연결
		update: function (__elements) {

			// ? __elements:element

			var $elements = mm.ui.element(base._dataName, __elements);
			$elements = _.filter($elements, function (__$el) { return mm.is.display(__$el); });// 숨겨진 요소 제외

			_.forEach($elements, function (__$el) {

				var data = mm.data.get(__$el, base._dataName);
				if (mm.is.empty(data)) data = mm.data.set(__$el, base._dataName, { initial: initial });

				// 텍스트 요소
				var $ui = __$el.closest('.mm_form-text');
				if ($ui) {
					$ui.classList.add('__text_calendar__');
					if (__$el.readOnly) mm.find('.btn_text-clear', $ui).remove();
				}

				// 요일 시작일에 따른 요일 배열 정렬
				data.config.weekdays = data.config.weekdays.slice(data.config._firstDay).concat(data.config.weekdays.slice(0, data.config._firstDay));

				// value가 있을 경우 value값이 포맷 형식인지 유효성 체크
				if (__$el.value && __$el.value.trim().length > 0) {
					var _value = base.checkFormat(__$el.value, data);

					if (_value) data.__._pickDate = _value;
					else __$el.value = String(_value);
				}

				// 날짜 선택
				data.__.onSelect = function (__e) {

					var $item = __e.target.closest('button');
					var $datepicker = $item.closest('.mm__datepicker');
					var _pickDate = $item.dataset.datepickerDate;// 캘린더의 버튼 요소가 가지고 있는 YYYY/MM/DD 형식의 data 값

					if (data.config._isInline && $item.classList.contains('btn_today')) base.create(data, _pickDate, $datepicker);
					else if (__$el.tagName === 'INPUT') mm.form.value(__$el, base.changeFormat(_pickDate, data));

					mm.class.remove(mm.find('.__datepicker-selected', $datepicker), '__datepicker-selected');
					mm.class.add(mm.closest(mm.find(mm.string.template('[data-datepicker-date="${VALUE}"]', { VALUE: _pickDate }), $datepicker), 'td'), '__datepicker-selected');

					data.__._pickDate = _pickDate;
					data.onSelectParams = [base.getDate(_pickDate), base.changeFormat(_pickDate, data)];

					base.close();

					mm.apply(data.onSelect, __$el, data.onSelectParams);

				};

				// 캘린더 이동
				data.__.onDraw = function (__e) {

					var $this = __e.target;
					var $datepicker = $this.closest('.mm__datepicker');
					var $datepickerHeads = mm.find('.mm__datepicker-item-head', $datepicker);
					var changeDate = null;

					switch (__e.type) {
						// 셀렉트
						case 'change':
							var $calendarHead = $this.closest('.mm__datepicker-item-head');
							changeDate = mm.find('select', $calendarHead)[0].value;

							if (!data.config._isMonth) {
								var _month = mm.find('select', $calendarHead)[1].value;
								changeDate += mm.string.template('-${MONTH}', { MONTH: String(_month).padStart(2, '0') })
							}

							changeDate = base.getDate(changeDate);
							changeDate.setMonth(changeDate.getMonth() - mm.element.index($datepickerHeads, $calendarHead));
						break;
						// 버튼
						case 'click':
							var $selects = mm.find('select', $datepickerHeads);

							changeDate = $selects[0].value;
							if (!data.config._isMonth) changeDate += mm.string.template('-${MONTH}', { MONTH: String($selects[1].value).padStart(2, '0') });
							changeDate = base.getDate(changeDate);

							if ($this.classList.contains('btn_next-month')) changeDate.setMonth(changeDate.getMonth() + 1);
							else if ($this.classList.contains('btn_prev-month')) changeDate.setMonth(changeDate.getMonth() - 1);
							else if ($this.classList.contains('btn_next-year')) changeDate.setFullYear(changeDate.getFullYear() + 1);
							else if ($this.classList.contains('btn_prev-year')) changeDate.setFullYear(changeDate.getFullYear() - 1);
						break;
					}

					base.create(data, changeDate, $datepicker);

				};

				if (data.config._isInline && !data.__._isOpen) {
					var $datepicker = base.create(data);
					$datepicker.classList.add('__datepicker-inline');
					__$el.append($datepicker);
					data.__._isOpen = true;
				}
				else {
					mm.event.on(__$el, 'click', function datepickerOpenInlineHandler(__e) {

						__e.stopPropagation();

						base.open(this);

					}, { _isOverwrite: true });
				}

			});

		},
		// 데이트픽커 변경
		change: function (__elements, __date) {

			// ? __elements:element
			// ? __date:string - 변경할 날짜

			var $elements = mm.ui.element(base._dataName, __elements);
			if ($elements.length === 0 || !__date) return;

			_.forEach($elements, function (__$el) {

				var data = mm.data.get(__$el, base._dataName);
				var _value = base.checkFormat(__date, data);
				if (_value) {
					data.__._pickDate = (data.config._isMonth) ? _value.slice(0, 7) : _value;
					mm.form.value(__$el, base.changeFormat(_value, data));
				}

			});

		},
	}

})();
//> 데이트픽커

//< UI 영역
// * 코드 마지막에 유지
mm.ui = (function () {

	// UI 고유 객체
	var base = {
		updates: ['tab', 'dropdown', 'stepper', 'carousel', 'slider', 'form', 'preload', 'lazyload', 'datepicker'],// 업데이트 항목
	};

	// public
	return {
		//- UI 요소 검색
		element: function (__dataName, __elements) {

			// ? __dataName:string - data-attribute 속성 이름
			// ? __elements:element - __dataName 속성이 있는 요소 또는 요소를 찾을 부모 요소
			// __elements 값이 없으면 페이지 전체에서 __dataName이 있는 요소 검색
			// * public에서 사용하고 private 등 객체 내부에서는 mm.find로 사용

			if (!__dataName || !__dataName.startsWith('data-')) return [];

			if (__elements) {
				var $elements = mm.find(__elements);

				if ($elements.length > 0) {
					var $filtered = _.chain($elements).filter(function (__$el) {

						return typeof(__$el.hasAttribute) === 'function' && __$el.hasAttribute(__dataName);

					}).value();

					if ($filtered.length > 0) return $filtered;
					else return mm.find(__dataName, $elements);
				}
				else return [];
			}
			else return mm.find(__dataName);

		},
		//- UI 업데이트
		update: function (__elements) {

			// ? __elements:element - UI 업데이트를 실행할 요소
			// ~ tab, dropdown 등 내부 컨텐츠가 있을 때 상태가 바뀔 때마다 업데이트?

			_.forEach(base.updates, function (__ui) {

				mm.apply(mm.string.template('mm.${UI}.update', { UI: __ui }), window, [__elements]);

			});

		},
		//- UI 업데이트 항목 추가
		add: function (__ui) {

			// ? __ui:string - update 함수가 있는 UI 이름
			// * mm.ui.add('table');

			if (typeof(__ui) !== 'string') return;

			base.updates.push(__ui);

		},
	};

})();
//> UI 영역