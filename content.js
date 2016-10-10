/* Wildfire Content Script */

var all_settings;
chrome.storage.local.get('settings', function (settings) {
    all_settings = settings.settings;
});

function getFrameIndex() {
    if (window.top === window.self)
        return 0;
    for (var i=0; i<window.top.frames.length; i++) {
        if (window.top.frames[i] === window.self) {
            return i+1;
        }
    }

    return -1;
}

function processPath(elementPath) {
    var numPathElements = elementPath.length;
    var path = [];
    
    uniqueEl = false;
    for (var i=0; i<numPathElements-1 && !uniqueEl; i++) {
        if (elementPath[i].id!=null && elementPath[i].id!="") {
            uniqueEl = true;
            path.push({
                uniqueId: elementPath[i].id,
                tagName: elementPath[i].tagName
            });
        } else {
            var childIndex = null;
            for (var j=0; elementPath[i].parentNode!=null && j<elementPath[i].parentNode.childNodes.length; j++) {
                if (elementPath[i].parentNode.childNodes[j]===elementPath[i]) {
                    childIndex = j;
                }
            }
            if (childIndex==null && elementPath[i]==document) {
                ; // WTF
            } else {
                path.push({
                    uniqueId: null,
                    childIndex: childIndex,
                    tagName: elementPath[i].tagName
                });
            }
        }
    }
    
    return path;
}

function getCSSPath(el, ignoreIds) {
    if (!(el instanceof Element))
        return;
    var path = [];
    while (el.nodeType === Node.ELEMENT_NODE) {
        var selector = el.nodeName.toLowerCase();
        if (el.id && !ignoreIds) {
            selector += '#' + el.id.replace( /(:|\.|\[|\]|,)/g, "\\$1" ); // extra regex for css chars in id
            path.unshift(selector);
            break;
        } else {
            var sib = el, nth = 1;
            var sib = el, nth = 1;
            while (sib = sib.previousElementSibling) {
                if (sib.nodeName.toLowerCase() == selector)
                    nth++;
            }
            if (nth != 1)
                selector += ":nth-of-type("+nth+")";
        }
        path.unshift(selector);
        el = el.parentNode;
    }
    return path.join(" > ");
}

function simulate(element, eventName) {
    var options = extend(defaultOptions, arguments[2] || {});
    var oEvent, eventType = null;

    for (var name in eventMatchers) {
        if (eventMatchers[name].test(eventName)) { eventType = name; break; }
    }

    if (!eventType)
        throw new SyntaxError('Only HTMLEvent, MouseEvents and KeyboardEvents interfaces are supported');

    if (eventType == 'KeyboardEvents') {
        var oEvent = new KeyboardEvent(eventName, {bubbles : true, cancelable : true,
            code : String.fromCharCode(options.keyCode).toLowerCase(),
            key : String.fromCharCode(options.keyCode).toLowerCase(), shiftKey : false});
    } else {
        oEvent = document.createEvent(eventType);
        if (eventType == 'HTMLEvents') {
            oEvent.initEvent(eventName, options.bubbles, options.cancelable);
        } else {
            oEvent.initMouseEvent(eventName, options.bubbles, options.cancelable, document.defaultView,
                options.button, options.clientX, options.clientY, options.clientX, options.clientY,
                options.ctrlKey, options.altKey, options.shiftKey, options.metaKey, options.button, element);
        }
    }

    console.log(element.dispatchEvent(oEvent));

    return element;
}

function extend(destination, source) {
    for (var property in source)
        destination[property] = source[property];
    return destination;
}

var eventMatchers = {
    'HTMLEvents': /^(?:load|unload|abort|error|select|change|submit|reset|focus|blur|resize|scroll)$/,
    'MouseEvents': /^(?:click|dblclick|mouse(?:down|up|over|move|out))$/,
    'KeyboardEvents': /^(?:key(?:down|up|press))$/
}

var defaultOptions = {
    clientX: 0,
    clientY: 0,
    button: 0,
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    metaKey: false,
    bubbles: true,
    cancelable: true
}

/*
new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
        console.log(mutation);
        alert('mutation');
    });
}).observe(document.body, {
    attributes: true,
    childList: false,
    characterData: false,
    attributeOldValue: true,
//  characterDataOldValue: true,
    subtree: true,
    attributeFilter: ['value']
});
*/

function getClipboard() {
    const input = document.createElement('input');
    input.style.position = 'fixed';
    input.style.opacity = 0;
    document.body.appendChild(input);
    input.select();
    document.execCommand('Paste');
    document.body.removeChild(input);
}


/*
document.addEventListener("DOMNodeInserted", function(e) {
    all_elements = e.getElementsByTagName("input");
    for (var i=0; i<all_elements.length; i++) {
        all_elements[i].addEventListener('change', function(evt) {
            alert('New event');
            console.log(evt);
        });
    }
}, false);
*/

/*
    var input_elements = document.body.getElementsByTagName("input");
    for (var i = 0; i < input_elements.length; i++) {
        input_elements[i].addEventListener('change', function (e) {
            chrome.storage.local.get('recording', function (isRecording) {
                if (isRecording.recording) {
                    chrome.storage.local.get('events', function (result) {
                        var events = result.events;
                        if (!Array.isArray(events)) { // for safety only
                            events = [];
                        }
                        events.push({
                            evt: 'dataentry',
                            evt_data: {
                                path: processPath(e.path),
                                csspath: getCSSPath(e.srcElement, false),
                                csspathfull: getCSSPath(e.srcElement, true),
                                bubbles: e.bubbles,
                                cancelable: e.cancelable,
                                value: e.srcElement.value,
                                type: 'input',
                                url: window.location.href
                            },
                            time: Date.now()
                        });
                        chrome.storage.local.set({events: events});
                    });
                }
            });
        });
        input_elements[i].addEventListener('copy', function (e) {
            chrome.storage.local.get('recording', function (isRecording) {
                if (isRecording.recording) {
                    chrome.storage.local.get('events', function (result) {
                        var events = result.events;
                        if (!Array.isArray(events)) { // for safety only
                            events = [];
                        }
                        events.push({
                            evt: 'clipboard_copy',
                            evt_data: {
                                path: processPath(e.path),
                                csspath: getCSSPath(e.srcElement, false),
                                csspathfull: getCSSPath(e.srcElement, true),
                                bubbles: e.bubbles,
                                cancelable: e.cancelable,
                                value: getClipboard(),
                                url: window.location.href
                            },
                            time: Date.now()
                        });
                        chrome.storage.local.set({events: events});
                    });
                }
            });
        });
        input_elements[i].addEventListener('cut', function (e) {
            chrome.storage.local.get('recording', function (isRecording) {
                if (isRecording.recording) {
                    chrome.storage.local.get('events', function (result) {
                        var events = result.events;
                        if (!Array.isArray(events)) { // for safety only
                            events = [];
                        }
                        events.push({
                            evt: 'clipboard_cut',
                            evt_data: {
                                path: processPath(e.path),
                                csspath: getCSSPath(e.srcElement, false),
                                csspathfull: getCSSPath(e.srcElement, true),
                                bubbles: e.bubbles,
                                cancelable: e.cancelable,
                                value: getClipboard(),
                                url: window.location.href
                            },
                            time: Date.now()
                        });
                        chrome.storage.local.set({events: events});
                    });
                }
            });
        });
        input_elements[i].addEventListener('paste', function (e) {
            chrome.storage.local.get('recording', function (isRecording) {
                if (isRecording.recording) {
                    chrome.storage.local.get('events', function (result) {
                        var events = result.events;
                        if (!Array.isArray(events)) { // for safety only
                            events = [];
                        }
                        events.push({
                            evt: 'clipboard_paste',
                            evt_data: {
                                path: processPath(e.path),
                                csspath: getCSSPath(e.srcElement, false),
                                csspathfull: getCSSPath(e.srcElement, true),
                                bubbles: e.bubbles,
                                cancelable: e.cancelable,
                                value: getClipboard(),
                                url: window.location.href
                            },
                            time: Date.now()
                        });
                        chrome.storage.local.set({events: events});
                    });
                }
            });
        });
    }
    var textarea_elements = document.body.getElementsByTagName("textarea");
    for (var i = 0; i < textarea_elements.length; i++) {
        textarea_elements[i].addEventListener('change', function (e) {
            chrome.storage.local.get('recording', function (isRecording) {
                if (isRecording.recording) {
                    chrome.storage.local.get('events', function (result) {
                        var events = result.events;
                        if (!Array.isArray(events)) { // for safety only
                            events = [];
                        }
                        events.push({
                            evt: 'dataentry',
                            evt_data: {
                                path: processPath(e.path),
                                csspath: getCSSPath(e.srcElement, false),
                                csspathfull: getCSSPath(e.srcElement, true),
                                bubbles: e.bubbles,
                                cancelable: e.cancelable,
                                value: e.srcElement.value,
                                type: 'textarea',
                                url: window.location.href
                            },
                            time: Date.now()
                        });
                        chrome.storage.local.set({events: events});
                    });
                }
            });
        });
        input_elements[i].addEventListener('copy', function (e) {
            chrome.storage.local.get('recording', function (isRecording) {
                if (isRecording.recording) {
                    chrome.storage.local.get('events', function (result) {
                        var events = result.events;
                        if (!Array.isArray(events)) { // for safety only
                            events = [];
                        }
                        events.push({
                            evt: 'clipboard_copy',
                            evt_data: {
                                path: processPath(e.path),
                                csspath: getCSSPath(e.srcElement, false),
                                csspathfull: getCSSPath(e.srcElement, true),
                                bubbles: e.bubbles,
                                cancelable: e.cancelable,
                                value: getClipboard(),
                                url: window.location.href
                            },
                            time: Date.now()
                        });
                        chrome.storage.local.set({events: events});
                    });
                }
            });
        });
        input_elements[i].addEventListener('cut', function (e) {
            chrome.storage.local.get('recording', function (isRecording) {
                if (isRecording.recording) {
                    chrome.storage.local.get('events', function (result) {
                        var events = result.events;
                        if (!Array.isArray(events)) { // for safety only
                            events = [];
                        }
                        events.push({
                            evt: 'clipboard_cut',
                            evt_data: {
                                path: processPath(e.path),
                                csspath: getCSSPath(e.srcElement, false),
                                csspathfull: getCSSPath(e.srcElement, true),
                                bubbles: e.bubbles,
                                cancelable: e.cancelable,
                                value: getClipboard(),
                                url: window.location.href
                            },
                            time: Date.now()
                        });
                        chrome.storage.local.set({events: events});
                    });
                }
            });
        });
        input_elements[i].addEventListener('paste', function (e) {
            chrome.storage.local.get('recording', function (isRecording) {
                if (isRecording.recording) {
                    chrome.storage.local.get('events', function (result) {
                        var events = result.events;
                        if (!Array.isArray(events)) { // for safety only
                            events = [];
                        }
                        events.push({
                            evt: 'clipboard_paste',
                            evt_data: {
                                path: processPath(e.path),
                                csspath: getCSSPath(e.srcElement, false),
                                csspathfull: getCSSPath(e.srcElement, true),
                                bubbles: e.bubbles,
                                cancelable: e.cancelable,
                                value: getClipboard(),
                                url: window.location.href
                            },
                            time: Date.now()
                        });
                        chrome.storage.local.set({events: events});
                    });
                }
            });
        });
    }
*/

//    document.addEventListener("DOMNodeInserted", function(e) {
//        alert(e);
//    }
//    document.getElementsByTagName('input').addEventListener('DOMAttrModified', function(evt) {
//        alert(evt.attrName + ' is changing from ' + evt.prevValue + ' to ' + evt.newValue);
//    }, true);

/* Start Scroll */
var scrollTimer = null;
var scrollObject = null;
var scrollStartTime;
var scrollStartTop;
var scrollStartLeft;

function finishScrollEvent() {
    chrome.storage.local.get('events', function (result) {
        scrollObject = document.body; // temp fix

        var events = result.events;
        if (!Array.isArray(events)) { // for safety only
            events = [];
        }
        events.push({
            evt: 'scroll',
            evt_data: {
                bubbles: false, // TODO: Investigate
                cancelable: false, // TODO: Investigate
                scrollTopStart: scrollStartTop,
                scrollTopEnd: scrollObject.scrollTop,
                scrollLeftStart: scrollStartLeft,
                scrollLeftEnd: scrollObject.scrollLeft,
                inFrame: getFrameIndex(),
                url: window.location.href,
                endtime: Date.now()
            },
            time: scrollStartTime
        });
        chrome.storage.local.set({events: events});

        scrollObject = null;
        scrollStartTop = null; // not necessary
        scrollStartLeft = null; // not necessary
    });
}

function updateScrollEvent(e) {
    // Designed to support multiple element scrolling event listeners

    var scrollTimeMillis = 100;

    if (scrollObject == null) {
        scrollStartTime = Date.now();
        scrollObject = document.body; // e.srcElement; temp removed
        scrollStartTop = scrollObject.scrollTop;
        scrollStartLeft = scrollObject.scrollLeft;
        scrollTimer = setTimeout(finishScrollEvent, scrollTimeMillis);
    } else {//} if (scrollObject == e.srcElement) {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(finishScrollEvent, scrollTimeMillis);
    }/* else { // a new element has started scrolling. 2 elements can't scroll concurrently, so the first must be
        alert('Wildfire Exception: Detected duplicate scroll. Please inform the developers of this issue.');
        clearTimeout(scrollTimer);
        finishScrollEvent();
        scrollStartTime = Date.now();
        scrollStartTop = e.srcElement.scrollTop;
        scrollStartLeft = e.srcElement.scrollLeft;
        setTimeout(finishScrollEvent, scrollTimeMillis);
    }*/
}

function addDocumentEventListener(eventName) {
	document.body.addEventListener(eventName, function (e) {
		var evt_data = {
			path: processPath(e.path),
			csspath: getCSSPath(e.srcElement, false),
			csspathfull: getCSSPath(e.srcElement, true),
			clientX: e.clientX,
			clientY: e.clientY,
			altKey: e.altKey,
			ctrlKey: e.ctrlKey,
			shiftKey: e.shiftKey,
			metaKey: e.metaKey,
			button: e.button,
			bubbles: e.bubbles,
			cancelable: e.cancelable,
			innerText: e.srcElement.innerText,
			inFrame: getFrameIndex(),
			url: window.location.href
		};
		if (eventName == "select")
			evt_data['selectValue'] = e.srcElement.value;
		if (eventName == "keyup" || eventName == "keydown" || eventName == "keypress")
			evt_data['keyCode'] = e.keyCode;
		if (eventName == "input" || eventName == "propertychange" || eventName == "change") {
			evt_data['value'] = e.srcElement.value;
			evt_data['type'] = e.srcElement.tagName.toLowerCase();
		}
		
		if (eventName=="wfSubmit")
			eventName = "submit";
		
		setTimeout(function () {
			chrome.storage.local.get('recording', function (isRecording) {
				if (isRecording.recording) {
					chrome.storage.local.get('events', function (result) {
						var events = result.events;
						if (!Array.isArray(events)) { // for safety only
							events = [];
						}
						events.push({
							evt: eventName,
							evt_data: evt_data,
							time: Date.now()
						});
						chrome.storage.local.set({events: events});
					});
				}
			});
		}, 1);
	}, false);
}

chrome.storage.local.get('recording', function (isRecording) {
    if (isRecording.recording) {

        window.addEventListener("scroll", function (e) {
            setTimeout(function () {
                chrome.storage.local.get('recording', function (isRecording) {
                    if (isRecording.recording) {
                        updateScrollEvent(e);
                    }
                });
            }, 1);
        }, false);
		
		addDocumentEventListener("mousedown");
		addDocumentEventListener("mouseup");
		addDocumentEventListener("touchstart");
        if (all_settings.recordmouseover) {
			addDocumentEventListener("mouseover");
        }
        if (all_settings.recordmouseout) {
			addDocumentEventListener("mouseout");
        }
		addDocumentEventListener("open");
		addDocumentEventListener("select");
		addDocumentEventListener("focusin");
		addDocumentEventListener("focusout");
		addDocumentEventListener("click");
		addDocumentEventListener("keydown");
		addDocumentEventListener("keypress");
		addDocumentEventListener("keyup");
		addDocumentEventListener("input");
		addDocumentEventListener("propertychange");
		addDocumentEventListener("change");
		addDocumentEventListener("wfSubmit");

        if (all_settings.customsubmit) {
            /* Inject JS directly in for submit intercepts */
            var s = document.createElement('script');
            s.src = chrome.extension.getURL('embedded.js');
            s.onload = function () {
                this.parentNode.removeChild(this);
            };
            (document.head || document.documentElement).appendChild(s);
        }

        /* Duplicate hover CSS classes */
        if (window.location.href.substring(0, 19) != "chrome-extension://" && all_settings.emulatehover) {
            var styles = document.styleSheets;
            for (var i = 0, len = styles.length; i < len; i++) {
                var rules = styles[i].cssRules;
                if (rules) {
                    var newstyle = "";
                    for (var j = 0; j < rules.length; j++) {
                        if (rules[j].cssText.indexOf(":hover") > -1) {
                            newstyle += rules[j].cssText.replace(/:hover/g, ".wildfire-hover") + ";";
                        }
                    }
                    var style_tag = document.createElement('style');
                    style_tag.appendChild(document.createTextNode(newstyle));
                    document.body.appendChild(style_tag);
                } else {
                    loadCSSCors(styles[i].href);
                }
            }

            function loadCSSCors(stylesheet_uri) {
                var path_parts = stylesheet_uri.split('/');
                path_parts.pop();
                var relative_host_dir = path_parts.join('/') + "/";

                var _xhr = XMLHttpRequest;
                var has_cred = false;
                try {
                    has_cred = _xhr && ('withCredentials' in (new _xhr()));
                } catch (e) {
                }
                if (!has_cred) {
                    console.error('CORS not supported');
                    return;
                }
                var xhr = new _xhr();
                xhr.open('GET', stylesheet_uri);
                xhr.onload = function () {
                    xhr.onload = xhr.onerror = null;
                    if (xhr.status < 200 || xhr.status >= 300) {
                        console.error('style failed to load: ' + stylesheet_uri)
                    } else if (xhr.responseText.indexOf(":hover") > -1) {
                        var style_tag = document.createElement('style');
                        var newstyle = xhr.responseText.replace(/:hover/g, ".wildfire-hover");
                        newstyle = newstyle.replace(/url\((?!http|\/\/)/g, "url(" + relative_host_dir);
                        style_tag.appendChild(document.createTextNode(newstyle));
                        document.body.appendChild(style_tag);
                    }
                    xhr.onerror = function () {
                        xhr.onload = xhr.onerror = null;
                        console.error('XHR CORS CSS fail:' + styleURI);
                    };
                };
                xhr.send();
            }

            function simulateHoverElement(el) {
                stopSimulateHover();
                $(el).addClass("wildfire-hover");
                $(el).parents().addClass("wildfire-hover");
            }

            function stopSimulateHover() {
                $("*").removeClass("wildfire-hover");
            }
        }

    }
});