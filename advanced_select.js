angular.module('vd.directive.advanced_select', [])
	.directive('advancedSelect', function($compile, $window, $parse, $filter) {
		                       //0000111110000000000022220000000000000000000000333300000000000000444444444444444440000000005555555555555555500000006666666666666666600000000000000077770
		var NG_OPTIONS_REGEXP = /^\s*(.*?)(?:\s+as\s+(.*?))?(?:\s+group\s+by\s+(.*))?\s+for\s+(?:([\$\w][\$\w\d]*)|(?:\(\s*([\$\w][\$\w\d]*)\s*,\s*([\$\w][\$\w\d]*)\s*\)))\s+in\s+(.*)$/;
		
		var FakeSelect = function(scope, select, item, label, compareWith, setNgModel) {
			this.scope = scope;
			this.select = select;
			this.label = label;
			this.item = item;
			this.compareWith = compareWith;
			this.setNgModel = setNgModel;

			this.element = this.createFakeSelect();
			this.controller();
		};

		FakeSelect.prototype = {
			controller: function() {
				var self = this;
				var scope = this.scope;

				scope.selected = null;
				scope.select = function(item, updateModel, focus) {
					scope.selected = item;
					scope.highlight(item);

					if (angular.isDefined(focus) && focus) {
						self.element.find('a').focus();
					}
					
					// Update the model
					if (angular.isUndefined(updateModel) || updateModel) {
						if (self.compareWith) {
							self.setNgModel(scope, $parse(self.compareWith)(item.target));
						} else {
							self.setNgModel(scope, item.target);
						}
					}

					scope.dropDownOpen = false;
				};

				scope.updateSelection = function(ngModel) {
					var results = $filter('filter')(scope.options, scope.search);
					angular.forEach(results, function(r) {
						if ((self.compareWith && $parse(self.compareWith)(r.target) == ngModel) || r.target == ngModel) {
							scope.select(r, false, false);
						}
					});
				};
			},
			dropDownOpened: function() {
				this.element.find('input').focus();
			},
			createFakeSelect: function() {
				var tabIndex = this.select.attr('tabindex') ? this.select.attr('tabindex') : '';
				var fakeSelect = angular.element('<div class="advanced-select-container" ng-class="{ \'advanced-select-dropdown-open\': dropDownOpen }">' + 
					'<a href="javascript:void(0)" ng-click="dropDownOpen=!dropDownOpen" class="advanced-select-choice" tabindex="' + tabIndex + '">' + 
						'<span ng-bind="selected.target' + this.label + '"></span>' + 
						'<abbr class="advanced-select-search-choice-close" style="display: none;"></abbr>' + 
						'<div class="arrow"><b></b></div>' + 
					'</a>' + 
					'<div class="advanced-select-drop" ng-show="dropDownOpen">' + 
						'<div class="advanced-select-search">' + 
							'<input type="text" ng-model="search" autocomplete="off" class="advanced-select-input" tabindex="-1" />' + 
						'</div>' + 
						'<ul class="advanced-select-results">' + 
							'<li class="advanced-select-result advanced-select-result-selectable" ng-repeat="' + this.item + ' in options | filter:search" ng-click="select(' + this.item + ', true, true)" ng-mouseover="highlight(' + this.item + ')" ng-class="{ \'advanced-select-highlighted\': ' + this.item + '.highlighted == true }">' + 
								'<div class="advanced-select-result-label" ng-bind="' + this.item + '.target' + this.label + '"></div>' + 
							'</li>' + 
						'</ul>' + 
					'</div>' + 
				'</div>');
				fakeSelect.addClass(this.select.attr('class'));
				return fakeSelect;
			}
		};

		return {
			restrict: 'A',
			require: '^ngModel',
			scope: true,
			controller: function($scope) {
				$scope.options = [];
				$scope.dropDownOpen = false;
				$scope.highlighted = null;
				$scope.search = '';

				$scope.highlight = function(item) {
					if ($scope.highlighted) {
						$scope.highlighted.highlighted = false;
					}
					$scope.highlighted = item;
					$scope.highlighted.highlighted = true;
				};

				$scope.highlightPrevious = function() {
					var results = $filter('filter')($scope.options, $scope.search);

					if (!$scope.hasHighlighted(results)) {
						$scope.highlight(results[0]);
						return;
					}

					try {
						angular.forEach(results, function(r, index) {
							if (r.highlighted && angular.isDefined(results[index - 1])) {
								$scope.highlight(results[index - 1]);
								throw 0;
							}
						});
					} catch (e) {}
				}

				$scope.highlightNext = function() {
					var results = $filter('filter')($scope.options, $scope.search);

					if (!$scope.hasHighlighted(results)) {
						$scope.highlight(results[0]);
						return;
					}

					try {
						angular.forEach(results, function(r, index) {
							if (r.highlighted && angular.isDefined(results[index + 1])) {
								$scope.highlight(results[index + 1]);
								throw 0;
							}
						});
					} catch (e) {}
				};

				$scope.hasHighlighted = function(results) {
					if ($scope.highlighted == null) {
						return false;
					}

					try {
						angular.forEach(results, function(r) {
							if (r.highlighted) {
								throw 0;
							}
						});
					} catch (e) {
						return true;
					}
					return false;
				};
			},
			link: function(scope, select, attrs, ngModelController) {
				// ngModel
				var getNgModel = $parse(attrs.ngModel);
				var setNgModel = getNgModel.assign;

				var label = "label",
				    item = "item",
				    optionsModel = null,
				    objects = []
				    compareWith = [];

				if (attrs.ngOptions) {
					var match = attrs.ngOptions.match(NG_OPTIONS_REGEXP),
					item = match[4] || match[6];
					label = (match[2] || match[1]).replace(new RegExp(item), '');
					compareWith = match[2] ? match[1].replace(new RegExp(item + '\.?'), '') : null;
					optionsModel = match[7];
					fillInResultsFromNgOptions();
				} else {
					fillInResultsFromSelect();
				}

				// Create the fake select and add it after the original select
				scope.fakeSelect = new FakeSelect(scope, select, item, label, compareWith, setNgModel);
				select.after(scope.fakeSelect.element);

				// Hide the original select
				select.css('display', 'none');

				// Compile the fake select
				$compile(scope.fakeSelect.element)(scope);


				scope.$watch('dropDownOpen', function() {
					if (scope.dropDownOpen) {
						$(document).unbind('keydown.advanced_select')
						           .bind('mousedown.advanced_select', handleMouseWhenDropDownOpened);
						scope.fakeSelect.dropDownOpened();
					} else {
						$(document).unbind('mousedown.advanced_select')
						           .unbind('keydown.advanced_select');
						scope.search = '';
					}
				});

				scope.$watch(attrs.ngModel, function(ngModel) {
					scope.updateSelection(ngModel);
				}, true);



				function handleMouseWhenDropDownOpened(e) {
					var container = angular.element(e.target).parents('.advanced-select-container');
					if (container.length == 0 || container[0] != scope.fakeSelect.element.get(0)) {
						scope.dropDownOpen = false;
						scope.$apply();
					}
				}

				function handleKeysWhenDropDownOpened(e) {
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
						case 38: // Up
							scope.highlightPrevious();
							scope.$apply();
							break;
						case 40: // Down
							scope.highlightNext();
							scope.$apply();
							break;
					}
				}

				/**
				 * Fill in the options list of the fakeSelect from
				 * the models given to ng-options
				 */
				function fillInResultsFromNgOptions() {
					scope.$watch(optionsModel, function(items) {
						scope.options = [];
						angular.forEach(items, function(item) {
							scope.options.push({
								target: item
							});
						});
						scope.updateSelection(getNgModel(scope));
					}, true);
				}

				/**
				 * Fill in the options list of the fakeSelect from the
				 * options of the original select
				 */
				function fillInResultsFromSelect() {
					scope.options = [];
					angular.forEach(select.find('options'), function(option) {
						scope.options.push({
							value: option.attr('value'),
							label: option.html()
						});
					});
				}
			}
		};
	});
