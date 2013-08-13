var db = openDatabase('hoolay','1.0','hoolay app slide',2*1024*1024);
var Db = {};

$.extend(Db,{
	db : db,
	init : function () {
		return db.transaction(function(tx){

				tx.executeSql('CREATE TABLE IF NOT EXISTS home_slide(id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,data,postdate)');

		});
	},
	getAll : function (callback){

		return db.transaction(function(tx){

			tx.executeSql('SELECT * FROM home_slide ORDER BY postdate DESC',[],function(tx,res){

				var rows = res.rows,
					ret = [],len,item;
					if( len = rows.length ){
						for(var i = 0;i<len;i++){
							item = rows.item(i);
							item.date_string = new Date(item.postdate).toLocaleString();
							ret.push(item);
						}
					}

					$.isFunction(callback) && callback.call(tx,ret);
			});

		})

	},
	getItem : function(id,callback){

		return db.transaction(function(tx){

			tx.executeSql( 'SELECT * FROM home_slide WHERE id='+id ,[],function(tx,res){

				$.isFunction(callback) && callback.call(tx,res.rows.item(0));

			});

		})

	},
	addItem : function(data,callback){

	    return db.transaction(function(tx){

	    	tx.executeSql('INSERT INTO home_slide (data,postdate) VALUES (?,?)',[ data, (new Date()).getTime() ],callback||$.noop);

	  })

	},
	saveItem : function(data,callback){

	    return db.transaction(function(tx){

	    	tx.executeSql('UPDATE home_slide SET data=?,postdate=? WHERE id='+data.id,[ data.data, (new Date()).getTime() ],callback||$.noop);

	  })

	},
	delItem : function(id,callback){

		return db.transaction(function(tx){

			tx.executeSql( 'DELETE FROM home_slide WHERE id='+id ,[],callback||$.noop);

		})

	},
	clearAll : function(callback){
		return db.transaction(function(tx){
			tx.executeSql('DELETE FROM home_slide',[],callback || $.noop);
		})
	}
})