module.exports = {
	unknown : {
		long_name  : 'unknown',
		short_name : 'unk',
		syntax : (value, needs_convert = true) => {
			throw new Error('Undefined datatype');
		}
	},
	string : {
		long_name  : 'string',
		short_name : 'str', 
		syntax : (value, needs_convert = false) => {
			if (typeof(value) == 'string') {
				return true, value;
			}
			else if (needs_convert) {
				return true, needs_convert.toString()
			}
			else {
				return false, undefined;
			}
		}
	}
}