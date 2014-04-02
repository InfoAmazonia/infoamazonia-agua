'use strict';

/*
 * i18n config
 */

module.exports = [
	'$translateProvider',
	function($translateProvider) {

		$translateProvider.translations('en-US', require('../languages/en-US'));
		$translateProvider.translations('pt-BR', require('../languages/pt-BR'));
		$translateProvider.translations('es-ES', require('../languages/es-ES'));

		$translateProvider.preferredLanguage('pt-BR');
		//$translateProvider.useLocalStorage();

	}
];