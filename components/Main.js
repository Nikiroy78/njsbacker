const express = require('express');
const https = require('https');
const version = 'v 1.0.0';


class Main {
	constructor (send_headers = true) {
		this.send_headers = send_headers;
		this.methods = new Object();
	}
	
	method (methodObj) {
		this.methods[methodObj.path] = methodObj;
	}
	
	call (method, params) {
		return this.methods[method.path].execute(params);
	}

	router (returnMiddlewareFunction = true, middlewareFunction = (req, res, next) => next()) {
		let router = express.Router();
		
		for (let path in this.methods) {
			for (let methodId in this.methods[path].allowedMethods) {
				router[this.methods[path].allowedMethods[methodId]](async (req, res) => {
					// (!) Mainbody
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
	
	server (mountPath = '/', options = null) {
		let app = express();
		
		app.use(mountPath, this.router());
		return app;
	}
}


module.exports = Main;