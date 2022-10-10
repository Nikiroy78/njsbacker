const typesApi = require('./types');


class Method {
	constructor (name, path, params) {
		this.name = name;
		this.path = path;
		this.paramsCompiles = params;
		this.groupsConnected = new Array();
		this.allowedMethods = new Array();
		// Setting allow methods
		let allowedMethods;
		
		for (let param in params) {
			if (!params[param].allow_methods) allowedMethods = ['get', 'post', 'put', 'delete'];
			else {
				allowedMethods = params[param].allow_methods;
			}
			for (let allowMethod in allowedMethods) {
				if (this.allowedMethods.indexOf(allowedMethods[allowMethod]) == -1) {
					this.allowedMethods.push(allowedMethods[allowMethod]);
				}
			}
		}
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
				type          : typesApi.unknown,
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
							[isSyntax, convertedValue] = paramScheme.type(cookies[param], true);
							break;
						case 'headers' :
							[isSyntax, convertedValue] = paramScheme.type(headers[param], true);
							break;
						case 'json' :
							[isSyntax, convertedValue] = paramScheme.type(json[param], false);
							break;
						case 'params' :
							[isSyntax, convertedValue] = paramScheme.type(params[param], false);
							break;
						case 'body' :
							[isSyntax, convertedValue] = paramScheme.type(body[param], false);
							break;
						case 'files' :
							[isSyntax, convertedValue] = paramScheme.type(files[param], false);
							break;
					}
					if (isSyntax) break;
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
					type          : typesApi.unknown,
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
				else {
					[isSyntax, _] = paramScheme.type(params[param], false);
					if (!isSyntax) {
						if (paramScheme.required) {
							required.unsyntax.push({param : param, description : this.typeError.split('{param}').join(param).split('{long_type}').join(paramScheme.type.long_name).split('{short_type}').join(paramScheme.type.short_name)});
						}
						else {
							additional.unsyntax.push({param : param, description : this.typeError.split('{param}').join(param).split('{long_type}').join(paramScheme.type.long_name).split('{short_type}').join(paramScheme.type.short_name)});
						}
					}
				}
			}
			
			if (required.missed.length > 0 || required.unsyntax.length > 0 || additional.unsyntax.length > 0) {
				throw this.paramsError(required, additional);
			}
			else {
				return this.execute(params);
			}
		}
		else {
			this.execute(params);
		}
	}
	
	group (groupClass) {
		this.groupsConnected.push(groupClass);
	}
	
	execute (params) {}
}


module.exports = Method;