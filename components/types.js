module.exports = {
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
}