angular.module('vd.directive.advanced_select', [])
	.directive('advancedSelect', function($compile, $window, $parse) {

		return {
			restrict: 'A',
			require: '^ngModel',
			controller: function($scope) {
				$scope.dropDownOpen = false;
				$scope.results = [];
				$scope.search = '';
			},
			link: function(scope, select, attrs, ngModelController) {

				                       //0000111110000000000022220000000000000000000000333300000000000000444444444444444440000000005555555555555555500000006666666666666666600000000000000077770
				var NG_OPTIONS_REGEXP = /^\s*(.*?)(?:\s+as\s+(.*?))?(?:\s+group\s+by\s+(.*))?\s+for\s+(?:([\$\w][\$\w\d]*)|(?:\(\s*([\$\w][\$\w\d]*)\s*,\s*([\$\w][\$\w\d]*)\s*\)))\s+in\s+(.*)$/;
				var label = "item.label",
					item = "item",
					models = null,
					body = angular.element(document.querySelector('body'));

				var getNgModel = $parse(attrs.ngModel);
				var setNgModel = getNgModel.assign;

				if (attrs.ngOptions) {
					var match = attrs.ngOptions.match(NG_OPTIONS_REGEXP),
						label = match[2] || match[1];
            			item = match[4] || match[6];
            			models = match[7];
					updateResultsFromNgOptions();
				} else {
					updateResultsFromSelect();
				}

				var label_property = label.replace(item+'.', '');

				scope.select = function(item) {
					console.log('select()');
					scope.dropDownOpen = false;
					setNgModel(scope, item);
				}

				var fakeSelect = createFakeSelect();
				var fakeSelectChoice = fakeSelect.children('.advanced-select-choice');
				var drop = fakeSelect.find('.advanced-select-drop');

				select.after(fakeSelect);
				select.css('display', 'none');

				$compile(fakeSelect)(scope);

				scope.$watch('dropDownOpen', function() {
					if (scope.dropDownOpen) {
						body.bind('mousedown', hideDropDownOnMouseDown);
						body.bind('keydown.advanced_select', handleKeys);
						fakeSelect.find('input').focus();
					} else {
						body.unbind('mousedown', hideDropDownOnMouseDown);
						body.unbind('keydown.advanced_select');
					}
					
				});

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

				function updateResultsFromSelect() {
					angular.forEach(select.find('options'), function(option) {
						$scope.results.push({ 
							value: option.attr('value'), 
							label: option.html() 
						});
					});
				}

				function updateResultsFromNgOptions() {
					scope.$watch(models, function(items) {
						scope.results = items;
					}, true);
				}

				function createFakeSelect() {
					var fakeSelect = angular.element(
						'<div class="advanced-select-container" ng-class="{ \'advanced-select-dropdown-open\': dropDownOpen }">' +
							'<a href="javascript:void(0)" ng-click="dropDownOpen=!dropDownOpen" class="advanced-select-choice">' +
								'<span ng-bind="'+attrs.ngModel+'.'+label_property+'"></span>' +
								'<abbr class="advanced-select-search-choice-close" style="display: none;"></abbr>' +
								'<div class="arrow"><b></b></div>' +
							'</a>' +
							'<div class="advanced-select-drop" ng-show="dropDownOpen">'+
									'<div class="advanced-select-search">' +
										'<input type="text" ng-model="search" autocomplete="off" class="advanced-select-input" tabindex="-1" />' +
									'</div>' +
									'<ul class="advanced-select-results">' +
										'<li class="advanced-select-result advanced-select-result-selectable" ng-repeat="'+item+' in results | filter:search" ng-click="select('+item+')">'+
											'<div class="advanced-select-result-label" ng-bind="'+label+'"></div>' +
										'</li>' +
									'</ul>' +
								'</div>' +
						'</div>');
					
					fakeSelect.addClass(select.attr('class'));

					return fakeSelect;
				}
				
			}
		}
	});
