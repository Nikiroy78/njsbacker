const backend = require('index');

// Создаём экземпляр класса backend.Main
var server = new backend.Main(
	false  // Отобразить в заголовках информацию о текущем фреймворке
);
// Настраиваем сессию (опционально)
server.session = (params, sessionData) => {
	sessionData._setValue('example', 1);  // Задать значение
	console.log(sessionData.example);     // Получить значение из сессии
	sessionData._remove('example');       // Убрать значение
	return 1;                             // Успешно
	return 'Example error';               // Пример ошибки
};
// Настраиваем вывод
server.error = (error) => ({
	mainbody : { error },
	headers  : {
		errored : 1
	},
	cookies  : {
		avava   : 1
	},
	// redirect_uri: '';  // if want redirect to another url
	code: 400
});
server.resposne = (response) => ({
	mainbody : { response },
	headers : {
		errored: 0	
	},
	cookies : {},
	// redirect_uri: '';  // if want redirect to another url
	code: 200
});
server.paramsError = (required, additional) => ({ required, additional });

// Создаём класс группы методов
class ExampleMethodGroup extends backend.Group {
	handler (params, session) {  // Путевая обработка
		session._setValue('example', 1);  // Задать значение
		console.log(session.example);     // Получить значение из сессии
		session._remove('example');       // Убрать значение
		return 1;                         // Успешно
		return 'Example error'            // Пример ошибки
	}
}
// Создаём класс метода
class ExampleMethod extends backend.Method {
	/*
	var result = this.MainObject.call(method : string, params : object)  // Вызов подключённого метода
	*/
	
	// Обработчик параметров
	execute (params) {
		return params.text;
		throw { code: 'EXAMPLE_ERROR', details: new Object() };
	}
}
var exampleMethod = new ExampleMethod('/example', {
	text: {
		required : true,
		type : backend.types.string,
		conversion : false,
		// values : [],
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
server.server().listen(8080);