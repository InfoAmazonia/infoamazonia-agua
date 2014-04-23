'use strict';

/* 
 * User module
 */
angular
	.module('mapasColetivos.user', [
		'btford.modal'
	])
	.config([
		'$stateProvider',
		function($stateProvider) {

			$stateProvider
				.state('user', {
					url: '/user/:userId/',
					controller: 'ProfilePageCtrl',
					templateUrl: '/views/user/show.html',
					resolve: {
						'UserData': [
							'$q',
							'$stateParams',
							'User',
							function($q, $stateParams, User) {

								var deferred = $q.defer();

								User.resource.get({
									userId: $stateParams.userId
								}, function(res) {

									deferred.resolve(res);

								});

								return deferred.promise;

							}
						],
						'ContentData': [
							'$q',
							'Content',
							'UserData',
							function($q, Content, UserData) {

								var deferred = $q.defer();

								Content.resource.query({
									perPage: -1,
									userId: UserData._id
								}, function(res) {

									deferred.resolve(res.contents);

								});

								return deferred.promise;

							}
						]
					}
				})
				.state('user.layers', {
					url: 'layers/',
					templateUrl: '/views/user/layers.html'
				})
				.state('user.maps', {
					url: 'maps/',
					templateUrl: '/views/user/maps.html'
				});
		}
	])
	.factory('User', require('./service').User)
	.factory('ChangePwd', require('./changePwd').changePwd)
	.factory('ChangeEmail', require('./changeEmail').changeEmail)
	.controller('UserCtrl', require('./controller').UserCtrl)
	.controller('ProfilePageCtrl', require('./profilePageController'));