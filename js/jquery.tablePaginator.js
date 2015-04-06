;
(function ($, window, document, undefined) {
    var pluginName = 'tablePaginator',
        $list,
        $body,
        cachedColumns = [],
        defaults = {
            appendTarget: "",
            columns: [],
            defaultLength: 15,
            activePage: 1,
            columnTarget: "",
            updateCallback: null
        };

    function setDefaultLength($length) {
        this._settings.defaultLength = $length;
    }

    function refresh(updateColumns) {
        if (typeof updateColumns == "undefined") updateColumns = true;
        if (updateColumns)
            this._columnSetup();
        this._refreshTotalPages();
        this._draw();
        if (this._settings.updateCallback) {
            this._settings.updateCallback();
        }
    }

    function _columnSetup() {
        var settings = this._settings,
            columnTarget = settings.columnTarget;

        settings.columns = [];

        if (columnTarget instanceof jQuery) {
            columnTarget = columnTarget.toArray();
        } else if (!(columnTarget.constructor === Array)) {
            columnTarget = $(columnTarget).toArray();
        }


        for (var i = 0; i < columnTarget.length; i++) {
            var element = (columnTarget[i] instanceof TableColumn) ? columnTarget[i].element : $(columnTarget[i]);
            if (!$body) $body = element.parent();

            if (!element.is(":visible")) element.detach();
            else settings.columns.push(element);
        }

        if (cachedColumns.length <= 0) cachedColumns = settings.columns.slice();

    }

    function _draw() {
        var that = this,
            settings = that._settings,
            columns = settings.columns,
            options,
            activePage = (settings.activePage > that.totalPages) ? 1 : settings.activePage;

        that._createList();

        // we append the previous button
        that._append({
            title: "Previous Page",
            text: "Previous"
        },activePage-1, (activePage - 1 <= 0));

        // we append the columns to the body
        var displayIndex = ((activePage - 1) * settings.defaultLength);
        for (var i = 0, added = 0; i < columns.length; i++) {
            if (i >= displayIndex && added < settings.defaultLength) {
                columns[i].appendTo($body);
                added++;
            } else {
                columns[i].detach();
            }
        }

        // if we have more than 10 pages we format them
        if (that.totalPages > 10) {
            var startLimit = 6;
            var endLimit = that.totalPages - 4;

            // the start links
            if(activePage < startLimit){
                for(i=1; i<startLimit;i++){
                    that._append({},i, activePage == i);
                    // if the active page is 5, we show one more
                    if(i == startLimit-1 && activePage == startLimit-1) that._append({},i+1, false);
                }
            }else{
                // if the active page is not within the first 5 pages, we just show 2
                for(i=1; i<=2; i++){
                    that._append({},i, false);
                }
                that._append({
                    "class" : "disabled",
                    "text" : "..."
                },0, true);
            }

            // the middle links
            if(activePage < endLimit && activePage >= startLimit){
                for (i = activePage - 1; i <= activePage + 1; i++) {
                    that._append({}, i, activePage == i);
                }

            }

            // the end links
            if(activePage < endLimit){
                that._append({
                    "class" : "disabled",
                    "text" : "..."
                },0, true);
                for(i=that.totalPages-1; i<=that.totalPages; i++){
                    that._append({},i, false);
                }
            }else{
                // if the active page is within the last 5 pages, we show all of them
                for(i=endLimit; i<=that.totalPages; i++){
                    if(activePage == endLimit && i == endLimit)
                        that._append({},i-1, false);

                    that._append({},i, activePage == i);
                }
            }
        } else {
            // we start from 1 so that the pages are in order: 1, 2 ,3 etc
            for (i = 1; i < that.totalPages + 1; i++) {
                that._append({},i, activePage == i);
            }
        }

        // we append the next button
        that._append({
            title: "Next Page",
            text: "Next"
        },activePage+1, activePage+1 > this.totalPages);
    }

    function _createList() {
        var settings = this._settings,
            target = settings.appendTarget;

        if ($list && $list.length > -1) {
            $list.html('');
        } else {
            $list = $("<ul></ul>", {
                "class": "tablePagination"
            });

            if (target) {
                if (target instanceof jQuery)
                    target.append($list);
                else
                    $(target).append($list);
            } else {
                this.$table.append($list);
            }
        }
    }

    function _refreshTotalPages() {
        this.totalPages = Math.ceil(this._settings.columns.length / this._settings.defaultLength);
    }

    function _changePageHandler(page, event) {
        this._settings.activePage = page;
        this._draw();
        if (this._settings.updateCallback) this._settings.updateCallback();
    }

    function _append(options,i, useSpan) {
        var that = this,
            $listItem = $('<li></li>').appendTo($list),
            attributes = {
                href: "#page-" + i,
                title: "Go to page " + i,
                text: i,
                "class" : ""
            };

        attributes = $.extend({}, attributes, options);

        if (!useSpan)
            $('<a></a>', attributes).appendTo($listItem).on('click', function (e) {
                return that._changePageHandler.call(that, parseInt(attributes.href.substr(6)), event);
            });
        else
            $('<span></span>', {text: attributes.text}).appendTo($listItem);

        return $listItem;
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
        this.$table = element;
        this._settings = $.extend({}, defaults, options);

        // check if there is a page selected through the page url
        var location = window.location.href.split('#');
        if (location.length > 1) {
            this._settings.activePage = parseInt(location[1].substr(5));
        }

        this.init();
    }

    Plugin.prototype = {
        init: function () {

            this.refresh(true);
        },
        refresh: refresh,
        setDefaultLength: setDefaultLength,
        _createList: _createList,
        _append: _append,
        _changePageHandler: _changePageHandler,
        _draw: _draw,
        _refreshTotalPages: _refreshTotalPages,
        _columnSetup: _columnSetup
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