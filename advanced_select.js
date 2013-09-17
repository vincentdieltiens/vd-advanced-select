angular.module('vd.directive.advanced_select', [])
	/**
	 * Directive that transform a regular <select> element into an advanced select
	 */
	.directive('vdAdvanced', function($compile) {
		return {
			restrict: 'A',
			require: ['select', 'ngModel'],
			link: function(scope, select, attrs) {
				// Creates the Advanced Select using the second directive
				var el;
				if (attrs.multiple) {
					el = angular.element('<vd-advanced-select vd-advanced-select-multiple options="'+attrs.ngOptions+'"></vd-advanced-select>');
				} else {
					el = angular.element('<vd-advanced-select vd-advanced-select-simple options="'+attrs.ngOptions+'"></vd-advanced-select>');
				}

				for(var i=0, n=select[0].attributes.length; i < n; i++) {
					var attr = select[0].attributes[i];

					if (attr.name == "name" || attr.name == "ng-options" || attr.name == "vd-advanced") {
						continue;
					}

					el.attr(attr.name, attr.value);
				}
				el.attr('config', attrs.vdAdvanced)

				// Hide the select, add the Advanced Select to the DOM and compile it
				select.css('display', 'none');
				select.after(el);
				//select.remove();
				$compile(el)(scope);
			}
		};
	})

	/**
	 * Base directive for creating an advanced select
	 */
	.directive('vdAdvancedSelect', function($parse, $filter, $timeout, $compile, $window) {
		                       //0000111110000000000022220000000000000000000000333300000000000000444444444444444440000000005555555555555555500000006666666666666666600000000000000077770
		var NG_OPTIONS_REGEXP = /^\s*(.*?)(?:\s+as\s+(.*?))?(?:\s+group\s+by\s+(.*))?\s+for\s+(?:([\$\w][\$\w\d]*)|(?:\(\s*([\$\w][\$\w\d]*)\s*,\s*([\$\w][\$\w\d]*)\s*\)))\s+in\s+(.*)$/;

		var openedAdvancedSelect = null;

		return {
			restrict: 'E',
			require: 'ngModel',
			scope: true,
			controller: ['$scope', '$element', '$attrs', function($scope, $element, $attrs) {
				// Which options is selected ?
				$scope.selected = null;

				// Is the DropDown open or not ?
				$scope.dropDownOpen = false;

				$scope.placeholder = $attrs.placeholder;

				$scope.dropDownElement = null;
			}],
			compile: function(tElement, tAttrs) {
				var advancedSelectDropLink = $compile($('<div class="advanced-select-drop">'+
					'<div class="search">'+
						'<input type="text" ng-model="search.label" autocomplete="off" class="advanced-select-input" tabindex="-1" />'+
					'</div>'+
					'<ul class="results top_result">'+
						'<li vd-advanced-select-option class="advanced-select-result advanced-select-result-selectable" ng-repeat="item in filteredTopOptions"  ng-class="{ \'with-children\': item.children.length > 0 }">'+
							'<div '+
							     'class="label" '+
							     'ng-bind="item.label" ' + 
							     'ng-click="select(item, true, true)" '+
							     'ng-mouseover="highlight(item, this)">'+
							'</div>'+
							'<ul>'+
								'<li vd-advanced-select-option class="advanced-select-result" ng-repeat="item in item.children">'+
									'<div class="label" '+
									     'ng-bind="item.label" '+
									     'ng-click="select(item, true, true)" '+
									     'ng-mouseover="highlight(item)">'+
									'</div>'+
								'</li>'+
							'</ul>'+
						'</li>'+
					'</ul>'+
					'<hr ng-show="filteredTopOptions.length" />' +
					'<ul class="results">'+
						'<li vd-advanced-select-option class="advanced-select-result advanced-select-result-selectable" ng-repeat="item in filteredOptions"  ng-class="{ \'with-children\': item.children.length > 0 }">'+
							'<div '+
							     'class="label" '+
							     'ng-bind="item.label" ' + 
							     'ng-click="select(item, true, true)" '+
							     'ng-mouseover="highlight(item, this)">'+
							'</div>'+
							'<ul>'+
								'<li vd-advanced-select-option class="advanced-select-result" ng-repeat="item in item.children">'+
									'<div class="label" '+
									     'ng-bind="item.label" '+
									     'ng-click="select(item, true, true)" '+
									     'ng-mouseover="highlight(item)">'+
									'</div>'+
								'</li>'+
							'</ul>'+
						'</li>'+
					'</ul>'+
					'<div class="search-min-message" ng-show="config && config.searchMinChars && search.label.length < config.searchMinChars" ng-bind="config.searchMinMessage"></div>'+
				'</div>'));

				var labelFn = $parse("label"),
				    item = "item",
				    optionsModel = null,
				    groupBy = null,
				    groupByFn = null,
				    value=null,
				    valueFn=null,
				    isTopFn=null,
				    watchOptionsModelExpression = null;

				function parseConfig(scope, attrs) {
					var config = null;
					if (attrs.config && attrs.config != '') {
						config = scope.$eval(attrs.config);
						if (typeof(config) == 'string') {
							config = $parse('$parent.'+config)();
						}

						if (config.add) {
							config.add = $parse(config.add);
						}

						config.filter = angular.isDefined(config.filter) ? config.filter : 'filter';
					} else {
						config = { filter: 'filter' };
					}

					return config;
				}

				function parseOptions(scope, attrs) {
					if (attrs.options) {
						var match = attrs.options.match(NG_OPTIONS_REGEXP);

						item = match[4] || match[6],
						//
						label = (match[2] || match[1]).replace(new RegExp('^'+item), 'item'),
						labelFn = $parse(label);
						//
						value = match[1].replace(new RegExp('^'+item), 'item'),
						valueFn = $parse(value),
						//
						groupBy = match[3] ? match[3].replace(new RegExp('^'+item), 'item') : null,
						groupByFn = $parse(groupBy),
						optionsModel = match[7],
						isTop = scope.config.isTop ? scope.config.isTop.replace(new RegExp('^'+item), 'target') : null,
						isTopFn =  $parse(isTop),
						watchOptionsModelExpression = scope.config.watchOptions ? scope.config.watchOptions : optionsModel,
						watchOptionsModelEquality = scope.config.watchOptionsEquality || true;
					}
				}

				return function(scope, element, attrs) {
					// ngModel
					scope.getNgModel = $parse('$parent.'+attrs.ngModel);
					scope.setNgModel = scope.getNgModel.assign;

					scope.config = parseConfig(scope, attrs);
					parseOptions(scope, attrs);

					scope.$on('$destroy', function() {
						// Remove the drop down and delete it correctly
						if (scope.dropDownElement) {
							scope.dropDownElement.remove();
						}
					});

					scope.toggleOpening = function() {
						scope.dropDownOpen = !scope.dropDownOpen;

						if (scope.dropDownOpen) {

							if (!scope.dropDownElement) {
								scope.dropDownElement = advancedSelectDropLink(scope);
							}

							$('body').append(scope.dropDownElement);
							var isTop = scope.adjustDropDownPosition();
							if (isTop) {
								element.addClass('top');
								scope.dropDownElement.addClass('top');
							} else {
								element.removeClass('top');
								scope.dropDownElement.removeClass('top');
							}

						} else {
							scope.dropDownElement.detach();
						}
					};

					scope.adjustDropDownPosition = function() {
						var isTop = false;

						var undermostPointInSelect = element.offset().top + element.outerHeight() + scope.dropDownElement.outerHeight();
						var undermostPointInWindow = $($window).scrollTop()+ document.documentElement.clientHeight
						if (undermostPointInSelect <= undermostPointInWindow) {
							// Top
							isTop = true;
							scope.dropDownElement.offset({
								left: element.offset().left,
								top: element.offset().top + element.outerHeight()
							});
						} else {
							// Bottom
							scope.dropDownElement.offset({
								left: element.offset().left,
								top: element.offset().top - scope.dropDownElement.outerHeight()
							});
						}

						return isTop;
					}
				}
			}
		};
	})
	/**
	 * Directive to make an advanced select with single selection
	 */ 
	.directive('vdAdvancedSelectSimple', function($parse, $compile) {
		return {
			restrict: 'A',
			require: 'vdAdvancedSelect',
			scope: true,
			compile: function(scope, element, attrs) {
				return function(scope, element, attrs) {

				}
			},
			replace: true,
			template: 
			'<a class="advanced-select-container" href="javascript:void(0)" ng-click="toggleOpening()">'+
				'<span ng-bind="selected.label || placeholder"></span>' +
				'<div class="arrow"><b></b></div>' +
			'</a>'
		};
	})
	/**
	 * Directive to make an advanced select with multiple selection
	 */
	.directive('vdAdvancedSelectMultiple', function($parse, $filter, $timeout) {
		return {
			restrict: 'A',
			require: 'vdAdvancedSelect',
			replace: true,
			scope: true,
			controller: function($scope) {
				
			},
			link: function(scope, element, attrs) {
				
			},
			template: 
			'<div class="advanced-select-container" ng-class="{ \'advanced-select-dropdown-open\': dropDownOpen, \'disabled\': disabled }">'+
				'<ul class="advanced-select-choices" ng-click="dropDownOpen=(!disabled && !dropDownOpen)">'+
					'<li vd-advanced-select-option ng-repeat="item in selected">'+
						'<div ng-bind="item.label"></div>'+
						'<a href="javascript:void(0)" ng-click="unselect($index, $event)" tabindex="-1"></a>'+
					'</li>'+
					'<li class="search">'+
						'<input type="text" autocomplete="off" autocorrect="off" tabIndex="tabIndex" ng-change="dropDownOpen=(!disabled)" ng-model="search.label" placeholder="{{ getPlaceholder() }}" />'+
					'</li>'+
				'</ul>'+
				'<div class="advanced-select-drop" ng-show="dropDownOpen">'+
					'<ul class="results">'+
						'<li vd-advanced-select-option class="advanced-select-result advanced-select-result-selectable" ng-repeat="item in filteredOptions"  ng-class="{ \'with-children\': item.children.length > 0 }">'+
							'<div '+
							     'class="label" '+
							     'ng-bind="item.label" '+ 
							     'ng-click="select(item, true, true)" '+
							     'ng-mouseover="highlight(item, this)">'+
							'</div>'+
							'<ul>'+
								'<li vd-advanced-select-option class="advanced-select-result" ng-repeat="item in item.children">'+
									'<div class="label" '+
									     'ng-bind="item.label" '+
									     'ng-click="select(item, true, true)" '+
									     'ng-mouseover="highlight(item)">'+
									'</div>'+
								'</li>'+
							'</ul>'+
						'</li>'+
					'</ul>'+
				'</div>'+
			'</div>'
		};
	})
	.directive('vdAdvancedSelectOption', function() {
		return {
			restrict: 'A',
			scope: true,
			link: function(scope, element) {
				
			}
		};
	})
	/**
	 * Options filter. Remove a sub list of options from the main options list
	 */
	.filter('exclude', function() {
		/**
		 * @param options : the main list of options
		 * @param excluded : the sub list of options to remove
		 */
		return function(options, excluded) {
			var o = options.filter(function(element, index, array) {
				for(var i=0, n=excluded.length; i < n; i++) {
					if (element.value == excluded[i].value) {
						return false;
					}
				}
				return true;
			});
			return o;
		}
	})
	.filter('starts_with', function() {
		return function(list, search) {
			var r = [];
			for(var i=0, n=list.length; i < n; i++) {
				if (list[i].label.toLowerCase().match(new RegExp('^'+search.label.toLowerCase()))) {
					r.push(list[i]);
				}
			}
			return r;
		}
	});
