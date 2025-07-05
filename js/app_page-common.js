'use strict';

/**
 * 페이지 공통
**/

//< 최초(레디 전)
(function () {

	// 우클릭 및 드래그 방지
	function returnHandler(__e) {

		__e.preventDefault();

	}

	window.addEventListener('contextmenu', returnHandler);
	// document.addEventListener('selectstart', returnHandler);// 에디터 입력 이슈
	// document.addEventListener('dragstart', returnHandler);

	// 로딩 제거(크롬 페이지 뒤로가기 시 이전 링크 이동으로 생긴 로딩 제거)
	mm.event.on(window, 'unload', function (__e) {

		mm.loading.hide();

	});

})();
//< 최초(레디 전)

//< 레디
mm.ready(function () {

	// 아이프레임
	if (frameElement) {
		mm.observer.dispatch(mm.event.type.frame_ready, { data: { this: window } });

		// 컨텐츠 아이프레임 리사이즈
		if (mm._isFrame) mm.frameResize(null, { _isLoad: true });
	}

	// 컴포넌트
	mm.ui.update();

	// autofill 감지
	mm.event.on('[data-text]', 'animationstart', function (__e) {

		var $text = this.closest('.mm_form-text');
		if (!$text) return;

		switch (__e.animationName) {
			case 'autofill-on':
				$text.classList.add('__text-on');
				break;
			case 'autofill-cancel':
				if (this.value.trim().length === 0) $text.classList.remove('__text-on');
				break;
		}

	});

	// 터치이벤트 확인
	mm.event.on(document, 'mousedown mouseup', function (__e) {

		switch (__e.type) {
			case 'mousedown':
				mm._isTouch = true;
				break;
			case 'mouseup':
				mm._isTouch = false;
				break;
		}

	});

	// a 링크
	mm.delegate.on(document, 'a[data-href]', 'click', function (__e) {

		if (this.target.toLowerCase() === 'blank') return;// target blank 제외

		// mm.data에 저장할 기본 값
		var initial = {
			openEl: this,// ? :element - 클릭한 요소
			_type: null,// ? :string - link, popup, modal, anchor, back, forward, reload
			_frameId: null,// ? :string - popup, modal을 iframe으로 노출할 때 id 값
			_frameName: null,// ? :string - popup, modal을 iframe으로 노출할 때 name 값
			// _isCloseBefore: false,// ? :boolean - type 값이 link/popup일 때 현재 팝업 요소를 닫음(교체)
			// _isLinkStage: true,// ? :boolean - type이 link일 때 true(스테이지에서 실행 mm.popup.open), false(현재 창에서 실행 location.href)
			_step: 1,// ? :number - mm.history.back/forward 이동 수
			// * 이 외 mm.link, mm.scroll.to  등에서 사용하는 변수를 추가로 적용하여 사용
		};

		var data = mm.data.get(this, 'data-href', { initial: initial });
		if (mm.is.empty(data)) data = mm.data.set(this, 'data-href', { initial: initial });
		var _attrHref = this.getAttribute('href');
		var _href = this.href;

		if (!data._type) return false;
		if (data._type === 'link') {
			if (_attrHref.replace('#', '').trim().length === 0 || _attrHref.toLowerCase().includes('javascript:')) return false;

			if (_href.split('#')[0] === location.href.split('#')[0]) data._type = 'reload';// 링크가 같으면 reload로 변경
			if (data._type === 'reload' && _href.includes('#')) data._type = 'anchor';// 링크가 같고 #이 있으면 anchor로 변경
		}

		__e.preventDefault();

		// 외부링크
		if (['link', 'popup'].includes(data._type)) {
			if (!_href.includes(location.host)) {
				// 프로토콜이 https 일 때 외부 http 경로의 iframe이 보안상 이유로 연결 안됨
				// mm.popup.open('popup_externalLink.html?url=' + _href);
				window.open(_href);// 새 창 열림
				return false;
			}
		}

		switch (data._type) {
			case 'reload':
				location.reload();// location.reload(true);
				break;
			case 'back':
				mm.history.back(data._step);
				break;
			case 'forward':
				mm.history.forward(data._step);
				break;
			case 'anchor':
				mm.scroll.to(_attrHref, data);
				break;
			case 'modal':
			case 'popup':
				// data.openEl = this;
			case 'link':
			case 'home':
				mm.link(_href, data);
				break;
		}

	});

	// 어드민 사용 추가
	(function () {

		//< gnb
		_.forEach(mm.find('.mm_gnb'), function (__$gnb) {

			var _gnbLeft = mm.element.offset(__$gnb).left;
			var _gnbWidth = __$gnb.offsetWidth;

			_.forEach(mm.find('.mm_gnb-depth2', __$gnb), function (__$second) {

				var _secondLeft = mm.element.offset(__$second).left;
				var _secondWidth = __$second.offsetWidth;

				// width값 홀수는 +1 (border깨짐이슈때문에)
				if (mm.is.odd(_secondWidth)) mm.element.style(__$second, { 'width': mm.number.unit(_secondWidth + 1) });

				if (_secondLeft < _gnbLeft) {
					mm.element.style(__$second, { 'margin-right': mm.number.unit(Math.ceil(_secondLeft - _gnbLeft)) });
				}
				// 1100기준 넘어갔을 시 위치변경
				else if (_secondWidth + _secondLeft > _gnbWidth + _gnbLeft) {
					mm.element.style(__$second, { 'margin-right': mm.number.unit((_secondWidth + _secondLeft) - (_gnbWidth + _gnbLeft)) });
				}

			});

			mm.event.on(__$gnb, 'mouseenter', function () {

				if (document.activeElement.tagName === 'SELECT') document.activeElement.blur();

			});

		});
		//> gnb

		//< 사이드바
		var $sidebar = mm.find('.mm_sidebar')[0];
		var $lnb = mm.find('.mm_lnb')[0];
		var $orderList = mm.find('.m_popup-customer-order .m__order-contain-sticky')[0];

		mm.event.on(window, 'load scroll resize', function (__e) {

			var _scrollTop = mm.scroll.offset(this).top;
			var _scrollLeft = mm.scroll.offset(this).left;
			var _screenHeight = document.body.offsetHeight;
			var _scrollHeight = document.body.scrollHeight;

			//< 사이드바
			if ($sidebar) {
				var _classSticky = '__sidebar-sticky';
				var $inner = $sidebar.children[0];
				var offset = mm.element.offset($sidebar);
				if (offset.top > 0) {
					$sidebar.classList.remove(_classSticky);
					mm.element.style($inner, { 'margin-left': '', 'width': '' });
				}
				else {
					$sidebar.classList.add(_classSticky);
					mm.element.style($inner, { 'width': mm.number.unit($sidebar.offsetWidth) });

					if (__e.type === 'scroll') mm.element.style($inner, { 'margin-left': mm.number.unit(-window.pageXOffset) });
				}
			}
			//> 사이드바

			//< lnb
			if ($lnb) {
				var _classSticky = '__lnb-sticky';
				var $inner = $lnb.children[0];
				var _footerHeight = parseInt(mm.element.style(mm.find('.mm_footer'), 'height'));
				if (mm.element.offset($lnb).top > 0) {
					$lnb.classList.remove(_classSticky);
					mm.element.style($lnb, { 'height': mm.number.unit(_screenHeight - mm.element.position($lnb).top + _scrollTop) });
				}
				else {
					$lnb.classList.add(_classSticky);
					mm.element.style($lnb, { 'height': '' });
				}

				if (_scrollTop >= _scrollHeight - _screenHeight - _footerHeight) mm.element.style($inner, { 'top': 0, 'bottom': mm.number.unit(_scrollTop - (_scrollHeight - _screenHeight - _footerHeight)), 'height': 'auto' });
				else mm.element.style($inner, { 'top': '', 'bottom': '', 'height': '' });
			}
			//> lnb

			//< (팝업)고객 주문 조회 주문리스트
			if ($orderList) {
				var _classSticky = '__order-sticky';
				var $orderTable = mm.find('.mm_table', $orderList);
				var $orderTableHead = mm.find('.mm_table-head', $orderList);
				var $orderTableBody = mm.find('.mm_table-body', $orderList);
				var _headerHeight = parseInt(mm.element.style(mm.find('.mm_header'), 'height'));
				var _tableHeadHeight = parseInt(mm.element.style($orderTableHead, 'height'));
				if (mm.element.offset($orderList).top > _headerHeight) {
					$orderList.classList.remove(_classSticky);
					mm.element.style($orderTableBody, { 'max-height': mm.number.unit(_screenHeight - mm.element.position($orderList).top + _scrollTop - _tableHeadHeight) });
				}
				else {
					$orderList.classList.add(_classSticky);
					mm.element.style($orderTableBody, { 'max-height': mm.number.unit(_screenHeight - _headerHeight - _tableHeadHeight) });

					if (_scrollLeft > 0) mm.element.style($orderTable, { 'left': mm.number.unit(-_scrollLeft + 24) });
					else mm.element.style($orderTable, { 'left': '' });
				}

				if (_scrollTop >= _scrollHeight - _screenHeight - 40) mm.element.style($orderTableBody, { 'max-height': mm.number.unit(_screenHeight - _headerHeight - _tableHeadHeight - (_scrollTop - (_scrollHeight - _screenHeight - 40))) });

				if (parseInt(mm.element.style($orderTableBody, 'height')) < parseInt(mm.element.style(mm.find('table', $orderTableBody), 'height'))) mm.element.style($orderTableHead, { 'padding-right': '17px' });
			}
			//> (팝업)고객 주문 조회 주문리스트

		});
		//> 사이드바

		//< 순서변경
		(function () {

			var initial = {
				_isHideFirst: true,// ? :booean - 첫 번째 요소의 내용 숨김
				onChange: null,// ? :function
				onChangeParams: [],// ? :array
			}
			var _dataName = 'data-sort';
			var _classSort = '__list-sortable';
			var _classExcepted = '__sortable-excepted';// 스크립트로 tbody에 생성
			var defaultLists = [];

			mm.delegate.on(document, '[data-sort]', 'click', function (__e) {

				__e.preventDefault();

				var $ui = this.closest('.__table_sortable__, .__form_sortable__');
				if (!$ui) return false;

				var $sort = mm.find('.mm_table, .mm_form', $ui)[0];
				var $sortList = mm.find('tbody', $sort)[0];
				var $sortItems = mm.find('> tr', $sortList);
				var $sortExcepts = mm.find('.__sortable_excepted__', $ui);
				var data = mm.data.get(this, _dataName);
				if (mm.is.empty(data)) data = mm.data.set(this, _dataName, { initial: initial });

				$ui.classList.add(_classSort);

				var $checks = mm.find('.__checked', $ui);
				mm.class.remove($checks, '__checked');
				mm.class.add($checks, '__checked-temp');

				// 순서편집 제외
				if ($sortExcepts.length !== 0) {
					mm.element.after($sortList, mm.string.template('<tbody class="${CLASS}"></tbody>', { CLASS: _classExcepted }));
					mm.element.append(mm.find(mm.selector(_classExcepted, '.'))[0], $sortExcepts);
				}

				var $firstItems = mm.find('> td:first-child, > th:first-child', $sortItems);
				var _checkHtml = mm.string.template([
					'<label class="mm_form-check __check-sortable">',
					'	<input type="checkbox" data-check>',
					'	<b class="mm_block">',
					'		<i class="ico_form-check"></i>',
					'		<span class="text_label mm_ir-blind">항목선택</span>',
					'	</b>',
					'</label>'
				]);

				if (data._isHideFirst) {
					mm.class.add(mm.element.wrap(mm.find('> .mm_table-item', $firstItems), 'div'), 'mm_table-hidden');
					mm.element.append($firstItems, _checkHtml);
					mm.class.add(mm.element.wrap(mm.find('.__check-sortable', $firstItems), 'div'), 'mm_table-item');
				}
				else mm.element.prepend($firstItems, _checkHtml);

				mm.form.update($sortList);

				_.forEach(mm.find('> tr', $sortList), function (__$tr, __index) {

					defaultLists[__index] = __$tr;
					if (__$tr.offsetHeight < 10) mm.element.remove(mm.find('.__check-sortable', __$tr.firstElementChild));

				});

				// 버튼 생성
				var $btnEdits = mm.find('[data-sort]', $ui);
				mm.element.after($btnEdits, mm.string.template([
					'<button type="button" class="mm_btn btn_sort-cancel __btn_line_light__"><i class="ico_sortable-cancel"></i><b>순서편집 취소</b></button>',
					'<button type="button" class="mm_btn btn_sort-complete __btn_secondary__"><i class="ico_sortable-complete"></i><b>순서편집 적용</b></button>',
					'<button type="button" class="mm_btn btn_sort-top __btn_light__"><b>최상단 이동</b></button>',
					'<button type="button" class="mm_btn btn_sort-bottom __btn_light__"><b>최하단 이동</b></button>',
					'<button type="button" class="mm_btn btn_sort-up __btn_line_light__"><b>위로 1칸 이동</b></button>',
					'<button type="button" class="mm_btn btn_sort-down __btn_line_light__"><b>아래로 1칸 이동</b></button>',
				]));

				var $buttons = mm.siblings($btnEdits, '[class*="btn_sort-"]');
				mm.event.on($buttons, 'click', function (__e) {

					// 초기화
					function resetSortable() {

						mm.event.off($buttons, 'click');
						mm.element.remove($buttons);

						$ui.classList.remove(_classSort);
						mm.class.remove(mm.find('.__checked', $ui), '__checked');

						var $temps = mm.find('.__checked-temp');
						mm.class.remove($temps, '__checked-temp');
						mm.class.add($temps, '__checked');

						mm.element.append($sortList, $sortExcepts);
						mm.element.remove(mm.find(mm.selector(_classExcepted, '.'), $sort));

						if (data._isHideFirst) {
							mm.element.remove(mm.find('td:first-child > .mm_table-item', $sortList));
							mm.element.unwrap(mm.find('td:first-child .mm_table-hidden', $sortList));
						}
						else mm.element.remove(mm.find('th:first-child .__check-sortable', $sortList));

						mm.form.update($sortList);

						// ie에서 순서편집 후 스크롤 확장될 때 스크롤 아래 영역에 있는 요소 전체 클릭이 안되는 이슈로 스크롤 재적용
						if (mm.is.ie('ie')) {
							var _ieCount = 0;
							var ieInterval = setInterval(function () {

								if (document.documentElement.scrollHeight > document.documentElement.clientHeight) {
									mm.scroll.off();
									mm.delay.on(mm.scroll.on);

									clearInterval(ieInterval);
								}

								_ieCount++;
								if (_ieCount > 100) clearInterval(ieInterval);

							}, 10);
						}

					}

					var $clicked = this;
					var $sortItems = mm.find('> tr', $sortList);
					var $sortExcepts = mm.find('.__sortable_excepted__', $ui);

					// 순서편집 취소
					if ($clicked.classList.contains('btn_sort-cancel')) {
						mm.bom.confirm('순서변경을 취소하시겠습니까?', function (__is) {

							if (__is === true) {
								_.forEach(defaultLists, function (__$list) {

									mm.element.append($sortList, __$list);

								});
								resetSortable();
							}

						});
					}
					// 순서편집 적용
					else if ($clicked.classList.contains('btn_sort-complete')) {
						mm.bom.confirm('순서변경을 적용하시겠습니까?', function (__is) {

							if (__is === true) {
								resetSortable();
								mm.apply(data.onChange, $clicked, data.onChangeParams);
							}

						});
					}
					// 순서편집 제어
					else {
						var sortables = _.filter($sortItems, function (__$item) {

							var $sortCheck = mm.find('.__check-sortable [data-check]', __$item)[0];
							return $sortCheck && $sortCheck.checked;

						});
						if ($sortItems.length === sortables.length) return;

						var _isForm = $sort.classList.contains('mm_form');// 첫 번째 tr 요소 샘플 숨김 확인
						var _index;

						// 위로 1칸 이동
						if ($clicked.classList.contains('btn_sort-up')) {
							_index = mm.element.index($sortItems, sortables[0]);
							if (_index === 0 || (_isForm && _index === 1)) return;

							_.forEach(sortables, function (__$item) {

								mm.element.before(__$item.previousElementSibling, __$item);

							});
						}
						// 아래로 1칸 이동
						else if ($clicked.classList.contains('btn_sort-down')) {
							_index = mm.element.index($sortItems, sortables[sortables.length - 1]);
							if (_index === $sortItems.length - 1) return;

							_.forEach(_.reverse(sortables.concat()), function (__$item) {

								mm.element.after(__$item.nextElementSibling, __$item);

							});
						}
						// 최상단 이동
						else if ($clicked.classList.contains('btn_sort-top')) {
							_index = mm.element.index($sortItems, sortables[0]);
							if (sortables.length === 1 && (_index === 0 || _isForm && _index === 1)) return;

							var _targetIndex = (_isForm) ? 1 : 0;
							var $target = mm.find('> tr', $sortList)[_targetIndex];

							if ($target === sortables[0]) {
								$target = sortables.shift();
								mm.element.after($target, sortables);
							}
							else mm.element.before($target, sortables);
						}
						// 최하단 이동
						else {
							_index = mm.element.index($sortItems, sortables[sortables.length - 1]);
							if (sortables.length === 1 && _index === $sortItems.length - 1) return;

							mm.element.append($sortList, sortables);
						}
					}

				});

			});

		})();
		//> 순서변경

		//< 테이블 이미지 미리보기
		mm.delegate.on(document, '.btn_preview-toggle', 'click', function () {

			var $table = this.closest('.mm_table');
			var $toggleBtn = mm.find('.btn_preview-toggle', $table);
			var $previewIcon = mm.find('i[class*="ico_image-"]', $toggleBtn);

			$table.classList.toggle('__preview-on');
			mm.class.remove($previewIcon, ['ico_image-show', 'ico_image-hide']);

			if (mm.class.every($table, '__preview-on')) {
				mm.element.attribute($toggleBtn, { 'title': '이미지 미리보기 끄기' });
				mm.class.add($previewIcon, 'ico_image-hide');
				mm.preload.destroy($table);
				mm.preload.update($table, { onComplete: function () {

					if (mm.find('.image_preview', $table).length === mm.find('.__preload-loaded', $table).length) mm.table.resize($table);

				} });
			}
			else {
				mm.element.attribute($toggleBtn, { 'title': '이미지 미리보기 켜기' });
				mm.class.add($previewIcon, 'ico_image-show');
			}

			mm.table.resize($table);

		});
		//> 테이블 이미지 미리보기

	})();

});
//> 레디

//< 로드
mm.load(function () {

	// 팝업 리사이즈
	if (mm._isPopup) mm.popup.resize();
	else if (mm._isModal) mm.modal.resize({ _isLoad: true });

	// 컨텐츠 아이프레임 리사이즈
	if (mm._isFrame) mm.frameResize(null, { _isLoad: true });

	// 익스/엣지 브라우저에서 새로고침 할 때 라디오/체크박스의 기존 선택을 물고있는거나 날려버리는 이슈가 있어 초기화 후 재연결
	if (mm.is.ie()) {
		var $checked = mm.find('[checked]');
		_.forEach($checked, function (__$check) {

			__$check.checked = true;

		});

		mm.form.update($checked);// mm.delay 필요?
	}

	// mm을 수정하지 못하도록 적용
	Object.freeze(mm);

});
//> 로드

//< 테이블
mm.table = (function () {

	var initial = {
		_isGrid: false,// :boolean - 테이블 그리드 기능
		_height: 0,// :number - 높이 제한(max-height)
		onOrderBy: null,// 정렬
		onOrderByArgs: [],
		onColumnChange: null,// 순서변경
		onColumnChangeArgs: [],
	};
	var _dataName = 'data-table';// 데이타 속성 이름

	// 테이블 요소
	function getTableElement(__element) {

		var $el = (__element) ? $(__element) : $(mm.string.template('[${A}]', { A: _dataName }));
		return ($el[0] && ($el[0] === document || !$el[0].hasAttribute(_dataName))) ? $el.find(mm.string.template('[${A}]', { A: _dataName })) : $el;

	}

	// 테이블 정렬
	function tableOrderBy(__$thisTh, __$table) {

		// 전체 th에서 __descending, __ascending 삭제 후 연결
		var _classDesc = '__descending';
		var _classAsc = '__ascending';
		var _isDescending = !mm.class.some(__$thisTh[0], [_classDesc, _classAsc]);
		var _isAscending = !_isDescending && __$thisTh[0].classList.contains(_classDesc);
		var $tableTh = __$table.find('th');
		var data = mm.data.get(__$table, _dataName);
		if (mm.is.empty(data)) data = mm.data.set(__$table, _dataName, { initial: initial });

		$tableTh.removeClass([_classDesc, _classAsc])
		.find('.ico_table-sort').remove();

		if (_isDescending || _isAscending) {
			__$thisTh.addClass(function () {

				return (_isDescending) ? _classDesc : _classAsc;

			}).find('.mm_table-item').append('<i class="ico_table-sort" />');
		}

		mm.apply(data.onOrderBy, __$table, [{ el: __$thisTh, _index: $tableTh.index(__$thisTh), _isDescending: (_isDescending) ? true : (_isAscending) ? false : null }].concat(data.onOrderByArgs));

	}

	// 테이블 순서변경
	function tableColumnChange(__$thisTh, __$table) {

		var data = mm.data.get(__$table[0], _dataName);
		mm.apply(data.onColumnChange, __$table, [{ el: __$thisTh, ths: __$table.find('th') }].concat(data.onColumnChangeArgs));

	}

	// private
	(function () {

		mm.ready(function () {

			mm.ui.add('table');// 컴포넌트 업데이트에 항목 추가
			mm.table.update(document);// 최초 연결

		});

		mm.load(function () {

			if (mm.is.ie()) mm.table.resize(document);

		});

	})();

	// public
	return {
		//- 테이블 분할 변경
		update: function (__element) {

			return getTableElement(__element).each(function () {

				var $table = $(this);
				var $tableContent = $table.children('.mm_scroller');
				if (!$tableContent[0] || !mm.is.display($table)) return;

				var $tableLeft;
				var $tableRight;
				var $colgroup = $table.find('colgroup');
				var _fixedTotal = 0;// 왼쪽 고정할 열 수
				var _classFixed = '__table-fixed';// 왼쪽 고정 클래스
				var _classAutosize = '__table-autosize';// colgroup이 없어 자동 적용(th 가로 조절 가능)
				var _isSpan = ($table.find('[colspan], [rowspan]')[0]) ? true : false;
				var data = mm.data.get(this, _dataName);
				if (mm.is.empty(data)) data = mm.data.set(this, _dataName, { initial: initial });

				// 초기 값 세팅
				(function () {

					if (parseFloat(data._height) > 0) $tableContent.css({ 'max-height': parseFloat(data._height) });

					// 체크박스 영역 표시
					var $colCheck = $table.find('.col_check');
					$table.on('update change', '[type="checkbox"]', function () {

						var $check = $(this);
						if (!$check.closest($colCheck)[0] && $check.closest('td').index() !== $colCheck.index()) return;// col_check를 제외한 체크는 영역 표시 안됨

						var $tr = $check.closest('.mm_table').find('tbody:first-of-type tr');
						var _classChecked = '__checked';
						var checkData = mm.data.get(this).check;
						var _isCheckAll = checkData && checkData._type === 'check_all';

						if (_isCheckAll) {
							if ($check.prop('checked')) {
								$tr.addClass(_classChecked);
								$tr.has('.text_check-none').removeClass(_classChecked);
							}
							else $tr.removeClass(_classChecked);
						}
						else {
							var _rowspan = $check.closest('td, th').attr('rowspan') || 1;
							$tr = $tr.filter(mm.string.template(':nth-child(${INDEX})', { INDEX: $check.closest('tr').index() + 1 }));

							for (var _i = 0; _i < _rowspan; _i++) {
								if ($check.prop('checked')) $tr.addClass(_classChecked);
								else $tr.removeClass(_classChecked);
								$tr = $tr.next();
							}
						}

					});

					// 문자열 변환
					$table.find('.mm_table-item').each(function () {

						var $this = $(this);
						var _trim = $this.text().trim();

						// 숫자, 가격 컴마
						var $num = $this.find('.text_comma, .text_price');
						$num.each(function () {

							var _number = $(this).text();
							if (_trim.length > 0) $(this).text(mm.number.comma(_number));
							else $(this).text(0);

						});

						// 빈 칸
						if ($this.closest('tfoot')[0]) return;

						var _trim = $this.text().trim();
						if (_trim.length === 0 || _trim === 'null') {
							$this.text('-');
							return;
						}

					});

					if (!$colgroup[0]) {

						var widths = [];// colgroup width
						var _colTotal = 0;// 열 수
						var _rowCount = 0;// 합쳐진 행은 제외하기 위한 리턴 카운팅

						// 전체 열 width 저장
						$table.addClass(_classAutosize)
						.find('tr').each(function (__index) {

							// 이전 행에 rowspan이 있으면 제외
							if (_rowCount > 0) {
								_rowCount--;
								return;
							}

							var _colIndex = 0;// 현재 열 계산

							$(this).children().each(function () {

								var $this = $(this);
								var _colLength = $this[0].colSpan;// parseFloat($this.attr('colspan'));
								if (!_colLength) _colLength = 1;

								widths[_colIndex] = (_colLength === 1) ? Math.ceil($this.outerWidth()) : null;// 합쳐진 열 사이즈는 제외

								_colIndex += _colLength;
								if (__index === 0) {
									_colTotal = _colIndex;// 첫 행에서 열 수 계산
									if ($this.hasClass(_classFixed)) _fixedTotal = _colIndex;// 왼쪽 고정할 열 수 계산
								}

								_rowCount = $this[0].rowSpan - 1;
								if (!_rowCount) _rowCount = 0;

							});
							if (_.compact(widths).length === _colTotal) return false;

						});

						// col 세팅
						$colgroup = $('<colgroup />');
						_.each(widths, function (__value, __index) {

							// $(mm.string.template('<col style="width:${A}px;" />', { A: __value })).appendTo($colgroup);

							// 예외 리사이즈
							var $col = $(mm.string.template('<col style="width:${A}px;" data-table-col="${A}" />', { A: __value })).appendTo($colgroup);
							var $periodTd = $table.find('tbody td').eq(__index).has('.mm_formmix-period');
							if ($periodTd.length > 0) $table.find('thead th').eq(__index).attr({ 'data-period': true });

							// 예외 사이즈
							// ~ var $col = $(mm.string.template('<col style="width:${A}px;" />', { A: __value })).appendTo($colgroup);
							// ~ var $periodTd = $table.find('tbody td').eq(__index).has('.mm_formmix-period');// 예외 최소 사이즈 적용
							// ~ if ($periodTd.length > 0) $col.css({ 'min-width': __value + 'px' });

						});
						$table.find('table').prepend($colgroup);
					}
					// destroy를 위해 저장
					else {
						mm.data.get($table).table._colHtml = $colgroup[0].outerHTML;
					}

				})();

				// 분할
				(function () {

					var _tableHtml = mm.string.template([
						'<div class="mm_table-${A}">',
						'	<table>',
						'		<colgroup></colgroup>',
						'		<t${A}></t${A}>',
						'	</table>',
						'</div>',
					], { A: '${A}' });
					var _tableHeadHtml = mm.string.template(_tableHtml, { A: 'head' });
					var _tableBodyHtml = mm.string.template(_tableHtml, { A: 'body' });
					var _tableFootHtml = mm.string.template(_tableHtml, { A: 'foot' });

					var $col = $colgroup.children();

					// 분할 - 왼쪽 테이블 구성
					var widths = _.map($col.slice(0, _fixedTotal), function (__$item) { return parseFloat(__$item.dataset.tableCol); });
					var _leftWidth = (!mm.is.empty(widths)) ? widths.reduce(function (__sum, __value) { return __sum + __value; }) : 0;
					$tableLeft = $(mm.string.template([
						'<div class="mm_table-lside" style="width:${WIDTH}px">',
						'	${A}',
						'	${B}',
						'	${C}',
						'</div>',
					], { A: _tableHeadHtml, B: _tableBodyHtml, C: _tableFootHtml, WIDTH: _leftWidth })).insertBefore($tableContent);

					$tableLeft.find('colgroup')
					.next(':not(tr)').append(function () {

						var $this = $(this);
						var $fragment = $(document.createDocumentFragment());

						var $tBox = ($this.is('thead')) ? $tableContent.find('thead') : ($this.is('tfoot')) ? $tableContent.find('tfoot') : $tableContent.find('tbody');
						$tBox.find('tr').each(function () {
							var $contentTr = $(this);
							$fragment.append($('<tr />').css({ 'height': $contentTr.height() }).append($contentTr.find(mm.selector(_classFixed, '.'))));

						});

						return $fragment;

					})
					.end().append($col.splice(0, _fixedTotal));// col 요소를 먼저 이동하면 width가 달라져 마지막에 적용
					if (_fixedTotal === 0) $tableLeft.hide();// 왼쪽 테이블이 없으면 숨김

					// 분할 - 오른쪽 테이블 구성
					$tableRight = $('<div class="mm_table-rside" />').css({ 'padding-left': _leftWidth }).append(_tableHeadHtml, $tableContent.addClass('mm_table-body'), _tableFootHtml).insertAfter($tableLeft);
					$tableRight.find('colgroup').not(function () {

						return ($(this).closest($tableContent)[0]) ? true : false;

					}).append($col.clone())
					.next('thead').replaceWith($tableContent.find('thead'))
					.end().next('tfoot').replaceWith($tableContent.find('tfoot'));

					mm.table.resize($table);

				})();

				// 빈 요소 정리
				var $tableLeftBody = $tableLeft.find('.mm_table-body');
				var $tableRightHead = $tableContent.prev('.mm_table-head');
				var $tableRightFoot = $tableContent.next('.mm_table-foot');
				var _isLeft = $tableLeft.is(':visible');
				var _isFoot = $tableRightFoot.find('td')[0] ? true : false;

				if (!_isLeft) $tableLeft.remove();
				if (!_isFoot) $table.find('.mm_table-foot').remove();

				// 스크롤
				var _scrollTop = $tableContent.scrollTop();
				var _scrollLeft = $tableContent.scrollLeft();
				$tableContent.on('scroll', function () {

					var $this = $(this);
					var _y = $this.scrollTop();
					var _x = $this.scrollLeft();

					if (_scrollTop !== _y && _isLeft) {
						gsap.set($tableLeftBody, { y: -_y });
						_scrollTop = _y;
					}
					if (_scrollLeft !== _x) {
						gsap.set([$tableRightHead, $tableRightFoot.children()], { x: -_x });
						_scrollLeft = _x;
					}

				});

				var $firstLineTh = $tableRightHead.find('tr:nth-child(1) th');// 첫 줄 헤드

				// 오른쪽 상단 리사이즈
				if ($table.hasClass(_classAutosize) && !_isSpan) {
					var _classResize = '__table-resize';
					$('<button type="button" class="btn_resize" />').on('mousedown', function (__e) {

						var _startX = __e.originalEvent.pageX;
						var $window = $(window);

						var $fromTh = _.take($firstLineTh, $(this).closest('th').index() + 1);// 현재 클릭한 버튼까지의 th요소
						var _colIndex = _.sumBy($fromTh, function (__th) { return $(__th)[0].colSpan; });// parseFloat($(__th).attr('colspan')) || 1; });
						var $targetCol = $tableRight.find(mm.string.template('col:nth-child(${A})', { A: _colIndex }));// 전체 col요소
						var _defaultWidth = parseFloat($targetCol.css('width'));
						var _minWidth = Math.min(_defaultWidth, 124);// 최소사이즈 124px 이하 (최소 110px + mm_table-item 좌우 여백 7px)

						// 예외 사이즈
						// ~ var _defaultMinWidth = parseFloat($targetCol.css('min-width'));// 예외 최소사이즈가 있으면 예외로 적용
						// ~ var _minWidth = (Number.isFinite(_defaultMinWidth) && _defaultMinWidth > 0) ? _defaultMinWidth : Math.min(_defaultWidth, 124);// 최소사이즈 124px 이하 (최소 110px + mm_table-item 좌우 여백 7px)

						$window.on('mousemove mouseup', function (__eA) {

							switch (__eA.type) {
								case 'mousemove':
									$table.addClass(_classResize);

									var _moveX = __eA.originalEvent.pageX - _startX;
									var _width = Math.max(_defaultWidth + _moveX, _minWidth);
									$targetCol.css({ 'width': _width });
									break;
								case 'mouseup':
									$window.off('mousemove mouseup');
									$table.removeClass(_classResize);
									break;
							}

							mm.table.resize($table);

						});

					}).appendTo($tableRightHead.find('tr:nth-child(1) th:not(.col_check, [data-period])'));// 체크박스, 기간 리사이즈 제외
				}

				mm.form.update($table);

				if (data._isGrid !== true) return;// 그리드 옵션이 없으면 리턴

				// 클릭 정렬
				var $clickTable = (_isSpan) ? $table : $tableLeft;
				$clickTable.on('click', '[tabindex]', function () {

					tableOrderBy($(this), $table);

				});

				mm.table.resize($table);
				if (_isSpan) return;// 테이블에 colspan, rowspan이 있으면 정렬만 적용

				// 오른쪽 상단 순서변경
				var _classDrag = '__drag';
				$firstLineTh.on('mousedown', function (__e) {

					var $th = $(this);
					if ($th.hasClass('col_check') || $(__e.target).closest('.btn_resize')[0]) return;// 캔슬

					var _startIndex = $th.index();
					var _moveCount = 0;
					var $window = $(window);
					var $point;// 드래그 위치 표시
					var $clone;// 드래그 요소 클론

					$window.on('mousemove mouseup', function (__eA) {

						var $target = $(__eA.target);
						if (!$target.is('th')) $target = $target.closest('th');

						switch (__eA.type) {
							case 'mousemove':
								// 단순 클릭에도 마우스 이동이 발생할 수 있어 카운트 2 적용
								if (_moveCount > 2) {
									if (!$point) {
										$table.addClass(_classDrag);
										$point = $(mm.string.template([
											'<div class="mm_table-point">',
											'	<i class="ico_table-drag"></i>',
											'	<i class="ico_table-drag"></i>',
											'</div>',
										])).css({ 'height': $th.outerHeight() }).insertBefore($table);
										$clone = $(mm.string.template([
											'<div class="mm_table-clone">',
											'	${A}',
											'</div>',
										], { A: $th.html() })).css({ 'width': $th.outerWidth(), 'height': $th.outerHeight() }).prependTo($table);
									}

									var _tableLeft = $table.position().left;
									var _pointLeft = (!$target[0] || !$target.closest($tableRight)[0]) ? -10000 : $target.offset().left;
									if (__eA.originalEvent.offsetX > $target.width() / 2) _pointLeft += $target.outerWidth();// 현재 th 영역의 가로사이즈 절반을 넘어가면 영역 오른쪽에 표시
									_pointLeft -= parseFloat($('.mm_page-content').css('padding-left')) || 0;// 컨텐츠 패딩만큼 추가 제외
									if (_pointLeft < $tableLeft.width() + _tableLeft - 1 || _pointLeft > $table.outerWidth() + _tableLeft) _pointLeft = -10000;// 테이블 영역을 벗어나면 화면 밖으로 숨김

									$point.css({ 'left': _pointLeft });
									$clone.css({ 'left': __eA.originalEvent.pageX - $table.offset().left - $clone.outerWidth() / 2 });
								}
								else _moveCount++;
								break;
							case 'mouseup':
								$window.off('mousemove mouseup');

								// 순서변경 적용
								if ($table.hasClass(_classDrag)) {
									$table.removeClass(_classDrag);
									$point.remove();
									$clone.remove();

									if (!$target[0] || !$target.closest($tableRight)[0]) return;// th가 아닌 곳에서 드랍하면 캔슬

									var _endIndex = $target.index();
									var _changeFunc = (__eA.originalEvent.offsetX < $target.width() / 2) ? 'before' : 'after';
									if (_endIndex === _startIndex || (_changeFunc === 'before' && _endIndex - 1 === _startIndex) || (_changeFunc === 'after' && _endIndex + 1 === _startIndex)) return;// 같은 위치에서 드랍하면 캔슬

									$target[_changeFunc]($th);
									$tableRight.find(mm.string.template('col:nth-child(${A}), td:nth-child(${A})', { A: _startIndex + 1 })).each(function () {

										$(this).siblings().addBack().eq(_endIndex)[_changeFunc](this);

									});

									tableColumnChange($th, $table);
								}
								// 클릭 정렬
								else {
									if ($th.is('[tabindex]')) tableOrderBy($th, $table);
								}
								break;
						}

					});

				});

			});

		},
		//- 테이블 삭제
		remove: function (__element) {

			return getTableElement(__element).each(function () {

				var $table = $(this);
				$table.removeClass('__table-autosize').off('click')
				.find('.mm_scroller').off('scroll')
				.end().find('.mm_table-lside, .mm_table-rside').remove();

			});

		},
		//- 테이블 해제
		destroy: function (__element) {

			return getTableElement(__element).each(function () {

				var $table = $(this);
				var data = mm.data.get($table).table;
				if ($table.find('.mm_table-rside').length === 0 || (!mm.is.empty(data) && data._colHtml)) return;

				var $reset = $(mm.string.template([
					'<div class="mm_scroller">',
					'	<table></table>',
					'</div>',
				]));
				var $resetTable = $reset.find('table');
				var _isLside = $table.find('.mm_table-lside').length > 0;

				_.forEach(['thead', 'tbody', 'tfoot'], function (__el) {

					$table.find(__el).each(function (__index) {

						if (__index === 0) $resetTable.append(this);
						else {
							if (_isLside) {
								var $resetTarget = $resetTable.find(__el).children('tr');
								$(this).children('tr').each(function (__i) {

									$resetTarget.eq(__i).append(mm.find('th, td', this));

								});
							}
							else $resetTable.find(__el).append(mm.find('th, td', this));//$(this).children('tr'));
						}

					});

				});
				mm.table.remove($table);
				$reset.find('th .btn_resize').remove();
				$table.append($reset);

			});

		},
		//- 테이블 리사이즈
		resize: function (__element) {

			return getTableElement(__element).each(function () {

				var $table = $(this);
				var $tableLeftTr = $table.find('.mm_table-lside tr');
				var _isLeft = $tableLeftTr.is(':visible');

				// 초기 td항목 2줄이거나 ie에서 로드 후 줄바꿈이 되는 이슈
				if (_isLeft) {
					$table.find('.mm_table-rside tr').each(function (__index) {

						$tableLeftTr.eq(__index).css({ 'height': '' });
						$(this).css({ 'height': '' });

						var _thisHeight = $(this).height();
						var _leftHeight = $tableLeftTr.eq(__index).height();
						var _height = (_thisHeight > _leftHeight) ? _thisHeight : _leftHeight;

						$tableLeftTr.eq(__index).css({ 'height': _height });
						$(this).css({ 'height': _height });

					});
				}

				// ie오류
				if (mm.is.ie()) {
					// 높이가 안잡힘
					$table.find('.btn_resize').css({ 'height': $table.find('th').height() });
				}

				// 세로스크롤이 있을 때 테이블 너비가 짧으면 적용
				var $tableContent = $table.find('.mm_scroller');
				var $tableRightHead = $tableContent.prev('.mm_table-head');
				var _spaceWidth = $tableContent.width() - $tableContent.children().width()
				if (_spaceWidth > 0) $tableRightHead.css({ 'padding-right': _spaceWidth });
				else $tableRightHead.css({ 'padding-right': '' })

			});

		},
	}

})();
//> 테이블

//< 헤더 고객정보조회 닫기
// 고객정보조회 영역 제외 화면 클릭 시 검색화면 꺼짐
function customerInquiryClose(__is) {

	if (__is) {
		mm.event.on(window, 'click', function (__e) {

			if (__e.target.closest('.mm_gnb-inquiry')) return;

			mm.switch.off('.btn_inquiry');

		});
	}
	else mm.event.off(window, 'click');

}
//> 헤더 고객정보조회 닫기
