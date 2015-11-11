import { MisskeyExpressRequest } from '../../../../../misskeyExpressRequest';
import { MisskeyExpressResponse } from '../../../../../misskeyExpressResponse';
const home = require('../home');

module.exports = (req: MisskeyExpressRequest, res: MisskeyExpressResponse): void => {
	'use strict';
	home(req, res, {
		customize: true
	});
};
