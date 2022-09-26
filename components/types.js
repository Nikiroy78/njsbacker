module.exports = {
	string : {
		long_name : 'string',
		short_name : 'str', 
		syntax : (value, needs_convert = true) => {
			if (typeof(value) == 'string') {
				return true, value;
			}
			else {
				return false, needs_convert ? value.toString() : undefined;
			}
		}
	}
}