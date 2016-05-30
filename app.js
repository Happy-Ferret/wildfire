/**
 * Created by ian on 24/04/2016.
 */

var events = [];
var recording_start_time = 0;
var recording_end_time = 0;
var simulating = false;

function downloadEventfile() {
    var text = JSON.stringify(events);
    var filename = "WildfireExport_" + Math.floor(Date.now() / 1000) + ".wfire";

    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

function deleteEvent(i) {
    swal({
        title: "Are you sure?",
        text: "The event will be deleted.",
        type: "warning",
        showCancelButton: true,
        cancelButtonClass: "btn-default",
        confirmButtonClass: "btn-danger",
        confirmButtonText: "Delete",
        closeOnConfirm: true
    },
    function(){
        chrome.storage.local.get('events', function (result) {
            events = result.events;
            if (!Array.isArray(events)) { // for safety only
                events = [];
            }
            events.splice(i,1);
            chrome.storage.local.set({events: events});
        });
    });
}

document.addEventListener('visibilitychange', function(){
    if (!document.hidden) {
        populateEvents();
    }
});

function populateEvents() {
    chrome.storage.local.get('events', function (result) {
        events = result.events;
        document.getElementById('events').innerHTML = ""; // reset table

        if (events.length<1) {
            var eventNode = document.createElement("tr");
            eventNode.innerHTML = '<tr><td style="text-align: center;" colspan="5">No events yet!</td></tr>';
            document.getElementById('events').appendChild(eventNode);
        } else {
            recording_start_time = events[0].time;
        }

        for (var i=0; i<events.length; i++) {
            /* Event Time */
            var event_time = ((events[i].time-recording_start_time)/1000).toFixed(2) + "s";

            /* Event Type and Details */
            var event_type = "";
            var event_data = "";
            var minorEvent = true;

            if (events[i].evt == "keydown" || events[i].evt == "keyup") {
                var event_data_prefix;
                if (events[i].evt == "keydown")
                    event_data_prefix = "Pressed down on ";
                else if (events[i].evt == "keyup")
                    event_data_prefix = "Released ";

                if (events[i].evt_data.keyCode==8)
                    event_data = event_data_prefix + "the Backspace key";
                else if (events[i].evt_data.keyCode==9)
                    event_data = event_data_prefix + "the Tab key";
                else if (events[i].evt_data.keyCode==13)
                    event_data = event_data_prefix + "the Enter key";
                else if (events[i].evt_data.keyCode==16)
                    event_data = event_data_prefix + "the Shift key";
                else if (events[i].evt_data.keyCode==17)
                    event_data = event_data_prefix + "the Control key";
                else if (events[i].evt_data.keyCode==18)
                    event_data = event_data_prefix + "the Alt key";
                else if (events[i].evt_data.keyCode==20)
                    event_data = event_data_prefix + "the Caps Lock key";
                else if (events[i].evt_data.keyCode==27)
                    event_data = event_data_prefix + "the Escape key";
                else if (events[i].evt_data.keyCode==32)
                    event_data = event_data_prefix + "the Space key";
                else if (events[i].evt_data.keyCode==33)
                    event_data = event_data_prefix + "the Page Up key";
                else if (events[i].evt_data.keyCode==34)
                    event_data = event_data_prefix + "the Page Down key";
                else if (events[i].evt_data.keyCode==35)
                    event_data = event_data_prefix + "the End key";
                else if (events[i].evt_data.keyCode==36)
                    event_data = event_data_prefix + "the Home key";
                else if (events[i].evt_data.keyCode==37)
                    event_data = event_data_prefix + "the Left Arrow key";
                else if (events[i].evt_data.keyCode==38)
                    event_data = event_data_prefix + "the Up Arrow key";
                else if (events[i].evt_data.keyCode==39)
                    event_data = event_data_prefix + "the Right Arrow key";
                else if (events[i].evt_data.keyCode==40)
                    event_data = event_data_prefix + "the Down Arrow key";
                else if (events[i].evt_data.keyCode==45)
                    event_data = event_data_prefix + "the Insert key";
                else if (events[i].evt_data.keyCode==46)
                    event_data = event_data_prefix + "the Delete key";
                else if (events[i].evt_data.keyCode > 47 && events[i].evt_data.keyCode < 91)
                    event_data = event_data_prefix + "the '" + String.fromCharCode(events[i].evt_data.keyCode).toLowerCase() + "' key";
                else if (events[i].evt_data.keyCode==106)
                    event_data = event_data_prefix + "the '*' key";
                else if (events[i].evt_data.keyCode==107)
                    event_data = event_data_prefix + "the '+' key";
                else if (events[i].evt_data.keyCode==109)
                    event_data = event_data_prefix + "the '-' key";
                else if (events[i].evt_data.keyCode==110)
                    event_data = event_data_prefix + "the '.' key";
                else if (events[i].evt_data.keyCode==111)
                    event_data = event_data_prefix + "the '/' key";
                else if (events[i].evt_data.keyCode==186)
                    event_data = event_data_prefix + "the ';' key";
                else if (events[i].evt_data.keyCode==187)
                    event_data = event_data_prefix + "the '=' key";
                else if (events[i].evt_data.keyCode==188)
                    event_data = event_data_prefix + "the ',' key";
                else if (events[i].evt_data.keyCode==189)
                    event_data = event_data_prefix + "the '-' key";
                else if (events[i].evt_data.keyCode==190)
                    event_data = event_data_prefix + "the '.' key";
                else if (events[i].evt_data.keyCode==191)
                    event_data = event_data_prefix + "the '/' key";
                else if (events[i].evt_data.keyCode==192)
                    event_data = event_data_prefix + "the '`' key";
                else if (events[i].evt_data.keyCode==219)
                    event_data = event_data_prefix + "the '[' key";
                else if (events[i].evt_data.keyCode==220)
                    event_data = event_data_prefix + "the '\\' key";
                else if (events[i].evt_data.keyCode==221)
                    event_data = event_data_prefix + "the ']' key";
                else if (events[i].evt_data.keyCode==222)
                    event_data = event_data_prefix + "the '\'' key";
                else
                    event_data = event_data_prefix + "an unknown key";
            } else if (events[i].evt == "keypress") {
                var event_data_prefix = "Pressed ";
                if (events[i].evt_data.keyCode==8)
                    event_data = event_data_prefix + "the Backspace key";
                else if (events[i].evt_data.keyCode==9)
                    event_data = event_data_prefix + "the Tab key";
                else if (events[i].evt_data.keyCode==13)
                    event_data = event_data_prefix + "the Enter key";
                else if (events[i].evt_data.keyCode==16)
                    event_data = event_data_prefix + "the Shift key";
                else if (events[i].evt_data.keyCode==17)
                    event_data = event_data_prefix + "the Control key";
                else if (events[i].evt_data.keyCode==18)
                    event_data = event_data_prefix + "the Alt key";
                else if (events[i].evt_data.keyCode==20)
                    event_data = event_data_prefix + "the Caps Lock key";
                else if (events[i].evt_data.keyCode==27)
                    event_data = event_data_prefix + "the Escape key";
                else if (events[i].evt_data.keyCode==32)
                    event_data = event_data_prefix + "the Space key";
                else if (events[i].evt_data.keyCode > 32 && events[i].evt_data.keyCode < 127)
                    event_data = event_data_prefix + "the '" + String.fromCharCode(events[i].evt_data.keyCode).toLowerCase() + "' key";
                else
                    event_data = event_data_prefix + "an unknown key";
            }

            switch (events[i].evt) {
                case 'begin_recording':
                    event_type = "Begun Recording";
                    event_time = "-";
                    minorEvent = false;
                    break;
                case 'end_recording':
                    event_type = "Ended Recording";
                    minorEvent = false;
                    break;
                case 'mousedown':
                    event_type = "Mouse Down";
                    event_data = "Began clicking at coordinates (" + events[i].evt_data.clientX + "," + events[i].evt_data.clientY + ")";
                    break;
                case 'mouseup':
                    event_type = "Mouse Up";
                    event_data = "Finished clicking at coordinates (" + events[i].evt_data.clientX + "," + events[i].evt_data.clientY + ")";
                    break;
                case 'click':
                    event_type = "Mouse Clicked";
                    event_data = "Clicked at coordinates (" + events[i].evt_data.clientX + "," + events[i].evt_data.clientY + ")";
                    minorEvent = false;
                    break;
                case 'keydown':
                    event_type = "Key Down";
                    break;
                case 'keyup':
                    event_type = "Key Up";
                    break;
                case 'keypress':
                    event_type = "Key Pressed";
                    break;
                case 'dataentry':
                    var escaped_value = events[i].evt_data.value.replace(/&/g, "&amp;")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;")
                        .replace(/"/g, "&quot;")
                        .replace(/'/g, "&#039;");
                    event_type = "Data Entry";
                    event_data = "Changed a &lt;" + events[i].evt_data.type + "&gt; element to the value \"" + escaped_value + "\"";
                    minorEvent = false;
                    break;
                case 'input':
                    var escaped_value = events[i].evt_data.value.replace(/&/g, "&amp;")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;")
                        .replace(/"/g, "&quot;")
                        .replace(/'/g, "&#039;");
                    event_type = "Data Input";
                    event_data = "Changed a &lt;" + events[i].evt_data.type + "&gt; element to the value \"" + escaped_value + "\"";
                    minorEvent = false;
                    break;
                case 'clipboard_copy':
                    var escaped_value = events[i].evt_data.value.replace(/&/g, "&amp;")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;")
                        .replace(/"/g, "&quot;")
                        .replace(/'/g, "&#039;");
                    event_type = "Clipboard Copy";
                    event_data = "Copied the text \"" + escaped_value + "\" to the clipboard";
                    break;
                case 'clipboard_cut':
                    var escaped_value = events[i].evt_data.value.replace(/&/g, "&amp;")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;")
                        .replace(/"/g, "&quot;")
                        .replace(/'/g, "&#039;");
                    event_type = "Clipboard Cut";
                    event_data = "Cut the text \"" + escaped_value + "\" to the clipboard";
                    break;
                case 'clipboard_paste':
                    var escaped_value = events[i].evt_data.value.replace(/&/g, "&amp;")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;")
                        .replace(/"/g, "&quot;")
                        .replace(/'/g, "&#039;");
                    event_type = "Clipboard Paste";
                    event_data = "Pasted the text \"" + escaped_value + "\" from the clipboard";
                    break;
                case 'submit':
                    event_type = "Form Submit";
                    minorEvent = false;
                    break;
                case 'tabchange':
                    event_type = "Changed Tabs";
                    if (events[i].evt_data.url=="chrome://newtab/")
                        event_type = "Opened New Tab";
                    minorEvent = false;
                    break;
                default:
                    var escaped_value = events[i].evt.replace(/&/g, "&amp;")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;")
                        .replace(/"/g, "&quot;")
                        .replace(/'/g, "&#039;");
                    event_type = "<i>" + escaped_value + "</i>";
            }

            //if (event_data.length>57)
            //    event_data = event_data.substr(0, 57) + "...";

            /* Event URL */
            var event_url = "&nbsp;";
            if (events[i].evt_data.url) {
                event_url = events[i].evt_data.url;
                if (event_url.length>57)
                    event_url = event_url.substr(0, 57) + "...";
            }

            var innerHTML = "<tr>" +
                "<td class=\"table-check\">" +
                "<div class=\"checkbox checkbox-only\">" +
                "<input type=\"checkbox\" id=\"event-" + i + "\" name=\"eventCheckboxes\">" +
                "<label for=\"event-" + i + "\"></label>" +
                "</div>" +
                "</td>" +
                "<td>" + event_type + "</td>" +
                "<td class=\"color-blue-grey-lighter\">" + event_data + "</td>" +
                "<td>";
            if (minorEvent)
                innerHTML += "<span class=\"label label-default\">Not Emulated</span>";
            else
                innerHTML += "<span class=\"label label-success\">Emulated</span>";
            innerHTML += "</td>" +
                "<td>" +
                "<div class=\"font-11 color-blue-grey-lighter uppercase\">Time</div> " +
                event_time +
                "</td>" +
                "<td>" +
                "<div class=\"font-11 color-blue-grey-lighter uppercase\">URL</div>" +
                event_url +
                "</td>" +
                "<td></td>" +
                "<td width=\"150\">";
            if (events[i].evt!="begin_recording" && events[i].evt!="end_recording")
                innerHTML += "<a href=\"#\" id=\"deleteEvent" + i + "\">Delete</a>";
            innerHTML += "</td>" +
                "</tr>";

            var eventNode = document.createElement("tr");
            eventNode.innerHTML = innerHTML;
            eventNode.id = "eventRow" + i;
            document.getElementById('events').appendChild(eventNode);

            if (events[i].evt!="begin_recording" && events[i].evt!="end_recording") {
                document.getElementById("deleteEvent" + i).onclick = function(e){
                    deleteEvent(e.target.id.replace("deleteEvent",""));
                }
            }
        }
    });
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

function runSimulation() {
    if (!simulating && events.length>2) {
        /*chrome.notifications.create("",{
            type: "basic",
            title: "Wildfire",
            message: "Simulation starting...",
            iconUrl: "icon-128.png"
        });*/

        simulating = true;
        chrome.windows.create({
            "url":"chrome-extension://" + chrome.runtime.id + "/new.html",
            "focused":true,
            "left":0,
            "top":0,
            "width":1920,
            "height":1080,
            "type":"popup" // https://bugs.chromium.org/p/chromium/issues/detail?id=459841
        },function(new_window) {
            chrome.windows.update(new_window.id,{
                state:"maximized"
            });

            var timeoutObject = setTimeout(function() {
                chrome.windows.remove(new_window.id, function(){});
                chrome.notifications.create("",{
                    type: "basic",
                    title: "Wildfire",
                    message: "Simulation timed out - shutting down simulation",
                    iconUrl: "icon-128.png"
                });
            }, 600000); // 10 minutes

            for (var i = 0; i < events.length; i++) {
                switch (events[i].evt) {
                    case 'begin_recording':
                        break;
                    case 'end_recording':
                        setTimeout(function(new_window, timeoutObject) {
                            clearTimeout(timeoutObject);

                            chrome.windows.remove(new_window.id,function(){});

                            chrome.notifications.create("",{
                                type: "basic",
                                title: "Wildfire",
                                message: "Simulation completed",
                                iconUrl: "icon-128.png"
                            });
                        }, events[i].time-recording_start_time, new_window, timeoutObject);
                        break;
                    case 'mousedown':
                        setTimeout(function(new_window, events, i) {
                            chrome.tabs.executeScript(new_window.tabs[0].id,{
                                code:"simulate(" +
                                constructElementIdentifier(events[i].evt_data.path) +
                                ",'mousedown', { clientX: " +
                                events[i].evt_data.clientX +
                                ", clientY: " +
                                events[i].evt_data.clientY +
                                " });"
                            });
                        }, events[i].time-recording_start_time, new_window, events, i);
                        break;
                    case 'mouseup':
                        setTimeout(function(new_window, events, i) {
                            chrome.tabs.executeScript(new_window.tabs[0].id,{
                                code:"simulate(" +
                                constructElementIdentifier(events[i].evt_data.path) +
                                ",'mouseup', { clientX: " +
                                events[i].evt_data.clientX +
                                ", clientY: " +
                                events[i].evt_data.clientY +
                                " });"
                            });
                        }, events[i].time-recording_start_time, new_window, events, i);
                        break;
                    case 'click':
                        setTimeout(function(new_window, events, i) {
                            chrome.tabs.executeScript(new_window.tabs[0].id,{
                                code:"simulate(" +
                                constructElementIdentifier(events[i].evt_data.path) +
                                ",'click', { clientX: " +
                                events[i].evt_data.clientX +
                                ", clientY: " +
                                events[i].evt_data.clientY +
                                " });"
                            });
                        }, events[i].time-recording_start_time, new_window, events, i);
                        break;
                    case 'keydown':
                        setTimeout(function(new_window, events, i) {
                            chrome.tabs.executeScript(new_window.tabs[0].id,{
                                code:"simulate(" +
                                constructElementIdentifier(events[i].evt_data.path) +
                                ",'keydown', { keyCode: " +
                                events[i].evt_data.keyCode +
                                " });"
                            });
                        }, events[i].time-recording_start_time, new_window, events, i);
                        break;
                    case 'keyup':
                        setTimeout(function(new_window, events, i) {
                            chrome.tabs.executeScript(new_window.tabs[0].id,{
                                code:"simulate(" +
                                constructElementIdentifier(events[i].evt_data.path) +
                                ",'keyup', { keyCode: " +
                                events[i].evt_data.keyCode +
                                " });"
                            });
                        }, events[i].time-recording_start_time, new_window, events, i);
                        break;
                    case 'keypress':
                        setTimeout(function(new_window, events, i) {
                            chrome.tabs.executeScript(new_window.tabs[0].id,{
                                code:"simulate(" +
                                constructElementIdentifier(events[i].evt_data.path) +
                                ",'keypress', { keyCode: " +
                                events[i].evt_data.keyCode +
                                " });"
                            });
                        }, events[i].time-recording_start_time, new_window, events, i);
                        break;
                    case 'submit':
                        setTimeout(function(new_window, events, i) {
                            chrome.tabs.executeScript(new_window.tabs[0].id,{
                                code:"simulate(" +
                                constructElementIdentifier(events[i].evt_data.path) +
                                ",'submit', {});"
                            });
                        }, events[i].time-recording_start_time, new_window, events, i);
                        break;
                    case 'dataentry':
                        setTimeout(function(new_window, events, i) {
                            chrome.tabs.executeScript(new_window.tabs[0].id,{
                                code: constructElementIdentifier(events[i].evt_data.path) +
                                ".value = '" + events[i].evt_data.value.replace("'", "\\'") + "';"
                            });
                        }, events[i].time-recording_start_time, new_window, events, i);
                        break;
                    case 'input':
                        setTimeout(function(new_window, events, i) {
                            chrome.tabs.executeScript(new_window.tabs[0].id,{
                                code: constructElementIdentifier(events[i].evt_data.path) +
                                ".value = '" + events[i].evt_data.value.replace("'", "\\'") + "';"
                            });
                        }, events[i].time-recording_start_time, new_window, events, i);
                        break;
                    case 'clipboard_cut':
                        setTimeout(function(new_window, events, i) {
                            chrome.tabs.executeScript(new_window.tabs[0].id,{
                                code: constructElementIdentifier(events[i].evt_data.path) +
                                ".value = '';"
                            });
                        }, events[i].time-recording_start_time, new_window, events, i);
                        break;
                    case 'tabchange':
                        setTimeout(function(events, i) {
                            chrome.tabs.update(new_window.tabs[0].id, {
                                url: events[i].evt_data.url
                            }, function(){});
                        }, events[i].time-recording_start_time, events, i);
                        break;
                    default:
                        console.log("Unknown event type: ".events[i].evt);
                }
            }
        });
        simulating = false;
    } else {
        if (events.length<3)
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

window.onload = function() {
    populateEvents();
    document.getElementById('simulateButton').addEventListener('click', function() {
        runSimulation();
    });
    document.getElementById('downloadEventfileButton').addEventListener('click', function() {
        downloadEventfile();
    });
    document.getElementById('downloadEventfileButton2').addEventListener('click', function() {
        downloadEventfile();
    });
    document.getElementById('importEventfileButton').addEventListener('click', function() {
        $('#eventfileContainer').click();
    });
    document.getElementById('eventfileContainer').addEventListener('change', function() {
        var reader = new FileReader();

        reader.onload = function(e) {
            var new_events = JSON.parse(e.target.result);
            chrome.storage.local.set({events: new_events});
            chrome.storage.local.set({recording: false});
            chrome.notifications.create("",{
                type: "basic",
                title: "Wildfire",
                message: "Eventfile Imported",
                iconUrl: "icon-128.png"
            });
        }

        var file = document.getElementById('eventfileContainer').files[0];
        reader.readAsText(file);
    });
}

chrome.storage.onChanged.addListener(function(changes, namespace) {
    populateEvents();
});

$('#table-check-head').click(function(e) {
    if (this.checked) {
        $('input[name=eventCheckboxes]').each(function() {
            this.checked = true;
        });
    } else {
        $('input[name=eventCheckboxes]').each(function() {
            this.checked = false;
        });
    }
});