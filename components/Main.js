const express = require('express');
const bodyParser = require('body-parser')
const https = require('https');
const version = '1.0.0';


class ApiError extends Error {
	constructor (opt, data) {
		super(opt);
		this.name = 'API Error';
		this.data = data;
	}
}


class Main {
	constructor (sendHeaders = true) {
		this.sendHeaders = sendHeaders;
		this.methods = new Object();
		
		this.errorHadler = (error) => {
			let errorData;
			if (error.name == "API Error") {
				errorData = {
					code    : error.message,
					details : error.data
				};
			}
			else {
				errorData = {
					name  : error.name,
					stack : error.stack
				};
			}
			return {
				mainbody : { error : errorData },
				headers  : {},
				cookies  : {},
				// redirect_uri: '';  // if want redirect to another url
				code: 400
			}
		};
		
		this.responseHandler = (response) => ({
			mainbody : { response },
			headers : {},
			cookies : {},
			// redirect_uri: '';  // if want redirect to another url
			code: 200
		});
		
		this.paramsError = (required, additional) => {
			return new ApiError('UNSYNTAX_OR_MISSED_REQUIRED_PARAMS', { required, additional });
		};
		this.typeError = 'param {param} must be only {long_type} ({short_type})';
	}
	
	method (methodObj) {
		methodObj._pinMain(this);
		this.methods[methodObj.name] = methodObj;
	}
	
	call (method, params) {
		return this.methods[method.name].pre_execute(params);
	}

	router (returnMiddlewareFunction = false, middlewareFunction = (req, res, next) => next(), debug = (text) => {}) {
		let router = express.Router();
		router.use(require('cookie-parser')());
		// parse various different custom JSON types as JSON
		router.use(bodyParser.json({ type: 'application/*+json' }))
		// parse some custom thing into a Buffer
		router.use(bodyParser.raw({ type: 'application/vnd.custom-type' }))
		// parse an HTML body into a string
		router.use(bodyParser.text({ type: 'text/html' }))
		
		for (let name in this.methods) {
			debug(`CONNECT METHOD : ${name}`);
			for (let methodId in this.methods[name].allowedMethods) {
				debug(` >> CONNECT METHOD : ${name} [${this.methods[name].allowedMethods[methodId]}] to ${this.methods[name].path}`);
				router[this.methods[name].allowedMethods[methodId]](this.methods[name].path, async (req, res) => {
					if (this.sendHeaders) {
						res.set('njsbacker-version', version);
					}
					try {
						let contentType = req.get('Content-Type');
						if (!!contentType) {
							contentType = contentType.toLowerCase();
						}
						else {
							contentType = 'unknown';
						}
						
						let result = this.methods[name].executeIntoExpressRouter(
							req.headers,
							(contentType.indexOf('json') != -1) ? req.body : new Object(),
							req.params,
							req.query,
							(contentType.indexOf('json') == -1) ? req.body : new Object(),
							req.files != undefined ? req.files : new Object(),
							req.cookies
						);
						let handledDataResponse = this.responseHandler(
							result
						);
						if (!handledDataResponse.redirect_uri) {
							for (let header in handledDataResponse.headers) {
								res.set(header, handledDataResponse.headers[header].toString());
							}
							for (let cookie in handledDataResponse.cookies) {
								res.cookie(cookie, handledDataResponse.cookies[cookie].toString());
							}
							res.status(handledDataResponse.code).send(handledDataResponse.mainbody);
						}
						else {
							res.status(handledDataResponse.code).redirect(handledDataResponse.redirect_uri);
						}
					}
					catch (err) {
						debug('ERROR RISED:');
						debug(err);
						let handledDataError = this.errorHadler(err);
						if (!handledDataError.redirect_uri) {
							for (let header in handledDataError.headers) {
								res.set(header, handledDataError.headers[header].toString());
							}
							for (let cookie in handledDataError.cookies) {
								res.cookie(cookie, handledDataError.cookies[cookie].toString());
							}
							res.status(handledDataError.code).send(handledDataError.mainbody);
						}
						else {
							res.status(handledDataError.code).redirect(handledDataError.redirect_uri);
						}
					}
				});
			}
		}
		
		if (returnMiddlewareFunction) {
			return middlewareFunction, router;
		}
		else {
			return router;
		}
	}
	
	server (mountPath = '/', sslOptions = null) {
		let app = express();
		
		app.use(mountPath, this.router(true));
		return app;
	}
}


module.exports = { Main, ApiError };