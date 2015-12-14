import * as express from 'express';

import { User } from './models/user';
import { UserSettings, IUserSettings } from './models/user-settings';
import requestApi from './utils/request-api';
import login from './core/login';
import refresh from './core/refresh-session';
import { MisskeyExpressRequest } from './misskey-express-request';
import { MisskeyExpressResponse } from './misskey-express-response';
import callController from './call-controller';
import config from './config';

export default function router(app: express.Express): void {
	'use strict';

	app.param('userScreenName', paramUserScreenName);

	app.param('postId', paramPostId);

	app.get('/', (req: MisskeyExpressRequest, res: MisskeyExpressResponse) => {
		if (req.isLogin) {
			callController(req, res, 'home');
		} else {
			callController(req, res, 'entrance');
		}
	});

	app.get('/!', (req: MisskeyExpressRequest, res: MisskeyExpressResponse) => {
		if (req.isLogin) {
			refresh(req.session).then(() => {
				res.redirect('/');
			});
		} else {
			res.redirect('/');
		}
	});

	app.post(`/subdomain/${config.publicConfig.signinDomain}/`, (req: MisskeyExpressRequest, res: MisskeyExpressResponse) => {
		login(req.body['screen-name'], req.body['password'], req.session).then(() => {
			res.sendStatus(200);
		}, (err: any) => {
			res.sendStatus(500);
		});
	});

	app.get(`/subdomain/${config.publicConfig.signinDomain}/`, (req: MisskeyExpressRequest, res: MisskeyExpressResponse) => {
		if (req.query.hasOwnProperty('screen-name') && req.query.hasOwnProperty('password')) {
			login(req.query['screen-name'], req.query['password'], req.session).then(() => {
				res.redirect('/');
			}, (err: any) => {
				res.sendStatus(500);
			});
		} else {
			callController(req, res, 'login');
		}
	});

	app.post(`/subdomain/${config.publicConfig.signoutDomain}/`, (req: MisskeyExpressRequest, res: MisskeyExpressResponse) => {
		if (req.isLogin) {
			req.session.destroy(() => {
				res.redirect('/');
			});
		}
	});

	app.get('/terms-of-use', (req: MisskeyExpressRequest, res: MisskeyExpressResponse) => {
		callController(req, res, 'terms-of-use');
	});

	app.get('/welcome', (req: MisskeyExpressRequest, res: MisskeyExpressResponse) => {
		callController(req, res, 'welcome');
	});

	app.get('/i/*', (req: MisskeyExpressRequest, res: MisskeyExpressResponse, next: () => void) => {
		if (req.isLogin) {
			next();
		} else {
			callController(req, res, 'login');
		}
	});

	app.get('/i/post-new', (req: MisskeyExpressRequest, res: MisskeyExpressResponse) => {
		callController(req, res, 'i/post-new');
	});

	app.get('/i/mentions', (req: MisskeyExpressRequest, res: MisskeyExpressResponse) => {
		callController(req, res, 'i/mentions');
	});

	app.get(`/subdomain/${config.publicConfig.talkDomain}/`, (req: MisskeyExpressRequest, res: MisskeyExpressResponse) => {
		callController(req, res, 'i/talks');
	});

	app.get(`/subdomain/${config.publicConfig.talkDomain}/:userScreenName`, (req: MisskeyExpressRequest, res: MisskeyExpressResponse) => {
		callController(req, res, 'i/talk');
	});

	app.get('/i/album', (req: MisskeyExpressRequest, res: MisskeyExpressResponse) => {
		callController(req, res, 'i/album');
	});

	app.get('/i/settings', (req: MisskeyExpressRequest, res: MisskeyExpressResponse) => callController(req, res, 'i/settings'));

	app.get('/i/home-customize', (req: MisskeyExpressRequest, res: MisskeyExpressResponse) => callController(req, res, 'i/home-customize'));

	app.get('/:userScreenName', (req: MisskeyExpressRequest, res: MisskeyExpressResponse) => {
		callController(req, res, 'user/home');
	});

	app.get('/:userScreenName/:postId', (req: MisskeyExpressRequest, res: MisskeyExpressResponse) => {
		callController(req, res, 'post');
	});

	// Not found handling
	app.use((req: MisskeyExpressRequest, res: MisskeyExpressResponse) => {
		res.status(404);
		callController(req, res, 'not-found');
	});

	// Error handling
	app.use((err: any, req: MisskeyExpressRequest, res: MisskeyExpressResponse, next: () => void) => {
		console.error(err);
		callController(req, res, 'error', err);
	});
}

function paramUserScreenName(
	req: MisskeyExpressRequest,
	res: MisskeyExpressResponse,
	next: () => void,
	screenName: string
): void {
	'use strict';

	requestApi('users/show', {
		'screen-name': screenName
	}, req.isLogin ? req.me : null).then((user: User) => {
		if (user !== null) {
			req.data.user = user;
			UserSettings.findOne({
				userId: user.id
			}, (settingsFindErr: any, settings: IUserSettings) => {
				if (settingsFindErr !== null) {
					throw settingsFindErr;
				}
				req.data.userSettings = settings;
				next();
			});
		} else {
			res.status(404);
			callController(req, res, 'user-not-found');
		}
	}, (err: any) => {
		if (err.body === 'not-found') {
			res.status(404);
			callController(req, res, 'user-not-found');
		}
	});
}

function paramPostId(
	req: MisskeyExpressRequest,
	res: MisskeyExpressResponse,
	next: () => void,
	postId: string
): void {
	'use strict';

	requestApi('posts/show', {
		'post-id': postId
	}, req.isLogin ? req.me : null).then((post: Object) => {
		if (post !== null) {
			req.data.post = post;
			next();
		} else {
			res.status(404);
			callController(req, res, 'post-not-found');
		}
	}, (err: any) => {
		if (err.body === 'not-found') {
			res.status(404);
			callController(req, res, 'post-not-found');
		}
	});
}
