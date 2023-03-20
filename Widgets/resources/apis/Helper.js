/**
 * @version 1
 * @file
 * This is a helper that contains all the common functions used by the Custom Widgets *
 */

function _____x_____helper() {

    /** Converts num to RGB
     * @param {int} num number in the format BGR
     * @return {rgb} if properly converted returns the rgb, else returns null
     */
    this.numToRGB = function (num) {
        var v = 0;
        var r = 0;
        var g = 0;
        var b = 0;

        if (isNaN(num))
            return null;

        v = parseInt(num);
        r = v & 0xff;
        g = (v >> 8) & 0xff;
        b = (v >> 16) & 0xff;

        return 'rgb(' + r + ',' + g + ',' + b + ')';
    }

    /** Converts num to Key
     * @param {int} num number
     * @return {key} returns the key
     */
    this.numToKey = function (num) {
        var str = '' + num;
        var pad = '0000';
        return pad.substring(0, pad.length - str.length) + str;
    }

    /** Converts num to Time Part
     * @param {int} num number
     * @return {key} returns the time part
     */
    this.numToTimePart = function (num) {
        var str = '' + num;
        var pad = '00';
        return pad.substring(0, pad.length - str.length) + str;
    }

    /** Converts str to Date
     * @param {string} value string containing the date
     * @param {boolean} isUTC specifies if the date is UTC
     * @return {string} returns local date in the format MM/dd/yyyy
     */
    this.strToDate = function (value, isUTC) {
        var d = null;
        if (isUTC) {
            d = moment.utc(value);
            d = d.local();
        } else {
            if (value[value.length - 1] == 'Z') {
                value = value.substr(0, value.length - 1);
            }
            d = moment(value);
        }
        if (!d || !d.isValid()) {
            return value;
        }
        var year = this.numToTimePart(d.year());
        if (parseInt(year) < 2000) {
            var yy = year.substr(2);
            if (parseInt(yy) > 29) {
                year = '19' + yy;
            } else {
                year = '20' + yy;
            }
        }
        return this.numToTimePart(d.month() + 1) + '/' +
            this.numToTimePart(d.date()) + '/' +
            year;
    }

    /** Converts str to Time
     * @param {string} value string containing the Time
     * @param {boolean} isUTC specifies if the time is UTC
     * @param {boolean} millisecond determines if milliseconds should be added to output string
     * @return {string} returns local time in the format hh:mm:ss
     */
    this.strToTime = function (value, isUTC, millisecond) {
        var d = null;
        if (isUTC) {
            d = moment.utc(value);
            d = d.local();
        } else {
            if (value[value.length - 1] == 'Z') {
                value = value.substr(0, value.length - 1);
            }
            d = moment(value);
        }
        if (!d || !d.isValid()) {
            return value;
        }
        return this.numToTimePart(d.hour()) + ':' +
            this.numToTimePart(d.minute()) + ':' +
            this.numToTimePart(d.second()) + (millisecond ? '.' +
            this.numToTimePart(d.millisecond()) : '');
    }

    this.isValidTime = function (value) {
        var time = value.split(':');
        if(time.length != 3) {
            return false;
        }
        if(isNaN(time[0])) {
            return false;
        }
        if(parseInt(time[0]) > 23) {
            return false;
        }
        if(isNaN(time[1])) {
            return false;
        }
        if(parseInt(time[1]) > 59) {
            return false;
        }
        if(isNaN(time[2])) {
            return false;
        }
        if(parseFloat(time[2]) > 59) {
            return false;
        }
        return true;
    }

    this.isValidDate = function (value) {
        var date = value.split('/');
        if(date.length != 3) {
            return false;
        }
        if(isNaN(date[0])) {
            return false;
        }
        if(parseInt(date[0]) > 12) {
            return false;
        }
        if(isNaN(date[1])) {
            return false;
        }
        if(parseInt(date[1]) > 31) {
            return false;
        }
        if(isNaN(date[2])) {
            return false;
        }
        return true;
    }

    this.isValidDateTime = function (value) {
        var dateTime = value.split(' ');
        if(dateTime.length != 2) {
            return false;
        }
        if(!this.isValidDate(dateTime[0])){
            return false;
        }
        return this.isValidTime(dateTime[1]);
    }

    /** Converts str to Date/Time
     * @param {string} value string containing the date/time
     * @param {boolean} isUTC specifies if the Date/Time is UTC
     * @param {boolean} millisecond determines if milliseconds should be added to output string
     * @return {string} returns local date/time in the format MM-dd-yyyy hh:mm:ss
     */
    this.strToDateTime = function (value, isUTC, millisecond) {
        return this.strToDate(value, isUTC) + ' ' +
            this.strToTime(value, isUTC, millisecond);
    }

    /** Parse the font style and applies it
     * @param {string} font style
     * @param {object} DOM node where the font style will be applied
     */
    this.parseFontStyle = function (fs, n) {
        var regular = false,
            italic = false,
            bold = false,
            black = false,
            oblique = false,
            style = {
                fontStyle: '',
                fontWeight: '',
            };

        if (!fs || typeof fs !== 'string' || fs.length === 0) {
            return style;
        }

        regular = fs.toLowerCase().indexOf('regular') >= 0;
        if (regular) { return style; }

        italic = fs.toLowerCase().indexOf('italic') >= 0;
        if (italic) {
            style.fontStyle = 'italic';
            (n && n.style) && (n.style.fontStyle = style.fontStyle);
        }

        bold = fs.toLowerCase().indexOf('bold') >= 0;
        if (bold) {
            style.fontWeight = 'bold';
            (n && n.style) && (n.style.fontWeight = style.fontWeight);
        }

        black = fs.toLowerCase().indexOf('black') >= 0;
        if (black) {
            style.fontWeight = 'bolder';
            (n && n.style) && (n.style.fontWeight = style.fontWeight);
        }

        oblique = fs.toLowerCase().indexOf('oblique') >= 0;
        if (oblique) {
            style.fontStyle = 'italic';
            (n && n.style) && (n.style.fontStyle = style.fontStyle);
        }

        return style;
    }

    /** Defines find function for array type if it does not exist. */
    this.addFindToArray = function () {
        if (!Array.prototype.find) {
            Object.defineProperty(Array.prototype, "find", {
                value: function (predicate) {
                    if (this === null) {
                        throw new TypeError('Array.prototype.find called on null or undefined');
                    }
                    if (typeof predicate !== 'function') {
                        throw new TypeError('predicate must be a function');
                    }
                    var list = Object(this);
                    var length = list.length >>> 0;
                    var thisArg = arguments[1];
                    var value;

                    for (var i = 0; i < length; i++) {
                        value = list[i];
                        if (predicate.call(thisArg, value, i, list)) {
                            return value;
                        }
                    }
                    return undefined;
                }
            });
        }
    }

}
if (typeof (window.SmaCustomWidget) === 'undefined') {
    /**
     * The SmaCustomWidget is the namespace used to encapsulate all the functionalities provided and required
     * to implement custom widgets.
     * @namespace SmaCustomWidget
     */
    window.SmaCustomWidget = {};
}

window.SmaCustomWidget.Helper = _____x_____helper;