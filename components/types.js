module.exports = {
	unknown : {
		long_name  : 'unknown',
		short_name : 'unk',
		syntax : (value, needs_convert = true) => {
			throw new Error('Undefined datatype');
		}
	},
	string : {
		long_name   : 'string',
		short_name  : 'str',
		checkSchema : (value, schema) => {
			if (schema.values != undefined) {
				if (schema.values.indexOf(value) == -1) {
					return [false, 'valuesError'];
				}
			}
		},
		syntax      : (value, needs_convert = false) => {
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