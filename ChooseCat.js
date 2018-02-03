function ChooseCat( $node, params ){
	// private:
	this.__root = $node;
	this.__params = {};
	this.__columnCount = 0;
	this.__chooseWay = {};
	this.__chooseTree = [];

	self = this;

	// public:

	this.getChooseTree = function() {
		return this.__chooseTree;
	}
	this.getLastChoosen = function() {
		return this.__chooseTree[this.__chooseTree.length - 1];
	}
	this.getChooseByColumn = function( column ) {
		return this.__chooseTree[column - 1];
	}

	// private:

	this.__setParams = function chooseCat__setParams( params ){
		this.__params.closeButton = (!!params.closeButton)? params.closeButton : true;
		this.__params.maxColumns = (!!params.maxColumns)? params.maxColumns : 4;
		this.__params.urlGetCategories = (!!params.urlGetCategories)? params.urlGetCategories : null;
		this.__params.lang = (!!params.lang)? params.lang : 'ru';
	}
	this.__setParams( params );

	this.__removeColumns = function chooseCat__removeColumns( column ) {
		// Удалить столбцы с `data-column > column`
		var $columns = self.__root.find(".chooseCat__column");
		$columns.each(function (item){
			var data_column = $(this).attr('data-column');
			if( data_column > column ) {
				console.log('Remove column: ', column);
				self.__chooseTree.pop();
				self.__columnCount--;
				$(this).remove();
			}
		});
	}

	this.__addColumn = function chooseCat__addColumn( items, isFirst ) {
		items = items || [];
		isFirst = isFirst || false;
		
		if( items.length < 1 ) {
			return;
		}

		var $chooseCat__column = $('<div class="chooseCat__column">');
		if( isFirst ) {
			$chooseCat__column.addClass('chooseCat__column--first');
		}

		$chooseCat__column.attr('data-column', self.__columnCount);

		var $chooseCat__list = $('<ul class="chooseCat__list">');

		// Перебираем item'ы и добавляем к списку
		items.map(function (item){
			$chooseCat__item = $('<li class="chooseCat__item">');
			if( isFirst ) {
				$chooseCat__item.addClass('chooseCat__item--firstColumn');
			}
			$chooseCat__item.text( item.name );
			$chooseCat__item.attr('data-id', item.id);
			$chooseCat__item.attr('data-level', self.__columnCount);

			// Обработка клика на item
			$chooseCat__item.on('click', function chooseCat__itemClick(){
				var id = $(this).attr('data-id');
				var column = $(this).attr('data-level');
				$(this).parent().find(".chooseCat__item").each(function (){
					$(this).removeClass("chooseCat__item--active");
				});
				$(this).addClass("chooseCat__item--active");
				self.__removeColumns(column);
				self.__chooseTree[column] = id; // push нельзя, если подкатегорий нет - то __remooveColumns не удалит последнее значение
				if( self.columnCount >= self.__params.maxColumns ){
					return;
				}
				self.__getCategories(id);
			})

			$chooseCat__list.append( $chooseCat__item );
		});

		// Увеличиваем кол-во колонок
		this.__columnCount += 1;

		// Привязываем список к колонке
		$chooseCat__column.append( $chooseCat__list );

		// Привязываем колонку к __chooseWay
		this.__chooseWay.append( $chooseCat__column );

		// root>__chooseWay>__column>__list>__item
		// TODO: emit Событие обновления данных
	}

	this.__construct = function chooseCat__construct(){
		var html = '';
		var closeButton = $('<button class="chooseCat__closeButton"></button>');
		this.__chooseWay = $('<div class="chooseCat__chooseWay">');

		// Добавим класс к root-ноде
		this.__root.addClass('chooseCat');

		// Создаём и привязываем кнопку закрытия, если она включена в параметрах
		if( this.__params.closeButton ) {
			closeButton.on('click', function (){
				$(this).parents('.chooseCat').remove(); // TODO: Класс не очень хороший якорь, но this.root.remoove() не получается
			});
			this.__root.append( closeButton );
		}

		// Добавим к root-ноде chooseWay
		this.__root.append( this.__chooseWay );

		// Отправляем запрос за первой колонкой, parent_id для верхнего уровня иерархии - 0
		this.__getCategories(0);

		// root>__closeButton+__chooseWay>__column
		return this;
	}

	this.__parseResponse = function chooseCat__parseResponse( data ) {
		// Тут разбирается ответ сервера и формируется собственный объект, для последующего использования
		var array = JSON.parse( data );
		var response = [];
		array.forEach(function (item){
			var object = {
				id: item['id'],
				name: item['name_' + self.__params.lang]
			};
			response.push( object );
		});

		return response;
	}

	this.__iRecievedData = function chooseCat__iRecievedData( response ) {
		// Вызывается когда данные пришли с сервера
		// https://goo.gl/6qQeJR
		self.__addColumn( response, this.__columnCount === 0 );
	}


	this.__getCategories = function chooseCat__getCategories( parent_id ) {
		// Отправляем запрос на сервер, для получения дочерних категорий, по parent_id
		var url_query = this.__params.urlGetCategories.replace("{parent_id}", parent_id);
		$.ajax({
			url: url_query,
			success: function(data){
				var response = self.__parseResponse( data );
				self.__iRecievedData( response );
			},
			error: function(){
				// TODO: Получить более детальные сведения об ошибке
				console.log("[ERROR] ChooseCat: Произошла ошибка во время выполнения запроса");
			}
		});
	}

	return this.__construct();
}
$(document).ready(function (){
	var choosecat = new ChooseCat( $('#chooseCat'), {
		lang: "ru",
		urlGetCategories: "/getCategories.php"
	});
});