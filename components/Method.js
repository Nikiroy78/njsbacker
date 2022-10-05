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
	) {
		
	}
	
	execute () {}
}


module.exports = Method;