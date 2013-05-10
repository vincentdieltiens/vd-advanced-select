angular.module('app', ['vd.directive.advanced_select'])
	.controller('index', function($scope) {
		$scope.language = null;
		$scope.$watch('language', function() {
			console.log('language changed : ', $scope.language);
		});

		$scope.languages = [{
			id: 0,
			name: 'English'
		}, {
			id: 1,
			name: 'Français'
		}, {
			id: 2,
			name: 'Italiano'
		}];
	});