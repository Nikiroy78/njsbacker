const express = require('express');
const bodyParser = require('body-parser')
const https = require('https');
const version = '1.0.0';


class Main {
	constructor (sendHeaders = true) {
		this.sendHeaders = sendHeaders;
		this.methods = new Object();
		
		this.errorHadler = (error) => ({
			mainbody : { error : error },
			headers  : {},
			cookies  : {},
			// redirect_uri: '';  // if want redirect to another url
			code: 400
		});
		
		this.resposneHandler = (response) => ({
			mainbody : { response },
			headers : {},
			cookies : {},
			// redirect_uri: '';  // if want redirect to another url
			code: 200
		});
		
		this.paramsError = (required, additional) => ({ required, additional });
		this.typeError = 'param {param} must be only {long_type} ({short_type})';
	}
	
	method (methodObj) {
		this.methods[methodObj.name] = methodObj;
	}
	
	call (method, params) {
		return this.methods[method.name].pre_execute(params);
	}

	router (returnMiddlewareFunction = false, middlewareFunction = (req, res, next) => next(), debug = (text) => console.log(text)) {
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
						let handledDataResponse = this.responseHandler(
							this.methods[name].executeIntoExpressRouter(
								req.headers,
								(req.get('Content-Type').toLowerCase().indexOf('json') != -1) ? req.body : new Object(),
								req.params,
								req.query,
								(req.get('Content-Type').toLowerCase().indexOf('json') == -1) ? req.body : new Object(),
								req.files,
								req.cookies
							)
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


module.exports = Main;