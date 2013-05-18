angular.module('vd.directive.advanced_select', [])
	.directive('advancedSelect', function($compile) {
		return {
			restrict: 'A',
			require: '^ngModel',
			link: function(scope, select, attrs) {

				// Creates the Advanced Select using the second directive
				var el = angular.element('<advanced-select class="'+attrs.class+'" ng-model="'+attrs.ngModel+'" options="'+attrs.ngOptions+'"></advanced-select>');
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
	.directive('advancedSelect', function($parse, $filter) {
		                       //0000111110000000000022220000000000000000000000333300000000000000444444444444444440000000005555555555555555500000006666666666666666600000000000000077770
		var NG_OPTIONS_REGEXP = /^\s*(.*?)(?:\s+as\s+(.*?))?(?:\s+group\s+by\s+(.*))?\s+for\s+(?:([\$\w][\$\w\d]*)|(?:\(\s*([\$\w][\$\w\d]*)\s*,\s*([\$\w][\$\w\d]*)\s*\)))\s+in\s+(.*)$/;

		return {
			restrict: 'E',
			require: '^ngModel',
			scope: true,
			replace: true,
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
					if (angular.isUndefined(options)) {
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

					if (angular.isUndefined(options)) {
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
				 * Get if the given list of options has a highlighted option
				 * @param options : the list of options
				 * @return true if there is a highlighted option, false
				 *      otherwise
				 */
				$scope.hasHighlighted = function(options) {
					if ($scope.highlighted == null) {
						return false;
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

				scope.select = function(item, updateModel, focus) {
					scope.selected = item;
					scope.highlight(item);

					// Set the focus
					if (angular.isDefined(focus) && focus) {
						element.find('a').focus();
					}
					
					// Update the model
					if (angular.isUndefined(updateModel) || updateModel) {
						setNgModel(scope, valueFn(item.target));
					}

					// Hide the drop down
					scope.dropDownOpen = false;
				};

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
					    valueFn = value ? $parse(value) : function(value) { return value };
					    //
					    groupBy = match[3] ? match[3].replace(new RegExp(item + '\.?'), '') : null,
					    groupByFn = $parse((match[3] || '').replace(new RegExp(item + '\.?'), '')),
					    optionsModel = match[7];
					fillInResultsFromNgOptions();
				} else {
					fillInResultsFromSelect();
				}

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

				scope.$watch('dropDownOpen', function() {
					if (scope.dropDownOpen) {
						$(document).bind('keydown.advanced_select', handleKeysWhenDropDownOpened)
						           .bind('mousedown.advanced_select', handleMouseWhenDropDownOpened);
						
						element.find('input').focus();
						if (element.offset().top + element.outerHeight() + element.find('.advanced-select-drop').outerHeight() 
								<= $(window).scrollTop() + document.documentElement.clientHeight) {
							element.removeClass('top');
							element.find('.results').before(element.find('.search').detach());
						} else {
							element.addClass('top');
							element.find('.results').after(element.find('.search').detach());
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
			},
			templateUrl: '../templates/advanced_select.html'
		}
	});
