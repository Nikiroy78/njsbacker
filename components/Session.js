class Session {
	constructor () {
		this._namesReserved = ['_getValues', '_namesReserved', '_setValue', '_remove'];
	}
	
	_setValue (key, value) {
		if (this._namesReserved.indexOf(key) == -1) {
			this[key] = value;
		}
	}
	
	_remove (key, value) {
		if (this._namesReserved.indexOf(key) == -1) {
			delete this[key];
		}
	}
	
	_getValues () {
		let values = new Object();
		for (let value in this) {
			if (this._namesReserved.indexOf(value) == -1) {
				values[value] = this[value];
			}
		}
		
		return values;
	}
}


module.exports = Session;