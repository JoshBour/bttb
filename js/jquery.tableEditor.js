;
(function ($, window, document, undefined) {
    var pluginName = 'tableEditor',
        editorWrapper = null,
        defaults = {
            type: "text",
            text: "",
            useEditor: false
        };

    function _createEditField(target) {
        var $element = this.$element,
            type = this._settings.type,
            text = this._settings.text,
            $returnElement;
        switch (type) {
            case "textarea":
                console.log(text);
                $returnElement = $('<input />', {
                    value: text,
                    type: "text"
                });
                $returnElement.appendTo(target).jqte();
                _toggleShadow();
                break;
            case "text":
                $returnElement = $('<textarea />', {
                    "text": this._settings.text
                });
                $returnElement.appendTo(target);
                break;
            case "select":
                $returnElement = $element.children("select").clone().removeClass('invisible');
                console.log(text);
                $returnElement.children("option").each(function () {
                    var $option = $(this);
                    if ($option.val() == text) $option.attr('selected', 'selected');
                });
                $returnElement.appendTo(target).selectbox();
                break;
            case "datetime":
            case "time":
            case "date":
                $returnElement = $('<input />', {
                    value: this._settings.text,
                    type: "text"
                });
                $returnElement.appendTo(target);
                $returnElement = _dateTimePicker.call(this, $returnElement);
                break;

        }
        return $returnElement.addClass('tableEditField');
    }

    function _draw() {

        if (editorWrapper == null) {
            var that = this,
                element = that.$element,
                parent = element.parent(),
                position = element.offset(),
                body = $("body");


            editorWrapper = $('<div></div>', {
                "class": "tableEditorWrapper"
            }).appendTo(body).hide();

            // we add the editor
            var editor = $('<div></div>', {
                "class": "tableEditor"
            }).appendTo(editorWrapper);

            _createEditField.call(that, editor).focus();

            // we add the action buttons
            var btnWrapper = $('<div></div>', {
                "class": "tableEditorActions"
            }).appendTo(editor);

            $('<a></a>', {
                "class": "tableButton tableCancel",
                "text": "Cancel"
            }).appendTo(btnWrapper).on('click', function (event) {
                _destroy.call(that);
            });

            $('<a></a>', {
                "class": "tableButton tableDone",
                "text": "Done"
            }).appendTo(btnWrapper).on('click', function (event) {
                _doneHandler.call(that, event);
            });

            _updatePosition.call(that);

            //else if((position.left + editorWrapper.outerWidth()) > parent.outerWidth()){
            //        console.log("edwwwwwwww");
            //
            //    }

            //console.log(position.left + editorWrapper.outerWidth());
            // first we calculate the left position according to the body width

        }
    }

    function _doneHandler(event) {
        var type = this._settings.type,
            value = "";
        switch (type) {
            case "textarea":
                editorWrapper.removeClass('tableEditorTextarea');
                value = editorWrapper.find('.jqte_editor').html();
                value = value.replace(/\\?div/gi, "p"); // replace the divs
                // replace
                break;
            case "text":
                value = $.trim(editorWrapper.find('textarea').val());
                break;
            case "select":
                value = $.trim(editorWrapper.find('select').val());
                this._settings.text = value;
                break;
            case "datetime":
            case "time":
            case "date":
                value = $.trim(editorWrapper.find('input').val());
                break;

        }
        value = value ? value : "-";
        this._settings.text = value;
        this.$element.children('.tableDataContent').text(value);
        _destroy.call(this);
    }

    function _dateTimePicker(element) {
        var that = this,
            type = that._settings.type,
            format = "d-m-Y H:i",
            timePicker = true,
            datePicker = true;
        if (type != "datetime") {
            if (type == "date") {
                timePicker = false;
                format = "d-m-Y";
            } else {
                datePicker = false;
                format = "H:i";
            }
        }

        // add the shadow to the body
        element.datetimepicker({
            lazyInit: true,
            timepicker: timePicker,
            datepicker: datePicker,
            format: format,
            formatDate: format,
            closeOnDateSelect: true,
            lang: 'el',
            inline: true,
            onGenerate: function (current_time, $input) {
                $input.css("display","block");
                _updatePosition.call(that);
            }
        });

        return element;
    }

    function _updatePosition() {
        if (editorWrapper) {
            var $element = this.$element,
                offset = $element.offset(),
                document = $(window),
                editor = editorWrapper.children('.tableEditor');

            // we reset the classes
            $element.removeClass('tableDataActive').removeClass('tableDataActiveInverted');

            if (this._settings.type == "textarea") {
                editorWrapper.addClass("tableEditorTextarea");
                editorWrapper.css({
                    "margin-left": "-" + (editorWrapper.outerWidth() / 2) + "px",
                    "margin-top": "-" + (editorWrapper.outerHeight() / 2) + "px"
                });
            } else {
                // we store which side of the cell the editor starts from
                var leftSide = true;
                if ((offset.left + editorWrapper.outerWidth()) >= document.width()) {
                    var left = offset.left - (editorWrapper.outerWidth() - $element.outerWidth());
                    editorWrapper.css("left", left);
                    leftSide = false;
                } else {
                    editorWrapper.css("left", offset.left);
                }
                // then we calculate the top position according to the height level of the parent element
                if (offset.top > (document.height() - editorWrapper.outerHeight() - 150)) {
                    editorWrapper.css("top", (offset.top - editorWrapper.outerHeight()));
                    $element.addClass('tableDataActiveInverted');
                    editor.css("box-shadow", "none");

                    if (!leftSide) {
                        editor.css("border-radius", "3px 3px 0 3px");
                    } else {
                        editor.css("border-radius", "3px 3px 3px 0");
                    }
                } else {
                    editorWrapper.css("top", offset.top + $element.outerHeight());
                    $element.addClass("tableDataActive");

                    if (!leftSide) {
                        editor.css("border-radius", "3px 0 3px 3px");
                    } else {
                        editor.css("border-radius", "0 3px 3px 3px");
                    }
                }
            }
            editorWrapper.show();
        }
    }

    function _toggleShadow(type) {
        var shadow = $('#shadow');
        console.log(shadow.length);
        if (shadow.length > 0 || type=="hide") {
            shadow.detach();
        } else {
            $('<div />', {'id': 'shadow'}).appendTo('body');
        }
    }

    function _destroy() {
        if(this._settings.type == "textarea") _toggleShadow("hide");
        editorWrapper.detach();
        editorWrapper = null;
        this.$element.removeClass("tableDataActive");
        this.$element.removeClass("tableDataActiveInverted");

    }


    function refresh() {
        this._updatePosition();
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
        this.$element = $(element);
        this._settings = $.extend({}, defaults, options);

        console.log(this._settings);
    }

    Plugin.prototype = {
        toggle: function () {
            this._draw();
        },
        _draw: _draw,
        _updatePosition: _updatePosition,
        refresh: refresh
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