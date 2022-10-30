const types = {
	dynamic : {
		long_name   : 'dynamic',
		short_name  : 'dyn',
		checkSchema : (value, schema) => {
			if (schema.values != undefined) {  // values
				if (schema.values.indexOf(value) == -1) {
					return [false, 'valuesError'];
				}
			}
			
			return [true, 'ok'];
		},
		syntax : (value, needs_convert = true) => [true, value]
	},
	unknown : {
		long_name   : 'unknown',
		short_name  : 'unk',
		checkSchema : (value, schema) => { throw new Error('Undefined datatype'); },
		syntax      : (value, needs_convert = true) => {
			throw new Error('Undefined datatype');
		}
	},
	float : {
		long_name   : 'float',
		short_name  : 'float',
		checkSchema : (value, schema) => {
			if (schema.values != undefined) {  // values
				if (schema.values.indexOf(value) == -1) {
					return [false, 'valuesError'];
				}
			}
			
			if (schema.min_length != undefined) {  // min_length
				if (value < schema.min_length) {
					return [false, 'minLengthError'];
				}
			}
			
			if (schema.max_length != undefined) {  // max_length
				if (value > schema.max_length) {
					return [false, 'maxLengthError'];
				}
			}
			
			return [true, 'ok'];
		},
		syntax : (value, needs_convert = true) => {
			function isFloat (value) {
				if (String(parseFloat(value)) == 'NaN') return false;
				return String(parseFloat(value)) == String(Number(value));
			}
			
			if (typeof(value) == 'number' & isFloat(value)) {
				return [true, value];
			}
			else if (needs_convert & isFloat(value)) {
				return [true, parseFloat(value)];
			}
			else {
				return [false, undefined];
			}
		}
	},
	array : (splitter, type=types.dynamic) => ({
		long_name   : `array (${type.long_name})`,
		short_name  : `arr (${type.short_name})`,
		checkSchema : (value, schema) => {
			if (schema.min_length != undefined) {  // min_length
				if (value.length < schema.min_length) {
					return [false, 'minLengthError'];
				}
			}
			
			if (schema.max_length != undefined) {  // max_length
				if (value.length > schema.max_length) {
					return [false, 'maxLengthError'];
				}
			}
			
			return [true, 'ok'];
		},
		syntax : (value, needs_convert = false) => {
			if (typeof(value) == 'string' & !!needs_convert) {
				value = value.split(splitter);
			}
			else if (typeof(value) != 'object') {
				return [false, undefined];
			}
			// checking type of array
			let isSyntax = Object.assign({}, value).filter(item => type.syntax(item, needs_convert)[0]).length == value.length;
			return [isSyntax, isSyntax ? value : undefined]
		}
	}),
	integer : {
		long_name   : 'integer',
		short_name  : 'int',
		checkSchema : (value, schema) => {
			if (schema.values != undefined) {  // values
				if (schema.values.indexOf(value) == -1) {
					return [false, 'valuesError'];
				}
			}
			
			if (schema.min_length != undefined) {  // min_length
				if (value < schema.min_length) {
					return [false, 'minLengthError'];
				}
			}
			
			if (schema.max_length != undefined) {  // max_length
				if (value > schema.max_length) {
					return [false, 'maxLengthError'];
				}
			}
			
			return [true, 'ok'];
		},
		syntax : (value, needs_convert = false) => {
			function isInt (value) {
				if (String(parseInt(value)) == 'NaN') return false;
				return String(parseInt(value)) == String(Number(value));
			}
			
			if (typeof(value) == 'number' & isInt(value)) {
				return [true, value];
			}
			else if (needs_convert & isInt(value)) {
				return [true, parseInt(value)];
			}
			else {
				return [false, undefined];
			}
		}
	},
	file : (allowed_types=null) => ({
		long_name   : 'file',
		short_name  : 'file',
		checkSchema : (value, schema) => {
			if (schema.min_length != undefined) {  // min_length
				if (value.size < schema.min_length) {
					return [false, 'minLengthError'];
				}
			}
			
			if (schema.max_length != undefined) {  // max_length
				if (value.size > schema.max_length) {
					return [false, 'maxLengthError'];
				}
			}
			
			if (allowed_types != null) {
				let file_extension = value.name.split(".")[value.name.split(".").length - 1];
				if (allowed_types.indexOf(file_extension.toLowerCase()) == -1) {
					return [false, 'unAllowExtension'];
				}
			}
			
			return [true, 'ok'];
		},
		syntax : (value, needs_convert = false) => {
			if (typeof(value) != 'object') {
				return [false, undefined];
			}
			else {
				let syntaxed = value.name != undefined &
				               value.mv != undefined &
				               value.mimetype != undefined &
				               value.data != undefined &
				               value.tempFilePath != undefined &
				               value.truncated != undefined &
				               value.size != undefined &
				               value.md5 != undefined;
				return [syntaxed, syntaxed ? value : undefined];
			}
		}
	}),
	string : {
		long_name   : 'string',
		short_name  : 'str',
		checkSchema : (value, schema) => {
			if (schema.values != undefined) {  // values
				if (schema.values.indexOf(value) == -1) {
					return [false, 'valuesError'];
				}
			}
			
			if (schema.min_length != undefined) {  // min_length
				if (value.length < schema.min_length) {
					return [false, 'minLengthError'];
				}
			}
			
			if (schema.max_length != undefined) {  // max_length
				if (value.length > schema.max_length) {
					return [false, 'maxLengthError'];
				}
			}
			
			return [true, 'ok'];
		},
		syntax : (value, needs_convert = false) => {
			if (typeof(value) == 'string') {
				return [true, value];
			}
			else if (needs_convert) {
				return [true, value.toString()];
			}
			else {
				return [false, undefined];
			}
		}
	}
};


module.exports = types;