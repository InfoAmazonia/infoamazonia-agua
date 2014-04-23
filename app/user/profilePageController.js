'use strict';

module.exports = [
	'$scope',
	'Page',
	'UserData',
	'ContentData',
	function($scope, Page, UserData, ContentData) {

		Page.setTitle(UserData.name);

		$scope.user = UserData;

		$scope.contents = ContentData;

	}
];