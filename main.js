$(function(){

		var fs = require('fs'),
			Mustache = require('mustache')

		Db.init();

//component

var Stage = function(){
		this.hash = ++Stage.uuid;	
		this.$el = $(Stage.tpl);
		this.$body = this.$el.find('.con');

		//attr
		this.$el.attr('id',this.getKey());
		//event delegate
		this._initEvents();

		Stage.manager.add(this);
	}

Stage.tpl = $('#winstage-tmpl').html();
Stage.uuid = 0;
Stage.manager = {};

$.extend(Stage.manager,{
	active : false,
	hash : {},
	alias : {},
	del : function(key){
		( key in this.hash && !this.active != key ) && (delete this[key]);
	},
	add : function(po){

		(po instanceof Stage) && ( this.hash[po.getKey()] = po,po.$el.appendTo('body') );

	},
	get : function(key){
		return (key in this.hash) && this.hash[key];
	},
	getStageByAlias : function(alias_key){

		var ret = false;

			if(typeof alias_key == 'string' && !!alias_key){

				ret = this.alias[alias_key];

				if(ret && ( ret = this.get(ret) ) ){

					return ret;

				}else{

					ret = new Stage();

					this.alias[alias_key] = ret.getKey();

				}
			}

		return ret;
	}
})

$.extend(Stage.prototype,{
	getKey : function(){
		return 'win'+this.hash;
	},
	_initEvents : function(){
		var that = this;

		//close
		this.$el.find('a.cancel').on('click',function(e){
			that.hide();
		})
	},
	show : function(){
		var cur;
		Stage.active && ( cur = Stage.manager.get(Stage.active) ) && cur.hide();

		this.$el.removeClass('bounceOutLeft').addClass('bounceInRight').show();
		Stage.active = this.getKey();
	},
	hide : function(){

		Stage.active == this.getKey() && (Stage.active = false);

		this.$el.removeClass('bounceInRight').addClass('bounceOutLeft');

	},
	setBody : function(body){

		this.$body.html(body);
	}
})


//BodyControl
var bodyCtrl = {
		/*$el : null,*/
		/*_initEvents : $.noop,*/
		render : function(stage){

			this.$el.find('input[name=postdate]').val( (new Date()).toLocaleString() );
			this.$el.css({
				'padding' : 10
			})

			stage.setBody(this.$el);

			this._initEvents();
		}
}

var bodyOfNew = $.extend({
		$el : (function(){

			return $( $('#class-form-tmpl').html() );

		})(),
		_initEvents : function(){
			var that = this;
			this.$el.find('.confirm-it').on('click',function(e){

				Db.addItem("[]",function(tx,err){
					if(!err) throw err;
						var id = err.insertId;
						var Win = Stage.manager.getStageByAlias('stage-edit');
							 bodyOfEdit.setID(id);
							 bodyOfEdit.render( Win );

							 Win.show();

				})

				return false;
			})

		}

},bodyCtrl)

var bodyOfEdit = $.extend({
		id : false,
		itemTpl : $('#edit-item-tmpl').html(),
		$el : $('<form class="edit-list form-inline"><div class="list"></div><div class="ctrl"><a href="javascript:;" class="btn btn-primary import-files">From files</a>&nbsp;<a class="btn btn-success add-item" href="javascript:;">Add Item</a>&nbsp;<a class="btn btn-danger submit-items" href="javascript:;">Submit</a></div></form>'),
		render : function(stage){

			stage.setBody(this.$el);


			this._initEvents();

			this.stage = stage;

		},
		setID : function(id){
			var that = this;

			Db.getItem(id,function(data){

				data = JSON.parse(data.data);


				if(!$.isArray(data) || !data.length){

					that.setList(that.itemTpl);

				}else{

					that.setList('');

					data.forEach(function(n,i){

						that.addItem(that.itemTpl,n);

					})

				}

				that.id = id;
			})

		},
		setList : function(items){
			this.$el.find('.list').html(items);
		},
		addItem : function(item,data){
			var $item = $(item);

			this.$el.find('.list').append($item);

				if( !$.isEmptyObject(data) ){
						$.each(data,function(key,val){

							$item.find('input[name='+key+']').val(val);

						})
				}

			$item.find('input').eq(0).focus();
		},
		_initEvents : function(){

			var that = this;


			//add
			this.$el.find('.add-item').on('click',function(){

				that.addItem( that.itemTpl );

			})

			//del delegate
			this.$el.on('click','.del-item',function(e){

				$(this).closest('p').remove();

			})

			this.$el.on('click','.submit-items',function(e){

				var data = that.$el.serializeArray(),res = null,i = 0,item = {},vo;

					if( !$.isEmptyObject(data) ){
						res = [];
						//data
						while(vo = data[i++]){

							item[vo.name] = vo.value;

								i%5 == 0 && ( res.push(item),item = Object.create({}) );
						}

						Db.saveItem({
							id : that.id,
							data : JSON.stringify(res)
						},function(err){
							
							console.log(that);
							that.stage.hide();

							$('.get-older').trigger('click');

						})

					}else{
						alert('请添加数据吧。');
					}

			})

		   		var $file = $('input[name=multi-file-com]');

		   			$file.on('change.import-items',function(e){

			   			var file = $(this).val(),item;

						file.split(';').forEach(function(n,i){
							
							if(!!n){

								var a = n.lastIndexOf('\\'),
									b = n.lastIndexOf('.');

								var name = n.substring(a+1,b);
								
									!!name && ( item = $(that.itemTpl),item.find('input[name=filename]').val(name),that.addItem( item )  );

							}

						})

						//reset value
						$(this).val('');

		   			})
		   this.$el.on('click','.import-files',function(e){

		   		$file.trigger('click');

		   })
		}
})

var bodyOfList = {
	listTpl : $('#list-item-tmpl').html(),
	$el : $('<ul class="show-list">'),
	render : function(stage){

		stage.setBody( this.$el );

		this._initEvents();

		this.stage = stage;

	},
	setData : function(data){

		var fragments = Mustache.render(this.listTpl,{
				list : data
		});
			this.$el.html(fragments);

	},
	_initEvents : function(){

		var that  =  this;
		//edit
		this.$el.on('click','.edit',function(e){
			var $this = $(this),
				id = $this.closest('.item').data('id');

			var Win = Stage.manager.getStageByAlias('stage-edit');

				bodyOfEdit.setID(id);
				bodyOfEdit.render(Win);
				Win.show();
		})
		//del
		this.$el.on('click','.del',function(e){

			var $this = $(this),
				$item = $this.closest('.item'),
				id = $item.data('id');

				confirm('确定要删除？') && Db.delItem(id,function(tx,err){
					if(  err.rowsAffected ){
						$item.slideUp();
					}else{
						alert('删除失败!');
					}
				});

		})
		var $saveas = $('input[name=saveas-file-com]');
		//saveas
		this.$el.on('click','.available',function(e){

			var data = $(this).closest('.item').find('.data').html(),
				data = JSON.parse(data);

				data = data.map(function(n){
					return [
								'__IMG__/v4/show_work/{dir}/'+n.filename+'.jpg',
								n.workid,
								n.workname,
								n.username,
								n.userid
					];
				})

				Modal.run( 'show' )
					 .setTitle('请将其复制，保存到一个文件 :)')
					 .setBody( JSON.stringify(data) );

				//$saveas.val('abc');

				//$saveas.trigger('click');

		})

	}

}
//modal
var Modal = {
		$el : (function(){
			return $($('#modal-box-tmpl').html());
		}()),
		run : function(opts){
			this.$el.modal(opts||{});
			return this;
		},
		setBody : function(body){
			this.$el.find('.modal-body').html(body);
			return this;
		},
		setTitle : function(title){
			this.$el.find('.modal-title').html(title);
			return this;
		}
}
//main 
		;;;(function(){

		var $file = $('input[name=single-file-com]');

			$file.on('change',function(e){
				var path = $(this).val();
				alert(path);
				fs.readFile(path, function (err, data) {
				  	if (err) throw err;
				  	//encoding?
				  	Modal.run('show').setTitle('File?').setBody(data+'');
				});
			})


			$('.get-files').on('click',function(){

				$file.trigger('click');

			})

			$('.get-websql').on('click',function(){

				Modal.run('show').setBody('WebSql ?! It looks so cool . but disappearance is certain ...');

			})
			//show all results panel
			$('.get-older , .set-new').on('click',function(e){

				var $this = $(this),Win;

				if( $this.hasClass('get-older') ){

					Win = Stage.manager.getStageByAlias('stage-lists');

					Win.show();

					Win.setBody('Loading...');

					Db.getAll(function(data){
						
						Win.$body.empty();

						bodyOfList.setData(data);
						bodyOfList.render(Win);

					})
					
				}else if( $this.hasClass('set-new') ){

					Win = Stage.manager.getStageByAlias('stage-new');

					bodyOfNew.render(Win);

					Win.show();

				}

			})


		})()

})