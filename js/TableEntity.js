var TableData = (function($){
    var attributes = {
        type : "text",
        attribute : "",
        text : "",
        classes : "",
        element : "",
        index : 0
    };

    //function _clickHandler(){
    //    var that = this;
    //    that.attributes.element.on("dblclick",function(e){
    //        console.log("trigg");
    //        $(this).tableEditor({
    //            type : that.attributes.type,
    //            text : that.attributes.text
    //        }).toggle();
    //    });
    //}

    function TableData(options){
        this.attributes = $.extend({}, attributes, options);

      //  this._clickHandler();
    }

    //TableData.prototype = {
    //    _clickHandler : _clickHandler
    //};


    return TableData;
}(jQuery));

var TableColumn = (function($){
    function TableColumn(options){
        this.tableData = options.tableData;
        this.location = options.location;
        this.element = options.element;
        this.index = options.index;
    }

    return TableColumn;
}(jQuery));