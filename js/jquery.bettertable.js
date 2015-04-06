;
(function ($, window, document, undefined) {
    var pluginName = 'betterTable',
        MESSAGE_CONFIRM_DELETE = "You are going to delete this column. Are you sure?",
        activeSort = null,
        hoveredElements = [],
        searchCache = {
            "columns": [],
            "matchedData": [] // contains the matched TableData instances
        },
        paginator = null,
        activePage = 1,
        sortIndexCache = [],
        loadingBar,
        defaults = {
            sort: "asc",
            unsortableColumns: [],
            hiddenColumns: [],
            tableName: "",
            lengthMenu: [5, 10, 15, -1],
            columnNumber: 20,
            defaultLength: 10,
            deletable: true,
            saveLocation: "",
            deleteLocation: "",
            entityIdCell: 0
        };

    function _toggleLoadingBar() {
        if (!loadingBar) {
            this.$table.hide();
            var loadingBox = $('<div></div>', {
                "class": "loadingBox"
            }).appendTo(this.$table.parent());

            loadingBar = $('<div></div>', {
                "class": "loadingBar"
            }).appendTo(loadingBox);
        } else {
            loadingBar.parent().detach();
            this.$table.fadeIn();
            loadingBar = null;
        }
    }

    function _load(callBack, hideLoadingBar) {
        var that = this;
        if (!loadingBar)
            that._toggleLoadingBar();

        loadingBar.animate({
            width: "+=25%"
        }, 100, function () {
            callBack.call(that);
            if (hideLoadingBar)
                that._toggleLoadingBar();

        });
    }

    /**
     * The table options setup
     * Appends the options responsible for search, add, save etc.
     *
     * @private
     */
    function _optionsSetup() {
        var that = this,
            settings = that._settings,
            name = settings.tableName,
            lengthMenu = settings.lengthMenu;

        var wrapper = $('<div />', {
            "class": "tableOptions"
        }).prependTo(that.$table);

        // we add the search input
        $('<input />', {
            type: "text",
            "class": "tableSearch",
            placeholder: "Search..."
        }).appendTo(wrapper);


        that.$_tableBody.perfectScrollbar({useBothWheelAxes: true});

        // we add the length menu
        // TODO validate the length is a number
        var lengthMenuWrapper = $('<div></div>', {
            "class": "tableLengthWrapper",
            text: "Posts Showing: "
        });
        var select = $('<select />', {
            "class": "tableLength"
        }).appendTo(lengthMenuWrapper);
        for (var i = 0; i < lengthMenu.length; i++) {
            var text = lengthMenu[i] == -1 ? "All" : lengthMenu[i];
            var option = $('<option />', {
                value: lengthMenu[i],
                text: text
            });
            if (lengthMenu[i] == settings.defaultLength) option.attr('selected', 'selected');
            option.appendTo(select);
        }

        var tableFooter = $('<div></div>', {
            "class": "tableFooter"
        }).append(lengthMenuWrapper).appendTo(that.$table);

        // if the user provided a name, we display it
        if (name != "") {
            $('<span />', {
                "class": "tableName",
                text: name
            }).appendTo(wrapper);
        }

        // we add the save and add buttons
        var actions = $('<div />', {
            "class": "tableActions"
        }).appendTo(wrapper);
        $('<a />', {
            title: "Save your changes",
            "class": "tableSave",
            text: "Save"
        }).appendTo(actions);
        $('<a />', {
            title: "Add a new column",
            "class": "tableAdd",
            text: "Add"
        }).appendTo(actions);


    }

    /**
     * The callback handler for the sort event
     *
     * @param plugin Pointer to the plugin
     * @private
     */
    function _sortHandler(plugin) {
        var btn = $(this),
            tableData = btn.closest('.tableData'),
            index = tableData.index();
        if (!btn.hasClass('sortActive')) {
            var sort = btn.hasClass('sortAsc') ? "asc" : "desc",
                bodyColumns = plugin._bodyColumns;
            sortIndexCache = [];

            if (activeSort) activeSort.removeClass('sortActive');
            btn.addClass('sortActive');
            activeSort = btn;

            bodyColumns.sort(function (a, b) {
                a = a.tableData[index].attributes.text;
                b = b.tableData[index].attributes.text;

                if (a == b)
                    return 0;
                else if (sort == "asc")
                    return a < b ? -1 : 1;
                else
                    return a > b ? -1 : 1;
            });

            for (var i = 0; i < bodyColumns.length; i++) {
                plugin.$_tableBody.append(bodyColumns[i].element);
            }
        }
        paginator.refresh();
    }

    /**
     * The callback handler for the search event
     *
     * @param plugin Pointer to the plugin
     * @private
     */
    function _searchHandler(plugin) {
        var input = $(this),
            value = input.val().toLocaleLowerCase(),
            bodyColumns = plugin._bodyColumns;

        plugin.$_tableBody.empty(); // empty the table body

        if (value.length >= 1) {

            // we search through each column
            for (var data in bodyColumns) {
                var match = false,
                    $element = bodyColumns[data].element,
                    tableData = bodyColumns[data].tableData;
                // and then we iterate the column's data to search for matches
                for (var i = 0; i < tableData.length; i++) {
                    var attributes = tableData[i].attributes,
                        text = attributes.text.toLocaleLowerCase();

                    if (text.indexOf(value) != -1) {
                        attributes.element.addClass('tableMatchedResult');
                        searchCache.matchedData.push(tableData[i]);
                        match = true;
                    } else {
                        attributes.element.removeClass('tableMatchedResult');
                    }
                }
                if (!match) {
                    $element.hide();
                } else {
                    plugin.$_tableBody.append($element);
                    //    searchCache.columns.push(bodyColumns[data]);
                }
            }
        } else {
            for (i = 0; i < searchCache.matchedData.length; i++)
                searchCache.matchedData[i].attributes.element.removeClass('tableMatchedResult');

            for (i = 0; i < bodyColumns.length; i++)
                plugin.$_tableBody.append(bodyColumns[i].element.css('display', 'inline-block'));

        }

        paginator.refresh();
    }

    /**
     * The callback handler for the length change event
     *
     * @param plugin Pointer to the plugin
     * @private
     */
    function _changeHandler(plugin) {
        var select = $(this),
            option = select.children('option:selected'),
            value = option.val(),
            defaultLength = plugin._settings.defaultLength,
            bodyColumns = plugin._bodyColumns,
            columnSize = bodyColumns.length;

        if (value >= columnSize || value == -1)
            value = columnSize;


        paginator.setDefaultLength(value);
        paginator.refresh(false);

        plugin._adjustTableBodyWidth();
        plugin._settings.defaultLength = value;

    }

    function _deleteHandler(tableEntity){
        if(confirm(MESSAGE_CONFIRM_DELETE)) {
            var idCell = tableEntity.tableData[this._settings.entityIdCell];
            console.log(idCell.attributes.text);
            $.ajax({
                url: this._settings.deleteLocation,
                type: "POST",
                data: {entityId: idCell.attributes.text},
                success: function (data, text) {
                    console.log(data);
                },
                error: function (request, status, error) {
                    alert(request.responseText);
                }
            });
        }
    }

    function _saveHandler() {
        var columns = this._bodyColumns;
        var entities = [];

        for (var i = 0; i < columns.length; i++) {
            var entity = [],
                data = columns[i].tableData;
            for (var j = 0; j < data.length; j++) {
                entity.push({
                    attribute: data[j].attributes.attribute,
                    text: data[j].attributes.text
                })
            }
            entities.push(entity);
        }

        console.log(entities);
        $.ajax({
            url: this._settings.saveLocation,
            type: "POST",
            data: {entities: entities},
            success: function (data,text) {
                console.log(data);
                //if (e.success == 1) {
                //    location.reload(true)
                //}
            },
            error : function(request,status,error){
                alert(request.responseText);
            }
        });
    }

    /**
     * The table header setup.
     * Manages the tableColumns & tableData of the header section.
     *
     * @private
     */
    function _headerDataSetup() {
        var plugin = this,
            headerColumns = plugin._headerColumns,
            columns = plugin._columns,
            settings = plugin._settings,
            unsortableColumns = settings.unsortableColumns,
            hiddenColumns = settings.hiddenColumns;


        // first we setup the header data and make them sortable
        this._tableHeader.children('.tableColumn').each(function () {
            var that = $(this),
                columnData = that.children('div'),
                columnDataLength = columnData.size(),
                dataIndex = 1,
                tableDataArray = [];

            columnData.each(function () {
                var divElement = $(this),
                    classes = divElement.attr('class') ? divElement.attr('class') : "";

                divElement.addClass("tableData");

                var entity = new TableData({
                    element: divElement,
                    text: divElement.children('span').text(),
                    classes: classes,
                    index: dataIndex
                });

                if (unsortableColumns.indexOf(dataIndex) == -1) {
                    var sortWrapper = $('<div />', {
                        "class": "sortOptions"
                    }).appendTo(divElement);
                    $('<a />', {
                        "class": "sortAsc",
                        "title": "Ascending Sort"
                    }).appendTo(sortWrapper);
                    $('<a />', {
                        "class": "sortDesc",
                        "title": "Descending Sort"
                    }).appendTo(sortWrapper);
                }

                // hide the span if it's in the hidden columns
                if (hiddenColumns.indexOf(dataIndex) != -1) {
                    divElement.addClass('invisible');
                }

                tableDataArray.push(entity);
                dataIndex++;
            });


            if (settings.deletable) {
                var deleteSpan = $('<div></div>', {
                    "class": "tableData delete",
                    text: "Delete"
                }).appendTo(that);
                columnData.push(deleteSpan)
            }

            var tableColumn = new TableColumn({
                tableData: tableDataArray,
                location: "header",
                element: that,
                index: that.index()
            });
            headerColumns.push(tableColumn);
            columns.push(tableColumn);
        });
    }

    /**
     * The table body setup.
     * Manages the tableColumns & tableData of the body section.
     *
     * @private
     */
    function _bodyDataSetup() {
        var plugin = this,
            bodyColumns = plugin._bodyColumns,
            columns = plugin._columns,
            settings = plugin._settings,
            hiddenColumns = settings.hiddenColumns;

        this.$_tableBody.children('.tableColumn').each(function () {
            var that = $(this),
                columnData = that.children('div'),
                dataIndex = 1,
                tableDataArray = [],
                columnIndex = that.index();


            that.attr('data-index', columnIndex);

            // we iterate the data of each column
            columnData.each(function () {
                var divElement = $(this),
                    classes = divElement.attr('class') ? divElement.attr('class') : "",
                    type = divElement.attr('data-type'),
                    spanChild = divElement.children('span:first-of-type').addClass("tableDataContent"),
                    text = spanChild.text();

                divElement.children(':not(span)').addClass('invisible');
                divElement.addClass('tableData');
                var entity = new TableData({
                    element: divElement,
                    text: (!text || text == "-") ? "" : text,
                    attribute: divElement.attr('data-attribute'),
                    type: type ? type : "text",
                    classes: classes,
                    index: dataIndex
                });

                if (type == "textarea") {
                    console.log(text);
                    // replace the span with a div that will contain the html code
                    spanChild.replaceWith($("<div></div>", {
                        "class": spanChild.attr('class'),
                        "text": spanChild.text()
                    }).hide());
                    $('<span></span>', {
                        "class": "button",
                        text: "Click to Edit"
                    }).appendTo(divElement);
                }

                // hide the span if it's in the hidden columns
                if (hiddenColumns.indexOf(dataIndex) != -1) {
                    divElement.addClass('invisible');
                }

                tableDataArray.push(entity);
                dataIndex++;
            });

            var tableColumn = new TableColumn({
                tableData: tableDataArray,
                location: "body",
                element: that,
                index: columnIndex
            });

            if (settings.deletable) {
                var deleteSpan = $('<div></div>', {
                    "class": "tableData delete"
                }).appendTo(that);
                $("<img/>", {
                    src: "images/delete-icon.png",
                    width: 16,
                    height: 16
                }).appendTo(deleteSpan);

                // setup the delete callback
                deleteSpan.on('dblclick',function(){
                    _deleteHandler.call(plugin,tableColumn);
                })
            }

            bodyColumns.push(tableColumn);
            columns.push(tableColumn);
        });

    }

    /**
     * Adjusts the width of the table body, according to the window width.
     *
     * @private
     */
    function _adjustTableBodyWidth() {
        this.$_tableBody.css('width', $(window).width() - 150);
        this.$_tableBody.perfectScrollbar('update');
    }

    /**
     * Attaches all the event handlers for the table.
     *
     * @private
     */
    function _tableHandlersSetup() {
        var plugin = this;

        $(window).on('resize', function () {
            plugin._adjustTableBodyWidth();
        });
        $(document).on('mouseenter', '.tableBody .tableData', function () {
            var element = $(this).length > -1 ? $(this) : $(this).parent(),
                index = element.index(),
                bodyColumns = plugin._bodyColumns;
            for (var column in bodyColumns) {
                var tableData;
                if (element.hasClass('delete')) {
                    tableData = bodyColumns[column].element.children().last();
                } else
                    tableData = bodyColumns[column].tableData[index].attributes.element;
                tableData.addClass('hovered');
                hoveredElements.push(tableData);
            }
        });

        $(document).on('mouseleave', '.tableBody .tableData', function () {
            // here essentially we clear the hovered elements cache
            for (var i = 0; i < hoveredElements.length; i++)
                hoveredElements[i].removeClass('hovered');
            hoveredElements = [];
        });

        $(document).on('click', '.sortAsc, .sortDesc', function () {
            _sortHandler.call(this, plugin);
        });

        $(document).on('keyup', '.tableSearch', function (event) {
            _searchHandler.call(this, plugin, event);
        });

        $(document).on('change', '.tableLength', function () {
            _changeHandler.call(this, plugin);
        });

        $(document).on('click', '.tableSave', function () {
            _saveHandler.call(plugin);
        });

        //$.each(plugin._bodyColumns,function(index, value){
        //   var data = plugin._bodyColumns[index].tableData;
        //    $.each(data,function(index, value){
        //        var attributes = value.attributes,
        //            element = attributes.element;
        //
        //        element.on('dblclick',function(e){
        //            console.log(attributes.type);
        //        });
        //    });
        //});

        $(document).on("click", ".tableData .button", function () {
            var button = $(this),
                parent = button.parent();

            parent.tableEditor({
                type: parent.attr('data-type'),
                text: button.siblings("div").text(),
                useEditor: true
            }).toggle();
        });


        $(document).on('dblclick', '.tableData', function (e) {
            var dataElement = $(this),
                type = dataElement.attr('data-type');
            if(!dataElement.hasClass('delete')){
                if (type != "textarea") {
                    dataElement.tableEditor({
                        type: type,
                        text: dataElement.children('span').text()
                    }).toggle();
                }
            }
        });

    }

    /**
     * The plugin constructor.
     * Creates the required plugin attributes and calls the init method.
     *
     * @param element The element the plugin is called on
     * @param options The options object passed by the user
     * @constructor
     */
    function Plugin(element, options) {
        this.element = element;
        this.$table = $(element);
        this.$_tableBody = this.$table.children('.tableBody');
        this._tableHeader = this.$table.children('.tableHeader');
        this._settings = $.extend({}, defaults, options);
        this._headerColumns = [];
        this._bodyColumns = [];
        this._columns = [];
        this._entity = this.$table.attr('data-entity');

        this.init();
    }

    Plugin.prototype = {
        init: function () {


            this._headerDataSetup();
            this._bodyDataSetup();
            this._tableHandlersSetup();
            this._optionsSetup();
            paginator = this.$table.tablePaginator({
                appendTarget: ".tableFooter",
                defaultLength: this._settings.defaultLength,
                columnTarget: ".tableBody .tableColumn",
                updateCallback: function () {
                    $('.tableBody').perfectScrollbar('update');
                }
            });

            // this will always be called last, after all other processing has been done
            this._adjustTableBodyWidth();


            //    var that = this;
            //    this._load(that._headerDataSetup);
            //    this._load(that._bodyDataSetup);
            //    this._load(that._tableHandlersSetup);
            //    this._load(that._optionsSetup);
            //    this._load(function() {
            //        paginator = that.$table.tablePaginator({
            //            appendTarget: ".tableFooter",
            //            defaultLength: that._settings.defaultLength,
            //            columnTarget: ".tableBody .tableColumn",
            //            updateCallback: function () {
            //                $('.tableBody').perfectScrollbar('update');
            //            }
            //        });
            //
            //        // this will always be called last, after all other processing has been done
            //        that._adjustTableBodyWidth();
            //    },true);
            //
        },
        _headerDataSetup: _headerDataSetup,
        _bodyDataSetup: _bodyDataSetup,
        _optionsSetup: _optionsSetup,
        _adjustTableBodyWidth: _adjustTableBodyWidth,
        _tableHandlersSetup: _tableHandlersSetup,
        _toggleLoadingBar: _toggleLoadingBar,
        _load: _load,
        size: function () {
            return this._bodyColumns.size();
        },
        update: function () {

        },
        delete: function () {

        },
        getColumns: function () {
            return this._columns;
        },
        getBodyColumns: function () {
            return this._bodyColumns;
        },
        getHeaderColumns: function () {
            return this._headerColumns;
        }
    };


    $.fn[pluginName] = function (options) {
        var plugin;
        this.each(function () {
            plugin = $.data(this, 'plugin_' + pluginName);
            if (!plugin) {
                plugin = new Plugin(this, options);
                $.data(this, 'plugin_' + pluginName, plugin);
            }
        });

        return plugin;
    }

})(jQuery, window, document);