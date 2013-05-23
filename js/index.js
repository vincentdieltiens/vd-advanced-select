angular.module('app', ['directive.tabs', 'vd.directive.advanced_select'])
	.controller('example1', function($scope) {
		$scope.language = { id: null };
		$scope.languages = [
			{ id: 0, name: 'English' }, 
			{ id: 1, name: 'Français' }, 
			{ id: 2, name: 'Italiano' }
		];
	})
	.controller('example2', function($scope) {
		$scope.number = 0;
		$scope.numbers = [5, 10, 15, 20, 25, 30];
	})
	.controller('example3', function($scope, $timeout) {
		$scope.country = { id: 1 };
		$scope.countries = [];
		$timeout(function() {
			$scope.countries = [
				{ id: 0, name: 'Belgium' }, 
				{ id: 1, name: 'France' }, 
				{ id: 2, name: 'Luxembourg' }, 
				{ id: 3, name: 'United States' }
			];
		}, 3000);
	})
	.controller('example4', function($scope) {
		$scope.language = { id: null };
		$scope.languages = [
			{ id: 1, name: 'French (BE)', group: 'French' },
			{ id: 2, name: 'French (FR)', group: 'French' },
			{ id: 3, name: 'French (CA)', group: 'French' },
			{ id: 4, name: 'English (US)', group: 'English'},
			{ id: 5, name: 'English (UK)', group: 'English'}
		];
	})
	.controller('example5', function($scope) {
		$scope.language = { id: null };
		$scope.languages = [
			{ id: 0, name: 'English' }, 
			{ id: 1, name: 'Français' }, 
			{ id: 2, name: 'Italiano' }
		];
	})
	.controller('example6', function($scope, $timeout) {
		$scope.year = null;
		$scope.years = [];
		for(var i=1940; i < 2013; i++) {
			$scope.years.push(i);
		}
	})
	.controller('example7', function($scope) {
		$scope.selected_languages = [];
		$scope.languages = [
			{ id: 0, name: 'English' }, 
			{ id: 1, name: 'Français' }, 
			{ id: 2, name: 'Italiano' }
		];
	});

$(document).ready(function() {
	$('.triggerChangeWithjQuery').click(function() {
		$('#'+$(this).get(0).dataset.targetId).val(2).trigger('change');
	});

	prettyPrint();
});