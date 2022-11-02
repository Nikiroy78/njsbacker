const typesApi = require('./types');
const Session = require('./Session');


var errHandlers = new Object();


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
		default :
			return errHandlers[errorType](message, errorType, scheme, value, param);
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
	
	setError (errorCode, message, handler=null) {
		this.error[errorCode] = message;
		if (!!handler) {
			errHandlers[errorCode] = handler;
		}
	}
	
	useDynamicType (condition) {
		this.isDynamic = !!condition;
	}
	
	_pinMain (mainObject) {
		this.MainObject = mainObject;
	}
	
	async executeIntoExpressRouter (
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
				import_key    : param,
				save_key      : param,
				type          : this.isDynamic ? typesApi.dynamic : typesApi.unknown,
				allow_methods : ['get', 'post', 'put', 'delete'],
				conversion    : false,
				allow_params  : ['headers', 'json', 'params', 'query', 'body', 'files', 'cookies']
			};
			// Configure paramScheme
			for (let key in paramsCompiles[param]) { paramScheme[key] = paramsCompiles[param][key]; }
			// check missible
			if (headers[paramScheme.import_key] != undefined & paramScheme.allow_params.indexOf('headers') != -1) { checkKeys.push('headers'); }
			if (json[paramScheme.import_key] != undefined & paramScheme.allow_params.indexOf('json') != -1) { checkKeys.push('json'); }
			if (query[paramScheme.import_key] != undefined & paramScheme.allow_params.indexOf('query') != -1) { checkKeys.push('query'); }
			if (body[paramScheme.import_key] != undefined & paramScheme.allow_params.indexOf('body') != -1) { checkKeys.push('body'); }
			if (files[paramScheme.import_key] != undefined & paramScheme.allow_params.indexOf('files') != -1) { checkKeys.push('files'); }
			if (cookies[paramScheme.import_key] != undefined & paramScheme.allow_params.indexOf('cookies') != -1) { checkKeys.push('cookies'); }
			if (params[paramScheme.import_key] != undefined & paramScheme.allow_params.indexOf('params') != -1) { checkKeys.push('params'); }
			
			if (checkKeys.length == 0) {
				if (paramScheme.required) { required.missed.push(paramScheme.import_key); }
				else { additional.missed.push(paramScheme.import_key); }
			}
			else if (paramScheme.allow_methods.indexOf(currentMethod) == -1) {
				if (paramScheme.required) { required.unsyntax.push({param : paramScheme.import_key, description : formatMessage(this.error.httpMethodError, 'httpMethodError', paramScheme, currentMethod, paramScheme.import_key) }); }
				else { additional.unsyntax.push({param : paramScheme.import_key, description : formatMessage(this.error.httpMethodError, 'httpMethodError', paramScheme, currentMethod, paramScheme.import_key)}); }
			}
			else {
				checkKeys = checkKeys.sort((a, b) => Number(b == 'query' || b == 'cookies') - Number(a == 'query' || a == 'cookies'));
				let isSyntax;
				let convertedValue;
				let selectedSyntaxError = 'typeError';
				for (let key in checkKeys) {
					switch (checkKeys[key]) {
						case 'query' :
							[isSyntax, convertedValue] = paramScheme.type.syntax(query[paramScheme.import_key], true);
							break;
						case 'cookies' :
							[isSyntax, convertedValue] = paramScheme.type.syntax(cookies[paramScheme.import_key], true);
							break;
						case 'headers' :
							[isSyntax, convertedValue] = paramScheme.type.syntax(headers[paramScheme.import_key], true);
							break;
						case 'body' :
							[isSyntax, convertedValue] = paramScheme.type.syntax(body[paramScheme.import_key], true);
							break;
						case 'json' :
							[isSyntax, convertedValue] = paramScheme.type.syntax(json[paramScheme.import_key], paramScheme.conversion);
							break;
						case 'params' :
							[isSyntax, convertedValue] = paramScheme.type.syntax(params[paramScheme.import_key], paramScheme.conversion);
							break;
						case 'files' :
							[isSyntax, convertedValue] = paramScheme.type.syntax(files[paramScheme.import_key], paramScheme.conversion);
							break;
					}
					if (isSyntax) {
						[isSyntax, selectedSyntaxError] = paramScheme.type.checkSchema(convertedValue, paramScheme);
						if (isSyntax) break;
					}
				}
				if (isSyntax) {
					paramsEndless[paramScheme.save_key] = convertedValue;
				}
				else {
					if (paramScheme.required) { required.unsyntax.push({param : paramScheme.import_key, description : formatMessage(this.error[selectedSyntaxError], selectedSyntaxError, paramScheme, convertedValue, paramScheme.import_key) }); }
					else { additional.unsyntax.push({param : paramScheme.import_key, description : formatMessage(this.error[selectedSyntaxError], selectedSyntaxError, paramScheme, convertedValue, paramScheme.import_key)}); }
				}
			}
		}
		if (required.missed.length > 0 || required.unsyntax.length > 0 || additional.unsyntax.length > 0) {
			throw this.MainObject.paramsError(required, additional);
		}
		else {
			return await this.pre_execute(paramsEndless, false);
		}
	}
	
	async pre_execute (params, needsChecking = true) {
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
					import_key    : param,
					save_key      : param,
					allow_methods : ['get', 'post', 'put', 'delete'],
					conversion    : false,
					allow_params  : ['headers', 'json', 'params', 'query', 'body', 'files', 'cookies']
				};
				for (let key in paramsCompiles[param]) { paramScheme[key] = paramsCompiles[param][key]; }
				
				if (params[paramScheme.import_key] === undefined) {
					if (paramScheme.required) {
						required.missed.push(paramScheme.import_key);
					}
					else {
						additional.missed.push(paramScheme.import_key);
					}
				}
				else {
					let selectedSyntaxError = 'typeError';
					[isSyntax, value] = paramScheme.type.syntax(params[paramScheme.import_key], paramScheme.conversion);
					if (!isSyntax) {
						if (paramScheme.required) {
							required.unsyntax.push({param : paramScheme.import_key, description : this.error.typeError.split('{param}').join(paramScheme.import_key).split('{long_type}').join(paramScheme.type.long_name).split('{short_type}').join(paramScheme.type.short_name)});
						}
						else {
							additional.unsyntax.push({param : paramScheme.import_key, description : this.error.typeError.split('{param}').join(paramScheme.import_key).split('{long_type}').join(paramScheme.type.long_name).split('{short_type}').join(paramScheme.type.short_name)});
						}
					}
					else {
						[isSyntax, selectedSyntaxError] = paramScheme.type.checkSchema(value, paramScheme);
						if (!isSyntax) {
							if (paramScheme.required) {
								required.unsyntax.push({param : paramScheme.import_key, description : formatMessage(this.error[selectedSyntaxError], selectedSyntaxError, paramScheme, value, paramScheme.import_key)});
							}
							else {
								additional.unsyntax.push({param : paramScheme.import_key, description : formatMessage(this.error[selectedSyntaxError], selectedSyntaxError, paramScheme, value, paramScheme.import_key)});
							}
						}
						else {
							params[paramScheme.save_key] = value;
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
		
		return await this.execute(params, sessionData, groupData._getValues());
	}
	
	group (group) {
		this.groupsConnected.push(group);
	}
	
	execute (params, sessionData, groupData) {}
}


module.exports = Method;