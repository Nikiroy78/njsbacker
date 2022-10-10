const backend = require('./index');

// Создаём класс бэкенда, наследующий класс backend.Main
class Main extends backend.Main {
	session (params, sessionData) {               // Настраиваем сессию (опционально)
		sessionData._setValue('example', 1);  // Задать значение
		console.log(sessionData.example);     // Получить значение из сессии
		sessionData._remove('example');       // Убрать значение
		return 1;                             // Успешно
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
server.typeError = 'param {param} must be only {long_type} ({short_type})';

// Создаём класс группы методов
class ExampleMethodGroup extends backend.Group {
	handler (params, session) {                   // Путевая обработка
		session._setValue('example', 1);      // Задать значение
		console.log(session.example);         // Получить значение из сессии
		session._remove('example');           // Убрать значение
		return 1;                             // Успешно
		return 'Example error'                // Пример ошибки
	}
}
// Создаём класс метода
class ExampleMethod extends backend.Method {
	/*
	var result = this.MainObject.call(method : string, params : object)  // Вызов подключённого метода
	*/
	
	// Обработчик параметров
	execute (params) {
		console.log(params);
		return params.text;
		throw { code: 'EXAMPLE_ERROR', details: new Object() };
	}
}

var exampleMethod = new ExampleMethod('example', '/example', {
	text: {
		required : true,
		type : backend.types.string,
		conversion : false,
		// values : ['123', 'test'],
		min_length : 1,
		max_length : 255,
		// allow_methods : ['post'],
		// allow_params : ['json'],
	}
});
// Привяжем метод к группе
exampleMethod.group(ExampleMethodGroup);
// Привяжем метод к основному проекту
server.method(exampleMethod);

// Запускаем сервер
server.server('/api/v1'/*, { Информация о SSL }*/).listen(8080, async (err) => {
	if (err) { throw err; }
	else {
		console.log('SERVER RUNNED');
	}
});