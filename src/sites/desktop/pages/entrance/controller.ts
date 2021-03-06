import * as express from 'express';
import requestApi from '../../../../utils/request-api';

module.exports = (req: express.Request, res: express.Response): void => {
	'use strict';
	requestApi('hashtags/trend/show', {}).then((hashtags: string[]) => {
		res.locals.display({
			trends: hashtags.map(hashtag => `#${hashtag}`)
		});
	});
};
