class Method {
	constructor (path, params) {
		this.path = path;
		this.paramsCompiles = params;
	}
	
	compileParams (
		headers,
		json,
		params,
		query,
		body,
		files,
		cookies
	) {
		let paramScheme;
		let required = { missed : [], unsyntax : [] };
		let additional = { missed : [], unsyntax : [] };
		let checkKeys = new Array();
		for (let param in this.paramsCompiles) {
			paramScheme = {
				required      : false,
				allow_methods : ['get', 'post', 'put', 'delete'],
				allow_params  : ['headers', 'json', 'params', 'query', 'body', 'files', 'cookies']
			};
			// Configure paramScheme
			for (let key in this.paramsCompiles[param]) { paramScheme[key] = this.paramsCompiles[param][key]; }
			// check missible
			if (headers[param] !== undefined & paramScheme.allow_params.indexOf('headers') != -1) { checkKeys.push('headers'); }
			if (json[param] !== undefined) { checkKeys.push('json'); }
			if (query[param] !== undefined) { checkKeys.push('query'); }
			if (body[param] !== undefined) { checkKeys.push('body'); }
			if (files[param] !== undefined) { checkKeys.push('files'); }
			if (cookies[param] !== undefined) { checkKeys.push('cookies'); }
			if (params[param] !== undefined) { checkKeys.push('params'); }
		}
	}
	
	execute () {}
}


module.exports = Method;