angular.module('app', ['vd.directive.advanced_select'])
	.controller('index', function($scope) {
		$scope.language = { id: null };
		$scope.$watch('language.id', function() {
			console.log('language id changed : ', $scope.language.id);
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

		$scope.number = 0;
		$scope.$watch('number', function() {
			console.log('number change : ', $scope.number);
		});
		$scope.numbers = [5, 10, 15, 20, 25, 30];
		
	});