const typesApi = require('./types');
const Session = require('./Session');


const formatMessage = (message, errorType, scheme, value, param) => {
	value = String(value);
	switch (errorType) {
		case 'typeError' :
			return message.split('{param}').join(param).split('{long_type}').join(scheme.type.long_name).split('{short_type}').join(scheme.type.short_name);
		case 'valuesError' :
			return message.split('{param}').join(param).split('{value}').join(value).split('{values}').join(scheme.values.join(', '));
		case 'minLengthError' :
			return message.split('{value}').join(scheme.min_length);
		case 'maxLengthError' :
			return message.split('{value}').join(scheme.max_length);
		case 'httpMethodError' :
			return message.split('{method}').join(value).split('{methods}').join(scheme.allow_methods.join(', '));
	}
};


const compileParams = (params) => {
	let compiled = new Object();
	for (let objKey in params) {
		compiled = Object.assign(compiled, params[objKey]);
	}
	return compiled;
}


class Method {
	constructor (name, path, params) {
		this.name = name;
		this.path = path;
		this.paramsCompiles = params;
		this.groupsConnected = new Array();
		this.allowedMethods = new Array();
		// Errors
		this.error = new Object();
		this.error.typeError = 'param {param} must be only {long_type} ({short_type})';
		this.error.valuesError = 'value "{value}" not finded into {values}';
		this.error.minLengthError = 'value must be more or equal {value}';
		this.error.maxLengthError = 'value must be less or equal {value}';
		this.error.httpMethodError = 'Method {method} does not supported. Methods supports: {methods}';
		
		this.isDynamic = false;
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
	
	useDynamicType (condition) {
		this.isDynamic = !!condition;
	}
	
	_pinMain (mainObject) {
		this.MainObject = mainObject;
	}
	
	executeIntoExpressRouter (
		currentMethod,
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
		let checkKeys;
		let paramsCompiles = Object.assign({}, this.paramsCompiles, this.MainObject.sessionData);
		for (let groupId in this.groupsConnected) {
			paramsCompiles = Object.assign({}, paramsCompiles, this.groupsConnected[groupId].sessionData);
		}
		
		for (let param in paramsCompiles) {
			checkKeys = new Array();
			paramScheme = {
				required      : false,
				type          : this.isDynamic ? typesApi.dynamic : typesApi.unknown,
				allow_methods : ['get', 'post', 'put', 'delete'],
				conversion    : false,
				allow_params  : ['headers', 'json', 'params', 'query', 'body', 'files', 'cookies']
			};
			// Configure paramScheme
			for (let key in paramsCompiles[param]) { paramScheme[key] = paramsCompiles[param][key]; }
			// check missible
			if (headers[param] != undefined & paramScheme.allow_params.indexOf('headers') != -1) { checkKeys.push('headers'); }
			if (json[param] != undefined & paramScheme.allow_params.indexOf('json') != -1) { checkKeys.push('json'); }
			if (query[param] != undefined & paramScheme.allow_params.indexOf('query') != -1) { checkKeys.push('query'); }
			if (body[param] != undefined & paramScheme.allow_params.indexOf('body') != -1) { checkKeys.push('body'); }
			if (files[param] != undefined & paramScheme.allow_params.indexOf('files') != -1) { checkKeys.push('files'); }
			if (cookies[param] != undefined & paramScheme.allow_params.indexOf('cookies') != -1) { checkKeys.push('cookies'); }
			if (params[param] != undefined & paramScheme.allow_params.indexOf('params') != -1) { checkKeys.push('params'); }
			
			if (checkKeys.length == 0) {
				if (paramScheme.required) { required.missed.push(param); }
				else { additional.missed.push(param); }
			}
			else if (paramScheme.allow_methods.indexOf(currentMethod) == -1) {
				if (paramScheme.required) { required.unsyntax.push({param : param, description : formatMessage(this.error.httpMethodError, 'httpMethodError', paramScheme, currentMethod, param) }); }
				else { additional.unsyntax.push({param : param, description : formatMessage(this.error.httpMethodError, 'httpMethodError', paramScheme, currentMethod, param)}); }
			}
			else {
				checkKeys = checkKeys.sort((a, b) => Number(b == 'query' || b == 'cookies') - Number(a == 'query' || a == 'cookies'));
				let isSyntax;
				let convertedValue;
				let selectedSyntaxError = 'typeError';
				for (let key in checkKeys) {
					switch (checkKeys[key]) {
						case 'query' :
							[isSyntax, convertedValue] = paramScheme.type.syntax(query[param], true);
							break;
						case 'cookies' :
							[isSyntax, convertedValue] = paramScheme.type.syntax(cookies[param], true);
							break;
						case 'headers' :
							[isSyntax, convertedValue] = paramScheme.type.syntax(headers[param], true);
							break;
						case 'body' :
							[isSyntax, convertedValue] = paramScheme.type.syntax(body[param], true);
							break;
						case 'json' :
							[isSyntax, convertedValue] = paramScheme.type.syntax(json[param], paramScheme.conversion);
							break;
						case 'params' :
							[isSyntax, convertedValue] = paramScheme.type.syntax(params[param], paramScheme.conversion);
							break;
						case 'files' :
							[isSyntax, convertedValue] = paramScheme.type.syntax(files[param], paramScheme.conversion);
							break;
					}
					if (isSyntax) {
						[isSyntax, selectedSyntaxError] = paramScheme.type.checkSchema(convertedValue, paramScheme);
						if (isSyntax) break;
					}
				}
				if (isSyntax) {
					paramsEndless[param] = convertedValue;
				}
				else {
					if (paramScheme.required) { required.unsyntax.push({param : param, description : formatMessage(this.error[selectedSyntaxError], selectedSyntaxError, paramScheme, convertedValue, param) }); }
					else { additional.unsyntax.push({param : param, description : formatMessage(this.error[selectedSyntaxError], selectedSyntaxError, paramScheme, convertedValue, param)}); }
				}
			}
		}
		if (required.missed.length > 0 || required.unsyntax.length > 0 || additional.unsyntax.length > 0) {
			throw this.MainObject.paramsError(required, additional);
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
			let value;
			let paramScheme;
			let paramsCompiles = Object.assign(this.paramsCompiles, this.MainObject.sessionData);
			
			for (let param in paramsCompiles) {
				paramScheme = {
					required      : false,
					type          : this.isDynamic ? typesApi.dynamic : typesApi.unknown,
					allow_methods : ['get', 'post', 'put', 'delete'],
					conversion    : false,
					allow_params  : ['headers', 'json', 'params', 'query', 'body', 'files', 'cookies']
				};
				for (let key in paramsCompiles[param]) { paramScheme[key] = paramsCompiles[param][key]; }
				if (params[param] === undefined) {
					if (paramScheme.required) {
						required.missed.push(param);
					}
					else {
						additional.missed.push(param);
					}
				}
				else {
					let selectedSyntaxError = 'typeError';
					[isSyntax, value] = paramScheme.type.syntax(params[param], paramScheme.conversion);
					if (!isSyntax) {
						if (paramScheme.required) {
							required.unsyntax.push({param : param, description : this.error.typeError.split('{param}').join(param).split('{long_type}').join(paramScheme.type.long_name).split('{short_type}').join(paramScheme.type.short_name)});
						}
						else {
							additional.unsyntax.push({param : param, description : this.error.typeError.split('{param}').join(param).split('{long_type}').join(paramScheme.type.long_name).split('{short_type}').join(paramScheme.type.short_name)});
						}
					}
					else {
						[isSyntax, selectedSyntaxError] = paramScheme.type.checkSchema(value, paramScheme);
						if (!isSyntax) {
							if (paramScheme.required) {
								required.unsyntax.push({param : param, description : formatMessage(this.error[selectedSyntaxError], selectedSyntaxError, paramScheme, value, param)});
							}
							else {
								additional.unsyntax.push({param : param, description : formatMessage(this.error[selectedSyntaxError], selectedSyntaxError, paramScheme, value, param)});
							}
						}
						else {
							params[param] = value;
						}
					}
				}
			}
			
			if (required.missed.length > 0 || required.unsyntax.length > 0 || additional.unsyntax.length > 0) {
				throw this.MainObject.paramsError(required, additional);
			}
		}
		// Исполнение сессии
		let sessionData = new Session();
		let groupData = new Session();
		this.MainObject.session(params, sessionData);
		sessionData = sessionData._getValues();
		
		for (let groupId in this.groupsConnected) {
			this.groupsConnected[groupId].handler(params, groupData);
		}
		// for (let key in sessionData) { params[key] = sessionData[key]; }
		// Исполнение группы
		
		return this.execute(params, sessionData, groupData._getValues());
	}
	
	group (group) {
		this.groupsConnected.push(group);
	}
	
	execute (params, sessionData, groupData) {}
}


module.exports = Method;