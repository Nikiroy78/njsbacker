class Group {
	constructor (sessionData) {
		this.sessionData = sessionData
	}
	
	handler (params, session) { return 1; }
}


module.exports = Group;