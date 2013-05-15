angular.module('app', ['vd.directive.advanced_select'])
	.controller('index', function($scope, $timeout) {

		$scope.language = { id: null };
		$scope.$watch('language.id', function() {
			//console.log('language id changed : ', $scope.language.id);
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
			//console.log('number change : ', $scope.number);
		});
		$scope.numbers = [5, 10, 15, 20, 25, 30];
		
		$scope.country = { id: null };
		$scope.country2 = { id: 2 };
		$scope.$watch('country.id', function() {
			//console.log('country id changed : ', $scope.country.id);
		});

		$scope.countries = [];
		$timeout(function() {
			//console.log('countries set...')
			$scope.countries = [{
				id: 0,
				name: 'Belgium'
			}, {
				id: 1,
				name: 'France'
			}, {
				id: 2,
				name: 'Luxembourg'
			}, {
				id: 3,
				name: 'United States'
			}];
		}, 3000);

		$scope.hierachical_languages = [{
			id: 1,
			name: 'French (BE)',
			group: 'French'
		}, {
			id: 2,
			name: 'French (FR)',
			group: 'French'
		}, {
			id: 3,
			name: 'French (CA)',
			group: 'French'
		}, {
			id: 4,
			name: 'English (US)',
			group: 'English'
		}, {
			id: 5,
			name: 'English (UK)',
			group: 'English'
		}];
		$scope.language2 = { id: null };

		$scope.language3 = { id: null };
	});

$(document).ready(function() {
	$('.triggerChangeWithjQuery').click(function() {
		$('#'+$(this).get(0).dataset.targetId).val(2).trigger('change');
	});
});