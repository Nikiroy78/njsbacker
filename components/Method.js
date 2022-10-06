class Method {
	constructor (path, params) {
		this.path = path;
		this.paramsCompiles = params;
	}
	
	executeIntoExpressRouter (
		headers,
		json,
		params,
		query,
		body,
		files,
		cookies
	) {
		let paramsEndless = new Object();
		let paramScheme;
		let required   = { missed : [], unsyntax : [] };
		let additional = { missed : [], unsyntax : [] };
		let checkKeys = new Array();
		for (let param in this.paramsCompiles) {
			paramScheme = {
				required      : false,
				type          : require('./types').unknown,
				allow_methods : ['get', 'post', 'put', 'delete'],
				allow_params  : ['headers', 'json', 'params', 'query', 'body', 'files', 'cookies']
			};
			// Configure paramScheme
			for (let key in this.paramsCompiles[param]) { paramScheme[key] = this.paramsCompiles[param][key]; }
			// check missible
			if (headers[param] !== undefined & paramScheme.allow_params.indexOf('headers') != -1) { checkKeys.push('headers'); }
			if (json[param] !== undefined & paramScheme.allow_params.indexOf('json') != -1) { checkKeys.push('json'); }
			if (query[param] !== undefined & paramScheme.allow_params.indexOf('query') != -1) { checkKeys.push('query'); }
			if (body[param] !== undefined & paramScheme.allow_params.indexOf('body') != -1) { checkKeys.push('body'); }
			if (files[param] !== undefined & paramScheme.allow_params.indexOf('files') != -1) { checkKeys.push('files'); }
			if (cookies[param] !== undefined & paramScheme.allow_params.indexOf('cookies') != -1) { checkKeys.push('cookies'); }
			if (params[param] !== undefined & paramScheme.allow_params.indexOf('params') != -1) { checkKeys.push('params'); }
			
			if (checkKeys.length == 0) {
				if (paramScheme.required) { required.missed.push(param); }
				else { additional.missed.push(param); }
			}
			else {
				checkKeys = checkKeys.sort((a, b) => Number(b == 'query' || b == 'cookies') - Number(a == 'query' || a == 'cookies'));
				let isSyntax;
				let convertedValue;
				for (let key in checkKeys) {
					switch (key) {
						case 'query' :
							[isSyntax, convertedValue] = paramScheme.type(query[param], true);
							break;
						case 'cookies' :
							[isSyntax, convertedValue] = paramScheme.type(query[param], true);
							break;
						case 'json' :
							[isSyntax, convertedValue] = paramScheme.type(query[param], false);
							break;
					}
				}
				if (isSyntax) {
					paramsEndless[param] = convertedValue;
				}
				else {
					if (paramScheme.required) { required.unsyntax.push({param : param, description : this.typeError.split('{param}').join(param).split('{long_type}').join(paramScheme.type.long_name).split('{short_type}').join(paramScheme.type.short_name)}); }
					else { additional.unsyntax.push({param : param, description : this.typeError.split('{param}').join(param).split('{long_type}').join(paramScheme.type.long_name).split('{short_type}').join(paramScheme.type.short_name)}); }
				}
			}
		}
		if (required.missed.length > 0 || required.unsyntax.length > 0 || additional.unsyntax.length > 0) {
			throw this.paramsError(required, additional);
		}
		else {
			return this.pre_execute(paramsEndless, false);
		}
	}
	
	pre_execute (params, needsChecking = true) {
		if (needsChecking) {
			let required   = { missed : [], unsyntax : [] };
			let additional = { missed : [], unsyntax : [] };
			let isSyntax;
			let _;
			let paramScheme;
			
			for (let param in this.paramsCompiles) {
				paramScheme = {
					required      : false,
					type          : require('./types').unknown,
					allow_methods : ['get', 'post', 'put', 'delete'],
					allow_params  : ['headers', 'json', 'params', 'query', 'body', 'files', 'cookies']
				};
				for (let key in this.paramsCompiles[param]) { paramScheme[key] = this.paramsCompiles[param][key]; }
				if (params[param] === undefined) {
					if (paramScheme.required) {
						required.missed.push(param);
					}
					else {
						additional.missed.push(param);
					}
				}
			}
		}
	}
	
	execute (params) {}
}


module.exports = Method;