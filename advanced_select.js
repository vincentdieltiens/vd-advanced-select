angular.module('vd.directive.advanced_select', [])
	.directive('advancedSelect', function($compile, $window, $parse, $filter) {
		                       //0000111110000000000022220000000000000000000000333300000000000000444444444444444440000000005555555555555555500000006666666666666666600000000000000077770
		var NG_OPTIONS_REGEXP = /^\s*(.*?)(?:\s+as\s+(.*?))?(?:\s+group\s+by\s+(.*))?\s+for\s+(?:([\$\w][\$\w\d]*)|(?:\(\s*([\$\w][\$\w\d]*)\s*,\s*([\$\w][\$\w\d]*)\s*\)))\s+in\s+(.*)$/;
		
		return {
			restrict: 'A',
			require: '^ngModel',
			scope: true,
			controller: function($scope) {
				$scope.dropDownOpen = false;
				$scope.results = [];
				$scope.search = '';
				$scope.selected = null;
				$scope.highlighted = null;
			},
			link: function(scope, select, attrs, ngModelController) {
				var label = "label",
					item = "item",
					options = null,
					objects = [];

				scope.compareWith = null;

				// ngModel
				var getNgModel = $parse(attrs.ngModel);
				var setNgModel = getNgModel.assign;
				var setNgModelAttr = attrs.ngModel;

				// Fill in the options of the fake select
				if (attrs.ngOptions) {
					var match = attrs.ngOptions.match(NG_OPTIONS_REGEXP),
						item = match[4] || match[6];
						label = (match[2] || match[1]).replace(new RegExp(item), '');
						scope.compareWith = match[2] ? match[1].replace(new RegExp(item+'\.?'), '') : null;
						options = match[7];
					fillInResultsFromNgOptions(scope, options);
				} else {
					fillInResultsFromSelect(scope, select);
				}

				// Creates the fake select
				var fakeSelect = createFakeSelect();

				scope.$watch('dropDownOpen', function() {
					if (scope.dropDownOpen) {
						// 1. Hide the dropdown on click outside
						// 2. handle keys
						$(document)
							.bind('mousedown', hideDropDownOnMouseDown)
							.bind('keydown.advanced_select', handleKeys);
						fakeSelect.find('input').focus();
					} else {
						$(document)
							.unbind('mousedown', hideDropDownOnMouseDown)
							.unbind('keydown.advanced_select');
						scope.search = '';
					}
				});

				scope.$watch(attrs.ngModel, function(ngModel) {
					scope.updateModel(ngModel);
				}, true);

				scope.updateModel = function(ngModel) {
					var results = $filter('filter')(scope.results, scope.search);
					angular.forEach(results, function(r) {
						if ((scope.compareWith && $parse(scope.compareWith)(r.target) == ngModel) || r.target == ngModel) {
							//scope.selected = r;
							scope.select(r, false, false);
						}
					});
				}

				scope.select = function(item, updateModel, focus) {
					scope.selected = item;
					scope.highlight(item);

					

					// Update the model
					if (angular.isUndefined(updateModel) || updateModel) {
						if (scope.compareWith) {
							setNgModel(scope, $parse(scope.compareWith)(item.target));
						} else {
							setNgModel(scope, item.target);
						}
					}

					if (angular.isDefined(focus) && focus) {
						fakeSelect.find('a').focus();
					}

					// Hide the options
					scope.dropDownOpen = false;
				}

				scope.highlight = function(item) {
					if (scope.highlighted) {
						scope.highlighted.highlighted = false;
					}
					scope.highlighted = item;
					scope.highlighted.highlighted = true;
				}

				scope.highlightPrevious = function() {
					var results = $filter('filter')(scope.results, scope.search);

					if (!scope.hasHighlighted(results)) {
						scope.highlight(results[0]);
						return;
					}

					try {
						angular.forEach(results, function(r, index) {
							if (r.highlighted && angular.isDefined(results[index-1])) {
								scope.highlight(results[index-1]);
								throw 0;
							}
						});
					} catch(e) {}
				}

				scope.highlightNext = function() {
					var results = $filter('filter')(scope.results, scope.search);

					if (!scope.hasHighlighted(results)) {
						scope.highlight(results[0]);
						return;
					}

					try {
						
						angular.forEach(results, function(r, index) {
							if (r.highlighted && angular.isDefined(results[index+1])) {
								scope.highlight(results[index+1]);
								throw 0;
							}
						});
					} catch(e) {

					}
				}

				scope.hasHighlighted = function(results) {
					if (scope.highlighted == null) {
						return false;
					}

					try {
						angular.forEach(results, function(r) {
							if (r.highlighted) {
								throw 0;
							}
						});
					} catch(e) {
						return true;
					}
					return false;
				}

				function handleKeys(e) {
					switch(e.keyCode) {
						case 9: // Tab
						case 13: // Enter
							e.preventDefault();
							e.stopPropagation();
							scope.select(scope.highlighted, true, true);
							scope.$apply();

							break;
						case 27: // Escape
							scope.dropDownOpen = false;
							scope.$apply();
							break;
						case 38: // Up Arrow
							scope.highlightPrevious();
							scope.$apply();
							break;
						case 40: // Down Arrow
							scope.highlightNext();
							scope.$apply();
							break;
					}
				}

				function hideDropDownOnMouseDown(e) {
					var container = angular.element(e.target).parents('.advanced-select-container');
					if (container.length == 0 || container[0] != fakeSelect.get(0)) {
						scope.dropDownOpen = false;
						scope.$apply();
					}
				}

				function fillInResultsFromNgOptions() {
					scope.$watch(options, function(items) {
						//scope.results = items;
						scope.results = [];
						angular.forEach(items, function(item) {
							scope.results.push({
								target: item
							});
						});
						scope.updateModel(getNgModel(scope));
					}, true);
				}

				function fillInResultsFromSelect() {
					angular.forEach(select.find('options'), function(option) {
						scope.results.push({ 
							value: option.attr('value'), 
							label: option.html() 
						});
					});
				}

				scope.compare = function(a, b) {
					if (scope.compareWith) {
						var A = $parse(scope.compareWith)(a);
						var B = $parse(scope.compareWith)(b);
						return A == B;
					} else {
						return angular.equals(a, b);
					}
				}

				function createFakeSelect() {
					var tabIndex = select.attr('tabindex') ? select.attr('tabindex') : '';
					var fakeSelect = angular.element(
						'<div class="advanced-select-container" ng-class="{ \'advanced-select-dropdown-open\': dropDownOpen }">' +
							'<a href="javascript:void(0)" ng-click="dropDownOpen=!dropDownOpen" class="advanced-select-choice" tabindex="'+tabIndex+'">' +
								'<span ng-bind="selected.target'+label+'"></span>' +
								'<abbr class="advanced-select-search-choice-close" style="display: none;"></abbr>' +
								'<div class="arrow"><b></b></div>' +
							'</a>' +
							'<div class="advanced-select-drop" ng-show="dropDownOpen">'+
									'<div class="advanced-select-search">' +
										'<input type="text" ng-model="search" autocomplete="off" class="advanced-select-input" tabindex="-1" />' +
									'</div>' +
									'<ul class="advanced-select-results">' +
										'<li class="advanced-select-result advanced-select-result-selectable" ng-repeat="'+item+' in results | filter:search" ng-click="select('+item+', true, true)" ng-mouseover="highlight('+item+')" ng-class="{ \'advanced-select-highlighted\': '+item+'.highlighted == true }">'+
											'<div class="advanced-select-result-label" ng-bind="'+item+'.target'+label+'"></div>' +
										'</li>' +
									'</ul>' +
								'</div>' +
						'</div>');
					
					
					fakeSelect.addClass(select.attr('class'));
					
					select.after(fakeSelect);
					select.css('display', 'none');

					$compile(fakeSelect)(scope);

					return fakeSelect;
				}
			}
		};
	});
