//! ClientHooks.debug.js
//

(function() {
//! Script# Core Runtime


    (function () {
        var globals = {
            version: '0.7.4.0',

            isUndefined: function (o) {
                return (o === undefined);
            },

            isNull: function (o) {
                return (o === null);
            },

            isNullOrUndefined: function (o) {
                return (o === null) || (o === undefined);
            },

            isValue: function (o) {
                return (o !== null) && (o !== undefined);
            }
        };

        var started = false;
        var startCallbacks = [];

        function onStartup(cb) {
            startCallbacks ? startCallbacks.push(cb) : setTimeout(cb, 0);
        }
        function startup() {
            if (startCallbacks) {
                var callbacks = startCallbacks;
                startCallbacks = null;
                for (var i = 0, l = callbacks.length; i < l; i++) {
                    callbacks[i]();
                }
            }
        }
        if (document.addEventListener) {
            document.readyState == 'complete' ? startup() : document.addEventListener('DOMContentLoaded', startup, false);
        }
        else if (window.attachEvent) {
            window.attachEvent('onload', function () {
                startup();
            });
        }

        var ss = window.ss;
        if (!ss) {
            window.ss = ss = {
                init: onStartup,
                ready: onStartup
            };
        }
        for (var n in globals) {
            ss[n] = globals[n];
        }
    })();

    ///////////////////////////////////////////////////////////////////////////////
    // Object Extensions

    Object.__typeName = 'Object';
    Object.__baseType = null;

    Object.clearKeys = function Object$clearKeys(d) {
        for (var n in d) {
            delete d[n];
        }
    }

    Object.keyExists = function Object$keyExists(d, key) {
        return d[key] !== undefined;
    }

    if (!Object.keys) {
        Object.keys = function Object$keys(d) {
            var keys = [];
            for (var n in d) {
                keys.push(n);
            }
            return keys;
        }

        Object.getKeyCount = function Object$getKeyCount(d) {
            var count = 0;
            for (var n in d) {
                count++;
            }
            return count;
        }
    }
    else {
        Object.getKeyCount = function Object$getKeyCount(d) {
            return Object.keys(d).length;
        }
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Boolean Extensions
    /*
    Boolean.__typeName = 'Boolean';
    
    Boolean.parse = function Boolean$parse(s) {
    return (s.toLowerCase() == 'true');
    }
    */
    ///////////////////////////////////////////////////////////////////////////////
    // Number Extensions
    /*
    Number.__typeName = 'Number';
    */
    Number.parse = function Number$parse(s) {
        if (!s || !s.length) {
            return 0;
        }
        if ((s.indexOf('.') >= 0) || (s.indexOf('e') >= 0) ||
            s.endsWith('f') || s.endsWith('F')) {
            return parseFloat(s);
        }
        return parseInt(s, 10);
    }
    /*
    Number.prototype.format = function Number$format(format) {
    if (ss.isNullOrUndefined(format) || (format.length == 0) || (format == 'i')) {
    return this.toString();
    }
    return this._netFormat(format, false);
    }
    */
    /*
    Number.prototype.localeFormat = function Number$format(format) {
    if (ss.isNullOrUndefined(format) || (format.length == 0) || (format == 'i')) {
    return this.toLocaleString();
    }
    return this._netFormat(format, true);
    }
    */

    Number._commaFormat = function Number$_commaFormat(number, groups, decimal, comma) {
        var decimalPart = null;
        var decimalIndex = number.indexOf(decimal);
        if (decimalIndex > 0) {
            decimalPart = number.substr(decimalIndex);
            number = number.substr(0, decimalIndex);
        }

        var negative = number.startsWith('-');
        if (negative) {
            number = number.substr(1);
        }

        var groupIndex = 0;
        var groupSize = groups[groupIndex];
        if (number.length < groupSize) {
            return decimalPart ? number + decimalPart : number;
        }

        var index = number.length;
        var s = '';
        var done = false;
        while (!done) {
            var length = groupSize;
            var startIndex = index - length;
            if (startIndex < 0) {
                groupSize += startIndex;
                length += startIndex;
                startIndex = 0;
                done = true;
            }
            if (!length) {
                break;
            }

            var part = number.substr(startIndex, length);
            if (s.length) {
                s = part + comma + s;
            }
            else {
                s = part;
            }
            index -= length;

            if (groupIndex < groups.length - 1) {
                groupIndex++;
                groupSize = groups[groupIndex];
            }
        }

        if (negative) {
            s = '-' + s;
        }
        return decimalPart ? s + decimalPart : s;
    }

    Number.prototype._netFormat = function Number$_netFormat(format, useLocale) {
        var nf = useLocale ? ss.CultureInfo.CurrentCulture.numberFormat : ss.CultureInfo.InvariantCulture.numberFormat;

        var s = '';
        var precision = -1;

        if (format.length > 1) {
            precision = parseInt(format.substr(1));
        }

        var fs = format.charAt(0);
        switch (fs) {
            case 'd': case 'D':
                s = parseInt(Math.abs(this)).toString();
                if (precision != -1) {
                    s = s.padLeft(precision, '0');
                }
                if (this < 0) {
                    s = '-' + s;
                }
                break;
            case 'x': case 'X':
                s = parseInt(Math.abs(this)).toString(16);
                if (fs == 'X') {
                    s = s.toUpperCase();
                }
                if (precision != -1) {
                    s = s.padLeft(precision, '0');
                }
                break;
            case 'e': case 'E':
                if (precision == -1) {
                    s = this.toExponential();
                }
                else {
                    s = this.toExponential(precision);
                }
                if (fs == 'E') {
                    s = s.toUpperCase();
                }
                break;
            case 'f': case 'F':
            case 'n': case 'N':
                if (precision == -1) {
                    precision = nf.numberDecimalDigits;
                }
                s = this.toFixed(precision).toString();
                if (precision && (nf.numberDecimalSeparator != '.')) {
                    var index = s.indexOf('.');
                    s = s.substr(0, index) + nf.numberDecimalSeparator + s.substr(index + 1);
                }
                if ((fs == 'n') || (fs == 'N')) {
                    s = Number._commaFormat(s, nf.numberGroupSizes, nf.numberDecimalSeparator, nf.numberGroupSeparator);
                }
                break;
            case 'c': case 'C':
                if (precision == -1) {
                    precision = nf.currencyDecimalDigits;
                }
                s = Math.abs(this).toFixed(precision).toString();
                if (precision && (nf.currencyDecimalSeparator != '.')) {
                    var index = s.indexOf('.');
                    s = s.substr(0, index) + nf.currencyDecimalSeparator + s.substr(index + 1);
                }
                s = Number._commaFormat(s, nf.currencyGroupSizes, nf.currencyDecimalSeparator, nf.currencyGroupSeparator);
                if (this < 0) {
                    s = String.format(nf.currencyNegativePattern, s);
                }
                else {
                    s = String.format(nf.currencyPositivePattern, s);
                }
                break;
            case 'p': case 'P':
                if (precision == -1) {
                    precision = nf.percentDecimalDigits;
                }
                s = (Math.abs(this) * 100.0).toFixed(precision).toString();
                if (precision && (nf.percentDecimalSeparator != '.')) {
                    var index = s.indexOf('.');
                    s = s.substr(0, index) + nf.percentDecimalSeparator + s.substr(index + 1);
                }
                s = Number._commaFormat(s, nf.percentGroupSizes, nf.percentDecimalSeparator, nf.percentGroupSeparator);
                if (this < 0) {
                    s = String.format(nf.percentNegativePattern, s);
                }
                else {
                    s = String.format(nf.percentPositivePattern, s);
                }
                break;
        }

        return s;
    }

    ///////////////////////////////////////////////////////////////////////////////
    // String Extensions

    /*
    String.__typeName = 'String';
    */
    String.Empty = '';


    String.compare = function String$compare(s1, s2, ignoreCase) {
        if (ignoreCase) {
            if (s1) {
                s1 = s1.toUpperCase();
            }
            if (s2) {
                s2 = s2.toUpperCase();
            }
        }
        s1 = s1 || '';
        s2 = s2 || '';

        if (s1 == s2) {
            return 0;
        }
        if (s1 < s2) {
            return -1;
        }
        return 1;
    }

    String.prototype.compareTo = function String$compareTo(s, ignoreCase) {
        return String.compare(this, s, ignoreCase);
    }

    String.concat = function String$concat() {
        if (arguments.length === 2) {
            return arguments[0] + arguments[1];
        }
        return Array.prototype.join.call(arguments, '');
    }
    /*
    String.prototype.endsWith = function String$endsWith(suffix) {
    if (!suffix.length) {
    return true;
    }
    if (suffix.length > this.length) {
    return false;
    }
    return (this.substr(this.length - suffix.length) == suffix);
    }
    */
    String.equals = function String$equals1(s1, s2, ignoreCase) {
        return String.compare(s1, s2, ignoreCase) == 0;
    }
    /*
    String._format = function String$_format(format, values, useLocale) {
    if (!String._formatRE) {
    String._formatRE = /(\{[^\}^\{]+\})/g;
    }
    
    return format.replace(String._formatRE,
    function(str, m) {
    var index = parseInt(m.substr(1));
    var value = values[index + 1];
    if (ss.isNullOrUndefined(value)) {
    return '';
    }
    if (value.format) {
    var formatSpec = null;
    var formatIndex = m.indexOf(':');
    if (formatIndex > 0) {
    formatSpec = m.substring(formatIndex + 1, m.length - 1);
    }
    return useLocale ? value.localeFormat(formatSpec) : value.format(formatSpec);
    }
    else {
    return useLocale ? value.toLocaleString() : value.toString();
    }
    });
    }
    */

    //String.format = function String$format(format) {
    //    return String._format(format, arguments, /* useLocale */ false);
    //}

    //String.fromChar = function String$fromChar(ch, count) {
    //    var s = ch;
    //    for (var i = 1; i < count; i++) {
    //        s += ch;
    //    }
    //    return s;
    //}

    String.prototype.htmlDecode = function String$htmlDecode() {
        var div = document.createElement('div');
        div.innerHTML = this;
        return div.textContent || div.innerText;
    }

    String.prototype.htmlEncode = function String$htmlEncode() {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(this));
        return div.innerHTML.replace(/\"/g, '&quot;');
    }

    String.prototype.indexOfAny = function String$indexOfAny(chars, startIndex, count) {
        var length = this.length;
        if (!length) {
            return -1;
        }

        startIndex = startIndex || 0;
        count = count || length;

        var endIndex = startIndex + count - 1;
        if (endIndex >= length) {
            endIndex = length - 1;
        }

        for (var i = startIndex; i <= endIndex; i++) {
            if (chars.indexOf(this.charAt(i)) >= 0) {
                return i;
            }
        }
        return -1;
    }

    String.prototype.insert = function String$insert(index, value) {
        if (!value) {
            return this.valueOf();
        }
        if (!index) {
            return value + this;
        }
        var s1 = this.substr(0, index);
        var s2 = this.substr(index);
        return s1 + value + s2;
    }

    String.isNullOrEmpty = function String$isNullOrEmpty(s) {
        return !s || !s.length;
    }

    String.prototype.lastIndexOfAny = function String$lastIndexOfAny(chars, startIndex, count) {
        var length = this.length;
        if (!length) {
            return -1;
        }

        startIndex = startIndex || length - 1;
        count = count || length;

        var endIndex = startIndex - count + 1;
        if (endIndex < 0) {
            endIndex = 0;
        }

        for (var i = startIndex; i >= endIndex; i--) {
            if (chars.indexOf(this.charAt(i)) >= 0) {
                return i;
            }
        }
        return -1;
    }

    //String.localeFormat = function String$localeFormat(format) {
    //    return String._format(format, arguments, /* useLocale */ true);
    //}

    String.prototype.padLeft = function String$padLeft(totalWidth, ch) {
        if (this.length < totalWidth) {
            ch = ch || ' ';
            return String.fromChar(ch, totalWidth - this.length) + this;
        }
        return this.valueOf();
    }

    String.prototype.padRight = function String$padRight(totalWidth, ch) {
        if (this.length < totalWidth) {
            ch = ch || ' ';
            return this + String.fromChar(ch, totalWidth - this.length);
        }
        return this.valueOf();
    }

    String.prototype.remove = function String$remove(index, count) {
        if (!count || ((index + count) > this.length)) {
            return this.substr(0, index);
        }
        return this.substr(0, index) + this.substr(index + count);
    }

    String.prototype.replaceAll = function String$replaceAll(oldValue, newValue) {
        newValue = newValue || '';
        return this.split(oldValue).join(newValue);
    }

    //String.prototype.startsWith = function String$startsWith(prefix) {
    //    if (!prefix.length) {
    //        return true;
    //    }
    //    if (prefix.length > this.length) {
    //        return false;
    //    }
    //    return (this.substr(0, prefix.length) == prefix);
    //}

    //if (!String.prototype.trim) {
    //    String.prototype.trim = function String$trim() {
    //        return this.trimEnd().trimStart();
    //    }
    //}

    //String.prototype.trimEnd = function String$trimEnd() {
    //    return this.replace(/\s*$/, '');
    //}

    //String.prototype.trimStart = function String$trimStart() {
    //    return this.replace(/^\s*/, '');
    //}

    ///////////////////////////////////////////////////////////////////////////////
    // Array Extensions
    /*
    Array.__typeName = 'Array';
    Array.__interfaces = [ ss.IEnumerable ];
    
    Array.prototype.add = function Array$add(item) {
    this[this.length] = item;
    }
    
    Array.prototype.addRange = function Array$addRange(items) {
    this.push.apply(this, items);
    }
    
    Array.prototype.aggregate = function Array$aggregate(seed, callback, instance) {
    var length = this.length;
    for (var i = 0; i < length; i++) {
    if (i in this) {
    seed = callback.call(instance, seed, this[i], i, this);
    }
    }
    return seed;
    }
    
    Array.prototype.clear = function Array$clear() {
    this.length = 0;
    }
    
    Array.prototype.clone = function Array$clone() {
    if (this.length === 1) {
    return [this[0]];
    }
    else {
    return Array.apply(null, this);
    }
    }
    
    Array.prototype.contains = function Array$contains(item) {
    var index = this.indexOf(item);
    return (index >= 0);
    }
    
    Array.prototype.dequeue = function Array$dequeue() {
    return this.shift();
    }
    
    Array.prototype.enqueue = function Array$enqueue(item) {
    // We record that this array instance is a queue, so we
    // can implement the right behavior in the peek method.
    this._queue = true;
    this.push(item);
    }
    
    Array.prototype.peek = function Array$peek() {
    if (this.length) {
    var index = this._queue ? 0 : this.length - 1;
    return this[index];
    }
    return null;
    }
    
    if (!Array.prototype.every) {
    Array.prototype.every = function Array$every(callback, instance) {
    var length = this.length;
    for (var i = 0; i < length; i++) {
    if (i in this && !callback.call(instance, this[i], i, this)) {
    return false;
    }
    }
    return true;
    }
    }
    
    Array.prototype.extract = function Array$extract(index, count) {
    if (!count) {
    return this.slice(index);
    }
    return this.slice(index, index + count);
    }
    
    if (!Array.prototype.filter) {
    Array.prototype.filter = function Array$filter(callback, instance) {
    var length = this.length;    
    var filtered = [];
    for (var i = 0; i < length; i++) {
    if (i in this) {
    var val = this[i];
    if (callback.call(instance, val, i, this)) {
    filtered.push(val);
    }
    }
    }
    return filtered;
    }
    }
    
    if (!Array.prototype.forEach) {
    Array.prototype.forEach = function Array$forEach(callback, instance) {
    var length = this.length;
    for (var i = 0; i < length; i++) {
    if (i in this) {
    callback.call(instance, this[i], i, this);
    }
    }
    }
    }
    
    Array.prototype.getEnumerator = function Array$getEnumerator() {
    return new ss.ArrayEnumerator(this);
    }
    
    Array.prototype.groupBy = function Array$groupBy(callback, instance) {
    var length = this.length;
    var groups = [];
    var keys = {};
    for (var i = 0; i < length; i++) {
    if (i in this) {
    var key = callback.call(instance, this[i], i);
    if (String.isNullOrEmpty(key)) {
    continue;
    }
    var items = keys[key];
    if (!items) {
    items = [];
    items.key = key;
    
    keys[key] = items;
    groups.add(items);
    }
    items.add(this[i]);
    }
    }
    return groups;
    }
    
    Array.prototype.index = function Array$index(callback, instance) {
    var length = this.length;
    var items = {};
    for (var i = 0; i < length; i++) {
    if (i in this) {
    var key = callback.call(instance, this[i], i);
    if (String.isNullOrEmpty(key)) {
    continue;
    }
    items[key] = this[i];
    }
    }
    return items;
    }
    
    if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function Array$indexOf(item, startIndex) {
    startIndex = startIndex || 0;
    var length = this.length;
    if (length) {
    for (var index = startIndex; index < length; index++) {
    if (this[index] === item) {
    return index;
    }
    }
    }
    return -1;
    }
    }
    
    Array.prototype.insert = function Array$insert(index, item) {
    this.splice(index, 0, item);
    }
    
    Array.prototype.insertRange = function Array$insertRange(index, items) {
    if (index === 0) {
    this.unshift.apply(this, items);
    }
    else {
    for (var i = 0; i < items.length; i++) {
    this.splice(index + i, 0, items[i]);
    }
    }
    }
    
    if (!Array.prototype.map) {
    Array.prototype.map = function Array$map(callback, instance) {
    var length = this.length;
    var mapped = new Array(length);
    for (var i = 0; i < length; i++) {
    if (i in this) {
    mapped[i] = callback.call(instance, this[i], i, this);
    }
    }
    return mapped;
    }
    }
    */

    Array.parse = function Array$parse(s) {
        return eval('(' + s + ')');
    }
    /*
    Array.prototype.remove = function Array$remove(item) {
    var index = this.indexOf(item);
    if (index >= 0) {
    this.splice(index, 1);
    return true;
    }
    return false;
    }
    
    Array.prototype.removeAt = function Array$removeAt(index) {
    this.splice(index, 1);
    }
    
    Array.prototype.removeRange = function Array$removeRange(index, count) {
    return this.splice(index, count);
    }
    
    if (!Array.prototype.some) {
    Array.prototype.some = function Array$some(callback, instance) {
    var length = this.length;
    for (var i = 0; i < length; i++) {
    if (i in this && callback.call(instance, this[i], i, this)) {
    return true;
    }
    }
    return false;
    }
    }
    
    Array.toArray = function Array$toArray(obj) {
    return Array.prototype.slice.call(obj);
    }
    */
    ///////////////////////////////////////////////////////////////////////////////
    // RegExp Extensions

    //RegExp.__typeName = 'RegExp';

    RegExp.parse = function RegExp$parse(s) {
        if (s.startsWith('/')) {
            var endSlashIndex = s.lastIndexOf('/');
            if (endSlashIndex > 1) {
                var expression = s.substring(1, endSlashIndex);
                var flags = s.substr(endSlashIndex + 1);
                return new RegExp(expression, flags);
            }
        }

        return null;
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Date Extensions

    Date.__typeName = 'Date';

    Date.empty = null;

    Date.get_now = function Date$get_now() {
        return new Date();
    }

    Date.get_today = function Date$get_today() {
        var d = new Date();
        return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }

    Date.isEmpty = function Date$isEmpty(d) {
        return (d === null) || (d.valueOf() === 0);
    }

    //Date.prototype.format = function Date$format(format) {
    //    if (ss.isNullOrUndefined(format) || (format.length == 0) || (format == 'i')) {
    //        return this.toString();
    //    }
    //    if (format == 'id') {
    //        return this.toDateString();
    //    }
    //    if (format == 'it') {
    //        return this.toTimeString();
    //    }

    //    return this._netFormat(format, false);
    //}

    //Date.prototype.localeFormat = function Date$localeFormat(format) {
    //    if (ss.isNullOrUndefined(format) || (format.length == 0) || (format == 'i')) {
    //        return this.toLocaleString();
    //    }
    //    if (format == 'id') {
    //        return this.toLocaleDateString();
    //    }
    //    if (format == 'it') {
    //        return this.toLocaleTimeString();
    //    }

    //    return this._netFormat(format, true);
    //}

    Date.prototype._netFormat = function Date$_netFormat(format, useLocale) {
        var dt = this;
        var dtf = useLocale ? ss.CultureInfo.CurrentCulture.dateFormat : ss.CultureInfo.InvariantCulture.dateFormat;

        if (format.length == 1) {
            switch (format) {
                case 'f': format = dtf.longDatePattern + ' ' + dtf.shortTimePattern; break;
                case 'F': format = dtf.dateTimePattern; break;

                case 'd': format = dtf.shortDatePattern; break;
                case 'D': format = dtf.longDatePattern; break;

                case 't': format = dtf.shortTimePattern; break;
                case 'T': format = dtf.longTimePattern; break;

                case 'g': format = dtf.shortDatePattern + ' ' + dtf.shortTimePattern; break;
                case 'G': format = dtf.shortDatePattern + ' ' + dtf.longTimePattern; break;

                case 'R': case 'r':
                    dtf = ss.CultureInfo.InvariantCulture.dateFormat;
                    format = dtf.gmtDateTimePattern;
                    break;
                case 'u': format = dtf.universalDateTimePattern; break;
                case 'U':
                    format = dtf.dateTimePattern;
                    dt = new Date(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate(),
                                  dt.getUTCHours(), dt.getUTCMinutes(), dt.getUTCSeconds(), dt.getUTCMilliseconds());
                    break;

                case 's': format = dtf.sortableDateTimePattern; break;
            }
        }

        if (format.charAt(0) == '%') {
            format = format.substr(1);
        }

        if (!Date._formatRE) {
            Date._formatRE = /'.*?[^\\]'|dddd|ddd|dd|d|MMMM|MMM|MM|M|yyyy|yy|y|hh|h|HH|H|mm|m|ss|s|tt|t|fff|ff|f|zzz|zz|z/g;
        }

        var re = Date._formatRE;
        var sb = new ss.StringBuilder();

        re.lastIndex = 0;
        while (true) {
            var index = re.lastIndex;
            var match = re.exec(format);

            sb.append(format.slice(index, match ? match.index : format.length));
            if (!match) {
                break;
            }

            var fs = match[0];
            var part = fs;
            switch (fs) {
                case 'dddd':
                    part = dtf.dayNames[dt.getDay()];
                    break;
                case 'ddd':
                    part = dtf.shortDayNames[dt.getDay()];
                    break;
                case 'dd':
                    part = dt.getDate().toString().padLeft(2, '0');
                    break;
                case 'd':
                    part = dt.getDate();
                    break;
                case 'MMMM':
                    part = dtf.monthNames[dt.getMonth()];
                    break;
                case 'MMM':
                    part = dtf.shortMonthNames[dt.getMonth()];
                    break;
                case 'MM':
                    part = (dt.getMonth() + 1).toString().padLeft(2, '0');
                    break;
                case 'M':
                    part = (dt.getMonth() + 1);
                    break;
                case 'yyyy':
                    part = dt.getFullYear();
                    break;
                case 'yy':
                    part = (dt.getFullYear() % 100).toString().padLeft(2, '0');
                    break;
                case 'y':
                    part = (dt.getFullYear() % 100);
                    break;
                case 'h': case 'hh':
                    part = dt.getHours() % 12;
                    if (!part) {
                        part = '12';
                    }
                    else if (fs == 'hh') {
                        part = part.toString().padLeft(2, '0');
                    }
                    break;
                case 'HH':
                    part = dt.getHours().toString().padLeft(2, '0');
                    break;
                case 'H':
                    part = dt.getHours();
                    break;
                case 'mm':
                    part = dt.getMinutes().toString().padLeft(2, '0');
                    break;
                case 'm':
                    part = dt.getMinutes();
                    break;
                case 'ss':
                    part = dt.getSeconds().toString().padLeft(2, '0');
                    break;
                case 's':
                    part = dt.getSeconds();
                    break;
                case 't': case 'tt':
                    part = (dt.getHours() < 12) ? dtf.amDesignator : dtf.pmDesignator;
                    if (fs == 't') {
                        part = part.charAt(0);
                    }
                    break;
                case 'fff':
                    part = dt.getMilliseconds().toString().padLeft(3, '0');
                    break;
                case 'ff':
                    part = dt.getMilliseconds().toString().padLeft(3).substr(0, 2);
                    break;
                case 'f':
                    part = dt.getMilliseconds().toString().padLeft(3).charAt(0);
                    break;
                case 'z':
                    part = dt.getTimezoneOffset() / 60;
                    part = ((part >= 0) ? '-' : '+') + Math.floor(Math.abs(part));
                    break;
                case 'zz': case 'zzz':
                    part = dt.getTimezoneOffset() / 60;
                    part = ((part >= 0) ? '-' : '+') + Math.floor(Math.abs(part)).toString().padLeft(2, '0');
                    if (fs == 'zzz') {
                        part += dtf.timeSeparator + Math.abs(dt.getTimezoneOffset() % 60).toString().padLeft(2, '0');
                    }
                    break;
                default:
                    if (part.charAt(0) == '\'') {
                        part = part.substr(1, part.length - 2).replace(/\\'/g, '\'');
                    }
                    break;
            }
            sb.append(part);
        }

        return sb.toString();
    }

    Date.parseDate = function Date$parse(s) {
        // Date.parse returns the number of milliseconds
        // so we use that to create an actual Date instance
        return new Date(Date.parse(s));
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Error Extensions

    //Error.__typeName = 'Error';

    //Error.prototype.popStackFrame = function Error$popStackFrame() {
    //    if (ss.isNullOrUndefined(this.stack) ||
    //        ss.isNullOrUndefined(this.fileName) ||
    //        ss.isNullOrUndefined(this.lineNumber)) {
    //        return;
    //    }

    //    var stackFrames = this.stack.split('\n');
    //    var currentFrame = stackFrames[0];
    //    var pattern = this.fileName + ':' + this.lineNumber;
    //    while (!ss.isNullOrUndefined(currentFrame) &&
    //           currentFrame.indexOf(pattern) === -1) {
    //        stackFrames.shift();
    //        currentFrame = stackFrames[0];
    //    }

    //    var nextFrame = stackFrames[1];
    //    if (isNullOrUndefined(nextFrame)) {
    //        return;
    //    }

    //    var nextFrameParts = nextFrame.match(/@(.*):(\d+)$/);
    //    if (ss.isNullOrUndefined(nextFrameParts)) {
    //        return;
    //    }

    //    stackFrames.shift();
    //    this.stack = stackFrames.join("\n");
    //    this.fileName = nextFrameParts[1];
    //    this.lineNumber = parseInt(nextFrameParts[2]);
    //}

    Error.createError = function Error$createError(message, errorInfo, innerException) {
        var e = new Error(message);
        if (errorInfo) {
            for (var v in errorInfo) {
                e[v] = errorInfo[v];
            }
        }
        if (innerException) {
            e.innerException = innerException;
        }

        e.popStackFrame();
        return e;
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Debug Extensions

    ss.Debug = window.Debug || function () { };
    ss.Debug.__typeName = 'Debug';

    if (!ss.Debug.writeln) {
        ss.Debug.writeln = function Debug$writeln(text) {
            if (window.console) {
                if (window.console.debug) {
                    window.console.debug(text);
                    return;
                }
                else if (window.console.log) {
                    window.console.log(text);
                    return;
                }
            }
            else if (window.opera &&
                window.opera.postError) {
                window.opera.postError(text);
                return;
            }
        }
    }

    ss.Debug._fail = function Debug$_fail(message) {
        ss.Debug.writeln(message);
        eval('debugger;');
    }

    ss.Debug.assert = function Debug$assert(condition, message) {
        if (!condition) {
            message = 'Assert failed: ' + message;
            if (confirm(message + '\r\n\r\nBreak into debugger?')) {
                ss.Debug._fail(message);
            }
        }
    }

    ss.Debug.fail = function Debug$fail(message) {
        ss.Debug._fail(message);
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Type System Implementation
    /*
    window.Type = Function;
    Type.__typeName = 'Type';
    
    window.__Namespace = function(name) {
    this.__typeName = name;
    }
    __Namespace.prototype = {
    __namespace: true,
    getName: function() {
    return this.__typeName;
    }
    }
    
    Type.registerNamespace = function Type$registerNamespace(name) {
    if (!window.__namespaces) {
    window.__namespaces = {};
    }
    if (!window.__rootNamespaces) {
    window.__rootNamespaces = [];
    }
    
    if (window.__namespaces[name]) {
    return;
    }
    
    var ns = window;
    var nameParts = name.split('.');
    
    for (var i = 0; i < nameParts.length; i++) {
    var part = nameParts[i];
    var nso = ns[part];
    if (!nso) {
    ns[part] = nso = new __Namespace(nameParts.slice(0, i + 1).join('.'));
    if (i == 0) {
    window.__rootNamespaces.add(nso);
    }
    }
    ns = nso;
    }
    
    window.__namespaces[name] = ns;
    }
    */
    /*
    Type.prototype.registerClass = function Type$registerClass(name, baseType, interfaceType) {
    this.prototype.constructor = this;
    this.__typeName = name;
    this.__class = true;
    this.__baseType = baseType || Object;
    if (baseType) {
    this.__basePrototypePending = true;
    }
    
    if (interfaceType) {
    this.__interfaces = [];
    for (var i = 2; i < arguments.length; i++) {
    interfaceType = arguments[i];
    this.__interfaces.add(interfaceType);
    }
    }
    }
    */
    /*
    Type.prototype.registerInterface = function Type$createInterface(name) {
    this.__typeName = name;
    this.__interface = true;
    }
    */
    Type.prototype.registerEnum = function Type$createEnum(name, flags) {
        for (var field in this.prototype) {
            this[field] = this.prototype[field];
        }

        this.__typeName = name;
        this.__enum = true;
        if (flags) {
            this.__flags = true;
        }
    }

    Type.prototype.setupBase = function Type$setupBase() {
        if (this.__basePrototypePending) {
            var baseType = this.__baseType;
            if (baseType.__basePrototypePending) {
                baseType.setupBase();
            }

            for (var memberName in baseType.prototype) {
                var memberValue = baseType.prototype[memberName];
                if (!this.prototype[memberName]) {
                    this.prototype[memberName] = memberValue;
                }
            }

            delete this.__basePrototypePending;
        }
    }

    if (!Type.prototype.resolveInheritance) {
        // This function is not used by Script#; Visual Studio relies on it
        // for JavaScript IntelliSense support of derived types.
        Type.prototype.resolveInheritance = Type.prototype.setupBase;
    }

    /*
    Type.prototype.initializeBase = function Type$initializeBase(instance, args) {
    if (this.__basePrototypePending) {
    this.setupBase();
    }
    
    if (!args) {
    this.__baseType.apply(instance);
    }
    else {
    this.__baseType.apply(instance, args);
    }
    }
    */

    /*
    Type.prototype.callBaseMethod = function Type$callBaseMethod(instance, name, args) {
    var baseMethod = this.__baseType.prototype[name];
    if (!args) {
    return baseMethod.apply(instance);
    }
    else {
    return baseMethod.apply(instance, args);
    }
    }
    */

    Type.prototype.get_baseType = function Type$get_baseType() {
        return this.__baseType || null;
    }

    Type.prototype.get_fullName = function Type$get_fullName() {
        return this.__typeName;
    }

    Type.prototype.get_name = function Type$get_name() {
        var fullName = this.__typeName;
        var nsIndex = fullName.lastIndexOf('.');
        if (nsIndex > 0) {
            return fullName.substr(nsIndex + 1);
        }
        return fullName;
    }

    /*
    Type.prototype.getInterfaces = function Type$getInterfaces() {
    return this.__interfaces;
    }
    
    
    Type.prototype.isInstanceOfType = function Type$isInstanceOfType(instance) {
    if (ss.isNullOrUndefined(instance)) {
    return false;
    }
    if ((this == Object) || (instance instanceof this)) {
    return true;
    }
    
    var type = Type.getInstanceType(instance);
    return this.isAssignableFrom(type);
    }
    */
    Type.prototype.isAssignableFrom = function Type$isAssignableFrom(type) {
        if ((this == Object) || (this == type)) {
            return true;
        }
        if (this.__class) {
            var baseType = type.__baseType;
            while (baseType) {
                if (this == baseType) {
                    return true;
                }
                baseType = baseType.__baseType;
            }
        }
        else if (this.__interface) {
            var interfaces = type.__interfaces;
            if (interfaces && interfaces.contains(this)) {
                return true;
            }

            var baseType = type.__baseType;
            while (baseType) {
                interfaces = baseType.__interfaces;
                if (interfaces && interfaces.contains(this)) {
                    return true;
                }
                baseType = baseType.__baseType;
            }
        }
        return false;
    }
    /*
    Type.isClass = function Type$isClass(type) {
    return (type.__class == true);
    }
    
    
    Type.isEnum = function Type$isEnum(type) {
    return (type.__enum == true);
    }
    
    Type.isFlags = function Type$isFlags(type) {
    return ((type.__enum == true) && (type.__flags == true));
    }
    
    Type.isInterface = function Type$isInterface(type) {
    return (type.__interface == true);
    }
    
    Type.isNamespace = function Type$isNamespace(object) {
    return (object.__namespace == true);
    }
    */
    Type.canCast = function Type$canCast(instance, type) {
        return type.isInstanceOfType(instance);
    }

    Type.safeCast = function Type$safeCast(instance, type) {
        if (type.isInstanceOfType(instance)) {
            return instance;
        }
        return null;
    }

    Type.getInstanceType = function Type$getInstanceType(instance) {
        var ctor = null;

        // NOTE: We have to catch exceptions because the constructor
        //       cannot be looked up on native COM objects
        try {
            ctor = instance.constructor;
        }
        catch (ex) {
        }
        if (!ctor || !ctor.__typeName) {
            ctor = Object;
        }
        return ctor;
    }

    Type.getType = function Type$getType(typeName) {
        if (!typeName) {
            return null;
        }

        if (!Type.__typeCache) {
            Type.__typeCache = {};
        }

        var type = Type.__typeCache[typeName];
        if (!type) {
            type = eval(typeName);
            Type.__typeCache[typeName] = type;
        }
        return type;
    }
    /*
    Type.parse = function Type$parse(typeName) {
    return Type.getType(typeName);
    }
    */

    ///////////////////////////////////////////////////////////////////////////////
    // Delegate

    ss.Delegate = function Delegate$() {
    }
    ss.Delegate.registerClass('Delegate');

    ss.Delegate.empty = function () { }

    ss.Delegate._contains = function Delegate$_contains(targets, object, method) {
        for (var i = 0; i < targets.length; i += 2) {
            if (targets[i] === object && targets[i + 1] === method) {
                return true;
            }
        }
        return false;
    }

    ss.Delegate._create = function Delegate$_create(targets) {
        var delegate = function () {
            if (targets.length == 2) {
                return targets[1].apply(targets[0], arguments);
            }
            else {
                var clone = targets.clone();
                for (var i = 0; i < clone.length; i += 2) {
                    if (ss.Delegate._contains(targets, clone[i], clone[i + 1])) {
                        clone[i + 1].apply(clone[i], arguments);
                    }
                }
                return null;
            }
        };
        delegate._targets = targets;

        return delegate;
    }

    ss.Delegate.create = function Delegate$create(object, method) {
        if (!object) {
            return method;
        }
        return ss.Delegate._create([object, method]);
    }

    ss.Delegate.combine = function Delegate$combine(delegate1, delegate2) {
        if (!delegate1) {
            if (!delegate2._targets) {
                return ss.Delegate.create(null, delegate2);
            }
            return delegate2;
        }
        if (!delegate2) {
            if (!delegate1._targets) {
                return ss.Delegate.create(null, delegate1);
            }
            return delegate1;
        }

        var targets1 = delegate1._targets ? delegate1._targets : [null, delegate1];
        var targets2 = delegate2._targets ? delegate2._targets : [null, delegate2];

        return ss.Delegate._create(targets1.concat(targets2));
    }

    ss.Delegate.remove = function Delegate$remove(delegate1, delegate2) {
        if (!delegate1 || (delegate1 === delegate2)) {
            return null;
        }
        if (!delegate2) {
            return delegate1;
        }

        var targets = delegate1._targets;
        var object = null;
        var method;
        if (delegate2._targets) {
            object = delegate2._targets[0];
            method = delegate2._targets[1];
        }
        else {
            method = delegate2;
        }

        for (var i = 0; i < targets.length; i += 2) {
            if ((targets[i] === object) && (targets[i + 1] === method)) {
                if (targets.length == 2) {
                    return null;
                }
                targets.splice(i, 2);
                return ss.Delegate._create(targets);
            }
        }

        return delegate1;
    }

    ss.Delegate.createExport = function Delegate$createExport(delegate, multiUse, name) {
        // Generate a unique name if one is not specified
        name = name || '__' + (new Date()).valueOf();

        // Exported delegates go on window (so they are callable using a simple identifier).

        // Multi-use delegates are exported directly; for the rest a stub is exported, and the stub
        // first deletes, and then invokes the actual delegate.
        window[name] = multiUse ? delegate : function () {
            try { delete window[name]; } catch (e) { window[name] = undefined; }
            delegate.apply(null, arguments);
        };

        return name;
    }

    ss.Delegate.deleteExport = function Delegate$deleteExport(name) {
        delete window[name];
    }

    ss.Delegate.clearExport = function Delegate$clearExport(name) {
        window[name] = ss.Delegate.empty;
    }

    ///////////////////////////////////////////////////////////////////////////////
    // CultureInfo

    ss.CultureInfo = function CultureInfo$(name, numberFormat, dateFormat) {
        this.name = name;
        this.numberFormat = numberFormat;
        this.dateFormat = dateFormat;
    }
    ss.CultureInfo.registerClass('CultureInfo');

    ss.CultureInfo.InvariantCulture = new ss.CultureInfo('en-US',
        {
            naNSymbol: 'NaN',
            negativeSign: '-',
            positiveSign: '+',
            negativeInfinityText: '-Infinity',
            positiveInfinityText: 'Infinity',

            percentSymbol: '%',
            percentGroupSizes: [3],
            percentDecimalDigits: 2,
            percentDecimalSeparator: '.',
            percentGroupSeparator: ',',
            percentPositivePattern: '{0} %',
            percentNegativePattern: '-{0} %',

            currencySymbol: '$',
            currencyGroupSizes: [3],
            currencyDecimalDigits: 2,
            currencyDecimalSeparator: '.',
            currencyGroupSeparator: ',',
            currencyNegativePattern: '(${0})',
            currencyPositivePattern: '${0}',

            numberGroupSizes: [3],
            numberDecimalDigits: 2,
            numberDecimalSeparator: '.',
            numberGroupSeparator: ','
        },
        {
            amDesignator: 'AM',
            pmDesignator: 'PM',

            dateSeparator: '/',
            timeSeparator: ':',

            gmtDateTimePattern: 'ddd, dd MMM yyyy HH:mm:ss \'GMT\'',
            universalDateTimePattern: 'yyyy-MM-dd HH:mm:ssZ',
            sortableDateTimePattern: 'yyyy-MM-ddTHH:mm:ss',
            dateTimePattern: 'dddd, MMMM dd, yyyy h:mm:ss tt',

            longDatePattern: 'dddd, MMMM dd, yyyy',
            shortDatePattern: 'M/d/yyyy',

            longTimePattern: 'h:mm:ss tt',
            shortTimePattern: 'h:mm tt',

            firstDayOfWeek: 0,
            dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            shortDayNames: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            minimizedDayNames: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],

            monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', ''],
            shortMonthNames: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', '']
        });
    ss.CultureInfo.CurrentCulture = ss.CultureInfo.InvariantCulture;

    ///////////////////////////////////////////////////////////////////////////////
    // IEnumerator

    ss.IEnumerator = function IEnumerator$() { };
    ss.IEnumerator.prototype = {
        get_current: null,
        moveNext: null,
        reset: null
    }

    ss.IEnumerator.getEnumerator = function ss_IEnumerator$getEnumerator(enumerable) {
        if (enumerable) {
            return enumerable.getEnumerator ? enumerable.getEnumerator() : new ss.ArrayEnumerator(enumerable);
        }
        return null;
    }

    ss.IEnumerator.registerInterface('IEnumerator');

    ///////////////////////////////////////////////////////////////////////////////
    // IEnumerable

    ss.IEnumerable = function IEnumerable$() { };
    ss.IEnumerable.prototype = {
        getEnumerator: null
    }
    ss.IEnumerable.registerInterface('IEnumerable');

    ///////////////////////////////////////////////////////////////////////////////
    // ArrayEnumerator

    ss.ArrayEnumerator = function ArrayEnumerator$(array) {
        this._array = array;
        this._index = -1;
        this.current = null;
    }
    ss.ArrayEnumerator.prototype = {
        moveNext: function ArrayEnumerator$moveNext() {
            this._index++;
            this.current = this._array[this._index];
            return (this._index < this._array.length);
        },
        reset: function ArrayEnumerator$reset() {
            this._index = -1;
            this.current = null;
        }
    }

    ss.ArrayEnumerator.registerClass('ArrayEnumerator', null, ss.IEnumerator);

    ///////////////////////////////////////////////////////////////////////////////
    // IDisposable

    ss.IDisposable = function IDisposable$() { };
    ss.IDisposable.prototype = {
        dispose: null
    }
    ss.IDisposable.registerInterface('IDisposable');

    ///////////////////////////////////////////////////////////////////////////////
    // StringBuilder

    ss.StringBuilder = function StringBuilder$(s) {
        this._parts = ss.isNullOrUndefined(s) || s === '' ? [] : [s];
        this.isEmpty = this._parts.length == 0;
    }
    ss.StringBuilder.prototype = {
        append: function StringBuilder$append(s) {
            if (!ss.isNullOrUndefined(s) && s !== '') {
                this._parts[this._parts.length] = s; // crm2011
                this.isEmpty = false;
            }
            return this;
        },

        appendLine: function StringBuilder$appendLine(s) {
            this.append(s);
            this.append('\r\n');
            this.isEmpty = false;
            return this;
        },

        clear: function StringBuilder$clear() {
            this._parts = [];
            this.isEmpty = true;
        },

        toString: function StringBuilder$toString(s) {
            return this._parts.join(s || '');
        }
    };

    ss.StringBuilder.registerClass('StringBuilder');

    ///////////////////////////////////////////////////////////////////////////////
    // EventArgs

    ss.EventArgs = function EventArgs$() {
    }
    ss.EventArgs.registerClass('EventArgs');

    ss.EventArgs.Empty = new ss.EventArgs();

    ///////////////////////////////////////////////////////////////////////////////
    // XMLHttpRequest and XML parsing helpers

    if (!window.XMLHttpRequest) {
        window.XMLHttpRequest = function () {
            var progIDs = ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP'];

            for (var i = 0; i < progIDs.length; i++) {
                try {
                    var xmlHttp = new ActiveXObject(progIDs[i]);
                    return xmlHttp;
                }
                catch (ex) {
                }
            }

            return null;
        }
    }

    ss.parseXml = function (markup) {
        try {
            if (DOMParser) {
                var domParser = new DOMParser();
                return domParser.parseFromString(markup, 'text/xml');
            }
            else {
                var progIDs = ['Msxml2.DOMDocument.3.0', 'Msxml2.DOMDocument'];

                for (var i = 0; i < progIDs.length; i++) {
                    var xmlDOM = new ActiveXObject(progIDs[i]);
                    xmlDOM.async = false;
                    xmlDOM.loadXML(markup);
                    xmlDOM.setProperty('SelectionLanguage', 'XPath');

                    return xmlDOM;
                }
            }
        }
        catch (ex) {
        }

        return null;
    }

    ///////////////////////////////////////////////////////////////////////////////
    // CancelEventArgs

    ss.CancelEventArgs = function CancelEventArgs$() {
        ss.CancelEventArgs.initializeBase(this);
        this.cancel = false;
    }
    ss.CancelEventArgs.registerClass('CancelEventArgs', ss.EventArgs);

    ///////////////////////////////////////////////////////////////////////////////
    // Tuple

    ss.Tuple = function (first, second, third) {
        this.first = first;
        this.second = second;
        if (arguments.length == 3) {
            this.third = third;
        }
    }
    ss.Tuple.registerClass('Tuple');

    ///////////////////////////////////////////////////////////////////////////////
    // Observable

    ss.Observable = function (v) {
        this._v = v;
        this._observers = null;
    }
    ss.Observable.prototype = {

        getValue: function () {
            this._observers = ss.Observable._captureObservers(this._observers);
            return this._v;
        },
        setValue: function (v) {
            if (this._v !== v) {
                this._v = v;

                var observers = this._observers;
                if (observers) {
                    this._observers = null;
                    ss.Observable._invalidateObservers(observers);
                }
            }
        }
    };

    ss.Observable._observerStack = [];
    ss.Observable._observerRegistration = {
        dispose: function () {
            ss.Observable._observerStack.pop();
        }
    }
    ss.Observable.registerObserver = function (o) {
        ss.Observable._observerStack.push(o);
        return ss.Observable._observerRegistration;
    }
    ss.Observable._captureObservers = function (observers) {
        var registeredObservers = ss.Observable._observerStack;
        var observerCount = registeredObservers.length;

        if (observerCount) {
            observers = observers || [];
            for (var i = 0; i < observerCount; i++) {
                var observer = registeredObservers[i];
                if (!observers.contains(observer)) {
                    observers.push(observer);
                }
            }
            return observers;
        }
        return null;
    }
    ss.Observable._invalidateObservers = function (observers) {
        for (var i = 0, len = observers.length; i < len; i++) {
            observers[i].invalidateObserver();
        }
    }

    ss.Observable.registerClass('Observable');


    ss.ObservableCollection = function (items) {
        this._items = items || [];
        this._observers = null;
    }
    ss.ObservableCollection.prototype = {

        get_item: function (index) {
            this._observers = ss.Observable._captureObservers(this._observers);
            return this._items[index];
        },
        set_item: function (index, item) {
            this._items[index] = item;
            this._updated();
        },
        get_length: function () {
            this._observers = ss.Observable._captureObservers(this._observers);
            return this._items.length;
        },
        add: function (item) {
            this._items.push(item);
            this._updated();
        },
        clear: function () {
            this._items.clear();
            this._updated();
        },
        contains: function (item) {
            return this._items.contains(item);
        },
        getEnumerator: function () {
            this._observers = ss.Observable._captureObservers(this._observers);
            return this._items.getEnumerator();
        },
        indexOf: function (item) {
            return this._items.indexOf(item);
        },
        insert: function (index, item) {
            this._items.insert(index, item);
            this._updated();
        },
        remove: function (item) {
            if (this._items.remove(item)) {
                this._updated();
                return true;
            }
            return false;
        },
        removeAt: function (index) {
            this._items.removeAt(index);
            this._updated();
        },
        toArray: function () {
            return this._items;
        },
        _updated: function () {
            var observers = this._observers;
            if (observers) {
                this._observers = null;
                ss.Observable._invalidateObservers(observers);
            }
        }
    }
    ss.ObservableCollection.registerClass('ObservableCollection', null, ss.IEnumerable);

    ///////////////////////////////////////////////////////////////////////////////
    // Interfaces

    ss.IApplication = function () { };
    ss.IApplication.registerInterface('IApplication');

    ss.IContainer = function () { };
    ss.IContainer.registerInterface('IContainer');

    ss.IObjectFactory = function () { };
    ss.IObjectFactory.registerInterface('IObjectFactory');

    ss.IEventManager = function () { };
    ss.IEventManager.registerInterface('IEventManager');

    ss.IInitializable = function () { };
    ss.IInitializable.registerInterface('IInitializable');


// SparkleXrm.js
Type.registerNamespace('Xrm');Xrm.ArrayEx=function(){}
Xrm.ArrayEx.add=function(list,item){list[list.length]=item;}
Xrm.ArrayEx.getEnumerator=function(list){return new ss.ArrayEnumerator(list);}
Xrm.ArrayEx.join=function(list,delimeter){var $0='';for(var $1=0;$1<list.length;$1++){if($1>0){$0+=delimeter;}$0+=list[$1];}return $0;}
Xrm.DelegateItterator=function(){}
Xrm.DelegateItterator.callbackItterate=function(action,numberOfTimes,completeCallBack,errorCallBack){Xrm.DelegateItterator.$0(action,0,numberOfTimes,completeCallBack,errorCallBack);}
Xrm.DelegateItterator.$0=function($p0,$p1,$p2,$p3,$p4){if($p1<$p2){try{$p0($p1,function(){
$p1++;Xrm.DelegateItterator.$0($p0,$p1,$p2,$p3,$p4);},function($p1_0){
$p4($p1_0);});}catch($0){$p4($0);}}else{$p3();}}
Xrm.NumberEx=function(){}
Xrm.NumberEx.parse=function(value,format){if(String.isNullOrEmpty(value)){return null;}value=value.replaceAll(' ','');if(format.decimalSymbol!=='.'){value=value.replaceAll(format.decimalSymbol,'.');}value=value.replaceAll(format.numberSepartor,'');if(value.startsWith('(')){value='-'+value.replaceAll('(','').replaceAll(')','');}else if(value.endsWith('-')){value='-'+value.substring(0,value.length-1);}var $0=Number.parse(value);return $0;}
Xrm.NumberEx.getNumberFormatInfo=function(){var $0={};if(Xrm.Sdk.OrganizationServiceProxy.userSettings!=null){$0.decimalSymbol=Xrm.Sdk.OrganizationServiceProxy.userSettings.decimalsymbol;$0.numberGroupFormat=Xrm.Sdk.OrganizationServiceProxy.userSettings.numbergroupformat;$0.numberSepartor=Xrm.Sdk.OrganizationServiceProxy.userSettings.numberseparator;$0.negativeFormatCode=Xrm.Sdk.OrganizationServiceProxy.userSettings.negativeformatcode;}else{$0.decimalSymbol='.';$0.numberGroupFormat='3';$0.numberSepartor=',';$0.negativeFormatCode=0;}$0.precision=2;$0.minValue=-2147483648;$0.maxValue=2147483648;return $0;}
Xrm.NumberEx.getCurrencyEditFormatInfo=function(){var $0={};if(Xrm.Sdk.OrganizationServiceProxy.userSettings!=null){$0.decimalSymbol=Xrm.Sdk.OrganizationServiceProxy.userSettings.decimalsymbol;$0.numberGroupFormat=Xrm.Sdk.OrganizationServiceProxy.userSettings.numbergroupformat;$0.numberSepartor=Xrm.Sdk.OrganizationServiceProxy.userSettings.numberseparator;$0.negativeFormatCode=Xrm.Sdk.OrganizationServiceProxy.userSettings.negativecurrencyformatcode;$0.precision=Xrm.Sdk.OrganizationServiceProxy.userSettings.currencydecimalprecision;$0.currencySymbol=Xrm.Sdk.OrganizationServiceProxy.userSettings.currencysymbol;}else{$0.decimalSymbol='.';$0.numberGroupFormat='3';$0.numberSepartor=',';$0.negativeFormatCode=0;$0.precision=2;$0.currencySymbol='$';}return $0;}
Xrm.NumberEx.getCurrencyFormatInfo=function(){var $0={};if(Xrm.Sdk.OrganizationServiceProxy.userSettings!=null){$0.decimalSymbol=Xrm.Sdk.OrganizationServiceProxy.userSettings.decimalsymbol;$0.numberGroupFormat=Xrm.Sdk.OrganizationServiceProxy.userSettings.numbergroupformat;$0.numberSepartor=Xrm.Sdk.OrganizationServiceProxy.userSettings.numberseparator;$0.negativeFormatCode=Xrm.Sdk.OrganizationServiceProxy.userSettings.negativecurrencyformatcode;$0.precision=Xrm.Sdk.OrganizationServiceProxy.userSettings.currencydecimalprecision;$0.currencySymbol=Xrm.Sdk.OrganizationServiceProxy.userSettings.currencysymbol;}else{$0.decimalSymbol='.';$0.numberGroupFormat='3';$0.numberSepartor=',';$0.negativeFormatCode=0;$0.precision=2;$0.currencySymbol='$';}return $0;}
Xrm.NumberEx.format=function(value,format){if(value==null){return '';}var $0=format.numberGroupFormat.split(',');var $1='';var $2=Math.floor(Math.abs(value));var $3=$2.toString();var $4=value.toString().substr($3.length+1+((value<0)?1:0));var $5=$3.length;var $6=0;while($5>0){var $8=parseInt($0[$6]);if($6<($0.length-1)){$6++;}if(!$8){$8=$5+1;}$1=$3.substring($5,$5-$8)+$1;if($5>$8){$1=format.numberSepartor+$1;}$5=$5-$8;}var $7=(value<0);if(format.precision>0){var $9=format.precision-$4.length;for(var $A=0;$A<$9;$A++){$4=$4+'0';}$1=$1+format.decimalSymbol+$4;}if($7){switch(format.negativeFormatCode){case 0:$1='('+$1+')';break;case 2:$1='- '+$1;break;case 3:$1=$1+'-';break;case 4:$1=$1+' -';break;case 1:default:$1='-'+$1;break;}}return $1;}
Xrm.NumberEx.round=function(numericValue,precision){var $0=1;if(precision>0){$0=Math.pow(10,precision);}return Math.round(numericValue*$0)/$0;}
Xrm.NumberEx.getCurrencySymbol=function(currencyId){var $0=Xrm.Services.CachedOrganizationService.retrieveMultiple("<fetch distinct='false' no-lock='false' mapping='logical'><entity name='organization'><attribute name='currencydisplayoption' /><attribute name='currencysymbol' /></entity></fetch>");var $1=$0.get_entities().get_item(0);var $2=Xrm.Services.CachedOrganizationService.retrieve('transactioncurrency',currencyId.toString(),['currencysymbol','isocurrencycode']);if(!$1.getAttributeValueOptionSet('currencydisplayoption').value){return $2.getAttributeValueString('currencysymbol')+' ';}else{return $2.getAttributeValueString('isocurrencycode')+' ';}}
Xrm.PageEx=function(){}
Xrm.PageEx.getCacheKey=function(){var $0=WEB_RESOURCE_ORG_VERSION_NUMBER;if(typeof($0)!=='undefined'){return $0+'/';}else{return '';}}
Xrm.PageEx.getWebResourceData=function(){var $0=window.location.search;if($0!=null&&!!$0){var $1=$0.substr(1).split('&');var $enum1=ss.IEnumerator.getEnumerator($1);while($enum1.moveNext()){var $2=$enum1.current;if($2.toLowerCase().startsWith('data=')){var $3=$2.replaceAll('+',' ').split('=');return Xrm.PageEx.$0($3[1]);}}}return {};}
Xrm.PageEx.$0=function($p0){var $0={};var $1=(decodeURIComponent($p0)).split('&');var $enum1=ss.IEnumerator.getEnumerator($1);while($enum1.moveNext()){var $2=$enum1.current;var $3=$2.split('=');$0[$3[0]]=$3[1];}return $0;}
Xrm.StringEx=function(){}
Xrm.StringEx.IN=function(value,values){if(value!=null){var $enum1=ss.IEnumerator.getEnumerator(values);while($enum1.moveNext()){var $0=$enum1.current;if(value===$0){return true;}}}return false;}
Xrm.TaskIterrator=function(){this.$0=[];}
Xrm.TaskIterrator.prototype={$1:null,$2:null,addTask:function(task){this.$0.add(task);},start:function(successCallBack,errorCallBack){this.$1=errorCallBack;this.$2=successCallBack;this.$3();},$3:function(){var $0=this.$0[0];if($0!=null){this.$0.remove($0);$0(ss.Delegate.create(this,this.$3),this.$1);}else{if(this.$2!=null){this.$2();}}}}
Xrm.TabItem=function(){}
Xrm.TabItem.prototype={sections:null,getDisplayState:function(){return 'expanded';},getLabel:function(){return null;},getName:function(){return null;},getParent:function(){return null;},getVisible:function(){return false;},setDisplayState:function(state){},setFocus:function(){},setLabel:function(label){},setVisible:function(visible){}}
Xrm.TabSection=function(){}
Xrm.TabSection.prototype={controls:null,getLabel:function(){return null;},getName:function(){return null;},getParent:function(){return null;},getVisible:function(){return false;},setLabel:function(label){},setVisible:function(visible){}}
Type.registerNamespace('Xrm.ComponentModel');Xrm.ComponentModel.INotifyPropertyChanged=function(){};Xrm.ComponentModel.INotifyPropertyChanged.registerInterface('Xrm.ComponentModel.INotifyPropertyChanged');Type.registerNamespace('Xrm.Sdk');Xrm.Sdk.EntityStates=function(){};Xrm.Sdk.EntityStates.prototype = {unchanged:0,created:1,changed:2,deleted:3,readOnly:4}
Xrm.Sdk.EntityStates.registerEnum('Xrm.Sdk.EntityStates',false);Xrm.Sdk.EntityRole=function(){};Xrm.Sdk.EntityRole.prototype = {referencing:0,referenced:1}
Xrm.Sdk.EntityRole.registerEnum('Xrm.Sdk.EntityRole',false);Xrm.Sdk.Attribute=function(attributeName,typeName){this.attributeName=attributeName;this.typeName=typeName;this.formattedValue=null;this.value=null;this.id=null;this.logicalName=null;this.name=null;}
Xrm.Sdk.Attribute.deSerialise=function(node,overrideType){var $0=(Xrm.Sdk.XmlHelper.getAttributeValue(node,'i:nil')==='true');var $1=null;if(!$0){var $2=overrideType;if($2==null){$2=Xrm.Sdk.Attribute.$0(Xrm.Sdk.XmlHelper.getAttributeValue(node,'i:type'));}var $3=Xrm.Sdk.XmlHelper.getNodeTextValue(node);switch($2){case 'EntityReference':var $4=new Xrm.Sdk.EntityReference(new Xrm.Sdk.Guid(Xrm.Sdk.XmlHelper.selectSingleNodeValue(node,'Id')),Xrm.Sdk.XmlHelper.selectSingleNodeValue(node,'LogicalName'),Xrm.Sdk.XmlHelper.selectSingleNodeValue(node,'Name'));$1=$4;break;case 'AliasedValue':$1=Xrm.Sdk.Attribute.deSerialise(Xrm.Sdk.XmlHelper.selectSingleNode(node,'Value'),null);break;case 'boolean':$1=($3==='true');break;case 'double':$1=parseFloat($3);break;case 'decimal':$1=parseFloat($3);break;case 'dateTime':var $5=Xrm.Sdk.DateTimeEx.parse($3);var $6=Xrm.Sdk.OrganizationServiceProxy.userSettings;if($6!=null){$5.setTime($5.getTime()+($5.getTimezoneOffset()*60*1000));var $7=Xrm.Sdk.DateTimeEx.utcToLocalTimeFromSettings($5,$6);$1=$7;}else{$1=$5;}break;case 'guid':$1=new Xrm.Sdk.Guid($3);break;case 'int':$1=parseInt($3);break;case 'OptionSetValue':$1=Xrm.Sdk.OptionSetValue.parse(Xrm.Sdk.XmlHelper.selectSingleNodeValue(node,'Value'));break;case 'Money':$1=new Xrm.Sdk.Money(parseFloat(Xrm.Sdk.XmlHelper.selectSingleNodeValue(node,'Value')));break;case 'EntityCollection':$1=Xrm.Sdk.EntityCollection.deSerialise(node);break;default:$1=$3;break;}}return $1;}
Xrm.Sdk.Attribute.serialise=function(attributeName,value,metaData){var $0='<a:KeyValuePairOfstringanyType><b:key>'+attributeName+'</b:key>';var $1=Type.getInstanceType(value).get_name();if(value!=null&&metaData!=null&&Object.keyExists(metaData,attributeName)){$1=metaData[attributeName];}$0+=Xrm.Sdk.Attribute.serialiseValue(value,$1);$0+='</a:KeyValuePairOfstringanyType>';return $0;}
Xrm.Sdk.Attribute.serialiseValue=function(value,overrideTypeName){var $0='';var $1=overrideTypeName;if($1==null){$1=Type.getInstanceType(value).get_name();}switch($1){case 'String':$0+='<b:value i:type="'+Xrm.Sdk.Attribute.$1('string')+'" xmlns:c="http://www.w3.org/2001/XMLSchema">';$0+=Xrm.Sdk.XmlHelper.encode(value);$0+='</b:value>';break;case 'Boolean':case 'bool':$0+='<b:value i:type="'+Xrm.Sdk.Attribute.$1('boolean')+'" xmlns:c="http://www.w3.org/2001/XMLSchema">';$0+=Xrm.Sdk.XmlHelper.encode(value.toString());$0+='</b:value>';break;case 'Date':var $2=value;var $3=null;var $4=Xrm.Sdk.OrganizationServiceProxy.userSettings;if($4!=null){var $D=Xrm.Sdk.DateTimeEx.localTimeToUTCFromSettings($2,$4);$3=Xrm.Sdk.DateTimeEx.toXrmString($D);}else{$3=Xrm.Sdk.DateTimeEx.toXrmStringUTC($2);}$0+='<b:value i:type="'+Xrm.Sdk.Attribute.$1('dateTime')+'" xmlns:c="http://www.w3.org/2001/XMLSchema">';$0+=Xrm.Sdk.XmlHelper.encode($3);$0+='</b:value>';break;case 'decimal':$0+='<b:value i:type="'+Xrm.Sdk.Attribute.$1('decimal')+'" xmlns:c="http://www.w3.org/2001/XMLSchema">';var $5=null;if(value!=null){$5=value.toString();}$0+=Xrm.Sdk.XmlHelper.encode($5);$0+='</b:value>';break;case 'double':$0+='<b:value i:type="'+Xrm.Sdk.Attribute.$1('double')+'" xmlns:c="http://www.w3.org/2001/XMLSchema">';var $6=null;if(value!=null){$6=value.toString();}$0+=Xrm.Sdk.XmlHelper.encode($6);$0+='</b:value>';break;case 'int':$0+='<b:value i:type="'+Xrm.Sdk.Attribute.$1('int')+'" xmlns:c="http://www.w3.org/2001/XMLSchema">';var $7=null;if(value!=null){$7=value.toString();}$0+=Xrm.Sdk.XmlHelper.encode($7);$0+='</b:value>';break;case 'Guid':$0+='<b:value i:type="'+Xrm.Sdk.Attribute.$1('guid')+'" xmlns:c="http://schemas.microsoft.com/2003/10/Serialization/">';$0+=(value).value;$0+='</b:value>';break;case 'EntityReference':var $8=value;$0+='<b:value i:type="'+Xrm.Sdk.Attribute.$1($1)+'">';$0+='<a:Id>'+$8.id+'</a:Id><a:LogicalName>'+$8.logicalName+'</a:LogicalName>';$0+='</b:value>';break;case 'OptionSetValue':var $9=value;if($9.value!=null){$0+='<b:value i:type="'+Xrm.Sdk.Attribute.$1($1)+'">';$0+='<a:Value>'+$9.value+'</a:Value>';$0+='</b:value>';}else{$0+='<b:value i:type="'+Xrm.Sdk.Attribute.$1($1)+'" i:nil="true"/>';}break;case 'EntityCollection':$0+='<b:value i:type="'+Xrm.Sdk.Attribute.$1($1)+'">';$0+=Xrm.Sdk.EntityCollection.serialise(value);$0+='</b:value>';break;case 'Money':var $A=value;if($A!=null&&$A.value!=null){$0+='<b:value i:type="'+Xrm.Sdk.Attribute.$1($1)+'">';$0+='<a:Value>'+$A.value.toString()+'</a:Value>';$0+='</b:value>';}else{$0+='<b:value i:type="'+Xrm.Sdk.Attribute.$1($1)+'" i:nil="true"/>';}break;case 'EntityFilters':var $B=value;var $C=[];if((1&$B)===1){$C.add('Entity');}if((2&$B)===2){$C.add('Attributes');}if((4&$B)===4){$C.add('Privileges');}if((8&$B)===8){$C.add('Relationships');}$0+='<b:value i:type="c:EntityFilters" xmlns:c="http://schemas.microsoft.com/xrm/2011/Metadata">'+Xrm.Sdk.XmlHelper.encode($C.join(' '))+'</b:value>';break;default:$0+='<b:value i:nil="true"/>';break;}return $0;}
Xrm.Sdk.Attribute.$0=function($p0){var $0=$p0.indexOf(':');return $p0.substring($0+1,$p0.length-$0+1);}
Xrm.Sdk.Attribute.$1=function($p0){switch($p0){case 'String':case 'Guid':case 'DateTime':case 'string':case 'decimal':case 'double':case 'boolean':case 'dateTime':case 'guid':case 'int':return 'c:'+$p0;case 'EntityReference':case 'OptionSetValue':case 'AliasedValue':case 'EntityCollection':case 'Money':return 'a:'+$p0;}throw new Error('Could not add node prefix for type '+$p0);}
Xrm.Sdk.Attribute.prototype={attributeName:null,typeName:null,formattedValue:null,value:null,id:null,logicalName:null,name:null}
Xrm.Sdk.AttributeTypes=function(){}
Xrm.Sdk.OrganizationSettings=function(){Xrm.Sdk.OrganizationSettings.initializeBase(this,[Xrm.Sdk.OrganizationSettings.entityLogicalName]);}
Xrm.Sdk.OrganizationSettings.prototype={weekstartdaycode:null}
Xrm.Sdk.UserSettingsAttributes=function(){}
Xrm.Sdk.UserSettings=function(){Xrm.Sdk.UserSettings.initializeBase(this,[Xrm.Sdk.UserSettings.entityLogicalName]);}
Xrm.Sdk.UserSettings.prototype={usersettingsid:null,businessunitid:null,calendartype:null,currencydecimalprecision:null,currencyformatcode:null,currencysymbol:null,dateformatcode:null,dateformatstring:null,dateseparator:null,decimalsymbol:null,defaultcalendarview:null,defaultdashboardid:null,localeid:null,longdateformatcode:null,negativecurrencyformatcode:null,negativeformatcode:null,numbergroupformat:null,numberseparator:null,offlinesyncinterval:null,pricingdecimalprecision:null,showweeknumber:null,systemuserid:null,timeformatcodestring:null,timeformatstring:null,timeseparator:null,timezonebias:null,timezonecode:null,timezonedaylightbias:null,timezonedaylightday:null,timezonedaylightdayofweek:null,timezonedaylighthour:null,timezonedaylightminute:null,timezonedaylightmonth:null,timezonedaylightsecond:null,timezonedaylightyear:null,timezonestandardbias:null,timezonestandardday:null,timezonestandarddayofweek:null,timezonestandardhour:null,timezonestandardminute:null,timezonestandardmonth:null,timezonestandardsecond:null,timezonestandardyear:null,transactioncurrencyid:null,uilanguageid:null,workdaystarttime:null,workdaystoptime:null,getNumberFormatString:function(decimalPlaces){return '###,###,###.000';}}
Xrm.Sdk.DataCollectionOfEntity=function(entities){this._internalArray=entities;}
Xrm.Sdk.DataCollectionOfEntity.prototype={_internalArray:null,items:function(){return this._internalArray;},getEnumerator:function(){return Xrm.ArrayEx.getEnumerator(this._internalArray);},get_count:function(){return this._internalArray.length;},get_item:function(i){return this._internalArray[i];},set_item:function(i,value){this._internalArray[i]=value;return value;}}
Xrm.Sdk.DateTimeEx=function(){}
Xrm.Sdk.DateTimeEx.toXrmString=function(date){var $0=Xrm.Sdk.DateTimeEx.$0(date.getMonth()+1,2);var $1=Xrm.Sdk.DateTimeEx.$0(date.getDate(),2);var $2=Xrm.Sdk.DateTimeEx.$0(date.getHours(),2);var $3=Xrm.Sdk.DateTimeEx.$0(date.getMinutes(),2);var $4=Xrm.Sdk.DateTimeEx.$0(date.getSeconds(),2);return String.format('{0}-{1}-{2}T{3}:{4}:{5}Z',date.getFullYear(),$0,$1,$2,$3,$4);}
Xrm.Sdk.DateTimeEx.toXrmStringUTC=function(date){var $0=Xrm.Sdk.DateTimeEx.$0(date.getUTCMonth()+1,2);var $1=Xrm.Sdk.DateTimeEx.$0(date.getUTCDate(),2);var $2=Xrm.Sdk.DateTimeEx.$0(date.getUTCHours(),2);var $3=Xrm.Sdk.DateTimeEx.$0(date.getUTCMinutes(),2);var $4=Xrm.Sdk.DateTimeEx.$0(date.getUTCSeconds(),2);return String.format('{0}-{1}-{2}T{3}:{4}:{5}Z',date.getUTCFullYear(),$0,$1,$2,$3,$4);}
Xrm.Sdk.DateTimeEx.$0=function($p0,$p1){var $0=$p0.toString();while($0.length<$p1){$0='0'+$0;}return $0;}
Xrm.Sdk.DateTimeEx.parse=function(dateString){if(!String.isNullOrEmpty(dateString)){var $0=(Date.parseDate(dateString));return $0;}else{return null;}}
Xrm.Sdk.DateTimeEx.formatDuration=function(totalMinutes){if(totalMinutes!=null){var $0=totalMinutes*60;var $1=Math.floor($0/86400);var $2=Math.floor(($0%86400)/3600);var $3=Math.floor((($0%86400)%3600)/60);var $4=(($0%86400)%3600)%60;var $5=[];if($1>0){Xrm.ArrayEx.add($5,'{0}d');}if($2>0){Xrm.ArrayEx.add($5,'{1}h');}if($3>0){Xrm.ArrayEx.add($5,'{2}m');}if(!$1&&!$2&&!$3){Xrm.ArrayEx.add($5,'{2}m');}return String.format(Xrm.ArrayEx.join($5,' '),$1,$2,$3);}else{return '';}}
Xrm.Sdk.DateTimeEx.parseDuration=function(duration){var $0=(duration==null)||(!duration.length);if($0){return null;}var $1='/([0-9.]*)[ ]?((h(our)?[s]?)|(m(inute)?[s]?)|(d(ay)?[s]?))/g';var $2=RegExp.parse($1);var $3=false;var $4=false;var $5=0;do{var $6=$2.exec(duration);$4=($6!=null&&$6.length>0);$3=$3||$4;if($4){var $7=parseFloat($6[1]);switch($6[2].substr(0,1).toLowerCase()){case 'd':$7=$7*60*24;break;case 'h':$7=$7*60;break;}$5+=Math.floor($7);duration.replaceAll($6[0],'');}}while($4);if($3){return $5;}else{return null;}}
Xrm.Sdk.DateTimeEx.addTimeToDate=function(date,time){if(date==null){date=Date.get_now();}if(time!=null){var $0=Date.parseDate('01 Jan 2000 '+time.replaceAll('.',':').replaceAll('-',':').replaceAll(',',':'));var $1=new Date(date.getTime());if(!isNaN(($0))){$1.setHours($0.getHours());$1.setMinutes($0.getMinutes());$1.setSeconds($0.getSeconds());$1.setMilliseconds($0.getMilliseconds());return $1;}return null;}return date;}
Xrm.Sdk.DateTimeEx.localTimeToUTCFromSettings=function(LocalTime,settings){return Xrm.Sdk.DateTimeEx.localTimeToUTC(LocalTime,settings.timezonebias,settings.timezonedaylightbias,settings.timezonedaylightyear,settings.timezonedaylightmonth,settings.timezonedaylightday,settings.timezonedaylighthour,settings.timezonedaylightminute,settings.timezonedaylightsecond,0,settings.timezonedaylightdayofweek,settings.timezonestandardbias,settings.timezonestandardyear,settings.timezonestandardmonth,settings.timezonestandardday,settings.timezonestandardhour,settings.timezonestandardminute,settings.timezonestandardsecond,0,settings.timezonestandarddayofweek);}
Xrm.Sdk.DateTimeEx.localTimeToUTC=function(LocalTime,Bias,DaylightBias,DaylightYear,DaylightMonth,DaylightDay,DaylightHour,DaylightMinute,DaylightSecond,DaylightMilliseconds,DaylightWeekday,StandardBias,StandardYear,StandardMonth,StandardDay,StandardHour,StandardMinute,StandardSecond,StandardMilliseconds,StandardWeekday){var $0;var $1;var $2;var $3;var $4;var $5;var $6;$1=Bias;if((!!StandardMonth)&&(!!DaylightMonth)){$3=Xrm.Sdk.DateTimeEx.$1(LocalTime,StandardYear,StandardMonth,StandardDay,StandardHour,StandardMinute,StandardSecond,StandardMilliseconds,StandardWeekday);if($3==null){return null;}$4=Xrm.Sdk.DateTimeEx.$1(LocalTime,DaylightYear,DaylightMonth,DaylightDay,DaylightHour,DaylightMinute,DaylightSecond,DaylightMilliseconds,DaylightWeekday);if($4==null){return null;}if($4<$3){if((LocalTime>=$4)&&(LocalTime<$3)){$6=true;}else{$6=false;}}else{if((LocalTime>=$3)&&(LocalTime<$4)){$6=false;}else{$6=true;}}if($6){$2=DaylightBias;}else{$2=StandardBias;}$0=$1+$2;}else{$0=$1;}$5=Xrm.Sdk.DateTimeEx.dateAdd('minutes',$0,LocalTime);return $5;}
Xrm.Sdk.DateTimeEx.utcToLocalTimeFromSettings=function(UTCTime,settings){return Xrm.Sdk.DateTimeEx.utcToLocalTime(UTCTime,settings.timezonebias,settings.timezonedaylightbias,settings.timezonedaylightyear,settings.timezonedaylightmonth,settings.timezonedaylightday,settings.timezonedaylighthour,settings.timezonedaylightminute,settings.timezonedaylightsecond,0,settings.timezonedaylightdayofweek,settings.timezonestandardbias,settings.timezonestandardyear,settings.timezonestandardmonth,settings.timezonestandardday,settings.timezonestandardhour,settings.timezonestandardminute,settings.timezonestandardsecond,0,settings.timezonestandarddayofweek);}
Xrm.Sdk.DateTimeEx.utcToLocalTime=function(UTCTime,Bias,DaylightBias,DaylightYear,DaylightMonth,DaylightDay,DaylightHour,DaylightMinute,DaylightSecond,DaylightMilliseconds,DaylightWeekday,StandardBias,StandardYear,StandardMonth,StandardDay,StandardHour,StandardMinute,StandardSecond,StandardMilliseconds,StandardWeekday){var $0=0;var $1=0;var $2=0;var $3;var $4;var $5;var $6;var $7;var $8;$1=Bias;if((!!StandardMonth)&&(!!DaylightMonth)){$3=Xrm.Sdk.DateTimeEx.$1(UTCTime,StandardYear,StandardMonth,StandardDay,StandardHour,StandardMinute,StandardSecond,StandardMilliseconds,StandardWeekday);if($3==null){return null;}$4=Xrm.Sdk.DateTimeEx.$1(UTCTime,DaylightYear,DaylightMonth,DaylightDay,DaylightHour,DaylightMinute,DaylightSecond,DaylightMilliseconds,DaylightWeekday);if($4==null){return null;}$2=StandardBias;$0=$1+$2;$6=Xrm.Sdk.DateTimeEx.dateAdd('minutes',$0,$4);$2=DaylightBias;$0=$1+$2;$5=Xrm.Sdk.DateTimeEx.dateAdd('minutes',$0,$3);if($6<$5){if((UTCTime>=$6)&&(UTCTime<$5)){$8=true;}else{$8=false;}}else{if((UTCTime>=$5)&&(UTCTime<$6)){$8=false;}else{$8=true;}}if($8){$2=DaylightBias;}else{$2=StandardBias;}$0=$1+$2;}else{$0=$1;}$7=Xrm.Sdk.DateTimeEx.dateAdd('minutes',$0*-1,UTCTime);return $7;}
Xrm.Sdk.DateTimeEx.$1=function($p0,$p1,$p2,$p3,$p4,$p5,$p6,$p7,$p8){if(!!$p1){return null;}var $0;var $1;var $2;var $3;var $4;var $5;var $6;var $7;$4=$p3;if(($4>5)||(!$4)){return null;}$7=$p8;$6=$p2;$5=$p0.getFullYear();$2=0;$0=Xrm.Sdk.DateTimeEx.firstDayOfMonth($p0,$6);$0=Xrm.Sdk.DateTimeEx.dateAdd('hours',$p4,$0);$0=Xrm.Sdk.DateTimeEx.dateAdd('minutes',$p5,$0);$0=Xrm.Sdk.DateTimeEx.dateAdd('seconds',$p6,$0);$0=Xrm.Sdk.DateTimeEx.dateAdd('milliseconds',$p7,$0);$1=$0;if($1.getDay()>$7){$0=Xrm.Sdk.DateTimeEx.dateAdd('days',(7-($1.getDay()-$7)),$0);}else if($1.getDay()<$7){$0=Xrm.Sdk.DateTimeEx.dateAdd('days',($7-$1.getDay()),$0);}$2=$0.getDay();$3=1;$1=$0;while($3<$4){$0=Xrm.Sdk.DateTimeEx.dateAdd('days',7,$0);if($0.getMonth()!==$1.getMonth()){break;}$1=$0;$3=$3+1;}return $1;}
Xrm.Sdk.DateTimeEx.firstDayOfMonth=function(date,Month){var $0=new Date(date.getTime());$0.setMonth(Month-1);$0.setDate(1);$0.setHours(0);$0.setMinutes(0);$0.setSeconds(0);$0.setMilliseconds(0);return $0;}
Xrm.Sdk.DateTimeEx.dateAdd=function(interval,value,date){var $0=date.getTime();var $1;switch(interval){case 'milliseconds':$1=new Date($0+value);break;case 'seconds':$1=new Date($0+(value*1000));break;case 'minutes':$1=new Date($0+(value*1000*60));break;case 'hours':$1=new Date($0+(value*1000*60*60));break;case 'days':$1=new Date($0+(value*1000*60*60*24));break;default:$1=date;break;}return $1;}
Xrm.Sdk.DateTimeEx.firstDayOfWeek=function(date){var $0=0;if(Xrm.Sdk.OrganizationServiceProxy.organizationSettings!=null){$0=Xrm.Sdk.OrganizationServiceProxy.organizationSettings.weekstartdaycode.value;}var $1=new Date(date.getTime());var $2=$1.getDay();$2=$2-$0;if($2<0){$2=7+$2;}if($2>0){$1=Xrm.Sdk.DateTimeEx.dateAdd('days',($2*-1),$1);}$1.setHours(0);$1.setMinutes(0);$1.setSeconds(0);$1.setMilliseconds(0);return $1;}
Xrm.Sdk.DateTimeEx.lastDayOfWeek=function(date){var $0=0;if(Xrm.Sdk.OrganizationServiceProxy.organizationSettings!=null){$0=Xrm.Sdk.OrganizationServiceProxy.organizationSettings.weekstartdaycode.value;}var $1=new Date(date.getTime());var $2=$1.getDay();$2=$2-$0;if($2<0){$2=7+$2;}$1=Xrm.Sdk.DateTimeEx.dateAdd('days',(6-$2),$1);$1.setHours(23);$1.setMinutes(59);$1.setSeconds(59);$1.setMilliseconds(999);return $1;}
Xrm.Sdk.DateTimeEx.formatTimeSpecific=function(dateValue,formatString){formatString=formatString.replaceAll('.',':').replaceAll('-',':').replaceAll(',',':');if(dateValue!=null&&(Date===Type.getInstanceType(dateValue))){return dateValue.format(formatString);}else{return '';}}
Xrm.Sdk.DateTimeEx.formatDateSpecific=function(dateValue,formatString){if(dateValue!=null){return xrmjQuery.datepicker.formatDate( formatString, dateValue );}else{return '';}}
Xrm.Sdk.DateTimeEx.parseDateSpecific=function(dateValue,formatString){return xrmjQuery.datepicker.parseDate( formatString, dateValue );}
Xrm.Sdk.DateTimeEx.setTime=function(date,time){if(date!=null&&time!=null){date.setHours(time.getHours());date.setMinutes(time.getMinutes());date.setSeconds(time.getSeconds());date.setMilliseconds(time.getMilliseconds());}}
Xrm.Sdk.DateTimeEx.setUTCTime=function(date,time){if(date!=null&&time!=null){date.setUTCHours(time.getUTCHours());date.setUTCMinutes(time.getUTCMinutes());date.setUTCSeconds(time.getUTCSeconds());date.setUTCMilliseconds(time.getUTCMilliseconds());}}
Xrm.Sdk.DateTimeEx.getTimeDuration=function(date){return (date.getHours()*(60*60))+(date.getMinutes()*60)+date.getSeconds();}
Xrm.Sdk.Entity=function(entityName){this._metaData={};this.logicalName=entityName;this.$0={};this.formattedValues={};}
Xrm.Sdk.Entity.sortDelegate=function(attributeName,a,b){var $0=a.getAttributeValue(attributeName);var $1=b.getAttributeValue(attributeName);var $2=0;var $3='';if($0!=null){$3=Type.getInstanceType($0).get_name();}else if($1!=null){$3=Type.getInstanceType($1).get_name();}if($0!==$1){switch($3.toLowerCase()){case 'string':$0=($0!=null)?($0).toLowerCase():null;$1=($1!=null)?($1).toLowerCase():null;if($0<$1){$2=-1;}else{$2=1;}break;case 'date':if($0==null){$2=-1;}else if($1==null){$2=1;}else if($0<$1){$2=-1;}else{$2=1;}break;case 'number':var $4=($0!=null)?($0):0;var $5=($1!=null)?($1):0;$2=($4-$5);break;case 'money':var $6=($0!=null)?($0).value:0;var $7=($1!=null)?($1).value:0;$2=($6-$7);break;case 'optionsetvalue':var $8=($0!=null)?($0).value:0;$8=($8!=null)?$8:0;var $9=($1!=null)?($1).value:0;$9=($9!=null)?$9:0;$2=($8-$9);break;case 'entityreference':var $A=(($0!=null)&&(($0).name!=null))?($0).name:'';var $B=($1!=null&&(($1).name!=null))?($1).name:'';if($A<$B){$2=-1;}else{$2=1;}break;}}return $2;}
Xrm.Sdk.Entity.prototype={logicalName:null,id:null,entityState:0,$0:null,formattedValues:null,relatedEntities:null,deSerialise:function(entityNode){this.logicalName=Xrm.Sdk.XmlHelper.selectSingleNodeValue(entityNode,'LogicalName');this.id=Xrm.Sdk.XmlHelper.selectSingleNodeValue(entityNode,'Id');var $0=Xrm.Sdk.XmlHelper.selectSingleNode(entityNode,'Attributes');var $1=$0.childNodes.length;for(var $4=0;$4<$1;$4++){var $5=$0.childNodes[$4];try{var $6=Xrm.Sdk.XmlHelper.selectSingleNodeValue($5,'key');var $7=Xrm.Sdk.Attribute.deSerialise(Xrm.Sdk.XmlHelper.selectSingleNode($5,'value'),null);this.$0[$6]=$7;this.$1($6,$7);}catch($8){throw new Error('Invalid Attribute Value :'+Xrm.Sdk.XmlHelper.getNodeTextValue($5)+':'+$8.message);}}var $2=Xrm.Sdk.XmlHelper.selectSingleNode(entityNode,'FormattedValues');if($2!=null){for(var $9=0;$9<$2.childNodes.length;$9++){var $A=$2.childNodes[$9];var $B=Xrm.Sdk.XmlHelper.selectSingleNodeValue($A,'key');var $C=Xrm.Sdk.XmlHelper.selectSingleNodeValue($A,'value');this.$1($B+'name',$C);this.formattedValues[$B+'name']=$C;var $D=this.$0[$B];if($D!=null){$D.name=$C;}}}var $3=Xrm.Sdk.XmlHelper.selectSingleNode(entityNode,'RelatedEntities');if($3!=null){var $E={};for(var $F=0;$F<$3.childNodes.length;$F++){var $10=$3.childNodes[$F];var $11=Xrm.Sdk.XmlHelper.selectSingleNode($10,'key');var $12=Xrm.Sdk.XmlHelper.selectSingleNodeValue($11,'SchemaName');var $13=new Xrm.Sdk.Relationship($12);var $14=Xrm.Sdk.XmlHelper.selectSingleNode($10,'value');var $15=Xrm.Sdk.EntityCollection.deSerialise($14);$E[$13.schemaName]=$15;}this.relatedEntities=$E;}},$1:function($p0,$p1){var $0=this;var $1=Type.safeCast($0,Object);$1[$p0]=$p1;},serialise:function(ommitRoot){var $0='';if(ommitRoot==null||!ommitRoot){$0+='<a:Entity>';}$0+='<a:Attributes>';var $1=(this);if($1[this.logicalName+'id']==null){delete $1[this.logicalName+'id'];}var $enum1=ss.IEnumerator.getEnumerator(Object.keys($1));while($enum1.moveNext()){var $2=$enum1.current;if(typeof($1[$2])!="function"&&Object.prototype.hasOwnProperty.call(this, $2)&&!Xrm.StringEx.IN($2,['id','logicalName','entityState','formattedValues','relatedEntities'])&&!$2.startsWith('$')&&!$2.startsWith('_')){var $3=$1[$2];if(!Object.keyExists(this.formattedValues,$2)){$0+=Xrm.Sdk.Attribute.serialise($2,$3,this._metaData);}}}$0+='</a:Attributes>';$0+='<a:LogicalName>'+this.logicalName+'</a:LogicalName>';if(this.id!=null){$0+='<a:Id>'+this.id+'</a:Id>';}if(ommitRoot==null||!ommitRoot){$0+='</a:Entity>';}return $0;},setAttributeValue:function(name,value){this.$0[name]=value;this.$1(name,value);},getAttributeValue:function(attributeName){return this[attributeName];},getAttributeValueOptionSet:function(attributeName){return this.getAttributeValue(attributeName);},getAttributeValueGuid:function(attributeName){return this.getAttributeValue(attributeName);},getAttributeValueInt:function(attributeName){return this.getAttributeValue(attributeName);},getAttributeValueFloat:function(attributeName){return this.getAttributeValue(attributeName);},getAttributeValueString:function(attributeName){return this.getAttributeValue(attributeName);},getAttributeValueEntityReference:function(attributeName){return this.getAttributeValue(attributeName);},raisePropertyChanged:function(propertyName){var $0={};$0.propertyName=propertyName;if(this.$2!=null){this.$2(this,$0);}if(propertyName!=='EntityState'&&!this.entityState&&this.entityState!==1){this.entityState=2;}},toEntityReference:function(){return new Xrm.Sdk.EntityReference(new Xrm.Sdk.Guid(this.id),this.logicalName,'');},add_propertyChanged:function(value){this.$2=ss.Delegate.combine(this.$2,value);},remove_propertyChanged:function(value){this.$2=ss.Delegate.remove(this.$2,value);},$2:null}
Xrm.Sdk.EntityCollection=function(entities){this.$0=new Xrm.Sdk.DataCollectionOfEntity(entities);}
Xrm.Sdk.EntityCollection.serialise=function(value){var $0='';if(Type.getInstanceType(value)!==Xrm.Sdk.EntityCollection){throw new Error("An attribute value of type 'EntityCollection' must contain an EntityCollection instance");}var $1=Type.safeCast(value,Xrm.Sdk.EntityCollection);$0+='<a:Entities>';for(var $2=0;$2<$1.$0.get_count();$2++){$0+=($1.get_item($2)).serialise(false);}$0+='</a:Entities>';return $0;}
Xrm.Sdk.EntityCollection.deSerialise=function(node){var $0=[];var $1=new Xrm.Sdk.EntityCollection($0);$1.set_entityName(Xrm.Sdk.XmlHelper.selectSingleNodeValue(node,'EntityName'));var $2=Xrm.Sdk.XmlHelper.selectSingleNodeDeep(node,'Entities');var $enum1=ss.IEnumerator.getEnumerator($2.childNodes);while($enum1.moveNext()){var $3=$enum1.current;var $4=new Xrm.Sdk.Entity($1.get_entityName());$4.deSerialise($3);Xrm.ArrayEx.add($0,$4);}return $1;}
Xrm.Sdk.EntityCollection.prototype={$0:null,get_entities:function(){return this.$0;},set_entities:function(value){this.$0=value;return value;},$1:null,get_entityName:function(){return this.$1;},set_entityName:function(value){this.$1=value;return value;},$2:null,get_minActiveRowVersion:function(){return this.$2;},set_minActiveRowVersion:function(value){this.$2=value;return value;},$3:false,get_moreRecords:function(){return this.$3;},set_moreRecords:function(value){this.$3=value;return value;},$4:null,get_pagingCookie:function(){return this.$4;},set_pagingCookie:function(value){this.$4=value;return value;},$5:0,get_totalRecordCount:function(){return this.$5;},set_totalRecordCount:function(value){this.$5=value;return value;},$6:false,get_totalRecordCountLimitExceeded:function(){return this.$6;},set_totalRecordCountLimitExceeded:function(value){this.$6=value;return value;},get_item:function(index){return this.get_entities().get_item(index);},set_item:function(index,value){this.get_entities().set_item(index,value);return value;}}
Xrm.Sdk.EntityReference=function(Id,LogicalName,Name){this.id=Id;this.logicalName=LogicalName;this.name=Name;}
Xrm.Sdk.EntityReference.prototype={name:null,id:null,logicalName:null,toString:function(){return String.format('[EntityReference: {0},{1},{2}]',this.name,this.id,this.logicalName);},toSoap:function(NameSpace){if(NameSpace==null||!NameSpace){NameSpace='a';}return String.format('<{0}:EntityReference><{0}:Id>{1}</{0}:Id><{0}:LogicalName>{2}</{0}:LogicalName><{0}:Name i:nil="true" /></{0}:EntityReference>',NameSpace,this.id.value,this.logicalName);}}
Xrm.Sdk.Guid=function(Value){this.value=Value;}
Xrm.Sdk.Guid.prototype={value:null,toString:function(){return this.value;}}
Xrm.Sdk.Money=function(value){this.value=value;}
Xrm.Sdk.Money.prototype={value:0}
Xrm.Sdk.OptionSetValue=function(value){this.value=value;}
Xrm.Sdk.OptionSetValue.parse=function(value){if(String.isNullOrEmpty(value)){return new Xrm.Sdk.OptionSetValue(null);}else{return new Xrm.Sdk.OptionSetValue(parseInt(value));}}
Xrm.Sdk.OptionSetValue.prototype={name:null,value:null}
Xrm.Sdk.OrganizationServiceProxy=function(){}
Xrm.Sdk.OrganizationServiceProxy.registerExecuteMessageResponseType=function(responseTypeName,organizationResponseType){Xrm.Sdk.OrganizationServiceProxy.executeMessageResponseTypes[responseTypeName]=organizationResponseType;}
Xrm.Sdk.OrganizationServiceProxy.getUserSettings=function(){if(Xrm.Sdk.OrganizationServiceProxy.userSettings==null){Xrm.Sdk.OrganizationServiceProxy.userSettings=Xrm.Sdk.OrganizationServiceProxy.retrieve(Xrm.Sdk.UserSettings.entityLogicalName,Xrm.Page.context.getUserId(),['AllColumns']);Xrm.Sdk.OrganizationServiceProxy.userSettings.timeformatstring=Xrm.Sdk.OrganizationServiceProxy.userSettings.timeformatstring.replaceAll(':',Xrm.Sdk.OrganizationServiceProxy.userSettings.timeseparator);Xrm.Sdk.OrganizationServiceProxy.userSettings.dateformatstring=Xrm.Sdk.OrganizationServiceProxy.userSettings.dateformatstring.replaceAll('/',Xrm.Sdk.OrganizationServiceProxy.userSettings.dateseparator);Xrm.Sdk.OrganizationServiceProxy.userSettings.dateformatstring=Xrm.Sdk.OrganizationServiceProxy.userSettings.dateformatstring.replaceAll('MM','mm').replaceAll('yyyy','UU').replaceAll('yy','y').replaceAll('UU','yy').replaceAll('M','m');}if(Xrm.Sdk.OrganizationServiceProxy.organizationSettings==null){var $0="<fetch>\r\n                                    <entity name='organization' >\r\n                                        <attribute name='weekstartdaycode' />\r\n                                    </entity>\r\n                                </fetch>";Xrm.Sdk.OrganizationServiceProxy.organizationSettings=Xrm.Sdk.OrganizationServiceProxy.retrieveMultiple($0).get_entities().get_item(0);}return Xrm.Sdk.OrganizationServiceProxy.userSettings;}
Xrm.Sdk.OrganizationServiceProxy.doesNNAssociationExist=function(relationship,Entity1,Entity2){var $0="<fetch mapping='logical'>"+"  <entity name='"+relationship.schemaName+"'>"+'    <all-attributes />'+'    <filter>'+"      <condition attribute='"+Entity1.logicalName+"id' operator='eq' value ='"+Entity1.id.value+"' />"+"      <condition attribute='"+Entity2.logicalName+"id' operator='eq' value='"+Entity2.id.value+"' />"+'    </filter>'+'  </entity>'+'</fetch>';var $1=Xrm.Sdk.OrganizationServiceProxy.retrieveMultiple($0);if($1.get_entities().get_count()>0){return true;}return false;}
Xrm.Sdk.OrganizationServiceProxy.associate=function(entityName,entityId,relationship,relatedEntities){var $0=Xrm.Sdk.OrganizationServiceProxy.$B(Xrm.Sdk.OrganizationServiceProxy.$0(entityName,entityId,relationship,relatedEntities),'Execute',null);delete $0;$0=null;}
Xrm.Sdk.OrganizationServiceProxy.beginAssociate=function(entityName,entityId,relationship,relatedEntities,callBack){Xrm.Sdk.OrganizationServiceProxy.$B(Xrm.Sdk.OrganizationServiceProxy.$0(entityName,entityId,relationship,relatedEntities),'Execute',callBack);}
Xrm.Sdk.OrganizationServiceProxy.endAssociate=function(asyncState){var $0=asyncState;if($0.childNodes!=null){}else{throw asyncState;}}
Xrm.Sdk.OrganizationServiceProxy.$0=function($p0,$p1,$p2,$p3){var $0='';var $enum1=ss.IEnumerator.getEnumerator($p3);while($enum1.moveNext()){var $2=$enum1.current;$0+=$2.toSoap('a');}var $1='<Execute xmlns="http://schemas.microsoft.com/xrm/2011/Contracts/Services" xmlns:i="http://www.w3.org/2001/XMLSchema-instance">';$1+='      <request i:type="a:AssociateRequest" xmlns:a="http://schemas.microsoft.com/xrm/2011/Contracts">';$1+='        <a:Parameters xmlns:b="http://schemas.datacontract.org/2004/07/System.Collections.Generic">';$1+='          <a:KeyValuePairOfstringanyType>';$1+='            <b:key>Target</b:key>';$1+='            <b:value i:type="a:EntityReference">';$1+='              <a:Id>'+$p1.value+'</a:Id>';$1+='              <a:LogicalName>'+$p0+'</a:LogicalName>';$1+='              <a:Name i:nil="true" />';$1+='            </b:value>';$1+='          </a:KeyValuePairOfstringanyType>';$1+='          <a:KeyValuePairOfstringanyType>';$1+='            <b:key>Relationship</b:key>';$1+='            <b:value i:type="a:Relationship">';$1+='              <a:PrimaryEntityRole i:nil="true" />';$1+='              <a:SchemaName>'+$p2.schemaName+'</a:SchemaName>';$1+='            </b:value>';$1+='          </a:KeyValuePairOfstringanyType>';$1+='          <a:KeyValuePairOfstringanyType>';$1+='            <b:key>RelatedEntities</b:key>';$1+='            <b:value i:type="a:EntityReferenceCollection">'+$0+'</b:value>';$1+='          </a:KeyValuePairOfstringanyType>';$1+='        </a:Parameters>';$1+='        <a:RequestId i:nil="true" />';$1+='        <a:RequestName>Associate</a:RequestName>';$1+='      </request>';$1+='    </Execute>';return $1;}
Xrm.Sdk.OrganizationServiceProxy.disassociate=function(entityName,entityId,relationship,relatedEntities){var $0=Xrm.Sdk.OrganizationServiceProxy.$B(Xrm.Sdk.OrganizationServiceProxy.$1(entityName,entityId,relationship,relatedEntities),'Execute',null);delete $0;$0=null;}
Xrm.Sdk.OrganizationServiceProxy.beginDisassociate=function(entityName,entityId,relationship,relatedEntities,callBack){Xrm.Sdk.OrganizationServiceProxy.$B(Xrm.Sdk.OrganizationServiceProxy.$1(entityName,entityId,relationship,relatedEntities),'Execute',callBack);}
Xrm.Sdk.OrganizationServiceProxy.endDisassociate=function(asyncState){var $0=asyncState;if($0.childNodes!=null){}else{throw asyncState;}}
Xrm.Sdk.OrganizationServiceProxy.$1=function($p0,$p1,$p2,$p3){var $0='';var $enum1=ss.IEnumerator.getEnumerator($p3);while($enum1.moveNext()){var $2=$enum1.current;$0+=$2.toSoap('a');}var $1='<Execute xmlns="http://schemas.microsoft.com/xrm/2011/Contracts/Services" xmlns:i="http://www.w3.org/2001/XMLSchema-instance">';$1+='      <request i:type="a:DisassociateRequest" xmlns:a="http://schemas.microsoft.com/xrm/2011/Contracts">';$1+='        <a:Parameters xmlns:b="http://schemas.datacontract.org/2004/07/System.Collections.Generic">';$1+='          <a:KeyValuePairOfstringanyType>';$1+='            <b:key>Target</b:key>';$1+='            <b:value i:type="a:EntityReference">';$1+='              <a:Id>'+$p1.value+'</a:Id>';$1+='              <a:LogicalName>'+$p0+'</a:LogicalName>';$1+='              <a:Name i:nil="true" />';$1+='            </b:value>';$1+='          </a:KeyValuePairOfstringanyType>';$1+='          <a:KeyValuePairOfstringanyType>';$1+='            <b:key>Relationship</b:key>';$1+='            <b:value i:type="a:Relationship">';$1+='              <a:PrimaryEntityRole i:nil="true" />';$1+='              <a:SchemaName>'+$p2.schemaName+'</a:SchemaName>';$1+='            </b:value>';$1+='          </a:KeyValuePairOfstringanyType>';$1+='          <a:KeyValuePairOfstringanyType>';$1+='            <b:key>RelatedEntities</b:key>';$1+='            <b:value i:type="a:EntityReferenceCollection">'+$0+'</b:value>';$1+='          </a:KeyValuePairOfstringanyType>';$1+='        </a:Parameters>';$1+='        <a:RequestId i:nil="true" />';$1+='        <a:RequestName>Disassociate</a:RequestName>';$1+='      </request>';$1+='    </Execute>';return $1;}
Xrm.Sdk.OrganizationServiceProxy.retrieveMultiple=function(fetchXml){var $0=Xrm.Sdk.OrganizationServiceProxy.$B(Xrm.Sdk.OrganizationServiceProxy.$2(fetchXml),'RetrieveMultiple',null);var $1=Xrm.Sdk.OrganizationServiceProxy.$3($0,Xrm.Sdk.Entity);delete $0;$0=null;return $1;}
Xrm.Sdk.OrganizationServiceProxy.$2=function($p0){var $0='<RetrieveMultiple xmlns="http://schemas.microsoft.com/xrm/2011/Contracts/Services" ><query i:type="a:FetchExpression" ><a:Query>';$0+=Xrm.Sdk.XmlHelper.encode($p0);$0+='</a:Query></query></RetrieveMultiple>';return $0;}
Xrm.Sdk.OrganizationServiceProxy.beginRetrieveMultiple=function(fetchXml,callBack){var $0=Xrm.Sdk.OrganizationServiceProxy.$B(Xrm.Sdk.OrganizationServiceProxy.$2(fetchXml),'RetrieveMultiple',callBack);}
Xrm.Sdk.OrganizationServiceProxy.endRetrieveMultiple=function(asyncState,entityType){var $0=asyncState;if($0.childNodes!=null){var $1=Xrm.Sdk.OrganizationServiceProxy.$3($0,entityType);return $1;}else{throw asyncState;}}
Xrm.Sdk.OrganizationServiceProxy.$3=function($p0,$p1){var $0=$p0.firstChild.firstChild;var $1=Xrm.Sdk.XmlHelper.selectSingleNodeDeep($0,'RetrieveMultipleResult');var $2=Xrm.Sdk.XmlHelper.selectSingleNode($1,'Entities');var $3=0;if($2!=null){$3=$2.childNodes.length;}var $4=[];for(var $6=0;$6<$3;$6++){var $7=$2.childNodes[$6];var $8=new $p1(null);$8.deSerialise($7);$4[$6]=$8;}var $5=new Xrm.Sdk.EntityCollection($4);$5.set_moreRecords(Xrm.Sdk.XmlHelper.selectSingleNodeValue($1,'MoreRecords')==='true');$5.set_pagingCookie(Xrm.Sdk.XmlHelper.selectSingleNodeValue($1,'PagingCookie'));$5.set_totalRecordCount(parseInt(Xrm.Sdk.XmlHelper.selectSingleNodeValue($1,'TotalRecordCount')));$5.set_totalRecordCountLimitExceeded(Xrm.Sdk.XmlHelper.selectSingleNodeValue($1,'TotalRecordCountLimitExceeded')==='true');return $5;}
Xrm.Sdk.OrganizationServiceProxy.retrieve=function(entityName,entityId,attributesList){var $0=Xrm.Sdk.OrganizationServiceProxy.$B(Xrm.Sdk.OrganizationServiceProxy.$4(entityName,entityId,attributesList),'Retrieve',null);var $1=Xrm.Sdk.XmlHelper.selectSingleNodeDeep($0,'RetrieveResult');var $2=new Xrm.Sdk.Entity(entityName);$2.deSerialise($1);delete $0;$0=null;return $2;}
Xrm.Sdk.OrganizationServiceProxy.beginRetrieve=function(entityName,entityId,attributesList,callBack){Xrm.Sdk.OrganizationServiceProxy.$B(Xrm.Sdk.OrganizationServiceProxy.$4(entityName,entityId,attributesList),'Retrieve',callBack);}
Xrm.Sdk.OrganizationServiceProxy.endRetrieve=function(asyncState,entityType){var $0=asyncState;var $1=Xrm.Sdk.XmlHelper.selectSingleNodeDeep($0,'RetrieveResult');var $2=new Xrm.Sdk.Entity(null);$2.deSerialise($1);return $2;}
Xrm.Sdk.OrganizationServiceProxy.$4=function($p0,$p1,$p2){var $0='<Retrieve xmlns="http://schemas.microsoft.com/xrm/2011/Contracts/Services">';$0+='<entityName>'+$p0+'</entityName>';$0+='<id>'+$p1+'</id>';$0+='<columnSet xmlns:d4p1="http://schemas.microsoft.com/xrm/2011/Contracts" xmlns:i="http://www.w3.org/2001/XMLSchema-instance">';if(($p2!=null)&&($p2[0]!=='AllColumns')){$0+='<d4p1:AllColumns>false</d4p1:AllColumns>';$0+='<d4p1:Columns xmlns:d5p1="http://schemas.microsoft.com/2003/10/Serialization/Arrays">';for(var $1=0;$1<$p2.length;$1++){$0+='<d5p1:string>'+$p2[$1]+'</d5p1:string>';}$0+='</d4p1:Columns>';}else{$0+='<d4p1:AllColumns>true</d4p1:AllColumns>';}$0+='</columnSet></Retrieve>';return $0;}
Xrm.Sdk.OrganizationServiceProxy.create=function(entity){var $0=Xrm.Sdk.OrganizationServiceProxy.$B(Xrm.Sdk.OrganizationServiceProxy.$5(entity),'Create',null);var $1=Xrm.Sdk.XmlHelper.selectSingleNodeValueDeep($0,'CreateResult');delete $0;$0=null;return new Xrm.Sdk.Guid($1);}
Xrm.Sdk.OrganizationServiceProxy.$5=function($p0){var $0='<Create xmlns="http://schemas.microsoft.com/xrm/2011/Contracts/Services" ><entity>';$0+=$p0.serialise(true);$0+='</entity></Create>';return $0;}
Xrm.Sdk.OrganizationServiceProxy.beginCreate=function(entity,callBack){Xrm.Sdk.OrganizationServiceProxy.$B(Xrm.Sdk.OrganizationServiceProxy.$5(entity),'Create',callBack);}
Xrm.Sdk.OrganizationServiceProxy.endCreate=function(asyncState){var $0=asyncState;if($0.childNodes!=null){var $1=Xrm.Sdk.XmlHelper.selectSingleNodeValueDeep($0,'CreateResult');return new Xrm.Sdk.Guid($1);}else{throw asyncState;}}
Xrm.Sdk.OrganizationServiceProxy.setState=function(id,entityName,stateCode,statusCode){var $0=Xrm.Sdk.OrganizationServiceProxy.$B(Xrm.Sdk.OrganizationServiceProxy.$6(id,entityName,stateCode,statusCode),'Execute',null);delete $0;$0=null;}
Xrm.Sdk.OrganizationServiceProxy.beginSetState=function(id,entityName,stateCode,statusCode,callBack){Xrm.Sdk.OrganizationServiceProxy.$B(Xrm.Sdk.OrganizationServiceProxy.$6(id,entityName,stateCode,statusCode),'Execute',callBack);}
Xrm.Sdk.OrganizationServiceProxy.endSetState=function(asyncState){var $0=asyncState;if($0.childNodes!=null){}else{throw asyncState;}}
Xrm.Sdk.OrganizationServiceProxy.$6=function($p0,$p1,$p2,$p3){return String.format('<Execute xmlns="http://schemas.microsoft.com/xrm/2011/Contracts/Services">'+'<request i:type="b:SetStateRequest" xmlns:a="http://schemas.microsoft.com/xrm/2011/Contracts" xmlns:b="http://schemas.microsoft.com/crm/2011/Contracts">'+'<a:Parameters xmlns:c="http://schemas.datacontract.org/2004/07/System.Collections.Generic">'+'<a:KeyValuePairOfstringanyType>'+'<c:key>EntityMoniker</c:key>'+'<c:value i:type="a:EntityReference">'+'<a:Id>{0}</a:Id>'+'<a:LogicalName>{1}</a:LogicalName>'+'<a:Name i:nil="true" />'+'</c:value>'+'</a:KeyValuePairOfstringanyType>'+'<a:KeyValuePairOfstringanyType>'+'<c:key>State</c:key>'+'<c:value i:type="a:OptionSetValue">'+'<a:Value>{2}</a:Value>'+'</c:value>'+'</a:KeyValuePairOfstringanyType>'+'<a:KeyValuePairOfstringanyType>'+'<c:key>Status</c:key>'+'<c:value i:type="a:OptionSetValue">'+'<a:Value>{3}</a:Value>'+'</c:value>'+'</a:KeyValuePairOfstringanyType>'+'</a:Parameters>'+'<a:RequestId i:nil="true" />'+'<a:RequestName>SetState</a:RequestName>'+'</request></Execute>',$p0.value,$p1,$p2,$p3);}
Xrm.Sdk.OrganizationServiceProxy.delete_=function(entityName,id){var $0=Xrm.Sdk.OrganizationServiceProxy.$B(Xrm.Sdk.OrganizationServiceProxy.$7(entityName,id),'Delete',null);var $1=Xrm.Sdk.XmlHelper.selectSingleNodeValueDeep($0,'DeleteResult');delete $0;$0=null;return $1;}
Xrm.Sdk.OrganizationServiceProxy.$7=function($p0,$p1){var $0=String.format('<Delete xmlns="http://schemas.microsoft.com/xrm/2011/Contracts/Services" ><entityName>{0}</entityName><id>{1}</id></Delete>',$p0,$p1.value);return $0;}
Xrm.Sdk.OrganizationServiceProxy.beginDelete=function(entityName,id,callBack){var $0=Xrm.Sdk.OrganizationServiceProxy.$B(Xrm.Sdk.OrganizationServiceProxy.$7(entityName,id),'Delete',callBack);}
Xrm.Sdk.OrganizationServiceProxy.endDelete=function(asyncState){var $0=asyncState;if($0.childNodes!=null){return;}else{throw asyncState;}}
Xrm.Sdk.OrganizationServiceProxy.update=function(entity){var $0='<Update xmlns="http://schemas.microsoft.com/xrm/2011/Contracts/Services" ><entity>';$0+=entity.serialise(true);$0+='</entity></Update>';var $1=Xrm.Sdk.OrganizationServiceProxy.$B($0,'Update',null);delete $1;$1=null;}
Xrm.Sdk.OrganizationServiceProxy.beginUpdate=function(entity,callBack){var $0='<Update xmlns="http://schemas.microsoft.com/xrm/2011/Contracts/Services" ><entity>';$0+=entity.serialise(true);$0+='</entity></Update>';var $1=Xrm.Sdk.OrganizationServiceProxy.$B($0,'Update',callBack);}
Xrm.Sdk.OrganizationServiceProxy.endUpdate=function(asyncState){var $0=asyncState;if($0.childNodes!=null){return;}else{throw asyncState;}}
Xrm.Sdk.OrganizationServiceProxy.execute=function(request){var $0=Xrm.Sdk.OrganizationServiceProxy.$B(Xrm.Sdk.OrganizationServiceProxy.$8(request),'Execute',null);return Xrm.Sdk.OrganizationServiceProxy.endExecute($0);}
Xrm.Sdk.OrganizationServiceProxy.$8=function($p0){var $0='<Execute xmlns="http://schemas.microsoft.com/xrm/2011/Contracts/Services">';$0+=$p0.serialise();$0+='</Execute>';return $0;}
Xrm.Sdk.OrganizationServiceProxy.beginExecute=function(request,callBack){Xrm.Sdk.OrganizationServiceProxy.$B(Xrm.Sdk.OrganizationServiceProxy.$8(request),'Execute',callBack);}
Xrm.Sdk.OrganizationServiceProxy.endExecute=function(asyncState){var $0=asyncState;if($0.childNodes!=null){var $1=Xrm.Sdk.XmlHelper.selectSingleNodeDeep($0,'ExecuteResult');var $2=Xrm.Sdk.XmlHelper.selectSingleNodeValue($1,'ResponseName');switch($2){case 'RetrieveAttribute':return new Xrm.Sdk.Messages.RetrieveAttributeResponse($1);case 'RetrieveAllEntities':return new Xrm.Sdk.Messages.RetrieveAllEntitiesResponse($1);case 'RetrieveEntity':return new Xrm.Sdk.Messages.RetrieveEntityResponse($1);case 'BulkDeleteResponse':return new Xrm.Sdk.Messages.BulkDeleteResponse($1);case 'FetchXmlToQueryExpression':return new Xrm.Sdk.Messages.FetchXmlToQueryExpressionResponse($1);case 'RetrieveMetadataChanges':return new Xrm.Sdk.Messages.RetrieveMetadataChangesResponse($1);case 'RetrieveRelationship':return new Xrm.Sdk.RetrieveRelationshipResponse($1);case 'ExecuteWorkflow':return new Xrm.Sdk.Messages.ExecuteWorkflowResponse($1);case 'Assign':return new Xrm.Sdk.Messages.AssignResponse($1);default:if(Object.keyExists(Xrm.Sdk.OrganizationServiceProxy.executeMessageResponseTypes,$2)){var $3=Xrm.Sdk.OrganizationServiceProxy.executeMessageResponseTypes[$2];var $4=new $3($1);return $4;}else{return null;}}}else{throw asyncState;}}
Xrm.Sdk.OrganizationServiceProxy.$9=function($p0){var $0='<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" xmlns:d="http://schemas.microsoft.com/xrm/2011/Contracts/Services"  xmlns:a="http://schemas.microsoft.com/xrm/2011/Contracts" xmlns:i="http://www.w3.org/2001/XMLSchema-instance" xmlns:b="http://schemas.datacontract.org/2004/07/System.Collections.Generic">'+'<s:Body>'+$p0+'</s:Body>'+'</s:Envelope>';return $0;}
Xrm.Sdk.OrganizationServiceProxy.$A=function(){if(typeof(Xrm.Page.context.getClientUrl)==='undefined'){var $0=Xrm.Page.context;var $1;if($0.isOutlookClient()&&!$0.isOutlookOnline()){$1=window.location.protocol+'//'+window.location.hostname;}else{$1=Xrm.Page.context.getServerUrl();$1=$1.replace(new RegExp('/^(http|https):\\/\\/([_a-zA-Z0-9\\-\\.]+)(:([0-9]{1,5}))?/'),window.location.protocol+'//'+window.location.hostname);$1=$1.replace(new RegExp('/\\/$/'),'');}return $1;}else{return Xrm.Page.context.getClientUrl();}}
Xrm.Sdk.OrganizationServiceProxy.$B=function($p0,$p1,$p2){var $0=($p2!=null);var $1=Xrm.Sdk.OrganizationServiceProxy.$9($p0);var $2=null;var $3=new XMLHttpRequest();$3.open('POST',Xrm.Sdk.OrganizationServiceProxy.$A()+'/XRMServices/2011/Organization.svc/web',$0);$3.setRequestHeader('SOAPAction','http://schemas.microsoft.com/xrm/2011/Contracts/Services/IOrganizationService/'+$p1);$3.setRequestHeader('Content-Type','text/xml; charset=utf-8');if(Xrm.Sdk.OrganizationServiceProxy.withCredentials){$3.withCredentials = true;;}if($0){$3.onreadystatechange=function(){
if($3==null){return;}if($3.readyState===4){var $1_0=$3.responseXML;var $1_1=null;if($3.status!==200){$1_1=Xrm.Sdk.OrganizationServiceProxy.$C($1_0);}delete $3;$3=null;if($1_1!=null){$p2($1_1);}else{$p2($1_0);}}};$3.send($1);return null;}else{$3.send($1);var $4=$3.responseXML;if($3.status!==200){$2=Xrm.Sdk.OrganizationServiceProxy.$C($4);}delete $3;;$3=null;if($2!=null){throw $2;}else{return $4;}}}
Xrm.Sdk.OrganizationServiceProxy.$C=function($p0){var $0=null;var $1=null;var $2=null;if($p0==null||$p0.firstChild.nodeName!=='s:Envelope'){return new Error('No SOAP Envelope in response');}var $3=$p0.firstChild.firstChild;var $4=Xrm.Sdk.XmlHelper.selectSingleNode($3,'Fault');if($4!=null){var $6=Xrm.Sdk.XmlHelper.selectSingleNode($4,'detail');if($6!=null){var $7=Xrm.Sdk.XmlHelper.selectSingleNode($6,'OrganizationServiceFault');if($7!=null){$0=Xrm.Sdk.XmlHelper.selectSingleNodeValue($7,'Message');$1=Xrm.Sdk.XmlHelper.selectSingleNodeValue($7,'TraceText');$2=Xrm.Sdk.XmlHelper.selectSingleNodeValue($7,'ErrorCode');}}if($0==null){var $8=Xrm.Sdk.XmlHelper.selectSingleNode($4,'faultstring');if($8!=null){$0=Xrm.Sdk.XmlHelper.getNodeTextValue($8);}}}var $5={};$5['Trace']=$1;$5['ErrorCode']=$2;return Error.createError($0,$5);}
Xrm.Sdk.Relationship=function(schemaName){this.schemaName=schemaName;}
Xrm.Sdk.Relationship.prototype={primaryEntityRole:0,schemaName:null}
Xrm.Sdk.RetrieveRelationshipRequest=function(){this.metadataId=Xrm.Sdk.Guid.empty;}
Xrm.Sdk.RetrieveRelationshipRequest.prototype={name:null,retrieveAsIfPublished:false,serialise:function(){return '<request i:type="a:RetrieveRelationshipRequest" xmlns:a="http://schemas.microsoft.com/xrm/2011/Contracts">'+'<a:Parameters xmlns:b="http://schemas.datacontract.org/2004/07/System.Collections.Generic">'+'<a:KeyValuePairOfstringanyType>'+'<b:key>MetadataId</b:key>'+Xrm.Sdk.Attribute.serialiseValue(this.metadataId,null)+'</a:KeyValuePairOfstringanyType>'+'<a:KeyValuePairOfstringanyType>'+'<b:key>Name</b:key>'+Xrm.Sdk.Attribute.serialiseValue(this.name,null)+'</a:KeyValuePairOfstringanyType>'+'<a:KeyValuePairOfstringanyType>'+'<b:key>RetrieveAsIfPublished</b:key>'+Xrm.Sdk.Attribute.serialiseValue(this.retrieveAsIfPublished,null)+'</a:KeyValuePairOfstringanyType>'+'</a:Parameters>'+'<a:RequestId i:nil="true" />'+'<a:RequestName>RetrieveRelationship</a:RequestName>'+'</request>';}}
Xrm.Sdk.RetrieveRelationshipResponse=function(response){var $0=Xrm.Sdk.XmlHelper.selectSingleNode(response,'Results');var $enum1=ss.IEnumerator.getEnumerator($0.childNodes);while($enum1.moveNext()){var $1=$enum1.current;var $2=Xrm.Sdk.XmlHelper.selectSingleNode($1,'key');if(Xrm.Sdk.XmlHelper.getNodeTextValue($2)==='RelationshipMetadata'){var $3=Xrm.Sdk.XmlHelper.selectSingleNode($1,'value');this.relationshipMetadata=Xrm.Sdk.Metadata.MetadataSerialiser.deSerialiseRelationshipMetadata($3);}}}
Xrm.Sdk.RetrieveRelationshipResponse.prototype={relationshipMetadata:null}
Xrm.Sdk.XmlHelper=function(){}
Xrm.Sdk.XmlHelper.encode=function(value){if(value==null){return value;}return value.replace(new RegExp("([\\&\"<>'])",'g'),Xrm.Sdk.XmlHelper.replaceCallBackEncode);}
Xrm.Sdk.XmlHelper.serialiseNode=function(node){if(typeof(node.xml)==='undefined'){return new XMLSerializer().serializeToString(node);}else{return node.xml;}}
Xrm.Sdk.XmlHelper.Decode=function(value){if(value==null){return null;}return value.replace(new RegExp('(&quot;|&lt;|&gt;|&amp;|&#39;)','g'),Xrm.Sdk.XmlHelper.replaceCallBackDecode);}
Xrm.Sdk.XmlHelper.replaceCallBackEncode=function(item){return Xrm.Sdk.XmlHelper._encode_map[item];}
Xrm.Sdk.XmlHelper.replaceCallBackDecode=function(item){return Xrm.Sdk.XmlHelper._decode_map[item];}
Xrm.Sdk.XmlHelper.selectSingleNodeValue=function(doc,baseName){var $0=Xrm.Sdk.XmlHelper.selectSingleNode(doc,baseName);if($0!=null){return Xrm.Sdk.XmlHelper.getNodeTextValue($0);}else{return null;}}
Xrm.Sdk.XmlHelper.selectSingleNode=function(doc,baseName){var $enum1=ss.IEnumerator.getEnumerator(doc.childNodes);while($enum1.moveNext()){var $0=$enum1.current;if(Xrm.Sdk.XmlHelper.getLocalName($0)===baseName){return $0;}}return null;}
Xrm.Sdk.XmlHelper.getLocalName=function(node){if(node.baseName!=null){return node.baseName;}else{return node.localName;}}
Xrm.Sdk.XmlHelper.selectSingleNodeValueDeep=function(doc,baseName){var $0=Xrm.Sdk.XmlHelper.selectSingleNodeDeep(doc,baseName);if($0!=null){return Xrm.Sdk.XmlHelper.getNodeTextValue($0);}else{return null;}}
Xrm.Sdk.XmlHelper.selectSingleNodeDeep=function(doc,baseName){var $enum1=ss.IEnumerator.getEnumerator(doc.childNodes);while($enum1.moveNext()){var $0=$enum1.current;if(Xrm.Sdk.XmlHelper.getLocalName($0)===baseName){return $0;}var $1=Xrm.Sdk.XmlHelper.selectSingleNodeDeep($0,baseName);if($1!=null){return $1;}}return null;}
Xrm.Sdk.XmlHelper.nsResolver=function(prefix){switch(prefix){case 's':return 'http://schemas.xmlsoap.org/soap/envelope/';case 'a':return 'http://schemas.microsoft.com/xrm/2011/Contracts';case 'i':return 'http://www.w3.org/2001/XMLSchema-instance';case 'b':return 'http://schemas.datacontract.org/2004/07/System.Collections.Generic';case 'c':return 'http://schemas.microsoft.com/xrm/2011/Metadata';default:return null;}}
Xrm.Sdk.XmlHelper.isSelectSingleNodeUndefined=function(value){return typeof (value.selectSingleNode)==='undefined';}
Xrm.Sdk.XmlHelper.loadXml=function(xml){if(typeof (ActiveXObject)==='undefined'){var $0=new DOMParser();return $0.parseFromString(xml,'text/xml');}else{var $1=(new ActiveXObject('Msxml2.DOMDocument'));$1.async = false;$1.loadXML(xml);$1.setProperty('SelectionLanguage', 'XPath');return $1;}}
Xrm.Sdk.XmlHelper.selectSingleNodeXpath=function(node,xpath){if(!Xrm.Sdk.XmlHelper.isSelectSingleNodeUndefined(node)){return node.selectSingleNode(xpath);}else{var $0=new XPathEvaluator();var $1=$0.evaluate(xpath,node,Xrm.Sdk.XmlHelper.nsResolver,9,null);return ($1!=null)?$1.singleNodeValue:null;}}
Xrm.Sdk.XmlHelper.getNodeTextValue=function(node){if((node!=null)&&(node.firstChild!=null)){return node.firstChild.nodeValue;}else{return null;}}
Xrm.Sdk.XmlHelper.getAttributeValue=function(node,attributeName){var $0=node.attributes.getNamedItem(attributeName);if($0!=null){return $0.nodeValue;}else{return null;}}
Type.registerNamespace('Xrm.Sdk.Messages');Xrm.Sdk.Messages.EntityFilters=function(){};Xrm.Sdk.Messages.EntityFilters.prototype = {default_:1,entity:1,attributes:2,privileges:4,relationships:8,all:15}
Xrm.Sdk.Messages.EntityFilters.registerEnum('Xrm.Sdk.Messages.EntityFilters',true);Xrm.Sdk.Messages.AssignRequest=function(){}
Xrm.Sdk.Messages.AssignRequest.prototype={target:null,assignee:null,serialise:function(){return '<request i:type="c:AssignRequest" xmlns:a="http://schemas.microsoft.com/xrm/2011/Contracts" xmlns:c="http://schemas.microsoft.com/crm/2011/Contracts">'+'        <a:Parameters xmlns:b="http://schemas.datacontract.org/2004/07/System.Collections.Generic">'+'          <a:KeyValuePairOfstringanyType>'+'            <b:key>Target</b:key>'+Xrm.Sdk.Attribute.serialiseValue(this.target,null)+'          </a:KeyValuePairOfstringanyType>'+'          <a:KeyValuePairOfstringanyType>'+'            <b:key>Assignee</b:key>'+Xrm.Sdk.Attribute.serialiseValue(this.assignee,null)+'          </a:KeyValuePairOfstringanyType>'+'        </a:Parameters>'+'        <a:RequestId i:nil="true" />'+'        <a:RequestName>Assign</a:RequestName>'+'      </request>';}}
Xrm.Sdk.Messages.AssignResponse=function(response){}
Xrm.Sdk.Messages.BulkDeleteRequest=function(){}
Xrm.Sdk.Messages.BulkDeleteRequest.prototype={serialise:function(){var $0='';if(this.toRecipients!=null){var $enum1=ss.IEnumerator.getEnumerator(this.toRecipients);while($enum1.moveNext()){var $2=$enum1.current;$0+=('<d:guid>'+$2.toString()+'</d:guid>');}}var $1='';if(this.ccRecipients!=null){var $enum2=ss.IEnumerator.getEnumerator(this.ccRecipients);while($enum2.moveNext()){var $3=$enum2.current;$1+=('<d:guid>'+$3.toString()+'</d:guid>');}}return String.format('<request i:type="b:BulkDeleteRequest" xmlns:a="http://schemas.microsoft.com/xrm/2011/Contracts" xmlns:b="http://schemas.microsoft.com/crm/2011/Contracts">'+'        <a:Parameters xmlns:c="http://schemas.datacontract.org/2004/07/System.Collections.Generic">'+'          <a:KeyValuePairOfstringanyType>'+'            <c:key>QuerySet</c:key>'+'            <c:value i:type="a:ArrayOfQueryExpression">'+'              <a:QueryExpression>'+this.querySet+'              </a:QueryExpression>'+'            </c:value>'+'          </a:KeyValuePairOfstringanyType>'+'          <a:KeyValuePairOfstringanyType>'+'            <c:key>JobName</c:key>'+'            <c:value i:type="d:string" xmlns:d="http://www.w3.org/2001/XMLSchema">'+this.jobName+'</c:value>'+'          </a:KeyValuePairOfstringanyType>'+'          <a:KeyValuePairOfstringanyType>'+'            <c:key>SendEmailNotification</c:key>'+'            <c:value i:type="d:boolean" xmlns:d="http://www.w3.org/2001/XMLSchema">'+this.sendEmailNotification.toString()+'</c:value>'+'          </a:KeyValuePairOfstringanyType>'+'          <a:KeyValuePairOfstringanyType>'+'            <c:key>ToRecipients</c:key>'+'            <c:value i:type="d:ArrayOfguid" xmlns:d="http://schemas.microsoft.com/2003/10/Serialization/Arrays">'+$0+'            </c:value>'+'          </a:KeyValuePairOfstringanyType>'+'          <a:KeyValuePairOfstringanyType>'+'            <c:key>CCRecipients</c:key>'+'            <c:value i:type="d:ArrayOfguid" xmlns:d="http://schemas.microsoft.com/2003/10/Serialization/Arrays">'+$1+'            </c:value>'+'          </a:KeyValuePairOfstringanyType>'+'          <a:KeyValuePairOfstringanyType>'+'            <c:key>RecurrencePattern</c:key>'+'            <c:value i:type="d:string" xmlns:d="http://www.w3.org/2001/XMLSchema" >'+this.recurrencePattern+'</c:value>'+'          </a:KeyValuePairOfstringanyType>'+'          <a:KeyValuePairOfstringanyType>'+'            <c:key>StartDateTime</c:key>'+'            <c:value i:type="d:dateTime" xmlns:d="http://www.w3.org/2001/XMLSchema">'+Xrm.Sdk.DateTimeEx.toXrmStringUTC(Xrm.Sdk.DateTimeEx.localTimeToUTCFromSettings(this.startDateTime,Xrm.Sdk.OrganizationServiceProxy.getUserSettings()))+'</c:value>'+'          </a:KeyValuePairOfstringanyType>'+'        </a:Parameters>'+'        <a:RequestId i:nil="true" />'+'        <a:RequestName>BulkDelete</a:RequestName>'+'      </request>');},ccRecipients:null,jobName:null,querySet:null,recurrencePattern:null,sendEmailNotification:false,sourceImportId:null,startDateTime:null,toRecipients:null}
Xrm.Sdk.Messages.BulkDeleteResponse=function(response){}
Xrm.Sdk.Messages.ExecuteWorkflowRequest=function(){}
Xrm.Sdk.Messages.ExecuteWorkflowRequest.prototype={entityId:null,workflowId:null,serialise:function(){return String.format('<request i:type="b:ExecuteWorkflowRequest" xmlns:a="http://schemas.microsoft.com/xrm/2011/Contracts" xmlns:b="http://schemas.microsoft.com/crm/2011/Contracts">'+'        <a:Parameters xmlns:c="http://schemas.datacontract.org/2004/07/System.Collections.Generic">'+'          <a:KeyValuePairOfstringanyType>'+'            <c:key>EntityId</c:key>'+'            <c:value i:type="e:guid" xmlns:e="http://schemas.microsoft.com/2003/10/Serialization/">'+this.entityId+'</c:value>'+'          </a:KeyValuePairOfstringanyType>'+'          <a:KeyValuePairOfstringanyType>'+'            <c:key>WorkflowId</c:key>'+'            <c:value i:type="e:guid" xmlns:e="http://schemas.microsoft.com/2003/10/Serialization/">'+this.workflowId+'</c:value>'+'          </a:KeyValuePairOfstringanyType>'+'        </a:Parameters>'+'        <a:RequestId i:nil="true" />'+'        <a:RequestName>ExecuteWorkflow</a:RequestName>'+'      </request>');}}
Xrm.Sdk.Messages.ExecuteWorkflowResponse=function(response){var $0=Xrm.Sdk.XmlHelper.selectSingleNode(response,'Results');var $enum1=ss.IEnumerator.getEnumerator($0.childNodes);while($enum1.moveNext()){var $1=$enum1.current;var $2=Xrm.Sdk.XmlHelper.selectSingleNode($1,'key');if(Xrm.Sdk.XmlHelper.getNodeTextValue($2)==='Id'){var $3=Xrm.Sdk.XmlHelper.selectSingleNode($1,'value');this.id=Xrm.Sdk.XmlHelper.getNodeTextValue($3);}}}
Xrm.Sdk.Messages.ExecuteWorkflowResponse.prototype={id:null}
Xrm.Sdk.Messages.FetchXmlToQueryExpressionRequest=function(){}
Xrm.Sdk.Messages.FetchXmlToQueryExpressionRequest.prototype={fetchXml:null,serialise:function(){var $0='';$0+='      <request i:type="b:FetchXmlToQueryExpressionRequest" xmlns:a="http://schemas.microsoft.com/xrm/2011/Contracts" xmlns:b="http://schemas.microsoft.com/crm/2011/Contracts">';$0+='        <a:Parameters xmlns:c="http://schemas.datacontract.org/2004/07/System.Collections.Generic">';$0+='          <a:KeyValuePairOfstringanyType>';$0+='            <c:key>FetchXml</c:key>';$0+='            <c:value i:type="d:string" xmlns:d="http://www.w3.org/2001/XMLSchema">{0}</c:value>';$0+='          </a:KeyValuePairOfstringanyType>';$0+='        </a:Parameters>';$0+='        <a:RequestId i:nil="true" />';$0+='        <a:RequestName>FetchXmlToQueryExpression</a:RequestName>';$0+='      </request>';return String.format($0,Xrm.Sdk.XmlHelper.encode(this.fetchXml));}}
Xrm.Sdk.Messages.FetchXmlToQueryExpressionResponse=function(response){var $0=Xrm.Sdk.XmlHelper.selectSingleNode(response,'Results');var $enum1=ss.IEnumerator.getEnumerator($0.childNodes);while($enum1.moveNext()){var $1=$enum1.current;var $2=Xrm.Sdk.XmlHelper.selectSingleNode($1,'key');if(Xrm.Sdk.XmlHelper.getNodeTextValue($2)==='Query'){var $3=Xrm.Sdk.XmlHelper.selectSingleNode($1,'value');var $4=Xrm.Sdk.XmlHelper.serialiseNode($3).substr(165);$4=$4.substr(0,$4.length-10);this.query=$4;}}}
Xrm.Sdk.Messages.FetchXmlToQueryExpressionResponse.prototype={query:null}
Xrm.Sdk.Messages.RetrieveAllEntitiesRequest=function(){}
Xrm.Sdk.Messages.RetrieveAllEntitiesRequest.prototype={serialise:function(){return '\r\n                              <request i:type="a:RetrieveAllEntitiesRequest" xmlns:a="http://schemas.microsoft.com/xrm/2011/Contracts">\r\n                                <a:Parameters xmlns:b="http://schemas.datacontract.org/2004/07/System.Collections.Generic">\r\n                                  <a:KeyValuePairOfstringanyType>\r\n                                    <b:key>EntityFilters</b:key>\r\n                                    <b:value i:type="c:EntityFilters" xmlns:c="http://schemas.microsoft.com/xrm/2011/Metadata">Entity</b:value>\r\n                                  </a:KeyValuePairOfstringanyType>\r\n                                  <a:KeyValuePairOfstringanyType>\r\n                                    <b:key>RetrieveAsIfPublished</b:key>\r\n                                    <b:value i:type="c:boolean" xmlns:c="http://www.w3.org/2001/XMLSchema">true</b:value>\r\n                                  </a:KeyValuePairOfstringanyType>\r\n                                </a:Parameters>\r\n                                <a:RequestId i:nil="true" />\r\n                                <a:RequestName>RetrieveAllEntities</a:RequestName>\r\n                              </request>\r\n                            ';}}
Xrm.Sdk.Messages.RetrieveAllEntitiesResponse=function(response){var $0=Xrm.Sdk.XmlHelper.selectSingleNode(response,'Results');var $enum1=ss.IEnumerator.getEnumerator($0.childNodes);while($enum1.moveNext()){var $1=$enum1.current;var $2=Xrm.Sdk.XmlHelper.selectSingleNode($1,'key');if(Xrm.Sdk.XmlHelper.getNodeTextValue($2)==='EntityMetadata'){var $3=Xrm.Sdk.XmlHelper.selectSingleNode($1,'value');this.entityMetadata=new Array($3.childNodes.length);for(var $4=0;$4<$3.childNodes.length;$4++){var $5=$3.childNodes[$4];var $6=Xrm.Sdk.Metadata.MetadataSerialiser.deSerialiseEntityMetadata({},$5);this.entityMetadata[$4]=$6;}}}}
Xrm.Sdk.Messages.RetrieveAllEntitiesResponse.prototype={entityMetadata:null}
Xrm.Sdk.Messages.RetrieveAttributeRequest=function(){}
Xrm.Sdk.Messages.RetrieveAttributeRequest.prototype={entityLogicalName:null,logicalName:null,retrieveAsIfPublished:false,serialise:function(){return String.format('<request i:type="a:RetrieveAttributeRequest" xmlns:a="http://schemas.microsoft.com/xrm/2011/Contracts">'+'<a:Parameters xmlns:b="http://schemas.datacontract.org/2004/07/System.Collections.Generic">'+'<a:KeyValuePairOfstringanyType>'+'<b:key>EntityLogicalName</b:key>'+'<b:value i:type="c:string" xmlns:c="http://www.w3.org/2001/XMLSchema">{0}</b:value>'+'</a:KeyValuePairOfstringanyType>'+'<a:KeyValuePairOfstringanyType>'+'<b:key>MetadataId</b:key>'+'<b:value i:type="ser:guid"  xmlns:ser="http://schemas.microsoft.com/2003/10/Serialization/">00000000-0000-0000-0000-000000000000</b:value>'+'</a:KeyValuePairOfstringanyType>'+'<a:KeyValuePairOfstringanyType>'+'<b:key>RetrieveAsIfPublished</b:key>'+'<b:value i:type="c:boolean" xmlns:c="http://www.w3.org/2001/XMLSchema">{2}</b:value>'+'</a:KeyValuePairOfstringanyType>'+'<a:KeyValuePairOfstringanyType>'+'<b:key>LogicalName</b:key>'+'<b:value i:type="c:string" xmlns:c="http://www.w3.org/2001/XMLSchema">{1}</b:value>'+'</a:KeyValuePairOfstringanyType>'+'</a:Parameters>'+'<a:RequestId i:nil="true" />'+'<a:RequestName>RetrieveAttribute</a:RequestName>'+'</request>',this.entityLogicalName,this.logicalName,this.retrieveAsIfPublished);}}
Xrm.Sdk.Messages.RetrieveAttributeResponse=function(response){var $0=Xrm.Sdk.XmlHelper.selectSingleNode(response,'Results');var $1=Xrm.Sdk.XmlHelper.selectSingleNode($0.firstChild,'value');var $2=Xrm.Sdk.XmlHelper.getAttributeValue($1,'i:type');switch($2){case 'c:PicklistAttributeMetadata':this.attributeMetadata=Xrm.Sdk.Metadata.MetadataSerialiser.deSerialisePicklistAttributeMetadata({},$1);break;}}
Xrm.Sdk.Messages.RetrieveAttributeResponse.prototype={attributeMetadata:null}
Xrm.Sdk.Messages.RetrieveEntityRequest=function(){}
Xrm.Sdk.Messages.RetrieveEntityRequest.prototype={entityFilters:0,logicalName:null,metadataId:null,retrieveAsIfPublished:false,serialise:function(){return '<request i:type="a:RetrieveEntityRequest" xmlns:a="http://schemas.microsoft.com/xrm/2011/Contracts">'+'<a:Parameters xmlns:b="http://schemas.datacontract.org/2004/07/System.Collections.Generic">'+'<a:KeyValuePairOfstringanyType>'+'<b:key>EntityFilters</b:key>'+Xrm.Sdk.Attribute.serialiseValue(this.entityFilters,'EntityFilters')+'</a:KeyValuePairOfstringanyType>'+'<a:KeyValuePairOfstringanyType>'+'<b:key>MetadataId</b:key>'+Xrm.Sdk.Attribute.serialiseValue(this.metadataId,null)+'</a:KeyValuePairOfstringanyType>'+'<a:KeyValuePairOfstringanyType>'+'<b:key>RetrieveAsIfPublished</b:key>'+Xrm.Sdk.Attribute.serialiseValue(this.retrieveAsIfPublished,null)+'</a:KeyValuePairOfstringanyType>'+'<a:KeyValuePairOfstringanyType>'+'<b:key>LogicalName</b:key>'+Xrm.Sdk.Attribute.serialiseValue(this.logicalName,null)+'</a:KeyValuePairOfstringanyType>'+'</a:Parameters>'+'<a:RequestId i:nil="true" />'+'<a:RequestName>RetrieveEntity</a:RequestName>'+'</request>';}}
Xrm.Sdk.Messages.RetrieveEntityResponse=function(response){var $0=Xrm.Sdk.XmlHelper.selectSingleNode(response,'Results');var $enum1=ss.IEnumerator.getEnumerator($0.childNodes);while($enum1.moveNext()){var $1=$enum1.current;var $2=Xrm.Sdk.XmlHelper.selectSingleNode($1,'key');if(Xrm.Sdk.XmlHelper.getNodeTextValue($2)==='EntityMetadata'){var $3=Xrm.Sdk.XmlHelper.selectSingleNode($1,'value');this.entityMetadata=Xrm.Sdk.Metadata.MetadataSerialiser.deSerialiseEntityMetadata({},$3);}}}
Xrm.Sdk.Messages.RetrieveEntityResponse.prototype={entityMetadata:null}
Xrm.Sdk.Messages.RetrieveMetadataChangesRequest=function(){}
Xrm.Sdk.Messages.RetrieveMetadataChangesRequest.prototype={clientVersionStamp:null,deletedMetadataFilters:null,query:null,serialise:function(){return "<request i:type='a:RetrieveMetadataChangesRequest' xmlns:a='http://schemas.microsoft.com/xrm/2011/Contracts'>\r\n                <a:Parameters xmlns:b='http://schemas.datacontract.org/2004/07/System.Collections.Generic'>\r\n                  <a:KeyValuePairOfstringanyType>\r\n                    <b:key>ClientVersionStamp</b:key>"+Xrm.Sdk.Attribute.serialiseValue(this.clientVersionStamp,null)+'\r\n                  </a:KeyValuePairOfstringanyType>\r\n                  <a:KeyValuePairOfstringanyType>\r\n                    <b:key>Query</b:key>\r\n                    '+Xrm.Sdk.Metadata.Query.MetadataSerialiser.serialiseEntityQueryExpression(this.query)+"\r\n                  </a:KeyValuePairOfstringanyType>\r\n                </a:Parameters>\r\n                <a:RequestId i:nil='true' />\r\n                <a:RequestName>RetrieveMetadataChanges</a:RequestName>\r\n              </request>";}}
Xrm.Sdk.Messages.RetrieveMetadataChangesResponse=function(response){var $0=Xrm.Sdk.XmlHelper.selectSingleNode(response,'Results');var $enum1=ss.IEnumerator.getEnumerator($0.childNodes);while($enum1.moveNext()){var $1=$enum1.current;var $2=Xrm.Sdk.XmlHelper.selectSingleNode($1,'key');var $3=Xrm.Sdk.XmlHelper.selectSingleNode($1,'value');switch(Xrm.Sdk.XmlHelper.getNodeTextValue($2)){case 'ServerVersionStamp':this.serverVersionStamp=Xrm.Sdk.XmlHelper.getNodeTextValue($3);break;case 'DeletedMetadata':break;case 'EntityMetadata':this.entityMetadata=[];for(var $4=0;$4<$3.childNodes.length;$4++){var $5=$3.childNodes[$4];var $6=Xrm.Sdk.Metadata.MetadataSerialiser.deSerialiseEntityMetadata({},$5);this.entityMetadata.add($6);}break;}}}
Xrm.Sdk.Messages.RetrieveMetadataChangesResponse.prototype={entityMetadata:null,serverVersionStamp:null}
Type.registerNamespace('Xrm.Sdk.Metadata');Xrm.Sdk.Metadata.AttributeRequiredLevel=function(){};Xrm.Sdk.Metadata.AttributeRequiredLevel.prototype = {None:'None',SystemRequired:'SystemRequired',ApplicationRequired:'ApplicationRequired',Recommended:'Recommended'}
Xrm.Sdk.Metadata.AttributeRequiredLevel.registerEnum('Xrm.Sdk.Metadata.AttributeRequiredLevel',false);Xrm.Sdk.Metadata.AttributeTypeCode=function(){};Xrm.Sdk.Metadata.AttributeTypeCode.prototype = {Boolean:'Boolean',Customer:'Customer',DateTime:'DateTime',Decimal:'Decimal',Double:'Double',Integer:'Integer',Lookup:'Lookup',Memo:'Memo',None:'None',Owner:'Owner',PartyList:'PartyList',Picklist:'Picklist',State:'State',Status:'Status',String:'String',Uniqueidentifier:'Uniqueidentifier',CalendarRules:'CalendarRules',Virtual:'Virtual',BigInt:'BigInt',ManagedProperty:'ManagedProperty',EntityName:'EntityName'}
Xrm.Sdk.Metadata.AttributeTypeCode.registerEnum('Xrm.Sdk.Metadata.AttributeTypeCode',false);Xrm.Sdk.Metadata.DateTimeFormat=function(){};Xrm.Sdk.Metadata.DateTimeFormat.prototype = {DateOnly:'DateOnly',DateAndTime:'DateAndTime'}
Xrm.Sdk.Metadata.DateTimeFormat.registerEnum('Xrm.Sdk.Metadata.DateTimeFormat',false);Xrm.Sdk.Metadata.IntegerFormat=function(){};Xrm.Sdk.Metadata.IntegerFormat.prototype = {None:'None',Duration:'Duration',TimeZone:'TimeZone',Language:'Language',Locale:'Locale'}
Xrm.Sdk.Metadata.IntegerFormat.registerEnum('Xrm.Sdk.Metadata.IntegerFormat',false);Xrm.Sdk.Metadata.OptionSetType=function(){};Xrm.Sdk.Metadata.OptionSetType.prototype = {Picklist:'Picklist',State:'State',Status:'Status',Boolean:'Boolean'}
Xrm.Sdk.Metadata.OptionSetType.registerEnum('Xrm.Sdk.Metadata.OptionSetType',false);Xrm.Sdk.Metadata.RelationshipType=function(){};Xrm.Sdk.Metadata.RelationshipType.prototype = {OneToManyRelationship:'OneToManyRelationship',Default:'Default',ManyToManyRelationship:'ManyToManyRelationship'}
Xrm.Sdk.Metadata.RelationshipType.registerEnum('Xrm.Sdk.Metadata.RelationshipType',false);Xrm.Sdk.Metadata.StringFormat=function(){};Xrm.Sdk.Metadata.StringFormat.prototype = {Email:'Email',Text:'Text',TextArea:'TextArea',Url:'Url',TickerSymbol:'TickerSymbol',PhoneticGuide:'PhoneticGuide',VersionNumber:'VersionNumber',Phone:'Phone'}
Xrm.Sdk.Metadata.StringFormat.registerEnum('Xrm.Sdk.Metadata.StringFormat',false);Xrm.Sdk.Metadata.MetadataSerialiser=function(){}
Xrm.Sdk.Metadata.MetadataSerialiser.deSerialiseAttributeMetadata=function(item,attribute){var $enum1=ss.IEnumerator.getEnumerator(attribute.childNodes);while($enum1.moveNext()){var $0=$enum1.current;var $1=item;var $2=Xrm.Sdk.XmlHelper.getLocalName($0);var $3=$2.substr(0,1).toLowerCase()+$2.substr(1);if($0.attributes.length===1&&$0.attributes[0].nodeName==='i:nil'){continue;}switch($2){case 'AttributeOf':case 'DeprecatedVersion':case 'EntityLogicalName':case 'LogicalName':case 'SchemaName':case 'CalculationOf':$1[$3]=Xrm.Sdk.XmlHelper.getNodeTextValue($0);break;case 'CanBeSecuredForCreate':case 'CanBeSecuredForRead':case 'CanBeSecuredForUpdate':case 'CanModifyAdditionalSettings':case 'IsAuditEnabled':case 'IsCustomAttribute':case 'IsCustomizable':case 'IsManaged':case 'IsPrimaryId':case 'IsPrimaryName':case 'IsRenameable':case 'IsSecured':case 'IsValidForAdvancedFind':case 'IsValidForCreate':case 'IsValidForRead':case 'IsValidForUpdate':case 'DefaultValue':$1[$3]=Xrm.Sdk.Attribute.deSerialise($0,'boolean');break;case 'ColumnNumber':case 'Precision':case 'DefaultFormValue':case 'MaxLength':case 'PrecisionSource':$1[$3]=Xrm.Sdk.Attribute.deSerialise($0,'int');break;case 'Description':case 'DisplayName':var $4={};$1[$3]=Xrm.Sdk.Metadata.MetadataSerialiser.deSerialiseLabel($4,$0);break;case 'OptionSet':var $5={};$1[$3]=Xrm.Sdk.Metadata.MetadataSerialiser.deSerialiseOptionSetMetadata($5,$0);break;case 'AttributeType':item.attributeType=Xrm.Sdk.XmlHelper.getNodeTextValue($0);break;}}return item;}
Xrm.Sdk.Metadata.MetadataSerialiser.deSerialiseEntityMetadata=function(item,entity){var $enum1=ss.IEnumerator.getEnumerator(entity.childNodes);while($enum1.moveNext()){var $0=$enum1.current;var $1=item;var $2=Xrm.Sdk.XmlHelper.getLocalName($0);var $3=$2.substr(0,1).toLowerCase()+$2.substr(1);if($0.attributes.length===1&&$0.attributes[0].nodeName==='i:nil'){continue;}switch($2){case 'IconLargeName':case 'IconMediumName':case 'IconSmallName':case 'LogicalName':case 'PrimaryIdAttribute':case 'PrimaryNameAttribute':case 'RecurrenceBaseEntityLogicalName':case 'ReportViewName':case 'SchemaName':case 'PrimaryImageAttribute':$1[$3]=Xrm.Sdk.XmlHelper.getNodeTextValue($0);break;case 'AutoRouteToOwnerQueue':case 'CanBeInManyToMany':case 'CanBePrimaryEntityInRelationship':case 'CanBeRelatedEntityInRelationship':case 'CanCreateAttributes':case 'CanCreateCharts':case 'CanCreateForms':case 'CanCreateViews':case 'CanModifyAdditionalSettings':case 'CanTriggerWorkflow':case 'IsActivity':case 'IsActivityParty':case 'IsAuditEnabled':case 'IsAvailableOffline':case 'IsChildEntity':case 'IsConnectionsEnabled':case 'IsCustomEntity':case 'IsCustomizable':case 'IsDocumentManagementEnabled':case 'IsDuplicateDetectionEnabled':case 'IsEnabledForCharts':case 'IsImportable':case 'IsIntersect':case 'IsMailMergeEnabled':case 'IsManaged':case 'IsReadingPaneEnabled':case 'IsRenameable':case 'IsValidForAdvancedFind':case 'IsValidForQueue':case 'IsVisibleInMobile':$1[$3]=Xrm.Sdk.Attribute.deSerialise($0,'boolean');break;case 'ActivityTypeMask':case 'ObjectTypeCode':$1[$3]=Xrm.Sdk.Attribute.deSerialise($0,'int');break;case 'Attributes':item.attributes=[];var $enum2=ss.IEnumerator.getEnumerator($0.childNodes);while($enum2.moveNext()){var $5=$enum2.current;var $6={};item.attributes.add(Xrm.Sdk.Metadata.MetadataSerialiser.deSerialiseAttributeMetadata($6,$5));}break;case 'Description':case 'DisplayCollectionName':case 'DisplayName':var $4={};$1[$3]=Xrm.Sdk.Metadata.MetadataSerialiser.deSerialiseLabel($4,$0);break;}}return item;}
Xrm.Sdk.Metadata.MetadataSerialiser.deSerialiseLabel=function(item,metaData){item.localizedLabels=[];var $0=Xrm.Sdk.XmlHelper.selectSingleNode(metaData,'LocalizedLabels');if($0!=null&&$0.childNodes!=null){var $enum1=ss.IEnumerator.getEnumerator($0.childNodes);while($enum1.moveNext()){var $1=$enum1.current;item.localizedLabels.add(Xrm.Sdk.Metadata.MetadataSerialiser.deSerialiseLocalizedLabel({},$1));}item.userLocalizedLabel=Xrm.Sdk.Metadata.MetadataSerialiser.deSerialiseLocalizedLabel({},Xrm.Sdk.XmlHelper.selectSingleNode(metaData,'UserLocalizedLabel'));}return item;}
Xrm.Sdk.Metadata.MetadataSerialiser.deSerialiseLocalizedLabel=function(item,metaData){item.label=Xrm.Sdk.XmlHelper.selectSingleNodeValue(metaData,'Label');item.languageCode=parseInt(Xrm.Sdk.XmlHelper.selectSingleNodeValue(metaData,'LanguageCode'));return item;}
Xrm.Sdk.Metadata.MetadataSerialiser.deSerialiseRelationshipMetadata=function(attribute){var $0;var $1=Xrm.Sdk.XmlHelper.getAttributeValue(attribute,'i:type');switch($1){case 'c:OneToManyRelationshipMetadata':$0={};break;case 'c:ManyToManyRelationshipMetadata':$0={};break;default:throw new Error('Unknown relationship type');}var $enum1=ss.IEnumerator.getEnumerator(attribute.childNodes);while($enum1.moveNext()){var $2=$enum1.current;var $3=$0;var $4=Xrm.Sdk.XmlHelper.getLocalName($2);var $5=$4.substr(0,1).toLowerCase()+$4.substr(1);if($2.attributes.length===1&&$2.attributes[0].nodeName==='i:nil'){continue;}switch($4){case 'SchemaName':case 'ReferencedAttribute':case 'ReferencedEntity':case 'ReferencingAttribute':case 'ReferencingEntity':case 'Entity1IntersectAttribute':case 'Entity1LogicalName':case 'Entity2IntersectAttribute':case 'Entity2LogicalName':case 'IntersectEntityName':$3[$5]=Xrm.Sdk.XmlHelper.getNodeTextValue($2);break;case 'IsCustomRelationship':case 'IsManaged':case 'IsValidForAdvancedFind':$3[$5]=Xrm.Sdk.Attribute.deSerialise($2,'boolean');break;case 'RelationshipType':$3[$5]=Xrm.Sdk.XmlHelper.getNodeTextValue($2);break;}}return $0;}
Xrm.Sdk.Metadata.MetadataSerialiser.deSerialiseOptionMetadata=function(item,metaData){item.value=parseInt(Xrm.Sdk.XmlHelper.selectSingleNodeValue(metaData,'Value'));item.label=Xrm.Sdk.Metadata.MetadataSerialiser.deSerialiseLabel({},Xrm.Sdk.XmlHelper.selectSingleNode(metaData,'Label'));return item;}
Xrm.Sdk.Metadata.MetadataSerialiser.deSerialiseOptionSetMetadata=function(item,metaData){var $0=Xrm.Sdk.XmlHelper.selectSingleNode(metaData,'Options');if($0!=null){item.options=[];var $enum1=ss.IEnumerator.getEnumerator($0.childNodes);while($enum1.moveNext()){var $1=$enum1.current;item.options.add(Xrm.Sdk.Metadata.MetadataSerialiser.deSerialiseOptionMetadata({},$1));}}return item;}
Xrm.Sdk.Metadata.MetadataSerialiser.deSerialisePicklistAttributeMetadata=function(item,metaData){var $0=Xrm.Sdk.XmlHelper.selectSingleNode(metaData,'OptionSet');if($0!=null){item.optionSet=Xrm.Sdk.Metadata.MetadataSerialiser.deSerialiseOptionSetMetadata({},$0);}return item;}
Xrm.Sdk.Metadata.MetadataCache=function(){}
Xrm.Sdk.Metadata.MetadataCache.get_entityMetaData=function(){return Xrm.Sdk.Metadata.MetadataCache.$1;}
Xrm.Sdk.Metadata.MetadataCache.get_attributeMetaData=function(){return Xrm.Sdk.Metadata.MetadataCache.$0;}
Xrm.Sdk.Metadata.MetadataCache.get_optionsetMetaData=function(){return Xrm.Sdk.Metadata.MetadataCache.$2;}
Xrm.Sdk.Metadata.MetadataCache.getOptionSetValues=function(entityLogicalName,attributeLogicalName,allowEmpty){if(allowEmpty==null){allowEmpty=false;}var $0=entityLogicalName+'.'+attributeLogicalName+'.'+allowEmpty.toString();if(Object.keyExists(Xrm.Sdk.Metadata.MetadataCache.$2,$0)){return Xrm.Sdk.Metadata.MetadataCache.$2[$0];}else{var $1=Xrm.Sdk.Metadata.MetadataCache.$4(entityLogicalName,attributeLogicalName);var $2=$1;var $3=[];if(allowEmpty){$3.add({});}var $enum1=ss.IEnumerator.getEnumerator($2.optionSet.options);while($enum1.moveNext()){var $4=$enum1.current;var $5={};$5.name=$4.label.userLocalizedLabel.label;$5.value=$4.value;$3.add($5);}Xrm.Sdk.Metadata.MetadataCache.$2[$0]=$3;return $3;}}
Xrm.Sdk.Metadata.MetadataCache.getEntityTypeCodeFromName=function(typeName){var $0=Xrm.Sdk.Metadata.MetadataCache.$3(typeName);return $0.objectTypeCode;}
Xrm.Sdk.Metadata.MetadataCache.getSmallIconUrl=function(typeName){var $0=Xrm.Sdk.Metadata.MetadataCache.$3(typeName);if($0.isCustomEntity!=null&&!!$0.isCustomEntity){if($0.iconSmallName!=null){return '../../'+$0.iconSmallName;}else{return '../../../../_Common/icon.aspx?cache=1&iconType=NavigationIcon&objectTypeCode='+$0.objectTypeCode.toString();}}else{return '/_imgs/ico_16_'+$0.objectTypeCode.toString()+'.gif';}}
Xrm.Sdk.Metadata.MetadataCache.$3=function($p0){var $0=$p0;var $1=Xrm.Sdk.Metadata.MetadataCache.$1[$0];if($1==null){var $2=new Xrm.Sdk.Messages.RetrieveEntityRequest();$2.entityFilters=1;$2.logicalName=$p0;$2.retrieveAsIfPublished=true;$2.metadataId=new Xrm.Sdk.Guid('00000000-0000-0000-0000-000000000000');var $3=Xrm.Sdk.OrganizationServiceProxy.execute($2);$1=$3.entityMetadata;Xrm.Sdk.Metadata.MetadataCache.$1[$0]=$1;}return $1;}
Xrm.Sdk.Metadata.MetadataCache.$4=function($p0,$p1){var $0=$p0+'|'+$p1;var $1=Xrm.Sdk.Metadata.MetadataCache.$0[$0];if($1==null){var $2=new Xrm.Sdk.Messages.RetrieveAttributeRequest();$2.entityLogicalName=$p0;$2.logicalName=$p1;$2.retrieveAsIfPublished=true;var $3=Xrm.Sdk.OrganizationServiceProxy.execute($2);$1=$3.attributeMetadata;Xrm.Sdk.Metadata.MetadataCache.$0[$0]=$1;}return $1;}
Xrm.Sdk.Metadata.MetadataCache.AddOptionsetMetadata=function(entityLogicalName,attributeLogicalName,allowEmpty,metatdata){var $0=entityLogicalName+'.'+attributeLogicalName+'.'+allowEmpty.toString();var $1=[];if(allowEmpty){$1.add({});}var $enum1=ss.IEnumerator.getEnumerator(metatdata);while($enum1.moveNext()){var $2=$enum1.current;var $3={};$3.name=$2['label'];$3.value=$2['value'];$1.add($3);}Xrm.Sdk.Metadata.MetadataCache.get_optionsetMetaData()[$0]=$1;}
Type.registerNamespace('Xrm.Sdk.Metadata.Query');Xrm.Sdk.Metadata.Query.DeletedMetadataFilters=function(){};Xrm.Sdk.Metadata.Query.DeletedMetadataFilters.prototype = {default_:'default_',entity:'entity',attribute:'attribute',relationship:'relationship',label:'label',optionSet:'optionSet',all:'all'}
Xrm.Sdk.Metadata.Query.DeletedMetadataFilters.registerEnum('Xrm.Sdk.Metadata.Query.DeletedMetadataFilters',false);Xrm.Sdk.Metadata.Query.MetadataConditionOperator=function(){};Xrm.Sdk.Metadata.Query.MetadataConditionOperator.prototype = {Equals:'Equals',NotEquals:'NotEquals',In:'In',NotIn:'NotIn',GreaterThan:'GreaterThan',LessThan:'LessThan'}
Xrm.Sdk.Metadata.Query.MetadataConditionOperator.registerEnum('Xrm.Sdk.Metadata.Query.MetadataConditionOperator',false);Xrm.Sdk.Metadata.Query.LogicalOperator=function(){};Xrm.Sdk.Metadata.Query.LogicalOperator.prototype = {And:'And',Or:'Or'}
Xrm.Sdk.Metadata.Query.LogicalOperator.registerEnum('Xrm.Sdk.Metadata.Query.LogicalOperator',false);Xrm.Sdk.Metadata.Query.MetadataSerialiser=function(){}
Xrm.Sdk.Metadata.Query.MetadataSerialiser.serialiseAttributeQueryExpression=function(item){return Xrm.Sdk.Metadata.Query.MetadataSerialiser.serialiseMetadataQueryExpression(item);}
Xrm.Sdk.Metadata.Query.MetadataSerialiser.serialiseEntityQueryExpression=function(item){if(item!=null){var $0="<b:value i:type='c:EntityQueryExpression' xmlns:c='http://schemas.microsoft.com/xrm/2011/Metadata/Query'>"+Xrm.Sdk.Metadata.Query.MetadataSerialiser.serialiseMetadataQueryExpression(item);if(item.attributeQuery!=null){$0+='<c:AttributeQuery>'+Xrm.Sdk.Metadata.Query.MetadataSerialiser.serialiseAttributeQueryExpression(item.attributeQuery)+'</c:AttributeQuery>';}$0+='<c:LabelQuery>'+Xrm.Sdk.Metadata.Query.MetadataSerialiser.serialiseLabelQueryExpression(item.labelQuery)+"</c:LabelQuery>\r\n                <c:RelationshipQuery i:nil='true' />\r\n                </b:value>";return $0;}else{return "<b:value i:nil='true'/>";}}
Xrm.Sdk.Metadata.Query.MetadataSerialiser.serialiseLabelQueryExpression=function(item){if(item!=null){var $0="<c:FilterLanguages xmlns:d='http://schemas.microsoft.com/2003/10/Serialization/Arrays'>";var $enum1=ss.IEnumerator.getEnumerator(item.filterLanguages);while($enum1.moveNext()){var $1=$enum1.current;$0=$0+'<d:int>'+$1.toString()+'</d:int>';}$0=$0+'</c:FilterLanguages>';return $0;}else{return '';}}
Xrm.Sdk.Metadata.Query.MetadataSerialiser.serialiseMetadataConditionExpression=function(item){return '<c:MetadataConditionExpression>\r\n                            <c:ConditionOperator>'+item.conditionOperator+'</c:ConditionOperator>\r\n                            <c:PropertyName>'+item.propertyName+"</c:PropertyName>\r\n                            <c:Value i:type='d:string' xmlns:d='http://www.w3.org/2001/XMLSchema'>"+item.value+'</c:Value>\r\n                          </c:MetadataConditionExpression>';}
Xrm.Sdk.Metadata.Query.MetadataSerialiser.serialiseMetadataFilterExpression=function(item){if(item!=null){var $0='<c:Conditions>';var $enum1=ss.IEnumerator.getEnumerator(item.conditions);while($enum1.moveNext()){var $1=$enum1.current;$0+=Xrm.Sdk.Metadata.Query.MetadataSerialiser.serialiseMetadataConditionExpression($1);}$0=$0+'</c:Conditions>\r\n                        <c:FilterOperator>'+item.filterOperator+'</c:FilterOperator>\r\n                        <c:Filters />';return $0;}return '';}
Xrm.Sdk.Metadata.Query.MetadataSerialiser.serialiseMetadataPropertiesExpression=function(item){if(item!=null){var $0='\r\n                <c:AllProperties>'+((item.allProperties!=null)?item.allProperties.toString().toLowerCase():'false')+"</c:AllProperties>\r\n                <c:PropertyNames xmlns:d='http://schemas.microsoft.com/2003/10/Serialization/Arrays'>";if(item.propertyNames!=null){var $enum1=ss.IEnumerator.getEnumerator(item.propertyNames);while($enum1.moveNext()){var $1=$enum1.current;$0=$0+'<d:string>'+$1+'</d:string>';}}$0=$0+'\r\n                </c:PropertyNames>\r\n              ';return $0;}return '';}
Xrm.Sdk.Metadata.Query.MetadataSerialiser.serialiseMetadataQueryExpression=function(item){if(item!=null){var $0='<c:Criteria>'+Xrm.Sdk.Metadata.Query.MetadataSerialiser.serialiseMetadataFilterExpression(item.criteria)+'</c:Criteria>\r\n                    <c:Properties>'+Xrm.Sdk.Metadata.Query.MetadataSerialiser.serialiseMetadataPropertiesExpression(item.properties)+' </c:Properties>';return $0;}return '';}
Xrm.Sdk.Metadata.Query.MetadataQueryBuilder=function(){this.request=new Xrm.Sdk.Messages.RetrieveMetadataChangesRequest();this.request.query={};this.request.query.criteria={};this.request.query.criteria.filterOperator='Or';this.request.query.criteria.conditions=[];}
Xrm.Sdk.Metadata.Query.MetadataQueryBuilder.prototype={request:null,addEntities:function(entityLogicalNames,propertiesToReturn){this.request.query.criteria={};this.request.query.criteria.filterOperator='Or';this.request.query.criteria.conditions=[];var $enum1=ss.IEnumerator.getEnumerator(entityLogicalNames);while($enum1.moveNext()){var $0=$enum1.current;var $1={};$1.conditionOperator='Equals';$1.propertyName='LogicalName';$1.value=$0;this.request.query.criteria.conditions.add($1);}this.request.query.properties={};this.request.query.properties.propertyNames=propertiesToReturn;},addAttributes:function(attributeLogicalNames,propertiesToReturn){var $0={};$0.properties={};$0.properties.propertyNames=propertiesToReturn;this.request.query.attributeQuery=$0;var $1={};$0.criteria=$1;$1.filterOperator='Or';$1.conditions=[];var $enum1=ss.IEnumerator.getEnumerator(attributeLogicalNames);while($enum1.moveNext()){var $2=$enum1.current;var $3={};$3.propertyName='LogicalName';$3.conditionOperator='Equals';$3.value=$2;$1.conditions.add($3);}},setLanguage:function(lcid){this.request.query.labelQuery={};this.request.query.labelQuery.filterLanguages=[];this.request.query.labelQuery.filterLanguages.add(lcid);}}
Type.registerNamespace('Xrm.Sdk.Ribbon');Xrm.Sdk.Ribbon.RibbonButton=function(Id,Sequence,LabelText,Command,Image16,Image32){Xrm.Sdk.Ribbon.RibbonButton.initializeBase(this,[Id,Sequence,LabelText,Command,Image16,Image32]);}
Xrm.Sdk.Ribbon.RibbonButton.prototype={serialiseToRibbonXml:function(sb){sb.appendLine('<Button Id="'+Xrm.Sdk.XmlHelper.encode(this.Id)+'" LabelText="'+Xrm.Sdk.XmlHelper.encode(this.LabelText)+'" Sequence="'+this.Sequence.toString()+'" Command="'+Xrm.Sdk.XmlHelper.encode(this.Command)+'"'+((this.Image32by32!=null)?(' Image32by32="'+Xrm.Sdk.XmlHelper.encode(this.Image32by32)+'"'):'')+((this.Image16by16!=null)?(' Image16by16="'+Xrm.Sdk.XmlHelper.encode(this.Image16by16)+'"'):'')+' />');}}
Xrm.Sdk.Ribbon.RibbonControl=function(Id,Sequence,LabelText,Command,Image16,Image32){this.Id=Id;this.Sequence=Sequence;this.LabelText=LabelText;this.Command=Command;this.Image16by16=Image16;this.Image32by32=Image32;}
Xrm.Sdk.Ribbon.RibbonControl.prototype={Id:null,LabelText:null,Sequence:0,Command:null,Image16by16:null,Image32by32:null,serialiseToRibbonXml:function(sb){}}
Xrm.Sdk.Ribbon.RibbonFlyoutAnchor=function(Id,Sequence,LabelText,Command,Image16,Image32){Xrm.Sdk.Ribbon.RibbonFlyoutAnchor.initializeBase(this,[Id,Sequence,LabelText,Command,Image16,Image32]);}
Xrm.Sdk.Ribbon.RibbonFlyoutAnchor.prototype={menu:null,serialiseToRibbonXml:function(sb){sb.appendLine('<FlyoutAnchor Id="'+Xrm.Sdk.XmlHelper.encode(this.Id)+'" LabelText="'+Xrm.Sdk.XmlHelper.encode(this.LabelText)+'" Sequence="'+this.Sequence.toString()+'" Command="'+Xrm.Sdk.XmlHelper.encode(this.Command)+'"'+((this.Image32by32!=null)?(' Image32by32="'+Xrm.Sdk.XmlHelper.encode(this.Image32by32)+'"'):'')+((this.Image16by16!=null)?(' Image16by16="'+Xrm.Sdk.XmlHelper.encode(this.Image16by16)+'"'):'')+' PopulateDynamically="false">');sb.appendLine(this.menu.serialiseToRibbonXml());sb.appendLine('</FlyoutAnchor>');}}
Xrm.Sdk.Ribbon.RibbonMenu=function(Id){this.sections=[];this.Id=Id;}
Xrm.Sdk.Ribbon.RibbonMenu.prototype={Id:null,serialiseToRibbonXml:function(){var $0=new ss.StringBuilder();$0.appendLine('<Menu Id="'+this.Id+'">');var $enum1=ss.IEnumerator.getEnumerator(this.sections);while($enum1.moveNext()){var $1=$enum1.current;$1.serialiseToRibbonXml($0);}$0.appendLine('</Menu>');return $0.toString();},addSection:function(section){Xrm.ArrayEx.add(this.sections,section);return this;}}
Xrm.Sdk.Ribbon.RibbonMenuSection=function(Id,LabelText,Sequence,DisplayMode){this.buttons=[];this.Id=Id;this.Title=LabelText;this.Sequence=Sequence;this.DisplayMode=DisplayMode;}
Xrm.Sdk.Ribbon.RibbonMenuSection.prototype={Id:null,Title:null,Sequence:0,DisplayMode:null,serialiseToRibbonXml:function(sb){sb.appendLine('<MenuSection Id="'+Xrm.Sdk.XmlHelper.encode(this.Id)+((this.Title!=null)?'" Title="'+this.Title:'')+'" Sequence="'+this.Sequence.toString()+'" DisplayMode="'+this.DisplayMode+'">');sb.appendLine('<Controls Id="'+Xrm.Sdk.XmlHelper.encode(this.Id+'.Controls')+'">');var $enum1=ss.IEnumerator.getEnumerator(this.buttons);while($enum1.moveNext()){var $0=$enum1.current;$0.serialiseToRibbonXml(sb);}sb.appendLine('</Controls>');sb.appendLine('</MenuSection>');},addButton:function(button){Xrm.ArrayEx.add(this.buttons,button);return this;}}
Type.registerNamespace('Xrm.Services');Xrm.Services.CachedOrganizationService=function(){}
Xrm.Services.CachedOrganizationService.retrieve=function(entityName,entityId,attributesList){var $0=Xrm.Services.CachedOrganizationService.cache.get(entityName,entityId);if($0==null){$0=Xrm.Sdk.OrganizationServiceProxy.retrieve(entityName,entityId,attributesList);Xrm.Services.CachedOrganizationService.cache.insert(entityName,entityId,$0);return $0;}else{return $0;}}
Xrm.Services.CachedOrganizationService.retrieveMultiple=function(fetchXml){var $0=Xrm.Services.CachedOrganizationService.cache.get('query',fetchXml);if($0==null){$0=Xrm.Sdk.OrganizationServiceProxy.retrieveMultiple(fetchXml);Xrm.Services.CachedOrganizationService.cache.insert('query',fetchXml,$0);return $0;}else{return $0;}}
Xrm.Services.OrganizationServiceCache=function(){this.$0={};}
Xrm.Services.OrganizationServiceCache.prototype={remove:function(entityName,id){},insert:function(key,query,results){this.$0[key+'_'+query]=results;},get:function(key,query){return this.$0[key+'_'+query];}}
Xrm.ArrayEx.registerClass('Xrm.ArrayEx');Xrm.DelegateItterator.registerClass('Xrm.DelegateItterator');Xrm.NumberEx.registerClass('Xrm.NumberEx');Xrm.PageEx.registerClass('Xrm.PageEx');Xrm.StringEx.registerClass('Xrm.StringEx');Xrm.TaskIterrator.registerClass('Xrm.TaskIterrator');Xrm.TabItem.registerClass('Xrm.TabItem');Xrm.TabSection.registerClass('Xrm.TabSection');Xrm.Sdk.Attribute.registerClass('Xrm.Sdk.Attribute');Xrm.Sdk.AttributeTypes.registerClass('Xrm.Sdk.AttributeTypes');Xrm.Sdk.Entity.registerClass('Xrm.Sdk.Entity',null,Xrm.ComponentModel.INotifyPropertyChanged);Xrm.Sdk.OrganizationSettings.registerClass('Xrm.Sdk.OrganizationSettings',Xrm.Sdk.Entity);Xrm.Sdk.UserSettingsAttributes.registerClass('Xrm.Sdk.UserSettingsAttributes');Xrm.Sdk.UserSettings.registerClass('Xrm.Sdk.UserSettings',Xrm.Sdk.Entity);Xrm.Sdk.DataCollectionOfEntity.registerClass('Xrm.Sdk.DataCollectionOfEntity',null,ss.IEnumerable);Xrm.Sdk.DateTimeEx.registerClass('Xrm.Sdk.DateTimeEx');Xrm.Sdk.EntityCollection.registerClass('Xrm.Sdk.EntityCollection');Xrm.Sdk.EntityReference.registerClass('Xrm.Sdk.EntityReference');Xrm.Sdk.Guid.registerClass('Xrm.Sdk.Guid');Xrm.Sdk.Money.registerClass('Xrm.Sdk.Money');Xrm.Sdk.OptionSetValue.registerClass('Xrm.Sdk.OptionSetValue');Xrm.Sdk.OrganizationServiceProxy.registerClass('Xrm.Sdk.OrganizationServiceProxy');Xrm.Sdk.Relationship.registerClass('Xrm.Sdk.Relationship');Xrm.Sdk.RetrieveRelationshipRequest.registerClass('Xrm.Sdk.RetrieveRelationshipRequest',null,Object);Xrm.Sdk.RetrieveRelationshipResponse.registerClass('Xrm.Sdk.RetrieveRelationshipResponse',null,Object);Xrm.Sdk.XmlHelper.registerClass('Xrm.Sdk.XmlHelper');Xrm.Sdk.Messages.AssignRequest.registerClass('Xrm.Sdk.Messages.AssignRequest',null,Object);Xrm.Sdk.Messages.AssignResponse.registerClass('Xrm.Sdk.Messages.AssignResponse',null,Object);Xrm.Sdk.Messages.BulkDeleteRequest.registerClass('Xrm.Sdk.Messages.BulkDeleteRequest',null,Object);Xrm.Sdk.Messages.BulkDeleteResponse.registerClass('Xrm.Sdk.Messages.BulkDeleteResponse',null,Object);Xrm.Sdk.Messages.ExecuteWorkflowRequest.registerClass('Xrm.Sdk.Messages.ExecuteWorkflowRequest',null,Object);Xrm.Sdk.Messages.ExecuteWorkflowResponse.registerClass('Xrm.Sdk.Messages.ExecuteWorkflowResponse',null,Object);Xrm.Sdk.Messages.FetchXmlToQueryExpressionRequest.registerClass('Xrm.Sdk.Messages.FetchXmlToQueryExpressionRequest',null,Object);Xrm.Sdk.Messages.FetchXmlToQueryExpressionResponse.registerClass('Xrm.Sdk.Messages.FetchXmlToQueryExpressionResponse',null,Object);Xrm.Sdk.Messages.RetrieveAllEntitiesRequest.registerClass('Xrm.Sdk.Messages.RetrieveAllEntitiesRequest',null,Object);Xrm.Sdk.Messages.RetrieveAllEntitiesResponse.registerClass('Xrm.Sdk.Messages.RetrieveAllEntitiesResponse',null,Object);Xrm.Sdk.Messages.RetrieveAttributeRequest.registerClass('Xrm.Sdk.Messages.RetrieveAttributeRequest',null,Object);Xrm.Sdk.Messages.RetrieveAttributeResponse.registerClass('Xrm.Sdk.Messages.RetrieveAttributeResponse',null,Object);Xrm.Sdk.Messages.RetrieveEntityRequest.registerClass('Xrm.Sdk.Messages.RetrieveEntityRequest',null,Object);Xrm.Sdk.Messages.RetrieveEntityResponse.registerClass('Xrm.Sdk.Messages.RetrieveEntityResponse',null,Object);Xrm.Sdk.Messages.RetrieveMetadataChangesRequest.registerClass('Xrm.Sdk.Messages.RetrieveMetadataChangesRequest',null,Object);Xrm.Sdk.Messages.RetrieveMetadataChangesResponse.registerClass('Xrm.Sdk.Messages.RetrieveMetadataChangesResponse',null,Object);Xrm.Sdk.Metadata.MetadataSerialiser.registerClass('Xrm.Sdk.Metadata.MetadataSerialiser');Xrm.Sdk.Metadata.MetadataCache.registerClass('Xrm.Sdk.Metadata.MetadataCache');Xrm.Sdk.Metadata.Query.MetadataSerialiser.registerClass('Xrm.Sdk.Metadata.Query.MetadataSerialiser');Xrm.Sdk.Metadata.Query.MetadataQueryBuilder.registerClass('Xrm.Sdk.Metadata.Query.MetadataQueryBuilder');Xrm.Sdk.Ribbon.RibbonControl.registerClass('Xrm.Sdk.Ribbon.RibbonControl');Xrm.Sdk.Ribbon.RibbonButton.registerClass('Xrm.Sdk.Ribbon.RibbonButton',Xrm.Sdk.Ribbon.RibbonControl);Xrm.Sdk.Ribbon.RibbonFlyoutAnchor.registerClass('Xrm.Sdk.Ribbon.RibbonFlyoutAnchor',Xrm.Sdk.Ribbon.RibbonControl);Xrm.Sdk.Ribbon.RibbonMenu.registerClass('Xrm.Sdk.Ribbon.RibbonMenu');Xrm.Sdk.Ribbon.RibbonMenuSection.registerClass('Xrm.Sdk.Ribbon.RibbonMenuSection');Xrm.Services.CachedOrganizationService.registerClass('Xrm.Services.CachedOrganizationService');Xrm.Services.OrganizationServiceCache.registerClass('Xrm.Services.OrganizationServiceCache');Xrm.PageEx.majorVersion=0;(function(){Xrm.PageEx.majorVersion=2011;if(typeof(window.APPLICATION_VERSION)!=='undefined'){var $0=window.APPLICATION_VERSION;if($0!=='5.0'){Xrm.PageEx.majorVersion=2013;}}})();
Xrm.Sdk.AttributeTypes.string_='string';Xrm.Sdk.AttributeTypes.decimal_='decimal';Xrm.Sdk.AttributeTypes.int_='int';Xrm.Sdk.AttributeTypes.double_='double';Xrm.Sdk.AttributeTypes.dateTime_='dateTime';Xrm.Sdk.AttributeTypes.boolean_='boolean';Xrm.Sdk.AttributeTypes.entityReference='EntityReference';Xrm.Sdk.AttributeTypes.guid_='guid';Xrm.Sdk.AttributeTypes.optionSetValue='OptionSetValue';Xrm.Sdk.AttributeTypes.aliasedValue='AliasedValue';Xrm.Sdk.AttributeTypes.entityCollection='EntityCollection';Xrm.Sdk.AttributeTypes.money='Money';Xrm.Sdk.OrganizationSettings.entityLogicalName='organization';Xrm.Sdk.UserSettingsAttributes.userSettingsId='usersettingsid';Xrm.Sdk.UserSettingsAttributes.businessUnitId='businessunitid';Xrm.Sdk.UserSettingsAttributes.calendarType='calendartype';Xrm.Sdk.UserSettingsAttributes.currencyDecimalPrecision='currencydecimalprecision';Xrm.Sdk.UserSettingsAttributes.currencyFormatCode='currencyformatcode';Xrm.Sdk.UserSettingsAttributes.currencySymbol='currencysymbol';Xrm.Sdk.UserSettingsAttributes.dateFormatCode='dateformatcode';Xrm.Sdk.UserSettingsAttributes.dateFormatString='dateformatstring';Xrm.Sdk.UserSettingsAttributes.dateSeparator='dateseparator';Xrm.Sdk.UserSettingsAttributes.decimalSymbol='decimalsymbol';Xrm.Sdk.UserSettingsAttributes.defaultCalendarView='defaultcalendarview';Xrm.Sdk.UserSettingsAttributes.defaultDashboardId='defaultdashboardid';Xrm.Sdk.UserSettingsAttributes.localeId='localeid';Xrm.Sdk.UserSettingsAttributes.longDateFormatCode='longdateformatcode';Xrm.Sdk.UserSettingsAttributes.negativeCurrencyFormatCode='negativecurrencyformatcode';Xrm.Sdk.UserSettingsAttributes.negativeFormatCode='negativeformatcode';Xrm.Sdk.UserSettingsAttributes.numberGroupFormat='numbergroupformat';Xrm.Sdk.UserSettingsAttributes.numberSeparator='numberseparator';Xrm.Sdk.UserSettingsAttributes.offlineSyncInterval='offlinesyncinterval';Xrm.Sdk.UserSettingsAttributes.pricingDecimalPrecision='pricingdecimalprecision';Xrm.Sdk.UserSettingsAttributes.showWeekNumber='showweeknumber';Xrm.Sdk.UserSettingsAttributes.systemUserId='systemuserid';Xrm.Sdk.UserSettingsAttributes.timeFormatCodestring='timeformatcodestring';Xrm.Sdk.UserSettingsAttributes.timeFormatString='timeformatstring';Xrm.Sdk.UserSettingsAttributes.timeSeparator='timeseparator';Xrm.Sdk.UserSettingsAttributes.timeZoneBias='timezonebias';Xrm.Sdk.UserSettingsAttributes.timeZoneCode='timezonecode';Xrm.Sdk.UserSettingsAttributes.timeZoneDaylightBias='timezonedaylightbias';Xrm.Sdk.UserSettingsAttributes.timeZoneDaylightDay='timezonedaylightday';Xrm.Sdk.UserSettingsAttributes.timeZoneDaylightDayOfWeek='timezonedaylightdayofweek';Xrm.Sdk.UserSettingsAttributes.timeZoneDaylightHour='timezonedaylighthour';Xrm.Sdk.UserSettingsAttributes.timeZoneDaylightMinute='timezonedaylightminute';Xrm.Sdk.UserSettingsAttributes.timeZoneDaylightMonth='timezonedaylightmonth';Xrm.Sdk.UserSettingsAttributes.timeZoneDaylightSecond='timezonedaylightsecond';Xrm.Sdk.UserSettingsAttributes.timeZoneDaylightYear='timezonedaylightyear';Xrm.Sdk.UserSettingsAttributes.timeZoneStandardBias='timezonestandardbias';Xrm.Sdk.UserSettingsAttributes.timeZoneStandardDay='timezonestandardday';Xrm.Sdk.UserSettingsAttributes.timeZoneStandardDayOfWeek='timezonestandarddayofweek';Xrm.Sdk.UserSettingsAttributes.timeZoneStandardHour='timezonestandardhour';Xrm.Sdk.UserSettingsAttributes.timeZoneStandardMinute='timezonestandardminute';Xrm.Sdk.UserSettingsAttributes.timeZoneStandardMonth='timezonestandardmonth';Xrm.Sdk.UserSettingsAttributes.timeZoneStandardSecond='timezonestandardsecond';Xrm.Sdk.UserSettingsAttributes.timeZoneStandardYear='timezonestandardyear';Xrm.Sdk.UserSettingsAttributes.transactionCurrencyId='transactioncurrencyid';Xrm.Sdk.UserSettingsAttributes.uiLanguageId='uilanguageid';Xrm.Sdk.UserSettingsAttributes.workdayStartTime='workdaystarttime';Xrm.Sdk.UserSettingsAttributes.workdayStopTime='workdaystoptime';Xrm.Sdk.UserSettings.entityLogicalName='usersettings';Xrm.Sdk.Guid.empty=new Xrm.Sdk.Guid('00000000-0000-0000-0000-000000000000');Xrm.Sdk.OrganizationServiceProxy.withCredentials=false;Xrm.Sdk.OrganizationServiceProxy.userSettings=null;Xrm.Sdk.OrganizationServiceProxy.executeMessageResponseTypes={};Xrm.Sdk.OrganizationServiceProxy.organizationSettings=null;Xrm.Sdk.XmlHelper._encode_map={'&':'&amp;','"':'&quot;','<':'&lt;','>':'&gt;',"'":'&#39;'};Xrm.Sdk.XmlHelper._decode_map={'&amp;':'&','&quot;':'"','&lt;':'<','&gt;':'>','&#39;':"'"};Xrm.Sdk.Metadata.MetadataCache.$0={};Xrm.Sdk.Metadata.MetadataCache.$1={};Xrm.Sdk.Metadata.MetadataCache.$2={};Xrm.Services.CachedOrganizationService.cache=new Xrm.Services.OrganizationServiceCache();


Type.registerNamespace('SmartButtons.ClientHooks');

////////////////////////////////////////////////////////////////////////////////
// ResourceStrings

ResourceStrings = function ResourceStrings() {
}


////////////////////////////////////////////////////////////////////////////////
// SmartButtons.ClientHooks.SmartButtons

SmartButtons.ClientHooks.SmartButtons = function SmartButtons_ClientHooks_SmartButtons() {
}
SmartButtons.ClientHooks.SmartButtons.RunReport = function SmartButtons_ClientHooks_SmartButtons$RunReport(reportName, recordId, etc) {
    var fetch = String.format("<fetch count='1'>\r\n                       <entity name='report'>\r\n                           <attribute name='reportid'/>\r\n                           <filter type='and'>\r\n                               <condition attribute='name' operator='eq' value='{0}'/>\r\n                           </filter>\r\n                       </entity>\r\n                   </fetch>", reportName);
    Xrm.Sdk.OrganizationServiceProxy.beginRetrieveMultiple(fetch, function(state) {
        var results = Xrm.Sdk.OrganizationServiceProxy.endRetrieveMultiple(state, Xrm.Sdk.Entity);
        var $enum1 = ss.IEnumerator.getEnumerator(results.get_entities());
        while ($enum1.moveNext()) {
            var row = $enum1.current;
            var id = row.id;
            var orgUrl = Xrm.Page.context.getClientUrl();
            var reportUrl = orgUrl + '/crmreports/viewer/viewer.aspx?action=run&id=%7b' + encodeURIComponent(id) + '%7d&records=%7b' + recordId + '%7d&recordstype=' + etc;
            window.open(reportUrl);
            break;
        }
    });
}
SmartButtons.ClientHooks.SmartButtons.RunDialog = function SmartButtons_ClientHooks_SmartButtons$RunDialog(name, entityId, entityLogicalName) {
    var fetch = String.format("<fetch count='1'>\r\n                       <entity name='workflow'>\r\n                           <attribute name='workflowid'/>\r\n                           <filter type='and'>\r\n                               <condition attribute='name' operator='eq' value='{0}'/>\r\n                               <condition attribute='primaryentityname' operator='eq' value='{1}'/>\r\n                               <condition attribute='ondemand' operator='eq' value='true'/>\r\n                               <condition attribute='statuscode' operator='eq' value='2'/> \r\n                               <condition attribute='type' operator='eq' value='1'/>     \r\n                           </filter>\r\n                       </entity>\r\n                   </fetch>", name, entityLogicalName);
    Xrm.Sdk.OrganizationServiceProxy.beginRetrieveMultiple(fetch, function(state) {
        var results = Xrm.Sdk.OrganizationServiceProxy.endRetrieveMultiple(state, Xrm.Sdk.Entity);
        var $enum1 = ss.IEnumerator.getEnumerator(results.get_entities());
        while ($enum1.moveNext()) {
            var row = $enum1.current;
            var url = Xrm.Page.context.getClientUrl() + '/cs/dialog/rundialog.aspx?DialogId=' + row.getAttributeValueGuid('workflowid').toString() + '&EntityName=' + entityLogicalName + '&ObjectId=' + entityId;
            window.open(url);
            return;
        }
    });
}
SmartButtons.ClientHooks.SmartButtons.QuickJavascript = function SmartButtons_ClientHooks_SmartButtons$QuickJavascript(entityIds, javascript) {
    var entityIdStrings = JSON.stringify(entityIds);
    eval(javascript.replaceAll('%ids%', entityIdStrings));
}
SmartButtons.ClientHooks.SmartButtons.RunWorkflowMultiple = function SmartButtons_ClientHooks_SmartButtons$RunWorkflowMultiple(name, entityIds, confirmationMessage, completeCallback, errorCalback) {
    if (!String.isNullOrEmpty(confirmationMessage)) {
        Xrm.Utility.confirmDialog(String.format(confirmationMessage, entityIds.length), function() {
            SmartButtons.ClientHooks.SmartButtons.RunWorkflowMultiple(name, entityIds, null, completeCallback, errorCalback);
        }, null);
        return;
    }
    var $enum1 = ss.IEnumerator.getEnumerator(entityIds);
    while ($enum1.moveNext()) {
        var entityId = $enum1.current;
        SmartButtons.ClientHooks.SmartButtons.RunWorkflowSingle(name, [ entityId ], null, completeCallback, errorCalback);
    }
}
SmartButtons.ClientHooks.SmartButtons.RunWorkflowSingle = function SmartButtons_ClientHooks_SmartButtons$RunWorkflowSingle(name, entityIds, confirmationMessage, completeCallback, errorCalback) {
    if (!String.isNullOrEmpty(confirmationMessage)) {
        Xrm.Utility.confirmDialog(confirmationMessage, function() {
            SmartButtons.ClientHooks.SmartButtons.RunWorkflowSingle(name, entityIds, null, completeCallback, errorCalback);
        }, null);
        return;
    }
    else {
        var $enum1 = ss.IEnumerator.getEnumerator(entityIds);
        while ($enum1.moveNext()) {
            var entityId = $enum1.current;
            SmartButtons.ClientHooks.SmartButtons.RunWorkflow(name, entityId, completeCallback, errorCalback);
        }
    }
}
SmartButtons.ClientHooks.SmartButtons.RunWorkflow = function SmartButtons_ClientHooks_SmartButtons$RunWorkflow(name, entityId, completeCallback, errorCalback) {
    var fetch = String.format("<fetch count='1'>\r\n                       <entity name='workflow'>\r\n                           <attribute name='workflowid'/>\r\n                           <filter type='and'>\r\n                               <condition attribute='name' operator='eq' value='{0}'/>\r\n                               <condition attribute='ondemand' operator='eq' value='true'/>\r\n                               <condition attribute='statuscode' operator='eq' value='2'/> \r\n                               <condition attribute='type' operator='eq' value='1'/>     \r\n                           </filter>\r\n                       </entity>\r\n                   </fetch>", name);
    Xrm.Sdk.OrganizationServiceProxy.beginRetrieveMultiple(fetch, function(state) {
        var results = Xrm.Sdk.OrganizationServiceProxy.endRetrieveMultiple(state, Xrm.Sdk.Entity);
        var $enum1 = ss.IEnumerator.getEnumerator(results.get_entities());
        while ($enum1.moveNext()) {
            var row = $enum1.current;
            var request = new Xrm.Sdk.Messages.ExecuteWorkflowRequest();
            request.entityId = entityId.replaceAll('{', '').replaceAll('}', '');
            request.workflowId = row.getAttributeValueString('workflowid');
            Xrm.Sdk.OrganizationServiceProxy.beginExecute(request, function(executeState) {
                var response = Xrm.Sdk.OrganizationServiceProxy.endExecute(executeState);
                if (completeCallback != null) {
                    SmartButtons.ClientHooks.SmartButtons.WaitForWorkflowToComplete(response.id, completeCallback, errorCalback, null);
                }
            });
            break;
        }
    });
}
SmartButtons.ClientHooks.SmartButtons.WaitForWorkflowToComplete = function SmartButtons_ClientHooks_SmartButtons$WaitForWorkflowToComplete(asyncoperationid, callbackFunction, errorCallback, startTime) {
    if (startTime == null) {
        startTime = Date.get_now();
    }
    Xrm.Sdk.OrganizationServiceProxy.beginRetrieve('asyncoperation', asyncoperationid, [ 'statecode', 'statuscode' ], function(state) {
        var response = Xrm.Sdk.OrganizationServiceProxy.endRetrieve(state, Xrm.Sdk.Entity);
        var statuscode = response.getAttributeValueOptionSet('statuscode');
        if (statuscode != null && statuscode.value === 30) {
            eval(callbackFunction);
        }
        else if ((statuscode != null && statuscode.value >= 31) || ((Date.get_now() - startTime) > 180000)) {
            eval(errorCallback);
        }
        else {
            window.setTimeout(function() {
                SmartButtons.ClientHooks.SmartButtons.WaitForWorkflowToComplete(asyncoperationid, callbackFunction, errorCallback, startTime);
            }, 1000);
        }
    });
}


ResourceStrings.registerClass('ResourceStrings');
SmartButtons.ClientHooks.SmartButtons.registerClass('SmartButtons.ClientHooks.SmartButtons');
ResourceStrings.confirmWorkflow = 'Are you sure you want to run the workflow';
ResourceStrings.confirmWorkflowMultiple = 'Are you sure you want to run the workflow on {0} record(s)?';
})();

//! This script was generated using Script# v0.7.4.0
