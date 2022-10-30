# Njsbacker
Njsbacker is framework for backend developing at node.js/express.js *(in future versions can be supports any frameworks)*
## How it works?
Below you can see simple scheme as framework works: from **session** response get into **Main class** where or getting at **Group** and next into **Method**, or at **Method Class** where response data from http-params, **Group** and **Session** hadling at execution method.
![simple scheme of njsbacker work](https://sun9-71.userapi.com/impg/VjRpi90eSMsV05NPRU3GVNxwEbem8ITGjErioQ/lyD9S-F_qI4.jpg?size=726x341&quality=96&sign=d48f6eff6f6da9747675287096eb24b3&type=album)
After init main logic, logic can be converted at **express.js router** or **express.js server (app)**. Below you can see example code:
```javascript
// ... another code
mainserverObject.server(
    '/api'  // mount path of api
).listen(8080, '127.0.0.1', async (err) => {
    if (err) {
        throw err;
    }
    else {
        console.log('SERVER RUNNED');
    }
});
```
Below you can see how responses from http/call-function hadless into reponse at scheme:
![simple scheme of njsbacker handling data an executing](https://sun9-78.userapi.com/impg/etOt-TcZ1KVxUnIm3laKJgAveXaMEOGfbGY0Wg/dIekdeOOKeo.jpg?size=649x353&quality=96&sign=958f40b23ab188ea03612bc98def05fe&type=album)
Http data or Data from call method gets into pre_execution binary function where checks data: syntax/missed or no: if all successfuly data get into Session/Group/Method execute method else throwing error.
### Before work.
Before work you must install this package:
```bash
# for npm
npm install njsbacker
# for yarn
yarn add njsbacker
```
And import at yoy project
```javascript
// from nodejs
const njsbacker = require('njsbacker');
```
```typescript
// from typescript
import njsbacker from 'njsbacker';
```
*(We will be use node.js)*
## General clases and objects
### Main
Main class is main backend-application, mainbased skelet of project. Mainclass object containts methods, groups, sessionHandler, etc. For all works you must create your class from njsbacker.Main
```javascript
const njsbacker = require('njsbacker');

class App extends njsbacker.Main {
    // ...
}
```
If you want handling your format errors, responses *(default JSON)* you must add methods into your body of class:
```javascript
const njsbacker = require('njsbacker');

class App extends njsbacker.Main {
    errorHadler (error) {  // Handling and show errors at backend application.
		let errorData;
		let codeStatus = 400;
		if (error.name == "API Error") {
			errorData = {
				code    : error.message,
				details : error.data
			};
		}
		else {
			errorData = {
				name  : error.name,
				stack : error.stack
			};
			codeStatus = 502;
		}
		return {
			mainbody : { error : errorData },
			headers  : {
			    error : error.name
			},
			cookies  : {
			    error_rised_at : Math.round(new Date().getTime() / 1000)
			},
			// redirect_uri: '';  // if want redirect to another url
			code: codeStatus
		}
	}
	
	responseHandler (response) { return ({  // Handling responses at backend application
		mainbody : { response },
		headers : {
			errored: 0	
		},
		cookies : {},
		// redirect_uri: '';  // if want redirect to another url
		code: 200
	}) };
	
	session (params, sessionData) {           // Session function
		sessionData._setValue('example', 1);  // Set value of sessionData object
		console.log(sessionData.example);     // Get value from sessionData object
		sessionData._remove('example');       // Remove value
		return;                               // Successful
		throw 'Example error';                // Example of error
	}
	
	paramsError (required, additional) {  // Handling missed/unsyntax params
		return new njsbacker.ApiError('UNSYNTAX_OR_MISSED_REQUIRED_PARAMS', { required, additional });
	}
}
```
#### Method: errorHadler
Hadling and format errors. First argument is error object when may be hadled by this method. Returns handled error schema when must be containts next params:
```typescript
mainbody     : < buffer / object / string >  // content when will be returns
headers      : object                        // headers into http-response
cookies      : object                        // cookies when will be applyed
code         : number                        // http-code
redirect_uri : string                        // redirect url (non-required, undefined if not redirect)
```
#### Method: responseHandler
Handling responses at backend application. First argument is reponse from .execute method at **Method** object. Must be containts next params:
```typescript
mainbody     : < buffer / object / string >  // content when will be returns
headers      : object                        // headers into http-response
cookies      : object                        // cookies when will be applyed
code         : number                        // http-code
redirect_uri : string                        // redirect url (non-required, undefined if not redirect)
```
#### Method: session
Method that call before executing method or groups of method. First argument - params from http/call method, second argument - **Session** object. This method setting **Session** object params and return error at http-response if error throws.
#### Method: paramsError
Method that return error when missing or unsyntax params.
#### Create object of njsbacker.Main and configuration
Before work you must create object of njsbacker.Main:
```javascript
var app = new App(
    false  // Returns information about njsbacker in headers.
);
```
If you're planning use session you can configure him:
```javascript
app.setSessionParams(
	{
		example_session_param : {
			required : false,
			type : njsbacker.types.string
		}
	}
);
```
**First param** - information about inputed params [(Params inforamtion)](#params-information)
### Method
After you create **njsbacker.Main** object you must create class that extends from **njsbacker.Method**:
```javascript
class ExampleMethod extends njsbacker.Method {
	// Params handler
	execute (params, session, groups) {
	    // Any code...
		return anotherResult;
		// If you needs raising error:
		throw new njsbacker.ApiError(
		    'EXAMPLE_ERROR',  // Error code
		    new Object()      // Error details
		);
	}
}
```
#### Method: execute
Method of executing current method. Return data when will be sended to njsbacker.Main.responseHandler method.
#### Connection and configure njsbacker.Method
After creating class you must create object of njsbacker.Method:
```javascript
var exampleMethod = new ExampleMethod('example', '/example', {
	text : {
		required : true,
		type : backend.types.string,
		min_length : 1,
		max_length : 255
	}
});
```
**First param** - name of method into system.  
**Second param** - path to method into http-server  
**Third param** - information about inputed params [(Params inforamtion)](#params-information)
If you create object of **njsbacker.Group** you can pin it with use next method:
```javascript
exampleMethod.group(groupObject);
```
And that this method work you must pin this method to object of **njsbacker.Main** with use next method:
```javascript
app.method(exampleMethod);
```
#### Additional tool into njsbacker.Method: this.MainObject.call
Inside execute method you can refer to existing methods into API.  
**Annotation**: this.MainObject is object of **njsbacker.Main** there was been included to **njsbacker.Method**
```javascript
class ExampleMethod extends njsbacker.Method {
    execute (params, session, groups) {
        // Another code here...
        this.MainObject.call('SecondExampleMethodName', {
            param : "value"
        });
        // Another code here...
        return result;
    }
}
```
**First param** - name of method.  
**Second param** - params there sends into method.  
## Additional clases and objects
### Params Information
Before reading this part we tolds about inputed params into http.  
**Example:**
```javascript
var paramsInfo = {
    paramNameCookie : {
        required     : true,
        type         : njsbacker.types.string,
        import_key   : 'param',
        allow_params : ['cookies']
    },
    paramNameQuery : {
        type         : njsbacker.types.string,
        import_key   : 'param',
        allow_params : ['query']
    }
}

var exampleMethod = new ExampleMethod('example', '/example', paramsInfo);
```
**Objects keys and default values**:
```typescript
required      : boolean = false                                                              // Required param or no.
import_key    : string  = param                                                              // Key when using as param int http headers/string (etc.)
save_key      : string  = param                                                              // Key when will be saved at param object 
type          : object  = njsbacker.types.unknown                                            // Param's datatype
allow_methods : array   = ['get', 'post', 'put', 'delete']                                   // Methods when method will be listen.
conversion    : boolean = false                                                              // Covert datatype if inputed datatype not equal "type" param.
allow_params  : array   = ['headers', 'json', 'params', 'query', 'body', 'files', 'cookies'] // Http-params where will be reads into method.
```
### Group
This is njbacker object where executing before **njsbacker.Method** if was been pinned to **njsbacker.Method**.  
Before work you must create class when extends from **njsbacker.Method** and create into class method **handler**:
```javascript
class ExampleGroup extends njsbacker.Method {
    handler (params, session) {	              // Path handling
		session._setValue('example', 1);      // Set value
		console.log(session.example);         // Get value from session
		session._remove('example');           // Remove value
		return 1;                             // Successful
		throw 'Example error'                 // Error example
	}
}
```
### types
**dynamic** - Dynamic datatype  
**unknown** - Unknown datatype *(Raising error)*  
**float** - Float *(real)* datatype  
**array** *(function)* - array of data.  
```javascript
// Example of array
var datatype = njsbacker.types.array(
    splitSymbol,  // symbol where will be used for splits queries, cookies and other string params. (required)
    typeOfArray,  // type of array data.                                                            (default: dynamic)
);
```
**integer** - Integer datatype.  
**file** *(function)* - file object [read more in express-fileupload module](https://www.npmjs.com/package/express-fileupload)  
```javascript
// Example of file
var datatype = njsbacker.types.file(
    allowedExtensions,  // allowed extensions (default: null (all extensions allowed))
);
```
**string** - String datatype.  
## Example code
```javascript
const njsbacker = require('./index');

// Create backend mainclass then extends from njsbacker.Main:
class Main extends njsbacker.Main {
	session (params, sessionData) {
		sessionData._setValue('example', 1);  // Set value
		console.log(sessionData.example);     // Get value from session
		sessionData._remove('example');       // Remove value
		return 1;                             // Successful
		throw 'Example error'                 // Example of error
	}
	
	responseHandler (response) { return ({
		mainbody : { response },
		headers : {
			errored: 0	
		},
		cookies : {},
		// redirect_uri: '';  // if want redirect to another url
		code: 200
	}) };
	
	/* paramsError (required, additional) { return({ required, additional }) }; */
}
// Create object of Main class.
var server = new Main(
	false  // Show information about this library into headers.
);
server.setSessionParams(  // Set required params for session.
	{
		session_id : {
			required : false,
			type : njsbacker.types.integer
		}
	}
);

// Create class from method's group.
class ExampleMethodGroup extends njsbacker.Group {
	handler (params, session) {	              // Path handling
		session._setValue('example', 1);      // Set value
		console.log(session.example);         // Get value from session
		session._remove('example');           // Remove value
		return 1;                             // Successful
		throw 'Example error'                 // Example of error
	}
}
// Create classes of method
class ExampleAnyMethodsOfHandlingInformation extends njsbacker.Method {
	execute (params, session, groups) {
		return {
			json_data : params.json_name,
			query_data : params.query_name,
		}
	}
}


class ExampleMethod extends njsbacker.Method {
	/*
	var result = this.MainObject.call(method : string, params : object)  // Вызов подключённого метода
	*/
	
	// Params handler
	execute (params, session, groups) {
		return {
			text   : params.text,
			result : this.MainObject.call('sum', {
				a  : 15,
				b  : 17,
				session_id : params.session_id
			})
		};
		throw new njsbacker.ApiError('EXAMPLE_ERROR', new Object());
	}
}


class SumMethod extends njsbacker.Method {
	execute (params, session, groups) {
		return params.a + params.b;
	}
}

class FileMethod extends njsbacker.Method {
	execute (params, session, groups) {
		return JSON.stringify(params.file);
	}
}

// Create class objects
var eamohi = new ExampleAnyMethodsOfHandlingInformation('handler', '/handler', {
	queryName : {
		required : true,
		type : njsbacker.types.string,
		import_key : 'name',
		allow_params : ['query']
	},
	jsonName : {
		required : true,
		type : njsbacker.types.string,
		import_key : 'name',
		allow_methods : ['post'],
		allow_params : ['json']
	}
});

var fileMethod = new FileMethod('file', '/file', {
	file : {
		required : true,
		type : njsbacker.types.file()
	}
});

var sumMethod = new SumMethod('sum', '/sum', {
	a : {
		required : true,
		type : njsbacker.types.integer,
		conversion : false,
		// allow_methods : ['post'],
	},
	b : {
		required : true,
		type : njsbacker.types.integer,
		conversion : false,
		// allow_methods : ['post'],
	}
});

var exampleMethod = new ExampleMethod('example', '/example', {
	text : {
		required : true,
		type : njsbacker.types.string,
		conversion : false,
		values : ['123', 'test'],
		min_length : 1,
		max_length : 255,
		// allow_methods : ['post'],
		// allow_params : ['json'],
	}
});
// Pins methods to group
exampleMethod.group(new ExampleMethodGroup({
	ses : {
		type : njsbacker.types.string
	}
}));
sumMethod.group(new ExampleMethodGroup({
	ses : {
		type : njsbacker.types.string
	}
}));
// Pin methods to mein project
server.method(exampleMethod);
server.method(sumMethod);
server.method(fileMethod);
server.method(eamohi);

// Run server
server.server('/api/v1').listen(8080, async (err) => {
	if (err) { throw err; }
	else {
		console.log('SERVER RUNNED');
	}
});
```
You can show example code in file **codeExample.js**