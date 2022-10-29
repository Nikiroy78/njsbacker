const njsbacker = require('./index');

// Создаём класс бэкенда, наследующий класс njsbacker.Main
class Main extends njsbacker.Main {
	/* errorHandler (error) { return {
		mainbody : JSON.stringify({ error : {}, error }),
		headers  : {
			errored : 1
		},
		cookies  : {
			avava   : 1
		},
		// redirect_uri: '';  // if want redirect to another url
		code: 400
	}};*/
	
	session (params, sessionData) {
		sessionData._setValue('example', 1);  // Задать значение
		console.log(sessionData.example);     // Получить значение из сессии
		sessionData._remove('example');       // Убрать значение
		return 1;                             // Успешно
		throw 'Example error'                 // Пример ошибки
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
// Создаём экземпляр класса Main
var server = new Main(
	false  // Отобразить в заголовках информацию о текущем фреймворке
);
server.setSessionParams(  // Зададим необходимые параметры для сессии
	{
		session_id : {
			required : false,
			type : njsbacker.types.integer
		}
	}
);

// Создаём класс группы методов
class ExampleMethodGroup extends njsbacker.Group {
	handler (params, session) {	              // Путевая обработка
		session._setValue('example', 1);      // Задать значение
		console.log(session.example);         // Получить значение из сессии
		session._remove('example');           // Убрать значение
		return 1;                             // Успешно
		throw 'Example error'                 // Пример ошибки
	}
}
// Создаём классы методов
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
	
	// Обработчик параметров
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

// Создаём экземпляры классов
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
// Привяжем метод к группе
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
// Привяжем метод к основному проекту
server.method(exampleMethod);
server.method(sumMethod);
server.method(fileMethod);
server.method(eamohi);

// Запускаем сервер
server.server('/api/v1').listen(8080, async (err) => {
	if (err) { throw err; }
	else {
		console.log('SERVER RUNNED');
	}
});