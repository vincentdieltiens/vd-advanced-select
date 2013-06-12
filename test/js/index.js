angular.module('app', ['directive.tabs', 'vd.directive.advanced_select', 'ngResource'])
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
		$scope.year = 1956;
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
	})
	.controller('example8', function($scope) {
		$scope.person = {};

		var Person = function(id, first_name, last_name) {
			this.id = id;
			this.first_name = first_name;
			this.last_name = last_name;
		}

		Person.prototype = {
			fullName: function() {
				return this.first_name+' '+this.last_name;
			}
		}

		$scope.persons = [
			new Person(0, 'Michael', 'Jordan'),
			new Person(1, 'Shaquille', 'O\'neal'),
			new Person(2, 'Magic', 'Johnson')
		];
	})
	.controller('example10', function($scope) {
		$scope.language = { id: null };
		$scope.languages = [
			{ id: 0, name: 'English' }, 
			{ id: 1, name: 'Français' }, 
			{ id: 2, name: 'Italiano' }
		];
	})
	.controller('example11', function($scope, Language) {
		$scope.language = { id: null };
		$scope.languages = Language.query();
	})
	.filter('namelowercase', function() {
		return function(object) {
			return object.name.toLowerCase();
		}
	})
	.factory('Language', function($resource) {
		return $resource('languages.js/:languageId', {});
	});

$(document).ready(function() {
	$('.triggerChangeWithjQuery').click(function() {
		$('#'+$(this).get(0).dataset.targetId).val(2).trigger('change');
	});

	prettyPrint();
});