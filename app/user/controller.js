'use strict';

exports.UserCtrl = [
	'$scope',
	'$rootScope',
	'$state',
	'$stateParams',
	'User',
	'SessionService',
	'ChangePwd',
	'ChangeEmail',
	'Layer',
	'Map',
	'MessageService',
	'SirTrevor',
	function($scope, $rootScope, $state, $stateParams, User, Session, ChangePwd, ChangeEmail, Layer, Map, Message, SirTrevor) {

		$scope.renderBlock = function(block) {
			return SirTrevor.renderBlock(block);
		}

		$scope.save = function(user) {

			User.resource.update({userId: user._id}, user, function(res) {

				$rootScope.$broadcast('user.save.success', user);

				Session.user(user);

			}, function(err) {

				$rootScope.$broadcast('user.save.error', err);

			});

		}

		$scope.openPwdModal = function(user) {
			ChangePwd.activate({
				user: user
			});

			$scope.$on('$destroy', function() {
				ChangePwd.deactivate();
			});
		};

		$scope.closePwdModal = function() {
			ChangePwd.deactivate();
		};

		$scope.openEmailModal = function(user) {
			ChangeEmail.activate({
				user: user
			});

			$scope.$on('$destroy', function() {
				ChangeEmail.deactivate();
			});
		};

		$scope.closeEmailModal = function() {
			ChangeEmail.deactivate();
		};

		$scope.changePassword = function(user, chPwd) {

			if(typeof chPwd === 'undefined') {
				return false;
			}

			if(!chPwd.userPwd) {
				Message.message({
					status: 'error',
					text: 'Você deve inserir sua senha atual.'
				});
				return false;
			}

			if(!chPwd.newPwd) {
				Message.message({
					status: 'error',
					text: 'Você deve inserir uma nova senha.'
				});
				return false;
			}

			if(chPwd.newPwd != chPwd.validatePwd) {
				Message.message({
					status: 'error',
					text: 'As senhas não são compatíveis'
				})
				return false;
			}

			User.resource.update({userId: user._id}, chPwd);

		}

		$scope.changeEmail = function(user) {

			if(!user.newEmail) {
				Message.message({
					status: 'error',
					text: 'Você deve inserir um email.'
				});
				return false;
			}

			User.resource.updateEmail({userId: user._id}, {
				email: user.newEmail
			});

		}

		$scope.profileUrl = function(user) {

			if(typeof user !== 'undefined') {

				var slug = user._id;

				if(user.username)
					slug =  user.username;
	
				return '/user/' + slug + '';
	
			}

			return '';

		}

	}
];