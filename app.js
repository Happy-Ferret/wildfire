/**
 * Created by ian.mckay on 24/04/2016.
 */

var events = [];
var recording_start_time = 0;
var recording_end_time = 0;
var simulating = false;
var simulation_log = [];
var sim_start_time;
var all_settings;
var timeoutObject;
var stepIterator = 0;
var new_window;
var event_execution_timeout = 10000;
var eventExecutionTimeoutCounter;
var closeListener;
var terminated;

var node_details = [];

chrome.storage.local.get('settings', function (settings) {
    all_settings = {
        "account": "",
        "cloudapikey": "",
        "emulatehover": false,
        "leavesimulationopen": false,
        "clearbrowsingdata": false,
        "recordmousedown": false,
        "recordmouseup": false,
        "recordmouseover": false,
        "recordmouseout": false,
        "recordselect": false,
        "recordfocusin": false,
        "recordfocusout": false,
        "recordclick": true,
        "recordkeydown": false,
        "recordkeypress": true,
        "recordkeyup": false,
        "recordinput": true,
        "recordchange": true,
        "recordscroll": false,
        "simulatemousedown": false,
        "simulatemouseup": false,
        "simulatemouseover": false,
        "simulatemouseout": false,
        "simulateselect": true,
        "simulatefocusin": true,
        "simulatefocusout": true,
        "simulateclick": true,
        "simulatekeydown": true,
        "simulatekeypress": true,
        "simulatekeyup": true,
        "simulateinput": true,
        "simulatechange": true,
        "simulatescroll": true,
        "customsubmit": true,
        "runminimized": false,
        "incognito": false,
        "rightclick": true
    };
    if (settings.settings != null)
        all_settings = $.extend(all_settings,settings.settings);
    chrome.storage.local.set({settings: all_settings});
});

chrome.storage.onChanged.addListener(function(changes, namespace) {
    updateEvents();
});

function closeListenerCallback(closed_window_id) {
	if (closed_window_id == new_window.id) {
		terminateSimulation(false, "Simulation terminated");
	}
}

function updateEvents() {
    chrome.storage.local.get('events', function (result) {
        events = result.events;
    });
}

updateEvents();

function downloadEventLog() {
    var text = encrypt(JSON.stringify(events));
    var filename = "WildfireExport_" + Math.floor(Date.now() / 1000) + ".wfire";

    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

function addListener(element, eventName, handler) {
    if (element.addEventListener) {
        element.addEventListener(eventName, handler, false);
    }
    else if (element.attachEvent) {
        element.attachEvent('on' + eventName, handler);
    }
    else {
        element['on' + eventName] = handler;
    }
}

function removeListener(element, eventName, handler) {
    if (element.addEventListener) {
        element.removeEventListener(eventName, handler, false);
    }
    else if (element.detachEvent) {
        element.detachEvent('on' + eventName, handler);
    }
    else {
        element['on' + eventName] = null;
    }
}

/*
 ** simulate(document.getElementById("btn"), "click", { clientX: 123, clientY: 321 })
 */

function constructElementIdentifier(path) {
    var js_string = "document";

    if (path.length==1) {
        return "document.getElementById('" + path[0].uniqueId + "')";
    }
    for (var i=path.length-2; i>=0; i--) {
        js_string += ".childNodes[" + path[i].childIndex + "]";
    }

    return js_string;
}

function closeListenerCallbackWorkflow(closed_window_id) {
	if (closed_window_id == new_window.id) {
        var custom = new CustomStop();
        CustomTracker.push(custom);
        node.add(custom, new draw2d.layout.locator.CenterLocator(node));
		terminateSimulation(false, "Simulation terminated");
	}
}

function terminateSimulation(finished, reason) {
	if (terminated)
		return;
	terminated = true; // prevent race against close listener
	
	chrome.windows.onRemoved.removeListener(closeListenerCallback);
    chrome.windows.onRemoved.removeListener(closeListenerCallbackWorkflow);
    clearTimeout(timeoutObject);
    chrome.storage.local.set({proxy: {clear: true}});

    chrome.browserAction.setBadgeText({ text: "" });

    if (all_settings.clearbrowsingdata) {
        chrome.browsingData.remove({
            "since": sim_start_time
        }, {
            "appcache": true,
            "cache": true,
            "cookies": true,
            "downloads": true,
            "fileSystems": true,
            "formData": true,
            "history": true,
            "indexedDB": true,
            "localStorage": true,
            "pluginData": true,
            "passwords": true,
            "webSQL": true
        }, function() {
            ;//console.log("Finished clearing browsing history");
        });
    }
	
    simulating = false;
    
    if (simulation_log.length < events.length && finished) { // No errors but missing events
        finished = false;
        reason = "Missed events";
    }

    chrome.notifications.create("",{
        type: "basic",
        title: "Wildfire",
        message: "Simulation completed",
        iconUrl: "icon-128.png"
    });

    try {
        chrome.tabs.captureVisibleTab(new_window.id,{
            "format": "png"
        }, function(imagedata){
            chrome.storage.local.get('simulations', function (result) {
                var simulations = result.simulations;
                if (!Array.isArray(simulations)) { // for safety only
                    simulations = [];
                }
                simulations.push({
                    log: simulation_log,
                    starttime: sim_start_time,
                    endtime: Date.now(),
                    image: imagedata,
                    finished: finished,
                    events: events,
                    terminate_reason: reason,
                    node_details: node_details
                });
                chrome.storage.local.set({simulations: simulations});
                if (!all_settings.leavesimulationopen)
                    chrome.windows.remove(new_window.id,function(){});
            });
        });
    } catch(err) {
        chrome.storage.local.get('simulations', function (result) {
            var simulations = result.simulations;
            if (!Array.isArray(simulations)) { // for safety only
                simulations = [];
            }
            simulations.push({
                log: simulation_log,
                starttime: sim_start_time,
                endtime: Date.now(),
                image: null,
                finished: finished,
                events: events,
                terminate_reason: reason,
                node_details: node_details
            });
            chrome.storage.local.set({simulations: simulations});
            if (!all_settings.leavesimulationopen)
                chrome.windows.remove(new_window.id,function(){});
        });
    }
}

function simulateEvent(code, i) {
	setTimeout(function(new_window, events, i, code) {
		var frameId = 0;

		chrome.webNavigation.getAllFrames({tabId: new_window.tabs[0].id}, function (frames) {
			for (var j=0; j<frames.length; j++) {
				if (frames[j].frameId!=0 && frames[j].url == events[i].evt_data.url) {
					frameId = frames[j].frameId;
				}
			}
			
			eventExecutionTimeoutCounter = setTimeout(function(i){
				simulation_log.push({
					index: i,
					error: true
				});
				terminateSimulation(false, "Event timeout");
			}, event_execution_timeout, i);

            code = "try { " + code + "; } catch(err) { new Object({error: err.message}); }";

			chrome.tabs.executeScript(new_window.tabs[0].id,{
				code: code,
				frameId: frameId,
				matchAboutBlank: true
			},function(results){
                error = true;
                if (results && results.length==1 && !results[0].error)
                    error = false;
				simulation_log.push({
                    index: i,
                    error: error,
                    results: results
                });
				
				simulateNextStep();
			});
		});
	}, events[i].time-events[i-1].time, new_window, events, i, code);
}

function simulateNextStep() {
    var i = stepIterator;
    clearTimeout(eventExecutionTimeoutCounter);

    switch (events[i].evt) {
        case 'begin_recording':
            setTimeout(function(i) {
                simulation_log.push({
                    index: i,
                    error: false
                });
                simulateNextStep();
            }, events[i].time-recording_start_time, i);
            break;
        case 'end_recording':
            setTimeout(function(new_window, timeoutObject, i) {
				simulation_log.push({
                    index: i,
                    error: false
                });
                terminateSimulation(true, "");
            }, events[i].time-events[i-1].time, new_window, timeoutObject, i);
            break;
        case 'mousedown':
            if (all_settings.simulatemousedown) {
            simulateEvent("simulate(" +
				constructElementIdentifier(events[i].evt_data.path) +
				",'mousedown', { clientX: " +
				events[i].evt_data.clientX +
				", clientY: " +
				events[i].evt_data.clientY +
				" });", i);
			} else {
				simulation_log.push({
                    index: i,
                    error: false
                });
                setTimeout(function(){
                    simulateNextStep();
                },1);
			}
            break;
        case 'scroll':
            if (all_settings.simulatescroll) {
            simulateEvent("$('html, body').animate({" +
				"scrollTop: " + events[i].evt_data.scrollTopEnd + "," +
				"scrollLeft: " + events[i].evt_data.scrollLeftEnd +
				"}, " + (events[i].evt_data.endtime-events[i].time) + ");", i);
			} else {
				simulation_log.push({
                    index: i,
                    error: false
                });
                setTimeout(function(){
                    simulateNextStep();
                },1);
			}
            break;
        case 'mouseup':
            if (all_settings.simulatemouseup) {
            simulateEvent("simulate(" +
				constructElementIdentifier(events[i].evt_data.path) +
				",'mouseup', { clientX: " +
				events[i].evt_data.clientX +
				", clientY: " +
				events[i].evt_data.clientY +
				" });", i);
			} else {
				simulation_log.push({
                    index: i,
                    error: false
                });
                setTimeout(function(){
                    simulateNextStep();
                },1);
			}
            break;
        case 'mouseover':
            if (all_settings.simulatemouseover) {
				simulateEvent("simulate(" +
					constructElementIdentifier(events[i].evt_data.path) +
					",'mouseover', { clientX: " +
					events[i].evt_data.clientX +
					", clientY: " +
					events[i].evt_data.clientY +
					" }); simulateHoverElement('" + events[i].evt_data.csspath + "');", i);
			} else {
				simulation_log.push({
                    index: i,
                    error: false
                });
                setTimeout(function(){
                    simulateNextStep();
                },1);
			}
            break;
        case 'mouseout':
            if (all_settings.simulatemouseout) {
				simulateEvent("simulate(" +
					constructElementIdentifier(events[i].evt_data.path) +
					",'mouseout', { clientX: " +
					events[i].evt_data.clientX +
					", clientY: " +
					events[i].evt_data.clientY +
					" }); stopSimulateHover();", i);
			} else {
				simulation_log.push({
                    index: i,
                    error: false
                });
                setTimeout(function(){
                    simulateNextStep();
                },1);
			}
            break;
        case 'click':
            if (all_settings.simulateclick) {
            simulateEvent("$('" + events[i].evt_data.csspath + "').click();", i);
			} else {
				simulation_log.push({
                    index: i,
                    error: false
                });
                setTimeout(function(){
                    simulateNextStep();
                },1);
			}
            break;
        case 'focusin':
            if (all_settings.simulatefocusin) {
            simulateEvent("$('" + events[i].evt_data.csspath + "').focus();", i);
			} else {
				simulation_log.push({
                    index: i,
                    error: false
                });
                setTimeout(function(){
                    simulateNextStep();
                },1);
			}
            break;
        case 'focusout':
            if (all_settings.simulatefocusout) {
            simulateEvent("$('" + events[i].evt_data.csspath + "').blur();", i);
			} else {
				simulation_log.push({
                    index: i,
                    error: false
                });
                setTimeout(function(){
                    simulateNextStep();
                },1);
			}
            break;
        case 'keydown':
            if (all_settings.simulatekeydown) {
            simulateEvent("simulate(" +
				constructElementIdentifier(events[i].evt_data.path) +
				",'keydown', { keyCode: " +
				events[i].evt_data.keyCode +
				" });", i);
			} else {
				simulation_log.push({
                    index: i,
                    error: false
                });
                setTimeout(function(){
                    simulateNextStep();
                },1);
			}
            break;
        case 'keyup':
            if (all_settings.simulatekeyup) {
			simulateEvent("simulate(" +
				constructElementIdentifier(events[i].evt_data.path) +
				",'keyup', { keyCode: " +
				events[i].evt_data.keyCode +
				" });", i);
			} else {
				simulation_log.push({
                    index: i,
                    error: false
                });
                setTimeout(function(){
                    simulateNextStep();
                },1);
			}
            break;
        case 'keypress':
            if (all_settings.simulatekeypress) {
			simulateEvent("simulate(" +
				constructElementIdentifier(events[i].evt_data.path) +
				",'keypress', { keyCode: " +
				events[i].evt_data.keyCode +
				" });", i);
			} else {
				simulation_log.push({
                    index: i,
                    error: false
                });
                setTimeout(function(){
                    simulateNextStep();
                },1);
			}
            break;
        case 'submit':
			simulateEvent("simulate(" +
				constructElementIdentifier(events[i].evt_data.path) +
				",'submit', {});", i);
            break;
        case 'change':
            if (all_settings.simulatechange) {
			simulateEvent("$('" + events[i].evt_data.csspath + "').val('" +
				events[i].evt_data.value.replace("'", "\\'") + "');", i);
			} else {
				simulation_log.push({
                    index: i,
                    error: false
                });
                setTimeout(function(){
                    simulateNextStep();
                },1);
			}
            break;
        case 'input':
            if (all_settings.simulateinput) {
			simulateEvent("$('" + events[i].evt_data.csspath + "').val('" +
				events[i].evt_data.value.replace("'", "\\'") + "');", i);
			/*simulateEvent("$('" + events[i].evt_data.csspath + "').val('" +
				events[i].evt_data.value.replace("'", "\\'") + "');", i);*/
			} else {
				simulation_log.push({
                    index: i,
                    error: false
                });
                setTimeout(function(){
                    simulateNextStep();
                },1);
			}
            break;
        case 'clipboard_cut':
			simulateEvent("document.execCommand('copy');window.getSelection().anchorNode.parentNode.value = '';", i);
            break;
        case 'clipboard_copy':
			simulateEvent("document.execCommand('copy');", i);
            break;
        case 'clipboard_paste':
			simulateEvent("document.execCommand('paste');", i);
            break;
        case 'tabchange':
            setTimeout(function(events, i) {
                eventExecutionTimeoutCounter = setTimeout(function(i){
                    simulation_log.push({
                        index: i,
                        error: true
                    });
                    terminateSimulation(false, "Tab change timeout");
                }, event_execution_timeout, i);

                chrome.tabs.update(new_window.tabs[0].id, {
                    url: events[i].evt_data.url
                }, function(){
					simulation_log.push({
						index: i,
						error: false
					});
                    simulateNextStep();
                });
            }, events[i].time-events[i-1].time, events, i);
            break;
        case 'select':
            if (all_settings.simulateselect) {
            simulateEvent("$('" + node.userData.evt_data.csspath + "').select();", i); // TODO - emulate Text Select
			} else {
				simulation_log.push({
                    index: i,
                    error: false
                });
                setTimeout(function(){
                    simulateNextStep();
                },1);
			}
            break;
        default:
            console.log("Unknown event type: " + events[i].evt);
            simulation_log.push({
                index: i,
                error: true
            });
			terminateSimulation(false, "Unknown event type: " + events[i].evt);
            break;
    }

    stepIterator++;
}

function runSimulation() {
    if (!simulating && events!=null && events.length>2) {
        recording_start_time = events[0].time;
        simulating = true;
        simulation_log = [];
        sim_start_time = Date.now();
		stepIterator = 0;
		terminated = false;

        chrome.browserAction.setBadgeText({ text: "SIM" });
        chrome.browserAction.setBadgeBackgroundColor({ color: "#00CC66" });

        chrome.storage.local.get('events', function (result) {
            events = result.events;

            if (events.length < 3) {
                alert('Events not found. Something went wrong!');
                return;
            }

            /* Fast forward into first real step */
            events[0].time = events[1].time - 1000;

            chrome.extension.isAllowedIncognitoAccess(function(isAllowedIncognito) {
                var incognito = false;
                if (all_settings.incognito && isAllowedIncognito) {
                    incognito = true;
                }

                var url = "chrome-extension://" + chrome.runtime.id + "/new.html";
                if (events[1].evt != "tabchange" && events[1].evt_data.url && events[1].evt_data.url.length > 8) {
                    url = events[1].url;
                }

                chrome.windows.create({
                    "url":url,
                    "focused":true,
                    "left":0,
                    "top":0,
                    "width":1920,
                    "height":1080,
                    "incognito":incognito
                },function(simulation_window) {
                    new_window = simulation_window;
                    if (all_settings.runminimized) {
                        chrome.windows.update(new_window.id, { // https://bugs.chromium.org/p/chromium/issues/detail?id=459841
                            state: "minimized"
                        });
                    }
                    
                    chrome.tabs.getAllInWindow(new_window.id, function(tabs){
                        for (var i=1; i<tabs.length; i++) {
                            chrome.tabs.remove(tabs[i].id);
                        }
                    });

                    timeoutObject = setTimeout(function() {
                        terminateSimulation(false, "Global run timeout");
                    }, 3600000); // 1 hour
                    
                    chrome.windows.onRemoved.addListener(closeListenerCallback);

                    simulateNextStep();
                });
            });
        });
    } else {
        if (events==null || events.length<3)
            swal({
                title: "No events found",
                text: "You haven't recorded any actions yet!",
                type: "info",
                showCancelButton: false,
                cancelButtonClass: "btn-default",
                confirmButtonClass: "btn-info",
                confirmButtonText: "OK",
                closeOnConfirm: true
            });
        else
            swal({
                title: "Still recording",
                text: "You are still recording!",
                type: "info",
                showCancelButton: false,
                cancelButtonClass: "btn-default",
                confirmButtonClass: "btn-info",
                confirmButtonText: "OK",
                closeOnConfirm: true
            });
    }
}

function generatePassphrase() {
  var ret = "3ur9";
  ret += "480tvb4";
  ret += "39f83r8";
  return ret;
}
function encrypt(str) {
  return CryptoJS.AES.encrypt(str, generatePassphrase()).toString();
}
function decrypt(str) {
  return CryptoJS.AES.decrypt(str, generatePassphrase()).toString(CryptoJS.enc.Utf8);
}

document.getElementById('simulateButton').addEventListener('click', function() {
    runSimulation();
});
document.getElementById('downloadEventLogButton2').addEventListener('click', function() {
    downloadEventLog();
});
document.getElementById('importEventLogButton').addEventListener('click', function() {
    $('#eventfileContainer').click();
});
document.getElementById('eventfileContainer').addEventListener('change', function() {
    var reader = new FileReader();

    reader.onload = function(e) {
        var new_events = JSON.parse(decrypt(e.target.result));
        chrome.storage.local.set({events: new_events});
        chrome.storage.local.set({recording: false});
        chrome.notifications.create("",{
            type: "basic",
            title: "Wildfire",
            message: "Event Log Imported",
            iconUrl: "icon-128.png"
        });
    }

    var file = document.getElementById('eventfileContainer').files[0];
    reader.readAsText(file);
});
