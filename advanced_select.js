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
		//var NG_OPTIONS_REGEXP = /^\s*(.*?)(?:\s+as\s+(.*?))?(?:\s+group\s+by\s+(.*))?\s+for\s+(?:([\$\w][\$\w\d]*)|(?:\(\s*([\$\w][\$\w\d]*)\s*,\s*([\$\w][\$\w\d]*)\s*\)))\s+in\s+(.*)$/;
		var NG_OPTIONS_REGEXP = /^\s*(.*?)(?:\s+as\s+(.*?))?(?:\s+group\s+by\s+(.*))?\s+for\s+(?:([\$\w][\$\w\d]*)|(?:\(\s*([\$\w][\$\w\d]*)\s*,\s*([\$\w][\$\w\d]*)\s*\)))\s+in\s+(.*?)(?:\s+track\s+by\s+(.*?))?$/;

		var openedAdvancedSelect = null;

		return {
			restrict: 'E',
			require: 'ngModel',
			scope: true,
			controller: ['$scope', '$element', '$attrs', function($scope, $element, $attrs) {
				// Which option is highlighted ?
				$scope.highlighted = null;

				// Which options is selected ?
				$scope.selected = null;

				// Is the DropDown open or not ?
				$scope.dropDownOpen = false;

				$scope.placeholder = $attrs.placeholder;

				$scope.required = $attrs.required;

				// The model of the search box
				$scope.search = { label: '' };

				$scope.options = [];

				// The lift of top filtered options (for performance)
				$scope.filteredTopOptions = [];

				// The lift of filtered options (for performance)
				$scope.filteredOptions = [];

				$scope.dropDownElement = null;

				$attrs.$observe($attrs.required, function() {
					$scope.required = $attrs.required
				});
					

				/**
				 * Highlight the given option
				 * @param option : the option to highlight
				 */
				$scope.highlight = function(option) {
					if (!option) {
						return;
					}
					// Unhighlight the previous highlighted option, if exists
					/*if ($scope.highlighted) {
						$scope.highlighted.highlighted = false;
					}*/
					$scope.unhighlight($scope.highlighted);

					// Highlight the given option
					option.highlighted = true;
					$scope.highlighted = option;
				};

				/**
				 * Unhighlight the given option
				 * @param option : the option to highlight
				 */
				$scope.unhighlight = function(option) {
					if (!option) {
						return;
					}
					option.highlighted = false;
					$scope.highlighted = null;
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
						options = $scope.filteredTopOptions.concat($scope.filteredOptions);
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
						options = $scope.filteredTopOptions.concat($scope.filteredOptions);
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
						options = $scope.filteredTopOptions.concat($scope.filteredOptions);
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
						options = $scope.filteredTopOptions.concat($scope.filteredOptions);
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
						options = $scope.filteredTopOptions.concat($scope.filteredOptions);
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
				$scope.updateSelection = function(ngModel, _options, canAdd) {
					if (angular.isUndefined(ngModel) || ngModel == null) {
						$scope.clear(false);
						return;
					}
					
					if (angular.isUndefined(_options) || _options == null) {
						options = scope.options;
					} else {
						options = _options;
					}
					
					for(var i=0, n = options.length; i < n; i++) {
						var r = options[i];
						if ($scope.trackFn && $scope.trackFn({item: ngModel}) == r.trackBy) {
							$scope.select(r, false, false, canAdd);
							return;
						}

						if (angular.equals(r.value, ngModel)) {
							$scope.select(r, false, false, canAdd);
							return;
						}

						if (r.children) {
							$scope.updateSelection(ngModel, r.children, canAdd);
						}
					}
				};
			}],
			compile: function(tElement, tAttrs) {

				// We compile the dropdown element once for select of the same nature
				var advancedSelectDropLink = $compile($('<div class="vd-advanced-select-drop">'+
					'<div class="search">'+
						'<input type="text" ng-model="search.label" autocomplete="off" tabindex="-1" />'+
					'</div>'+
					'<ul class="results top_result">'+
						'<li vd-advanced-select-option class="vd-advanced-select-result vd-advanced-select-result-selectable" ng-repeat="item in filteredTopOptions"  ng-class="{ \'with-children\': item.children.length > 0 }">'+
							'<div '+
							     'class="label" '+
							     'ng-bind="item.label" ' + 
							     'ng-click="select(item, true, true)" '+
							     'ng-mouseover="highlight(item, this)">'+
							'</div>'+
							'<ul>'+
								'<li vd-advanced-select-option class="vd-advanced-select-result" ng-repeat="item in item.children">'+
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
						'<li vd-advanced-select-option class="vd-advanced-select-result vd-advanced-select-result-selectable" ng-repeat="item in filteredOptions"  ng-class="{ \'with-children\': item.children.length > 0 }">'+
							'<div '+
							     'class="label" '+
							     'ng-bind="item.label" ' + 
							     'ng-click="select(item, true, true)" '+
							     'ng-mouseover="highlight(item, this)">'+
							'</div>'+
							'<ul>'+
								'<li vd-advanced-select-option class="vd-advanced-select-result" ng-repeat="item in item.children">'+
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
					    globalOptions = [],
					    optionsSet = false,
					    config=null,
					    trackFn=null;

				parseOptions(tAttrs);
				
				/**
				 * Parse the configuration given to the directive via
				 * the `config` attribute
				 * @param scope : 
				 * @param attrs :
				 */
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
				};

				/**
				 * Parse the Options given in the `options` attributes
				 * @param attrs:
				 */
				function parseOptions(attrs) {
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

						track = match[8] ? match[8].replace(new RegExp('^'+item), 'item') : null,
						trackFn = match[8] ? $parse(track) : null;
					}
				};

				/**
				 * Set the options from the model described in the `options` attribute
				 * @param scope:
				 */
				function setOptionsFromNgOptions(scope) {
					var watchOptionsModelExpression = config.watchOptions || optionsModel;
					var getOptionsModel = $parse(optionsModel);
					scope.$watch(watchOptionsModelExpression, function() {
						var items = getOptionsModel(scope);
						globalOptions = [];

						if (groupBy != null) {
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
									trackBy: (trackFn) ? trackFn(item) : null,
									label: labelFn(item)
								});
							});

							angular.forEach(groups, function(subitems, groupName) {
								globalOptions.push({
									target: null,
									label: groupName,
									value: null,
									children: subitems
								});
							});
						} else {
							angular.forEach(items, function(item) {
								var item = { 'item': item };
								globalOptions.push({
									target: item.item,
									value: valueFn(item),
									trackBy: (trackFn) ? trackFn(item) : null,
									label: labelFn(item )
								});
							});
						}

					}, true);
				};

				return function(scope, element, attrs) {
					//console.log('link vdAdvancedSelect ', element);
					// ngModel
					scope.getNgModel = $parse('$parent.'+attrs.ngModel);
					scope.setNgModel = scope.getNgModel.assign;

					var watchLabelUnregister = null;

					scope.$on('$destroy', function() {
						// Remove the drop down and delete it correctly
						if (scope.dropDownElement) {
							scope.dropDownElement.remove();
						}
					});

					if (!optionsSet) {
						optionsSet = true;
						config = parseConfig(scope, attrs);
						setOptionsFromNgOptions(scope);
						var isTop = config.isTop ? config.isTop.replace(new RegExp('^'+item), 'target') : null;
						isTopFn = $parse(isTop);
					}

					scope.trackFn = trackFn;

					scope.$watch(function() { return globalOptions.length }, function() {
						scope.options = angular.copy(globalOptions);

						if ((modelValue = scope.getNgModel(scope)) != null) {
							scope.updateSelection(modelValue, scope.options, false);
						}
					});

					scope.config = config;

					scope.$watch(attrs.ngModel, function(ngModel) {
						scope.updateSelection(ngModel, scope.options, false);
					}, true);

					function handleMouseWhenDropDownOpened(e) {
						var container = angular.element(e.target).parents('.vd-advanced-select-container');
						var drop = angular.element(e.target).parents('.vd-advanced-select-drop');

						var close = false;
						if (angular.isDefined(container.get(0)) && !angular.equals(openedAdvancedSelect, container.get(0))) {
							close = true;
						}

						if (close || (container.length == 0 && drop.length == 0)) {
							e.stopPropagation();
							e.preventDefault();
							scope.toggleOpening();
							scope.$apply();
						}
					};

					/**
					 * 
					 */
					function handleKeysWhenDropDownOpened(e) {
						switch(e.keyCode) {
							case 9: // Tab
								scope.select(scope.highlighted, true, true, true);
								scope.$apply();
								break;
							case 13: // Enter
								e.preventDefault();
								e.stopPropagation();
								scope.select(scope.highlighted, true, true, true);
								scope.$apply();
								break;
							case 27: // Escape
								e.preventDefault();
								e.stopPropagation();
								scope.toggleOpening(false, true);
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
					};

					/**
					 * Show the dropdown it is hidden, otherwise hide it
					 */
					scope.toggleOpening = function(open, focus) {
						if (angular.isDefined(open)) {
							scope.dropDownOpen = open;
						} else {
							scope.dropDownOpen = !scope.dropDownOpen;
						}
						

						if (scope.dropDownOpen) {

							// Update the filtered options
							scope.setFilteredOptions();
							if (!scope.hasHighlighted()) {
								scope.highlightFirst();
							}

							// Set the filtered options when
							watchLabelUnregister = scope.$watch('search.label', function() {
								scope.setFilteredOptions();
								if (!scope.hasHighlighted()) {
									scope.highlightFirst();
								}
							});

							$(document)
								.bind('keydown.vd-advanced-select', handleKeysWhenDropDownOpened)
								.bind('mousedown.vd-advanced-select', handleMouseWhenDropDownOpened);

							// Create the dropDown element once (for each advanced select)
							if (!scope.dropDownElement) {
								scope.dropDownElement = advancedSelectDropLink(scope);
								if (scope.config.class) {
									scope.dropDownElement.addClass('vd-advanced-select-drop-down-'+scope.config.class);
								}
							}

							// Show the dropdown element (by adding it to the page)
							$('body').append(scope.dropDownElement);

							// Adjust the dropdown position
							scope.adjustDropDownSize();
							var isTop = scope.adjustDropDownPosition();
							if (isTop) {
								element.addClass('top');
								scope.dropDownElement.addClass('top');
							} else {
								element.removeClass('top');
								scope.dropDownElement.removeClass('top');
							}

							scope.dropDownElement.find('.search input').focus();

						} else {

							// Hide the dropdown element (by detaching it)
							if (scope.dropDownElement) {
								scope.dropDownElement.detach();
							}
							

							$(document)
								.unbind('keydown.vd-advanced-select', handleKeysWhenDropDownOpened)
								.unbind('mousedown.vd-advanced-select', handleMouseWhenDropDownOpened);

							// Don't watch the search anymore
							if (watchLabelUnregister) {
								watchLabelUnregister();
							}

							if (focus) {
								element.focus();
							}
						}
					};

					/**
					 * Sets the filtered options
					 */
					scope.setFilteredOptions = function() {
						if (scope.config == null || angular.isUndefined(scope.config.searchMinChars) || scope.search.label.length >= scope.config.searchMinChars) {
							
							var filteredOptions = $filter(scope.config.filter)(scope.options, scope.search);

							scope.filteredOptions = [];
							scope.filteredTopOptions = [];
							if (isTopFn) {
								for(var i=0, n=filteredOptions.length; i < n; i++) {
									
									if (isTopFn(filteredOptions[i])) {
										scope.filteredTopOptions.push(filteredOptions[i]);
									} else {
										scope.filteredOptions.push(filteredOptions[i]);
									}
								}
							} else {
								scope.filteredOptions = filteredOptions;
							}
						} else {
							scope.filteredOptions = [];
							scope.filteredTopOptions = [];
						}
					}

					/**
					 * Adjust the dropdown position to his best
					 * @return true if the dropdown is at the top of the select, false otherwise
					 */
					scope.adjustDropDownPosition = function() {
						var isTop = false;

						var undermostPointInSelect = element.offset().top + element.outerHeight() + scope.dropDownElement.outerHeight();
						var undermostPointInWindow = $($window).scrollTop()+ document.documentElement.clientHeight
						if (undermostPointInSelect <= undermostPointInWindow) {
							// Top
							isTop = true;
							scope.dropDownElement.offset({
								left: element.offset().left,
								top: element.offset().top + element.height()
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

					scope.adjustDropDownSize = function() {
						scope.dropDownElement.width(element.width());
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
					/**
					 * Select an options (and highlight it for future) and eventually update the model
					 * and set the focus on the select
					 * @param option : the option to select
					 * @param updateModel : if the method must update the model
					 * @param focus : if the method must set the focus on the select
					 */
					scope.select = function(option, updateModel, focus, canAdd) {
						var canAdd = angular.isDefined(canAdd) ? canAdd : true;
						if (scope.filteredOptions.length == 0 && canAdd) {
							if (scope.config && scope.config.add) {
								scope.config.add(scope, { 
									text: scope.search.label,
									close: function() {
										scope.toggleOpening(false, focus)
										scope.$apply();
									},
									select: function(option, updateModel, focus) {
										scope.select(option, updateModel, focus, canAdd);
										scope.$apply();
									}
								});
							}

							return;
						}

						scope.selected = option;
						scope.highlight(option);
						
						// Update the model
						if (angular.isUndefined(updateModel) || updateModel) {
							scope.setNgModel(scope, option.value);
						}

						// Hide the drop down
						scope.toggleOpening(false, focus);
					};

					// Open the dropdown when entering a letter of digit on the closed advanced select
					element.bind('focus', function() {
						$(document).bind('keydown.advanced_select_focus', function(e) {
							c = ""+String.fromCharCode(e.keyCode);
							if (c.match(/^[a-zA-Z0-9]$/) == null) {
								return;
							}
							
							scope.toggleOpening();
							scope.$apply();
						});
					}).bind('blur', function() {
						$(document).unbind('keydown.advanced_select_focus');
					});

					/**
					 * clear the select
					 */
					scope.clear = function(updateModel) {
						scope.unhighlight(scope.selected); 
						scope.selected = null;

						// Update the model
						/*if (angular.isUndefined(updateModel) || updateModel) {
							scope.setNgModel(scope, option.value);
						}*/
					}
					element.removeAttr('vd-advanced-select-simple');
				}
			},
			replace: true,
			template: 
			'<a class="vd-advanced-select-container" href="javascript:void(0)" ng-click="toggleOpening()" ng-class="{ \'vd-advanced-select-dropdown-open\': dropDownOpen }">'+
				'<span ng-bind="selected.label || placeholder" ng-class="{\'placeholder\': !selected.label}"> </span>' +
				'<div ng-show="!required && selected" ng-mousedown="clear()" class="vd-advanced-select-clear"></div>'+
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
				var label = element.find('.label');

				// Make the option visible when highlighted
				scope.$watch('item.highlighted', function(highlighted) {
					if (highlighted) {
						//scope.item.makeVisible();
						element.addClass('vd-advanced-select-highlighted');
						label.addClass('vd-advanced-select-highlighted');
					} else {
						element.removeClass('vd-advanced-select-highlighted');
						label.removeClass('vd-advanced-select-highlighted');
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
