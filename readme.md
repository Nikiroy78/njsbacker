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
### Method

## Additional clases and objects
## Examples