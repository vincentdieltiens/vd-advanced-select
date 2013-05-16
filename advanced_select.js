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

				scope.updateSelection = function(ngModel, results) {
					var results = angular.isDefined(results) ? results : $filter('filter')(scope.options, scope.search);
					for(var i=0, n = results.length; i < n; i++) {
						var r = results[i];
						if ((self.compareWith && $parse(self.compareWith)(r.target) == ngModel) || r.target == ngModel) {
							scope.select(r, false, false);
							return;
						}
						if (r.children) {
							scope.updateSelection(ngModel, r.children);
						}
					}
				};
			},
			dropDownOpened: function() {
				this.element.find('input').focus();
				if (this.element.offset().top + this.element.outerHeight() + this.element.find('.advanced-select-drop').outerHeight() 
						<= $(window).scrollTop() + document.documentElement.clientHeight) {
					this.dropDownBelow();
				} else {
					this.dropDownAbove();
				}
			},
			createFakeSelect: function() {
				var tabIndex = this.select.attr('tabindex') ? this.select.attr('tabindex') : '';
				var fakeSelect = angular.element('<div class="advanced-select-container" ng-class="{ \'advanced-select-dropdown-open\': dropDownOpen, \'disabled\': disabled }">' + 
					'<a href="javascript:void(0)" ng-click="dropDownOpen=(!disabled && !dropDownOpen)" class="advanced-select-choice" tabindex="' + tabIndex + '">' + 
						'<span ng-bind="selected.label || placeholder" ng-class="{ \'placeholder\': selected == null }"></span>' + 
						'<abbr class="advanced-select-search-choice-close" style="display: none;"></abbr>' + 
						'<div class="arrow"><b></b></div>' + 
					'</a>' + 
					'<div class="advanced-select-drop" ng-show="dropDownOpen">' + 
						'<div class="search">' + 
							'<input type="text" ng-model="search" autocomplete="off" class="advanced-select-input" tabindex="-1" />' + 
						'</div>' + 
						'<ul class="results">' + 
							'<li class="advanced-select-result advanced-select-result-selectable" ng-repeat="' + this.item + ' in options | filter:search"  ng-class="{ \'with-children\': '+ this.item +'.children.length > 0 }">' + 
								'<div class="label" ng-bind="' + this.item + '.label" ng-class="{ \'advanced-select-highlighted\': ' + this.item + '.highlighted == true }" ng-click="select(' + this.item + ', true, true)" ng-mouseover="highlight(' + this.item + ')"></div>' + 
								'<ul>' +
									'<li class="advanced-select-result" ng-repeat="sub in ' + this.item + '.children"  ng-class="{ \'advanced-select-highlighted\': sub.highlighted == true }">'+
										'<div class="label" ng-bind="sub.label" ng-click="select(sub, true, true)" ng-class="{ \'advanced-select-highlighted\': sub.highlighted == true }" ng-mouseover="highlight(sub)"></div>' +
									'</li>'+
								'</ul>' +
							'</li>' + 
						'</ul>' + 
					'</div>' + 
				'</div>');

				fakeSelect.addClass(this.select.attr('class'));
				return fakeSelect;
			},
			dropDownBelow: function() {
				this.element.removeClass('top');
				this.element.find('.results').before(this.element.find('.search').detach());
			},
			dropDownAbove: function() {
				this.element.addClass('top');
				this.element.find('.results').after(this.element.find('.search').detach());
			}
		};

		return {
			restrict: 'A',
			require: '^ngModel',
			scope: true,
			controller: function($scope, $element, $attrs) {
				$scope.options = [];
				$scope.dropDownOpen = false;
				$scope.highlighted = null;
				$scope.search = '';
				$scope.disabled = false;
				$scope.placeholder = $attrs.placeholder;

				$scope.highlight = function(item) {
					if ($scope.highlighted) {
						$scope.highlighted.highlighted = false;
					}
					$scope.highlighted = item;
					$scope.highlighted.highlighted = true;
				};

				$scope.highlightPrevious = function(results, highlightPrevious) {
					if (angular.isUndefined(results)) {
						results = $filter('filter')($scope.options, $scope.search);
					}

					var res = {
						jobDone: false,
						highlightPrevious: angular.isDefined(highlightPrevious) ? highlightPrevious : false
					};

					for(var i=results.length-1; i >= 0; i--) {
						var r = results[i];

						if (r.children) {
							res = $scope.highlightPrevious(r.children, res.highlightPrevious);
							if (res.jobDone) {
								break;
							}
						}

						if (res.highlightPrevious) {
							$scope.highlight(r);
							res = { jobDone: true, highlightPrevious: false }
							break;
						}

						if (r.highlighted) {
							res.highlightPrevious = true;
						}

						
					}

					return res;
				}

				$scope.highlightNext = function(results, highlightNext) {
					// Walks into the list of optins (results). When an highlighted item
					// is found, set the marker "res.highlightNext" as true.
					// At each step of the loop, if "res.highlightNext" is true, highlight the item and stop
					// the loop with res.jobDone = true

					if (angular.isUndefined(results)) {
						results = $filter('filter')($scope.options, $scope.search);
					}

					var res = {
						jobDone: false,
						highlightNext: angular.isDefined(highlightNext) ? highlightNext : false
					};

					for(var i=0, n=results.length; i < n; i++) {
						var r = results[i];
						if (res.highlightNext) {
							$scope.highlight(r);
							res = { jobDone: true, highlightNext: false }
							break;
						}

						if (r.highlighted) {
							res.highlightNext = true;
						}

						if (r.children) {
							res = $scope.highlightNext(r.children, res.highlightNext);
							if (res.jobDone) {
								break;
							}
						}
					}

					return res;
				};

				$scope.hasHighlighted = function(results) {
					if ($scope.highlighted == null) {
						return false;
					}

					try {
						angular.forEach(results, function(r) {
							if (r.highlighted) {
								throw 0;
							} else {
								if (r.children && $scope.hasHighlighted(r.children)) {
									throw 0;
								}
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
				    labelFn = $parse(label),
				    item = "item",
				    optionsModel = null,
				    groupBy = null,
				    objects = []
				    compareWith = [];

				if (attrs.ngOptions) {
					var match = attrs.ngOptions.match(NG_OPTIONS_REGEXP),
					    item = match[4] || match[6],
					    label = (match[2] || match[1]).replace(new RegExp(item), ''),
					    labelExp = label.replace(new RegExp('^\.'), ''),
					    labelFn = labelExp ? $parse(labelExp) : function(s, value) { return value },
					    compareWith = match[2] ? match[1].replace(new RegExp(item + '\.?'), '') : null,
					    groupBy = match[3] ? match[3].replace(new RegExp(item + '\.?'), '') : null,
					    groupByFn = $parse((match[3] || '').replace(new RegExp(item + '\.?'), '')),
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
						$(document).bind('keydown.advanced_select', handleKeysWhenDropDownOpened)
						           .bind('mousedown.advanced_select', handleMouseWhenDropDownOpened);
						console.log(scope.fakeSelect.element.offset().top,
							scope.fakeSelect.element.outerHeight(),
							$(window).scrollTop(),
							document.documentElement.clientHeight
						);
						scope.fakeSelect.dropDownOpened();
					} else {
						$(document).unbind('mousedown.advanced_select')
						           .unbind('keydown.advanced_select');
						scope.search = '';
					}
				});

				attrs.$observe('disabled', function(disabled) {
					scope.disabled = disabled;
				});

				scope.$watch(attrs.ngModel, function(ngModel) {
					console.log(attrs.id, ':', ngModel)
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
							e.preventDefault();
							e.stopPropagation();
							scope.dropDownOpen = false;
							scope.$apply();
							break;
						case 38: // Up
							e.preventDefault();
							e.stopPropagation();
							scope.highlightPrevious();
							scope.$apply();
							break;
						case 40: // Down
							e.preventDefault();
							e.stopPropagation();
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
						if (groupBy != null) {
							scope.options = [];
							var groups = {};

							angular.forEach(items, function(item) {
								var groupByName = groupByFn(scope, item) || '';
								if (!angular.isDefined(groups[groupByName])) {
									groups[groupByName] = [];
								}
								groups[groupByName].push({ target: item, label: labelFn(scope, item) });
							});

							angular.forEach(groups, function(subitems, groupName) {
								scope.options.push({
									target: null,
									label: groupName,
									children: subitems
								});
							});

						} else {
							scope.options = [];
							angular.forEach(items, function(item) {
								scope.options.push({
									target: item,
									label: labelFn(scope, item)
								});
							});
							scope.updateSelection(getNgModel(scope));
						}
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
