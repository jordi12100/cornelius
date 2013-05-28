;(function(exports){

    var corneliusDefaults = {
        monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July',
                     'August', 'September', 'October', 'November', 'December'],

        shortMonthNames: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul',
                          'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],

        repeatLevels: {
            'low': [0, 2],
            'medium-low': [2, 5],
            'medium': [5, 10],
            'medium-high': [10, 30],
            'high': [30, 50],
            'hot': [50, 70],
            'extra-hot': [70, 100]
        },

        labels: {
            time: 'Time',
            people: 'People',
            weekOf: 'Week of'
        },

        timeInterval: 'monthly',

        drawEmptyCells: true,

        rawNumberOnHover: true,

        initialMonth: 1,

        classPrefix: 'cornelius-',

        formatHeaderLabel: function(i) {
            return i === 0 ? this.labels.people : (this.initialMonth - 1 + i).toString();
        },

        formatDailyLabel: function(date, i) {
            date.setDate(date.getDate() + i);
            return this.monthNames[date.getMonth()] + ' ' + date.getDate() + ', ' + getYear(date);
        },

        formatWeeklyLabel: function(date, i) {
            date.setDate(date.getDate() + i * 7);
            return this.labels.weekOf + ' ' + this.shortMonthNames[date.getMonth()] + ' ' +
                    date.getDate() + ', ' + getYear(date);
        },

        formatMonthlyLabel: function(date, i) {
            date.setMonth(date.getMonth() + i);
            return this.monthNames[date.getMonth()] + ' ' + getYear(date);
        },

        formatYearlyLabel: function(date, i) {
            return date.getYear() + 1900 + i;
        }
    },

    defaults = corneliusDefaults;

    function extend() {
        var target = arguments[0];

        if (arguments.length === 1) return target;

        for (var i = 1; i < arguments.length; i++) {
            var source = arguments[i];
            for (var prop in source) target[prop] = source[prop];
        }

        return target;
    }

    function isNumber(val) {
        return Object.prototype.toString.call(val) === '[object Number]';
    }

    function isEmpty(val) {
        return val === null || val === undefined || val === "";
    }

    function getYear(date) {
        return date.getYear() + 1900;
    }

    var draw = function(cohort, container, config) {

        function create(el, options) {
            options = options || {};

            el = document.createElement(el);

            if ((className = options.className)) {
                delete options.className;
                el.className = prefixClass(className);
            }
            if (!isEmpty(textContent = options.text)) {
                delete options.text;
                el.textContent = textContent.toString();
            }

            for (var option in options) {
                if ((opt = options[option])) el[option] = opt;
            }

            return el;
        }

        function prefixClass(className) {
            var prefixedClass = [],
                classes = className.split(/\s+/);

            for (var i in classes) {
                prefixedClass.push(config.classPrefix + classes[i]);
            }
            return prefixedClass.join(" ");
        }

        function drawHeader(data) {
            var th = create('tr'),
                monthLength = data[0].length;

            th.appendChild(create('th', { text: config.labels.time, className: 'time' }));

            for (var i = 0; i < monthLength; i++) {
                if (i > config.maxColumns) break;
                th.appendChild(create('th', { text: config.formatHeaderLabel(i), className: 'people' }));
            }
            return th;
        }

        function formatTimeLabel(initial, timeInterval, i) {
            var date = new Date(initial.getTime()),
                formatFn = null;

            if (timeInterval === 'daily') {
                formatFn = 'formatDailyLabel';
            } else if (timeInterval === 'weekly') {
                formatFn = 'formatWeeklyLabel';
            } else if (timeInterval === 'monthly') {
                formatFn = 'formatMonthlyLabel';
            } else if (timeInterval === 'yearly') {
                formatFn = 'formatYearlyLabel';
            } else {
                throw new Error("Interval not supported");
            }

            return config[formatFn].call(config, date, i);
        }

        function drawCells(data) {
            var fragment = document.createDocumentFragment(),

                startMonth = config.maxRows ? data.length - config.maxRows : 0,

                formatPercentage = function(value, base) {
                    if (isNumber(value) && base > 0) {
                        return (value / base * 100).toFixed(2);
                    } else if (isNumber(value)) {
                        return "0.00";
                    }
                },

                classNameFor = function(value) {
                    var levels = config.repeatLevels,
                        floatValue = value && parseFloat(value),
                        highestLevel = null;

                    var classNames = ['percentage'];

                    for (var level in levels) {
                        if (floatValue >= levels[level][0] && floatValue < levels[level][1]) {
                            classNames.push(level);
                            return classNames.join(" ");
                        }
                        highestLevel = level;
                    }

                    // handle 100% case
                    classNames.push(highestLevel);
                    return classNames.join(" ");

                };

            for (var i = startMonth; i < data.length; i++) {
                var tr = create('tr'),
                    row = data[i],
                    baseValue = row[0];

                tr.appendChild(create('td', {
                    className: 'label',
                    textContent: formatTimeLabel(config.initialDate, config.timeInterval, i)
                }));

                for (var j = 0; j < data[0].length; j++) {
                    if (j > config.maxColumns) break;

                    var value = row[j],
                        cellValue = j === 0 ? value : formatPercentage(value, baseValue),
                        opts = {};

                        if (!isEmpty(cellValue)) {
                            opts = {
                                text: cellValue,
                                title: j > 0 && config.rawNumberOnHover ? value : null,
                                className: j === 0 ? 'people' : classNameFor(cellValue)
                            };
                        } else if (config.drawEmptyCells) {
                            opts = { text: '-', className: 'empty' };
                        }

                    tr.appendChild(create('td', opts));
                }
                fragment.appendChild(tr);
            }
            return fragment;
        }

        var mainContainer = create('div', { className: 'container' }),
            table = create('table', { className: 'table' });

        table.appendChild(drawHeader(cohort));
        table.appendChild(drawCells(cohort));

        if ((title = config.title)) {
            mainContainer.appendChild(create('div', { text: title, className: 'title' }));
        }
        mainContainer.appendChild(table);

        container.innerHTML = "";
        container.appendChild(mainContainer);
    };

    var Cornelius = function(opts) {
        this.config = extend({}, Cornelius.getDefaults(), opts || {});
    };

    Cornelius.prototype.draw = function(cohort, container) {
        if (!cohort)    throw new Error ("Please provide the cohort data");
        if (!container) throw new Error ("Please provide the cohort container");

        draw(cohort, container, this.config);
    };

    extend(Cornelius, {
        getDefaults: function() {
            return defaults;
        },

        setDefaults: function(def) {
            defaults = extend({}, corneliusDefaults, def);
        },

        resetDefaults: function() {
            defaults = corneliusDefaults;
        }
    });

    if (typeof jQuery !== "undefined" && jQuery !== null) {
        jQuery.fn.cornelius = function(options) {
            return this.each(function() {
                return new Cornelius(options).draw(options.cohort, this);
            });
        };
    }

    exports.Cornelius = Cornelius;

})(window);
