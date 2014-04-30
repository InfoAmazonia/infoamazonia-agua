'use strict';

/*
 * i18n config
 */

module.exports = {
	config: [
		'$translateProvider',
		'$httpProvider',
		function($translateProvider, $httpProvider) {

			$translateProvider.translations('en-US', require('../languages/en-US'));
			$translateProvider.translations('pt-BR', require('../languages/pt-BR'));
			$translateProvider.translations('es-ES', require('../languages/es-ES'));

			$translateProvider.preferredLanguage('pt-BR');
			//$translateProvider.useLocalStorage();

			$httpProvider.interceptors.push('i18n.RequestInterceptor');

		}
	],
	RequestInterceptor: [
		'$rootScope',
		'$q',
		'$window',
		'$translate',
		function($rootScope, $q, $window, $translate) {

			return {
				request: function(config) {

					config.headers = config.headers || {};

					config.headers['Accept-Language'] = $translate.use();

					return config || $q.when(config);

				}
			}

		}
	]
};