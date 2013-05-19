angular.module('directive.tabs', [])
	.directive('tabs', function() {
		return {
			restrict: 'E',
			controller: function($scope, $element) {
				$scope.panes = [];

				$scope.select = function(paneScope) {
					angular.forEach($scope.panes, function(currentPane) {
						currentPane.selected = false;
					});

					paneScope.selected = true;
				};

				this.addPane = function(paneScope) {
					$scope.panes.push(paneScope);

					if ($scope.panes.length == 1) {
						$scope.select(paneScope);
					}
				};
			},
			link: function(scope) {

			},
			template: '<div class="tabbable">'+
				'<ul class="nav nav-tabs">'+
					'<li data-ng-repeat="(index, pane) in panes" data-ng-class="{active: pane.selected}" ng-click="select(pane, true)">'+
						'<span ng-bind="pane.name"></span>'+
					'</li>'+
				'</ul>'+
				'<div class="tab-content" ng-transclude></div>'+
			'</div>',
			replace: true,
			transclude: true
		}
	})
	.directive('tab', function() {
		return {
			require: '^tabs',
			restrict: 'E',
			transclude: true,
			scope: {
				name: '@'
			},
			link: function(scope, element, attrs, tabsController) {
				scope.$watch('name', function(newValue, oldValue) {
					if (newValue == oldValue) {
						tabsController.addPane(scope);
					}
				}, true);
			},
			template: '<div class="tab-pane" ng-class="{active: selected}"  ng-transclude></div>',
			replace: true
		}
	});