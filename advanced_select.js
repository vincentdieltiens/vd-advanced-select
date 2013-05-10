angular.module('vd.directive.advanced_select', [])
	.directive('advancedSelect', function($compile, $window, $parse) {
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
			},
			link: function(scope, select, attrs, ngModelController) {
				var label = "label",
					item = "item",
					compareWith = null;
					options = null,
					objects = [],
					labelFn = $parse(label);

				// ngModel
				var getNgModel = $parse(attrs.ngModel);
				var setNgModel = getNgModel.assign;

				// Fill in the options of the fake select
				if (attrs.ngOptions) {
					var match = attrs.ngOptions.match(NG_OPTIONS_REGEXP),
						item = match[4] || match[6];
						label = (match[2] || match[1]).replace(item+'.', '');
						labelFn = $parse(match[2] || match[1]);
						compareWith = match[2] ? match[1].replace(item+'.', '') : null;
						options = match[7];
						console.log('item : ', item)
						console.log('label : ', label)
						console.log('compareWith : ', compareWith);
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
						$('body')
							.bind('mousedown', hideDropDownOnMouseDown)
							.bind('keydown.advanced_select', handleKeys);
						fakeSelect.find('input').focus();
					} else {
						$('body')
							.unbind('mousedown', hideDropDownOnMouseDown)
							.unbind('keydown.advanced_select');
					}
				});

				scope.$watch(attrs.ngModel, function(ngModel) {
					angular.forEach(scope.results, function(r) {
						if ($parse(compareWith)(r) == ngModel) {
							scope.selected = r;
						}
					});
				});

				scope.select = function(item) {
					// Hide the options
					scope.dropDownOpen = false;
					scope.selected = item;
					// Update the model
					setNgModel(scope, $parse(compareWith)(item));
				}

				function handleKeys(e) {
					switch(e.keyCode) {
						case 13: // Enter
							break;
						case 9: // Tab
							break;
						case 27: // Escape
							break;
						case 38: // Up Arrow
							break;
						case 40: // Down Arrow
							break;
					}
				}

				function hideDropDownOnMouseDown(e) {
					if (!angular.element(e.target).parents().hasClass('advanced-select-container')) {
						scope.dropDownOpen = false;
						scope.$apply();
					}
				}

				function fillInResultsFromNgOptions() {
					scope.$watch(options, function(items) {
						console.log('items : ', items)
						scope.results = items;
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
					if (compareWith) {
						var A = $parse(compareWith)(a);
						var B = $parse(compareWith)(b);
						console.log(A, 'vs', B)
						return A == B;
					} else {
						return angular.equals(a, b);
					}
				}

				function createFakeSelect() {
					var fakeSelect = angular.element(
						'<div class="advanced-select-container" ng-class="{ \'advanced-select-dropdown-open\': dropDownOpen }">' +
							'<a href="javascript:void(0)" ng-click="dropDownOpen=!dropDownOpen" class="advanced-select-choice">' +
								'<span ng-bind="selected.'+label+'"></span>' +
								'<abbr class="advanced-select-search-choice-close" style="display: none;"></abbr>' +
								'<div class="arrow"><b></b></div>' +
							'</a>' +
							'<div class="advanced-select-drop" ng-show="dropDownOpen">'+
									'<div class="advanced-select-search">' +
										'<input type="text" ng-model="search" autocomplete="off" class="advanced-select-input" tabindex="-1" />' +
									'</div>' +
									'<ul class="advanced-select-results">' +
										'<li class="advanced-select-result advanced-select-result-selectable" ng-repeat="'+item+' in results | filter:search" ng-click="select('+item+')" ng-class="{ \'advanced-select-highlighted\': compare(selected, '+item+') }">'+
											'<div class="advanced-select-result-label" ng-bind="'+item+'.'+label+'"></div>' +
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
