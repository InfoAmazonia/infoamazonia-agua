'use strict';

angular
	.module('iaRios.pages', [])
	.config([
		'$stateProvider',
		function($stateProvider) {

			var pages = require('../config').pages;

			angular.forEach(pages, function(page) {

				$stateProvider.state('page' + page.path, {
					url: page.path,
					controller: 'PagesCtrl',
					templateUrl: page.template,
					resolve: {
						'PageData': function() {
							return page;
						}
					}
				});

			});

		}
	])
	.controller('PagesCtrl', [
		'$scope',
		'$state',
		'Page',
		'PageData',
		function($scope, $state, Page, PageData) {
			Page.setTitle(PageData.title);
		}
	]);