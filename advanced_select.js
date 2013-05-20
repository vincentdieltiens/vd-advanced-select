angular.module('vd.directive.advanced_select', [])
	.directive('advanced', function($compile) {
		return {
			restrict: 'A',
			require: '^ngModel',
			controller: function() {

			},
			link: function(scope, select, attrs) {

				// Creates the Advanced Select using the second directive
				var el;

				if (attrs.multiple) {
					var el = angular.element('<advanced-select advanced-select-multiple class="'+attrs.class+'" ng-model="'+attrs.ngModel+'" options="'+attrs.ngOptions+'"></advanced-select>');
				} else {
					var el = angular.element('<advanced-select advanced-select-simple class="'+attrs.class+'" ng-model="'+attrs.ngModel+'" options="'+attrs.ngOptions+'"></advanced-select>');
				}
				
				if (angular.isDefined(attrs.disabled)) {
					el.attr('disabled', attrs.disabled);
				}
				if (angular.isDefined(attrs.placeholder)) {
					el.attr('placeholder', attrs.placeholder);
				}

				// Hide the select, add the Advanced Select to the DOM and compile it
				select.css('display', 'none');
				select.after(el);
				$compile(el)(scope);
			}
		};
	})
	.filter('exclude', function() {
		return function(list, excludes, valueFn) {
			var valueFn = angular.isDefined(valueFn) ? valueFn : function(value) { return value; };
			var excludeValues = [];
			angular.forEach(excludes, function(exclude) {
				excludeValues.push(valueFn(exclude.target));
			})

			var newList = [];
			angular.forEach(list, function(item) {
				var isExcluded = false;
				var value = valueFn(item.target);
				angular.forEach(excludeValues, function(excludeValue) {
					if (excludeValue == value) {
						isExcluded = true;
					}
				});

				if (!isExcluded) {
					newList.push(item);
				}
			});
			return newList;
		}
	})
	.directive('advancedSelectMultiple', function($parse, $filter, $timeout) {
		return {
			restrict: 'A',
			require: 'advancedSelect',
			replace: true,
			scope: true,
			link: function(scope, element, attrs) {
				scope.selected = [];

				element.find('input').bind('focus', function(e) {
					element.addClass('focus')
				}).bind('blur', function(e) {
					element.removeClass('focus');
				});

				element.find('input').bind('keydown.advanced_select_multiple', handleKeys);

				function handleKeys(e) {
					switch(e.keyCode) {
						case 8: // Backspace
							if (scope.search == '') {
								scope.unselectLast(e);
								scope.$apply();
							}
							break;
					}
				} 

				function exists(array, newValue) {
					for(var i=0, n=array.length; i < n; i++) {
						var value = array[i];
						if (array[i] == newValue) {
							return true;
						}
					}
				}

				function pushOnce(array, newValue) {
					if (!exists(array, newValue)) {
						array.push(newValue);
					}
				}

				scope.select = function(item, updateModel, focus) {
					//scope.selected = angular.extend(scope.selected, [item]);
					pushOnce(scope.selected, item);
					scope.highlight(item);

					// Set the focus
					if (angular.isDefined(focus) && focus) {
						element.find('.advanced-select-choices').focus();
					}
					
					// Update the model
					if (angular.isUndefined(updateModel) || updateModel) {
						var m = scope.getNgModel(scope);
						pushOnce(m, scope.valueFn(item.target));
						scope.setNgModel(scope, m);
					}

					$timeout(function() {
						adjustSearchInputWidth();
					});
					

					// Hide the drop down
					scope.dropDownOpen = false;
				};

				scope.updateSelection = function(ngModel, results) {
					var results = angular.isDefined(results) ? results : $filter('filter')(scope.options, scope.search);
					for(var i=0, n = results.length; i < n; i++) {
						var r = results[i];
						var value = scope.valueFn(r.target);
						for(var j=0, m=ngModel.length; j < m; j++) {
							if (value == ngModel[j]) {
								scope.select(r, false, false);
							}
						}
						
						if (r.children) {
							scope.updateSelection(ngModel, r.children);
						}
					}
				};

				scope.DropDownOpened = function() {
					element.find('input').focus();
					if (element.offset().top + element.outerHeight() + element.find('.advanced-select-drop').outerHeight() 
							<= $(window).scrollTop() + document.documentElement.clientHeight) {
						element.removeClass('top');
					} else {
						element.addClass('top');
					}
				};

				scope.unselectLast = function(e) {
					scope.unselect(null, scope.selected.length-1, e)
				};

				scope.unselect = function(choice, index, e) {
					if (e) {
						e.preventDefault();
						e.stopPropagation();
					}

					var m = scope.getNgModel(scope);
					m.splice(index, 1);
					scope.setNgModel(scope, m);

					scope.selected.splice(index, 1);
					scope.dropDownOpen = false;
					element.find('input').focus();

					$timeout(function() {
						adjustSearchInputWidth();
					});
				};

				function adjustSearchInputWidth() {
					var lastSelected = element.find('.advanced-select-choices li:not(.search)').last();
					var width = element.width() - (lastSelected.offset().left + lastSelected.outerWidth());
					element.find('input').width(width);
				}
			},
			template: 
			'<div class="advanced-select-container" ng-class="{ \'advanced-select-dropdown-open\': dropDownOpen, \'disabled\': disabled }">'+
				'<ul class="advanced-select-choices" ng-click="dropDownOpen=(!disabled && !dropDownOpen)">'+
					'<li ng-repeat="choice in selected">'+
						'<div ng-bind="choice.label"></div>'+
						'<a href="javascript:void(0)" ng-click="unselect(choice, $index, $event)" tabindex="-1"></a>'+
					'</li>'+
					'<li class="search">'+
						'<input type="text" autocomplete="off" autocorrect="off" tabIndex="tabIndex" ng-change="dropDownOpen=(!disabled)" ng-model="search" />'+
					'</li>'+
				'</ul>'+
				'<div class="advanced-select-drop" ng-show="dropDownOpen">'+
					'<ul class="results">'+
						'<li class="advanced-select-result advanced-select-result-selectable" ng-repeat="item in options | exclude:selected:valueFn | filter:search"  ng-class="{ \'with-children\': item.children.length > 0 }">'+
							'<div advanced-select-item '+
							     'class="label" '+
							     'ng-bind="item.label" ' + 
							     'ng-class="{ \'advanced-select-highlighted\': item.highlighted == true }" '+ 
							     'ng-click="select(item, true, true)" '+
							     'ng-mouseover="highlight(item, this)">'+
							'</div>'+
							'<ul>'+
								'<li class="advanced-select-result" ng-repeat="sub in item.children"  ng-class="{ \'advanced-select-highlighted\': sub.highlighted == true }">'+
									'<div class="label" '+
									     'ng-bind="sub.label" '+
									     'ng-click="select(sub, true, true)" '+
									     'ng-class="{ \'advanced-select-highlighted\': sub.highlighted == true }" '+
									     'ng-mouseover="highlight(sub)">'+
									'</div>'+
								'</li>'+
							'</ul>'+
						'</li>'+
					'</ul>'+
				'</div>'+
			'</div>'
		};
	})
	.directive('advancedSelectSimple', function($parse, $filter) {
		return {
			restrict: 'A',
			require: 'advancedSelect',
			scope: true,
			link: function(scope, element, attrs) {
				scope.select = function(item, updateModel, focus) {
					scope.selected = item;
					scope.highlight(item);

					// Set the focus
					if (angular.isDefined(focus) && focus) {
						element.find('a').focus();
					}
					
					// Update the model
					if (angular.isUndefined(updateModel) || updateModel) {
						scope.setNgModel(scope, scope.valueFn(item.target));
					}

					// Hide the drop down
					scope.dropDownOpen = false;
				};
			},
			replace: true,
			template: 
			'<div class="advanced-select-container" ng-class="{ \'advanced-select-dropdown-open\': dropDownOpen, \'disabled\': disabled }">'+
				'<a href="javascript:void(0)" ng-click="dropDownOpen=(!disabled && !dropDownOpen)" class="advanced-select-choice" tabindex="tabIndex">'+
					'<span ng-bind="selected.label || placeholder" ng-class="{ \'placeholder\': selected == null }"></span>'+
						'<abbr class="advanced-select-search-choice-close" style="display: none;"></abbr>'+
						'<div class="arrow"><b></b></div>'+
				'</a>'+
				'<div class="advanced-select-drop" ng-show="dropDownOpen">'+
					'<div class="search">'+
						'<input type="text" ng-model="search" autocomplete="off" class="advanced-select-input" tabindex="-1" />'+
					'</div>'+
					'<ul class="results">'+
						'<li class="advanced-select-result advanced-select-result-selectable" ng-repeat="item in options | filter:search"  ng-class="{ \'with-children\': item.children.length > 0 }">'+
							'<div advanced-select-item '+
							     'class="label" '+
							     'ng-bind="item.label" ' + 
							     'ng-class="{ \'advanced-select-highlighted\': item.highlighted == true }" '+ 
							     'ng-click="select(item, true, true)" '+
							     'ng-mouseover="highlight(item, this)">'+
							'</div>'+
							'<ul>'+
								'<li class="advanced-select-result" ng-repeat="sub in item.children"  ng-class="{ \'advanced-select-highlighted\': sub.highlighted == true }">'+
									'<div class="label" '+
									     'ng-bind="sub.label" '+
									     'ng-click="select(sub, true, true)" '+
									     'ng-class="{ \'advanced-select-highlighted\': sub.highlighted == true }" '+
									     'ng-mouseover="highlight(sub)">'+
									'</div>'+
								'</li>'+
							'</ul>'+
						'</li>'+
					'</ul>'+
				'</div>'+
			'</div>'
		}
	})
	.directive('advancedSelect', function($parse, $filter) {
		                       //0000111110000000000022220000000000000000000000333300000000000000444444444444444440000000005555555555555555500000006666666666666666600000000000000077770
		var NG_OPTIONS_REGEXP = /^\s*(.*?)(?:\s+as\s+(.*?))?(?:\s+group\s+by\s+(.*))?\s+for\s+(?:([\$\w][\$\w\d]*)|(?:\(\s*([\$\w][\$\w\d]*)\s*,\s*([\$\w][\$\w\d]*)\s*\)))\s+in\s+(.*)$/;

		return {
			restrict: 'E',
			require: '^ngModel',
			scope: true,
			controller: ['$scope', '$element', '$attrs', function($scope, $element, $attrs) {
				// The list of options
				$scope.options = [];

				// Is the DropDown open or not ?
				$scope.dropDownOpen = false;

				// Which option is highlighted ?
				$scope.highlighted = null;

				// Which options is selected ?
				$scope.selected = null;

				// Is the advanced select disabled ?
				$scope.disabled = false;

				// What's the placeholder ?
				$scope.placeholder = $attrs.placeholder;

				// The model of the search box
				$scope.search = '';

				/**
				 * Highlight the given option
				 * @param option : the option to highlight
				 */
				$scope.highlight = function(option) {
					// Unhighlight the previous highlighted option, if exists
					if ($scope.highlighted) {
						$scope.highlighted.highlighted = false;
					}

					// Highlight the given option
					option.highlighted = true,
					$scope.highlighted = option;
				};

				/**
				 * Highlight the previous option in the given list of options
				 * @param options (optional) : the list of options. If not 
				 *      options given, the global options are used
				 * @param highlightPrevious (optional) : if true, the next 
				 *      item (which is the previous option) will be highlighted
				 */
				$scope.highlightPrevious = function(options, highlightPrevious) {
					if (angular.isUndefined(options) || options == null) {
						options = $filter('filter')($scope.options, $scope.search);
					}

					var res = {
						jobDone: false,
						highlightPrevious: angular.isDefined(highlightPrevious) ? highlightPrevious : false
					};

					for(var i=options.length-1; i >= 0; i--) {
						var r = options[i];

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

				/**
				 * Highlight the next option in the given list of options
				 * @param options (optional) : the list of options. If not 
				 *      options given, the global options are used
				 * @param highlightNext (optional) : if true, the next 
				 *      item (which is the next option) will be highlighted
				 */
				$scope.highlightNext = function(options, highlightNext) {
					// Walks into the list of optins (options). When an highlighted item
					// is found, set the marker "res.highlightNext" as true.
					// At each step of the loop, if "res.highlightNext" is true, highlight the item and stop
					// the loop with res.jobDone = true

					if (angular.isUndefined(options) || options == null) {
						options = $filter('filter')($scope.options, $scope.search);
					}

					var res = {
						jobDone: false,
						highlightNext: angular.isDefined(highlightNext) ? highlightNext : false
					};

					for(var i=0, n=options.length; i < n; i++) {
						var r = options[i];
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

				/**
				 * Highlight the first options in the given option's list
				 * @param options (optional) : the list of options. If not 
				 *      options given, the global options are used
				 */
				$scope.highlightFirst = function(options) {
					if (angular.isUndefined(options) || options == null) {
						options = $filter('filter')($scope.options, $scope.search);
					}
					$scope.highlight(options[0]);
				}

				/**
				 * Highlight the last options in the given option's list
				 * @param options (optional) : the list of options. If not 
				 *      options given, the global options are used
				 */
				$scope.highlightLast = function(options) {
					if (angular.isUndefined(options) || options == null) {
						options = $filter('filter')($scope.options, $scope.search);
					}
					$scope.highlight(options[options.length-1]);
				}

				/**
				 * Get if the given list of options has a highlighted option
				 * @param options : the list of options
				 * @return true if there is a highlighted option, false
				 *      otherwise
				 */
				$scope.hasHighlighted = function(options) {
					if ($scope.highlighted == null) {
						return false;
					}
					if (angular.isUndefined(options) || options == null) {
						options = $filter('filter')($scope.options, $scope.search);
					}
					for(var i=0, n = options.length; i < n; i++) {
						var r = options[i];

						if (r.highlighted) {
							return true;
						}

						if (r.children && $scope.hasHighlighted(r.children)) {
							return true;
						}
					}
					return false;
				};
			}],
			link: function(scope, element, attrs) {
				// ngModel
				var getNgModel = $parse('$parent.'+attrs.ngModel);
				var setNgModel = getNgModel.assign;

				var labelFn = $parse("label"),
				    item = "item",
				    optionsModel = null,
				    groupBy = null,
				    objects = []
				    value = [];

				if (attrs.options) {
					var match = attrs.options.match(NG_OPTIONS_REGEXP),
					    item = match[4] || match[6],
					    //
					    label = (match[2] || match[1]).replace(new RegExp(item), ''),
					    labelExp = label.replace(new RegExp('^\.'), ''),
					    labelFn = labelExp ? $parse(labelExp) : function(s, value) { return value },
					    //
					    value = match[2] ? match[1].replace(new RegExp(item + '\.?'), '') : null,
					    valueFn = value ? $parse(value) : function(value) { return value },
					    //
					    groupBy = match[3] ? match[3].replace(new RegExp(item + '\.?'), '') : null,
					    groupByFn = $parse((match[3] || '').replace(new RegExp(item + '\.?'), '')),
					    optionsModel = match[7];
					fillInResultsFromNgOptions();
				} else {
					fillInResultsFromSelect();
				}

				scope.valueFn = valueFn;
				scope.setNgModel = setNgModel;
				scope.getNgModel = getNgModel;

				scope.updateSelection = function(ngModel, results) {
					var results = angular.isDefined(results) ? results : $filter('filter')(scope.options, scope.search);
					for(var i=0, n = results.length; i < n; i++) {
						var r = results[i];
						if (valueFn(r.target) == ngModel) {
							scope.select(r, false, false);
							return;
						}
						if (r.children) {
							scope.updateSelection(ngModel, r.children);
						}
					}
				};

				scope.DropDownOpened = function() {
					element.find('input').focus();
					if (element.offset().top + element.outerHeight() + element.find('.advanced-select-drop').outerHeight() 
							<= $(window).scrollTop() + document.documentElement.clientHeight) {
						element.removeClass('top');
						element.find('.results').before(element.find('.search').detach());
					} else {
						element.addClass('top');
						element.find('.results').after(element.find('.search').detach());
					}
				}

				scope.$watch('dropDownOpen', function() {
					if (scope.dropDownOpen) {
						$(document).bind('keydown.advanced_select', handleKeysWhenDropDownOpened)
						           .bind('mousedown.advanced_select', handleMouseWhenDropDownOpened);
						
						scope.DropDownOpened();

						if (!scope.hasHighlighted()) {
							scope.highlightFirst();
						}
						
					} else {
						$(document).unbind('mousedown.advanced_select')
						           .unbind('keydown.advanced_select');
						scope.search = '';
					}
				});

				attrs.$observe('disabled', function(disabled) {
					scope.disabled = disabled;
				});

				attrs.$observe('placeholder', function(placeholder) {
					scope.placeholder = placeholder;
				});

				scope.$watch(attrs.ngModel, function(ngModel) {
					if (ngModel != null) {
						scope.updateSelection(ngModel);
					}
				}, true);

				function handleMouseWhenDropDownOpened(e) {
					var container = angular.element(e.target).parents('.advanced-select-container');
					if (container.length == 0 || container[0] != element.get(0)) {
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
							if (!scope.highlightPrevious().jobDone) {
								scope.highlightLast();
							}
							scope.$apply();
							break;
						case 40: // Down
							e.preventDefault();
							e.stopPropagation();
							if (!scope.highlightNext().jobDone) {
								scope.highlightFirst();
							}
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
							
						}
						
						if ((modelValue = getNgModel(scope)) != null) {
							scope.updateSelection(modelValue);
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
		}
	});
