angular.module('vd.directive.advanced_select', [])
	/**
	 * Directive that transform a regular <select> element into an advanced select
	 */
	.directive('advanced', function($compile) {
		return {
			restrict: 'A',
			require: ['select', 'ngModel'],
			link: function(scope, select, attrs) {
				// Creates the Advanced Select using the second directive
				var el;
				if (attrs.multiple) {
					el = angular.element('<advanced-select advanced-select-multiple config="'+attrs.advanced+'" class="'+attrs.class+'" ng-model="'+attrs.ngModel+'" options="'+attrs.ngOptions+'"></advanced-select>');
				} else {
					el = angular.element('<advanced-select advanced-select-simple config="'+attrs.advanced+'" class="'+attrs.class+'" ng-model="'+attrs.ngModel+'" options="'+attrs.ngOptions+'"></advanced-select>');
				}
				
				if (angular.isDefined(attrs.disabled)) {
					el.attr('disabled', attrs.disabled);
				}
				if (angular.isDefined(attrs.placeholder)) {
					el.attr('placeholder', attrs.placeholder);
				}

				if (angular.isDefined(attrs.tabindex)) {
					el.attr('tabindex', attrs.tabindex);
				}

				// Hide the select, add the Advanced Select to the DOM and compile it
				select.css('display', 'none');
				select.after(el);
				$compile(el)(scope);
			}
		};
	})
	/**
	 * Base directive for creating an advanced select
	 */
	.directive('advancedSelect', function($parse, $filter, $timeout) {
		                       //0000111110000000000022220000000000000000000000333300000000000000444444444444444440000000005555555555555555500000006666666666666666600000000000000077770
		var NG_OPTIONS_REGEXP = /^\s*(.*?)(?:\s+as\s+(.*?))?(?:\s+group\s+by\s+(.*))?\s+for\s+(?:([\$\w][\$\w\d]*)|(?:\(\s*([\$\w][\$\w\d]*)\s*,\s*([\$\w][\$\w\d]*)\s*\)))\s+in\s+(.*)$/;

		return {
			restrict: 'E',
			require: 'ngModel',
			scope: true,
			controller: ['$scope', '$element', '$attrs', function($scope, $element, $attrs) {
				// The list of options
				$scope.options = [];

				// The lift of filtered options (for performance)
				$scope.filteredOptions = [];

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
				$scope.search = { label: '' };

				$scope.config = null;

				$scope.dropDownIsOnTop = false;

				$scope.setFilteredOptions = function() {
					if ($scope.config == null || $scope.search.label.length >= $scope.config.searchMinChars) {
						$scope.filteredOptions = $filter('filter')($scope.options, $scope.search);
					} else {
						$scope.filteredOptions = [];
					}
				}

				/**
				 * Get the filtered options
				 * @return the filtered options
				 */
				$scope.getFilteredOptions = function() {
					return $scope.filteredOptions;
					//return $filter('filter')($scope.options, $scope.search);
				}

				/**
				 * Highlight the given option
				 * @param option : the option to highlight
				 */
				$scope.highlight = function(option) {
					if (!option) {
						return;
					}
					// Unhighlight the previous highlighted option, if exists
					if ($scope.highlighted) {
						$scope.highlighted.highlighted = false;
					}

					// Highlight the given option
					option.highlighted = true;
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
						options = $scope.getFilteredOptions();
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
						options = $scope.getFilteredOptions();
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
						options = $scope.getFilteredOptions();
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
						options = $scope.getFilteredOptions();
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
						options = $scope.getFilteredOptions();
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

				/**
				 * Update the label of the select according to the model
				 * @param ngModel : the model to use to update the label
				 * @param options : the list of options
				 */
				$scope.updateSelection = function(ngModel, options) {
					var options = angular.isDefined(options) ? options : $scope.getFilteredOptions();
					for(var i=0, n = options.length; i < n; i++) {
						var r = options[i];
						if (r.value == ngModel) {
							$scope.select(r, false, false);
							return;
						}
						if (r.children) {
							$scope.updateSelection(ngModel, r.children);
						}
					}
				};
			}],
			link: function(scope, element, attrs) {
				// ngModel
				var getNgModel = $parse('$parent.'+attrs.ngModel);
				var setNgModel = getNgModel.assign;

				scope.setNgModel = setNgModel;
				scope.getNgModel = getNgModel;

				var labelFn = $parse("label"),
				    item = "item",
				    optionsModel = null,
				    groupBy = null,
				    groupByFn = null,
				    value=null,
				    valueFn=null;
				

				scope.dropDownElement = element.find('.advanced-select-drop');
				if (attrs.config) {
					scope.config = scope.$eval(attrs.config);
					if (typeof(scope.config) == 'string') {
						scope.config = $parse('$parent.'+config)();
					}
				}

				if (attrs.options) {
					var match = attrs.options.match(NG_OPTIONS_REGEXP),
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
					    optionsModel = match[7];
					
					fillInResultsFromNgOptions();
				} else {
					fillInResultsFromSelect();
				}

				if (attrs.tabindex) {
					element.attr('tabindex', -1);
					scope.tabIndex = attrs.tabindex;
				}

				/**
				 * Method called when the dropdown is just opened
				 */
				scope.DropDownOpened = function() {

					// Highlight the selected option if any
					if (scope.selected) {
						scope.highlight(scope.selected);
					}

					// Adjust the position of the dropdown according to the available space
					if (element.offset().top + element.outerHeight() + scope.dropDownElement.outerHeight() 
							<= $(window).scrollTop() + document.documentElement.clientHeight) {
						scope.dropDownElement.find('.results').before(scope.dropDownElement.find('.search').detach());
					} else {
						scope.dropDownElement.find('.results').after(scope.dropDownElement.find('.search').detach());
					}

					// Set the focus on the input
					scope.dropDownElement.find('input').focus();
				}

				/* Wachtes and observes */
				scope.$watch('dropDownOpen', function() {
					if (scope.dropDownOpen) {
						scope.setFilteredOptions();
						
						$(document).bind('keydown.advanced_select', handleKeysWhenDropDownOpened)
						           .bind('mousedown.advanced_select', handleMouseWhenDropDownOpened);
						
						scope.dropDownElement.detach();
						$('body').append(scope.dropDownElement);

						// Adjust the position of the dropdown according to the available space
						if (element.offset().top + element.outerHeight() + scope.dropDownElement.outerHeight() 
							<= $(window).scrollTop() + document.documentElement.clientHeight) {
							// bottom

							scope.dropDownIsOnTop = false;

							scope.dropDownElement.css({
								'position': 'absolute',
								'width': element.outerWidth()
							});

							scope.adjustDropDownPosition();
							
							element.removeClass('top');
							scope.dropDownElement.removeClass('top');
						} else {
							// top

							scope.dropDownIsOnTop = true;

							scope.dropDownElement.css({
								'position': 'absolute',
								'width': element.outerWidth()
							});

							scope.adjustDropDownPosition();

							element.addClass('top');
							scope.dropDownElement.addClass('top');
						}

						scope.DropDownOpened();


						if (!scope.hasHighlighted()) {
							scope.highlightFirst();
						}

						if (scope.highlighted) {
							scope.highlighted.makeVisible('middle');
						}
						
					} else {
						$(document).unbind('mousedown.advanced_select')
						           .unbind('keydown.advanced_select');
						scope.search.label = '';

						scope.dropDownElement.detach();
						element.append(scope.dropDownElement);
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

				scope.$watch('search.label', function() {
					
					if (scope.timeout) {
						clearTimeout(scope.timeout);
					}

					scope.timeout = setTimeout(function() {
						scope.setFilteredOptions();
						scope.$apply();
						scope.timeout = null;
					}, 10);
					
					$timeout(function() {
						scope.adjustDropDownPosition();
					});
					
				});

				scope.adjustDropDownPosition = function() {
					if (!scope.dropDownIsOnTop) {
						scope.dropDownElement.offset({ 
							left: element.offset().left,
							top: element.offset().top + element.height()
						}); 	
					} else {
						scope.dropDownElement.offset({ 
							left: element.offset().left,
							top: element.offset().top - scope.dropDownElement.outerHeight()
						}); 
					}
				}

				function handleMouseWhenDropDownOpened(e) {
					var container = angular.element(e.target).parents('.advanced-select-container');
					var drop = angular.element(e.target).parents('.advanced-select-drop');
					e.stopPropagation();
					e.preventDefault();
					if (container.length == 0 && drop.length == 0) {
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
				 *
				 * each option is an object with 3 or 4 keys :
				 *   - target : the scope of the select option
				 *   - label : the text to display in the list
				 *   - value : the value used to update the model
				 *   - children (optional) : an array of sub options 
				 */
				function fillInResultsFromNgOptions() {
					scope.$watch(optionsModel, function(items) {
						if (groupBy != null) {
							scope.options = [];
							var groups = {};

							angular.forEach(items, function(item) {
								var item = { 'item': item };

								var groupByName = groupByFn(item);
								if (!angular.isDefined(groups[groupByName])) {
									groups[groupByName] = [];
								}
								
								groups[groupByName].push({ 
									target: item.item, 
									value: valueFn(item),
									label: labelFn(item)
								});
							});

							angular.forEach(groups, function(subitems, groupName) {
								scope.options.push({
									target: null,
									label: groupName,
									value: null,
									children: subitems
								});
							});
						} else {
							scope.options = [];

							angular.forEach(items, function(item) {
								var item = { 'item': item };
								scope.options.push({
									target: item.item,
									value: valueFn(item),
									label: labelFn(item )
								});
							});
							
						}

						//scope.setFilteredOptions();
						
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
					//scope.setFilteredOptions();
				}
			}
		};
	})
	/**
	 * Directive to make an advanced select with single selection
	 */ 
	.directive('advancedSelectSimple', function($parse) {
		return {
			restrict: 'A',
			require: 'advancedSelect',
			scope: true,
			link: function(scope, element, attrs) {
				/**
				 * Select an options (and highlight it for future) and eventually update the model
				 * and set the focus on the select
				 * @param option : the option to select
				 * @param updateModel : if the method must update the model
				 * @param focus : if the method must set the focus on the select
				 */
				scope.select = function(option, updateModel, focus) {
					scope.selected = option;
					scope.highlight(option);

					// Set the focus
					if (angular.isDefined(focus) && focus) {
						element.find('a').focus();
					}
					
					// Update the model
					if (angular.isUndefined(updateModel) || updateModel) {
						scope.setNgModel(scope, option.value);
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
					'<div class="loading" ng-show="options.length == 0"></div>' +
				'</a>'+
				'<div class="advanced-select-drop" ng-show="dropDownOpen">'+
					'<div class="search">'+
						'<input type="text" ng-model="search.label" autocomplete="off" class="advanced-select-input" tabindex="-1" />'+
					'</div>'+
					'<ul class="results">'+
						'<li advanced-select-option class="advanced-select-result advanced-select-result-selectable" ng-repeat="item in filteredOptions"  ng-class="{ \'with-children\': item.children.length > 0 }">'+
							'<div advanced-select-item '+
							     'class="label" '+
							     'ng-bind="item.label" ' + 
							     'ng-click="select(item, true, true)" '+
							     'ng-mouseover="highlight(item, this)">'+
							'</div>'+
							'<ul>'+
								'<li advanced-select-option class="advanced-select-result" ng-repeat="item in item.children">'+
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
				'</div>'+
			'</div>'
		};
	})
	/**
	 * Directive to make an advanced select with multiple selection
	 */
	.directive('advancedSelectMultiple', function($parse, $filter, $timeout) {
		return {
			restrict: 'A',
			require: 'advancedSelect',
			replace: true,
			scope: true,
			controller: function($scope) {
				/**
				 * Update the label of the select according to the model
				 * @param ngModel : the model to use to update the label
				 * @param options : the list of options
				 */
				$scope.updateSelection = function(ngModel, options) {
					var options = angular.isDefined(options) ? options : $scope.getFilteredOptions();
					for(var i=0, n = options.length; i < n; i++) {
						var r = options[i];
						for(var j=0, m=ngModel.length; j < m; j++) {
							if (r.value == ngModel[j]) {
								$scope.select(r, false, false);
							}
						}
						if (r.children) {
							$scope.updateSelection(ngModel, r.children);
						}
					}
				};

				/**
				 * Update the filtered options
				 */
				$scope.setFilteredOptions = function() {
					$scope.filteredOptions = $filter('filter')($filter('exclude')($scope.options, $scope.selected), $scope.search);
				}

				/**
				 * Get the filtered options
				 * @return the filtered options
				 */
				$scope.getFilteredOptions = function() {
					return $scope.filteredOptions;
				}
			},
			link: function(scope, element, attrs) {
				// There may be more than one selected value
				scope.selected = [];

				// Add a specific class on the main container when the input has the focus
				element.find('input').bind('focus', function(e) {
					element.addClass('focus')
				}).bind('blur', function(e) {
					element.removeClass('focus');
				});

				scope.$watch('selected.length', function() {
					scope.setFilteredOptions();
				});

				// Adjust the size of the input to take the available space
				$timeout(function() {
					adjustSearchInputWidth();
				});

				element.find('input').bind('keydown.advanced_select_multiple', handleKeys);
				function handleKeys(e) {
					switch(e.keyCode) {
						case 8: // Backspace
							if (scope.search.label == '') {
								scope.unselectLast(e);
								scope.$apply();
							}
							break;
					}
				} 

				/**
				 * check if a value exists in a given array
				 * @param array : the array
				 * @param value : the value to search in the array
				 */
				function exists(array, value) {
					for(var i=0, n=array.length; i < n; i++) {
						if (array[i] == value) {
							return true;
						}
					}
				}

				/**
				 * Push a value in the array if the value is not already in it
				 * @param array : the array
				 * @param value : the value to add
				 */
				function pushOnce(array, value) {
					if (!exists(array, value)) {
						array.push(value);
					}
				}

				/**
				 * Select a value by adding it in the array
				 * @param option : the option to select
				 * @param updateModel : if the method must update the model
				 * @param focus : if the method must set the focus on the select
				 */
				scope.select = function(option, updateModel, focus) {
					pushOnce(scope.selected, option);
					
					// Set the focus
					if (angular.isDefined(focus) && focus) {
						element.find('.advanced-select-choices input').focus();
					}
					
					// Update the model
					if (angular.isUndefined(updateModel) || updateModel) {
						var m = scope.getNgModel(scope);
						pushOnce(m, option.value);
						scope.setNgModel(scope, m);
					}

					$timeout(function() {
						adjustSearchInputWidth();
					});
					
					// Hide the drop down
					scope.dropDownOpen = false;
				};

				/**
				 * Method called when dropdown is just opened
				 */
				scope.DropDownOpened = function() {
					//
					element.find('input').focus();

					// Adjust the position of the dropdown according to the available space
					if (element.offset().top + element.outerHeight() + scope.dropDownElement.outerHeight() 
							<= $(window).scrollTop() + document.documentElement.clientHeight) {
						element.removeClass('top');
					} else {
						element.addClass('top');
					}
				};

				/**
				 * Unselect the last value
				 * @param e : the source event if any
				 */
				scope.unselectLast = function(e) {
					scope.unselect( scope.selected.length-1, e)
				};

				/**
				 * Unselect the choice at a given index
				 * @param index : the index of the item to unselect
				 * @param e : the source event if any
				 */
				scope.unselect = function(index, e) {
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

				/**
				 * Get the placeholder value (empty if there is at least a selected value)
				 */
				scope.getPlaceholder = function() {
					return scope.selected.length ? '' : scope.placeholder;
				};

				/**
				 * Adjust the size of the search input according to the available space
				 */
				function adjustSearchInputWidth() {
					var lastSelected = element.find('.advanced-select-choices li:not(.search)').last();
					if (lastSelected.length) {
						var width = element.find('.advanced-select-choices').width() - (lastSelected.offset().left + lastSelected.outerWidth());
						element.find('.search').width(width);
					} else {
						element.find('.search').width(element.find('.advanced-select-choices').innerWidth());
					}
				}
			},
			template: 
			'<div class="advanced-select-container" ng-class="{ \'advanced-select-dropdown-open\': dropDownOpen, \'disabled\': disabled }">'+
				'<ul class="advanced-select-choices" ng-click="dropDownOpen=(!disabled && !dropDownOpen)">'+
					'<li advanced-select-option ng-repeat="item in selected">'+
						'<div ng-bind="item.label"></div>'+
						'<a href="javascript:void(0)" ng-click="unselect($index, $event)" tabindex="-1"></a>'+
					'</li>'+
					'<li class="search">'+
						'<input type="text" autocomplete="off" autocorrect="off" tabIndex="tabIndex" ng-change="dropDownOpen=(!disabled)" ng-model="search.label" placeholder="{{ getPlaceholder() }}" />'+
					'</li>'+
				'</ul>'+
				'<div class="advanced-select-drop" ng-show="dropDownOpen">'+
					'<ul class="results">'+
						'<li advanced-select-option class="advanced-select-result advanced-select-result-selectable" ng-repeat="item in filteredOptions"  ng-class="{ \'with-children\': item.children.length > 0 }">'+
							'<div advanced-select-item '+
							     'class="label" '+
							     'ng-bind="item.label" '+ 
							     'ng-click="select(item, true, true)" '+
							     'ng-mouseover="highlight(item, this)">'+
							'</div>'+
							'<ul>'+
								'<li advanced-select-option class="advanced-select-result" ng-repeat="item in item.children">'+
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
	.directive('advancedSelectOption', function() {
		return {
			restrict: 'A',
			scope: true,
			link: function(scope, element) {
				var label = element.find('.label');

				/**
				 * Scroll the list to make visible the option
				 * @param position : 'middle' or 'none'
				 */
				scope.$parent.item.makeVisible = function(position) {
					var position = angular.isDefined(position) ? position : 'none';
					var top = 0;

					if (element.position().top < 0) {
						top = element.parent().scrollTop() + element.position().top;
						if (position == 'middle') {
							top -= (element.parent().height()/2.0 - element.outerHeight()/2.0);
						}
						element.parent().scrollTop(top);
					} else if (element.position().top + element.outerHeight() > element.parent().height()) {
						top = element.parent().scrollTop() + (element.position().top + element.outerHeight() - element.parent().height());
						if (position == 'middle') {
							top += (element.parent().height()/2.0 + element.outerHeight()/2.0);
						}
						element.parent().scrollTop(top);
					}
				};

				// Make the option visible when highlighted
				scope.$watch('item.highlighted', function(highlighted) {
					if (highlighted) {
						scope.item.makeVisible();
						element.addClass('advanced-select-highlighted');
						label.addClass('advanced-select-highlighted');
					} else {
						element.removeClass('advanced-select-highlighted');
						label.removeClass('advanced-select-highlighted');
					}
				});
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
	});
