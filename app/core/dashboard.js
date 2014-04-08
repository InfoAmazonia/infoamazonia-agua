'use strict';

angular.module('mapasColetivos.dashboard', [])

.config([
	'$stateProvider',
	function($stateProvider) {

		$stateProvider
			.state('dashboard', {
				url: '/dashboard/',
				controller: 'DashboardCtrl',
				templateUrl: '/views/dashboard/index.html'
			})
			.state('dashboard.profile', {
				url: 'profile/',
				templateUrl: '/views/dashboard/profile.html'
			});

	}
])

.controller('DashboardCtrl', [
	'$scope',
	'$rootScope',
	'$timeout',
	'$state',
	'$stateParams',
	'SessionService',
	'$location',
	'Page',
	'User',
	'Layer',
	'Map',
	function($scope, $rootScope, $timeout, $state, $stateParams, Session, $location, Page, User, Layer, Map) {

		Page.setTitle('Painel de Controle');

		$scope.isDashboard = true;

		$scope.$session = Session;

		$scope.$watch('$session.authenticated()', function(auth) {

			if(!auth) {
				$location.path('/login/');
			}

		});

		var setUser = function(u) {
			var user = angular.copy(u);
			if(user) {
				User.resource.get({
					userId: user._id
				}, function(res) {

					$scope.user = res;
					$scope.userName = angular.copy($scope.user.name);

				});
			}
		}

		$scope.$watch('$session.user()', setUser);

		$scope.$on('user.save.success', function(event, user) {
			setUser(user);
		});

		var stateFunctions = function() {
			if($state.current.name === 'dashboard') {
				$location.path('/dashboard/layers').replace();
			}
			$scope.currentState = $state.current.name.replace('dashboard.', '');
		}

		$rootScope.$on('$viewContentLoaded', function() {
			stateFunctions();
		});

		$rootScope.$on('$stateChangeSuccess', function() {
			stateFunctions();
		});

		$scope.$layer = Layer;
		Layer.resource.userLayers(function(res) {
			$scope.totalLayer = res.layersTotal;
			$scope.layers = res.layers;

			/*
			 * Pagination
			 */
			$scope.$on('layer.page.next', function(event, res) {
				if(res.layers.length) {
					angular.forEach(res.layers, function(layer) {
						$scope.layers.push(layer);
					});
					$scope.layers = $scope.layers; // trigger digest
				}
			});

		});

		$scope.$map = Map;
		Map.resource.userMaps(function(res) {
			
			$scope.totalMap = res.mapsTotal;
			$scope.maps = res.maps;

			/*
			 * Pagination
			 */
			$scope.$on('map.page.next', function(event, res) {
				if(res.maps.length) {
					angular.forEach(res.maps, function(map) {
						$scope.maps.push(map);
					});
					$scope.maps = $scope.maps; // trigger digest
				}
			});
		});

		$rootScope.$on('map.delete.success', function(event, map) {
			$scope.maps = $scope.maps.filter(function(m) { return map._id != m._id; });
		});

		$rootScope.$on('layer.add.success', function(event, layer) {
			$scope.layers = [layer].concat($scope.layers);
		});

		$rootScope.$on('layer.delete.success', function(event, layer) {
			$scope.layers = $scope.layers.filter(function(m) { return layer._id != m._id; });
		});

	}
]);