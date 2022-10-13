const backend = require('./index');

// Создаём класс бэкенда, наследующий класс backend.Main
class Main extends backend.Main {
	session (params, sessionData, next) {	  // Настраиваем сессию (опционально)
		sessionData._setValue('example', 1);  // Задать значение
		console.log(sessionData.example);     // Получить значение из сессии
		sessionData._remove('example');       // Убрать значение
		return next();                        // Успешно
		return 'Example error';               // Пример ошибки
	};
	
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
		return 'Example error'                // Пример ошибки
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
			required : true,
			type : backend.types.integer,
			values : [1]
		}
	}
);
server.typeError = 'param {param} must be only {long_type} ({short_type})';

// Создаём класс группы методов
class ExampleMethodGroup extends backend.Group {
	handler (params, session) {	              // Путевая обработка
		session._setValue('example', 1);      // Задать значение
		console.log(session.example);         // Получить значение из сессии
		session._remove('example');           // Убрать значение
		return 1;                             // Успешно
		return 'Example error'                // Пример ошибки
	}
}
// Создаём классы методов
class ExampleMethod extends backend.Method {
	/*
	var result = this.MainObject.call(method : string, params : object)  // Вызов подключённого метода
	*/
	
	// Обработчик параметров
	execute (params) {
		return {
			text   : params.text,
			result : this.MainObject.call('sum', {
				a : 15,
				b : 17,
				session_id : params.session_id
			})
		};
		throw new backend.ApiError('EXAMPLE_ERROR', new Object());
	}
}


class SumMethod extends backend.Method {
	execute (params) {
		return params.a + params.b;
	}
}

// Создаём экземпляры классов
var sumMethod = new SumMethod('sum', '/sum', {
	a : {
		required : true,
		type : backend.types.integer,
		conversion : false,
		// allow_methods : ['post'],
	},
	b : {
		required : true,
		type : backend.types.integer,
		conversion : false,
		// allow_methods : ['post'],
	}
});

var exampleMethod = new ExampleMethod('example', '/example', {
	text: {
		required : true,
		type : backend.types.string,
		conversion : false,
		values : ['123', 'test'],
		min_length : 1,
		max_length : 255,
		// allow_methods : ['post'],
		// allow_params : ['json'],
	}
});
// Привяжем метод к группе
exampleMethod.group(ExampleMethodGroup);
sumMethod.group(ExampleMethodGroup);
// Привяжем метод к основному проекту
server.method(exampleMethod);
server.method(sumMethod);

// Запускаем сервер
server.server('/api/v1'/*, { Информация о SSL }*/).listen(8080, async (err) => {
	if (err) { throw err; }
	else {
		console.log('SERVER RUNNED');
	}
});