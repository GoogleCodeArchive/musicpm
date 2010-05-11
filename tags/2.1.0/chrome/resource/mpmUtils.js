/**
 * Music Player Minion Copyright 2008, Chris Seickel
 *
 * This program is free software; you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation; either version 2 of the License, or (at your option) any later
 * version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for more
 * details.
 *
 * You should have received a copy of the GNU General Public License along with
 * this program; if not, write to the Free Software Foundation, Inc., 51
 * Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.
 */
EXPORTED_SYMBOLS = ["Nz", "debug", "hmsFromSec", "prettyTime", "copyArray",
        "observerService", "getFileContents", "getAmazonArt", "SaveImageToURL", 
		"prefetchImageFromURL",  "fetch", "winw", "urlReplace", "openReuseByURL", 
		"openReuseByAttribute", "mpm_openDialog", "prefs", "guessTags", 
		"updateStatusBarPosition", "translateService", "mpmUtils_EXPORTED_SYMBOLS"]
var mpmUtils_EXPORTED_SYMBOLS = copyArray(EXPORTED_SYMBOLS)

var observerService = Components.classes["@mozilla.org/observer-service;1"]
        .getService(Components.interfaces.nsIObserverService);
var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
        .getService(Components.interfaces.nsIConsoleService);
var prefService = Components.classes["@mozilla.org/preferences-service;1"]
        .getService(Components.interfaces.nsIPrefService);
var branch = prefService.getBranch("extensions.mpm.");

var winw = Components.classes["@mozilla.org/embedcomp/window-watcher;1"]
        .getService(Components.interfaces.nsIWindowWatcher);

var translateService = Components.classes["@mozilla.org/intl/stringbundle;1"]
        .getService(Components.interfaces.nsIStringBundleService)
        .createBundle("chrome://minion/locale/strings.properties");

function getStringTime() {
	var today = new Date();
	var strDate = "";
	var t = 0;
	
	t = today.getHours();
	if ( t.toString().length == 1 ) strDate += '0';
	strDate += t +':';
	
	t = today.getMinutes();
	if ( t.toString().length == 1 ) strDate += '0';
	strDate += t +':';

	t = today.getSeconds();
	if ( t.toString().length == 1 ) strDate += '0';
	strDate += t +'.';
	
	t = today.getMilliseconds();
	if ( t.toString().length == 1 ) strDate += '00';
	if ( t.toString().length == 2 ) strDate += '0';
	strDate += t;
	
	return strDate;
}

function debug(s) {
	if ( prefs.get("debug", false) != true ) return;	
	try {
		var strDate = getStringTime();
		var f = 0;
		var str = "";
		if (s == null) s = "null passed to debug";
		if (typeof(s) == 'object') {
			for (x in s) {
				try {
					if ( f != 0 ) str += "\n             ";
					str += x + ': ' + s[x];
				} catch (e) {
					if ( f != 0 ) str += "\n             ";
					str += x + ': ERROR';
				}
				f=1;
			}
		} else if (typeof(str) == 'string') {
			var str = s;
		}
		if (typeof(str) == 'string' && str.length > 0) {
			dump(strDate + ' ' + str + "\n");
			//consoleService.logStringMessage(str)
		}
	} catch (e) {
		dump("error in debug!")
		dump(e);
		consoleService.logStringMessage("error in debug!")
	}
}

function Nz(obj, def) {
    if (typeof(obj) == 'undefined') {
        return (typeof(def) == 'undefined') ? null : def
    }
    return obj
}

function urlReplace (s, item) {   
	if (Nz(item.file)) item.Path = item.file.split("/").slice(0,-1).join("/");
	// debug(item);
	for (x in item) {
		var re = new RegExp("{"+x+"}","ig");
		s = s.replace(re, fixedEncodeURI(item[x]));
	}
	s = s.replace(/{[^}]+}/g,"");
	return s;
}

// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Global_Functions/encodeURIComponent
// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Global_Functions/encodeURI
function fixedEncodeURI (str) {
	return encodeURI(str).replace(/!/g, '%21').replace(/'/g, '%27')
								  .replace(/\(/g, '%28').replace(/\)/g, '%29')
								  .replace(/\*/g, '%2A').replace(/\@/g, '%40')
								  .replace(/&/g, '%26').replace(/#/g, '%23');
}

function getFileContents(aURL) {
    var ioService = Components.classes["@mozilla.org/network/io-service;1"]
            .getService(Components.interfaces.nsIIOService);
    var scriptableStream = Components.classes["@mozilla.org/scriptableinputstream;1"]
            .getService(Components.interfaces.nsIScriptableInputStream);

    var channel = ioService.newChannel(aURL, null, null);
    var input = channel.open();
    scriptableStream.init(input);
    var str = scriptableStream.read(input.available());
    scriptableStream.close();
    input.close();
    return str;
}

function hmsFromSec(sec) {
    var hms = "0:00"
    try {
        sec = parseInt(sec)
    } catch (err) {
        return "0:00"
    }
    if (sec > 0) {
        var h = 0
        if (sec >= 3600) {
            h = Math.floor(sec / 3600)
            sec = sec % 3600
        }
        var m = Math.floor(sec / 60)
        var s = sec % 60
        if (h > 0) {
            h = h + ":"
            if (m.toString().length == 1) {
                m = "0" + m
            }
        } else {
            h = ""
        }
        m = m + ":"
        if (s.toString().length == 1) {
            s = "0" + s
        }
        hms = h + m + s
    }
    return hms
}

function prettyTime(sec, round) {
	var tm = ""
	try {
		sec = parseInt(sec)
	} catch (err) {
		debug("prettyTime: " + err.description);
		sec = 0
	}
	if (sec > 0) {
		var d = Math.floor(sec / 86400)
		sec = sec % 86400
		var h = Math.floor(sec / 3600)
		sec = sec % 3600
		var m = Math.floor(sec / 60)
		var s = sec % 60
		var sep = ""

		if (d > 0) {
			if (d > 1) tm = d + " " + translateService.GetStringFromName("days");
			else tm = d + " " + translateService.GetStringFromName("day");
			sep = ", ";
		}

		if (h > 0) {
			tm += sep;
			if ( h > 1 ) {
				if (d > 0) tm += h + " " + translateService.GetStringFromName("hrs");
				else tm += h + " " + translateService.GetStringFromName("hours");
			} else {
				if (d > 0) tm += h + " " + translateService.GetStringFromName("hr");
				else tm += h + " " + translateService.GetStringFromName("hour");
			}
			sep = ", ";
		}

		if (m > 0) {
			tm += sep;
			if ( m > 1 ) {
				if (d > 0) tm += m + " " + translateService.GetStringFromName("mins");
				else tm += m + " " + translateService.GetStringFromName("minutes");
			} else {
				if (d > 0) tm += m + " " + translateService.GetStringFromName("min");
				else tm += m + " " + translateService.GetStringFromName("minute");
			}
			sep = ", ";
		}

		if (!Nz(round) && s > 0) {
			tm += sep;
			if ( s > 1 ) {
			if (d > 0) tm += s + " " + translateService.GetStringFromName("secs");
			else tm += s + " " + translateService.GetStringFromName("seconds");
			} else {
				if (d > 0) tm += s + " " + translateService.GetStringFromName("sec");
				else tm += s + " " + translateService.GetStringFromName("second");
			}
		}
	}
	return tm
}

function copyArray(oldArray) {
    if (typeof(oldArray) == 'object') {
        var l = oldArray.length
        var n = l
        var newArray = []
        if (l > 0) {
            do {
                newArray.push(oldArray[l - n])
            } while (--n)
        }
        return newArray
    } else
        return oldArray
}

function getAmazonArt(mpd, item, img) {
	var art = "chrome://minion/content/images/album_blank.png";
	var search_url = urlReplace(
					"http://musicbrainz.org/ws/1/release/?type=xml&artist={Artist}&title={Album}&limit=1",
					item);
	if ( typeof(item.Album) != 'string' || typeof(item.Artist) != 'string' 
			|| item.Album == "" || item.Artist == "") {
		debug("Not enough info for search...")
		img.src = 'chrome://minion/content/images/album_blank_no_info.png';
		img.setAttribute("tooltiptext",translateService.GetStringFromName("track_no_info"));	
	} else {
		debug("searching Metabrainz...")
		if (typeof(mpd.cachedArt[search_url]) == 'string') {
			img.src = mpd.cachedArt[search_url];
			img.setAttribute("tooltiptext",mpd.cachedArt[search_url]);
		} else {
			var cb = function(data) {
				try {
					var asin = "";
					if (data != "") {
						var s = data.indexOf("<asin>") + 6;
						if (s > 6) {
							var e = data.indexOf("</asin>", s);
							if (e > 0) {
								asin = data.slice(s, e);
							}
							if (asin.length == 10 && asin != '          ') {
								base = "http://images.amazon.com/images/P/" + asin;
								art = base + ".01.MZZZZZZZ.jpg";
							}
						}
					}
					debug('applying art='+art);
					mpd.cachedArt[search_url] = art;
					img.src = art;
					img.setAttribute("tooltiptext",art);
					SaveImageToURL(item,art);
				} catch (e) {
					debug(e);
				}
			};
			fetch(search_url, cb);
		}
	}
}

function SaveImageToURL(item,url) {
	try {
		debug('SaveImageToURL url=');
		debug(url);
		// we want to reject dummy requests
		var txt = new String(url);
		if (txt.indexOf('chrome://') == 0) return;

		// unless specified, we don't save arts
		if ( parseInt(prefs.get("use_amazon_art",1)) != 2 ) {
			return;
		}
		
		// the source object we want to download
		var oSourceURL = Components.classes["@mozilla.org/network/io-service;1"]
			.getService(Components.interfaces.nsIIOService)
			.newURI(url, null, null);
		
		// if file:// we want to probe if it already exists
		var oTargetFile = Components.classes["@mozilla.org/file/local;1"]
			.createInstance(Components.interfaces.nsILocalFile);
		// use to create the destination object
		var ioService = Components.classes["@mozilla.org/network/io-service;1"]
			.getService(Components.interfaces.nsIIOService);
		
		var sTargetFile = urlReplace(prefs.get("save_art_url"), item);
		var oDestination = ioService.newURI(sTargetFile,null,null);

		debug("Attempt to download url: "+url);
		debug("Attempt to save to file: "+sTargetFile);

		// Probe if the file already exists
		if ( oDestination.scheme == 'file://' ) {		
			oTargetFile.initWithPath(oDestination.path);		
			if(oTargetFile.exists()) {
				deubg("File already exists");
				return;
			} else {
				oTargetFile.create(0x00,0640);
			}
		}

		// create a persist
		var persist = Components.classes["@mozilla.org/embedding/browser/nsWebBrowserPersist;1"].
			createInstance(Components.interfaces.nsIWebBrowserPersist);

		// with persist flags if desired See nsIWebBrowserPersist page for more PERSIST_FLAGS.
		const nsIWBP = Components.interfaces.nsIWebBrowserPersist;
		// const flags = nsIWBP.PERSIST_FLAGS_REPLACE_EXISTING_FILES;
		const flags = nsIWBP.PERSIST_FLAGS_NONE;
		persist.persistFlags = flags | nsIWBP.PERSIST_FLAGS_FROM_CACHE;

		// do the save
		persist.saveURI(oSourceURL, null, null, null, null, oDestination);

	} catch(e) { 
		debug(e); 
	}
}

function prefetchImageFromURL(url, callBack, arg) {
	try {
		debug('Prefetch requested');
		var imgRequest = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"]
						.createInstance();
		imgRequest.QueryInterface(Components.interfaces.nsIDOMEventTarget);
		imgRequest.QueryInterface(Components.interfaces.nsIXMLHttpRequest);

		imgRequest.open("POST", url, true);
		imgRequest.onreadystatechange = function() {
			if (imgRequest.readyState == 4) {
				imgRequest.onreadystatechange = null;
				var status = imgRequest.status;
				imgRequest = null;
				callBack(status, arg, url);
			}
		};
		imgRequest.send("q="+(Math.random()*10000));
	} catch (e) { 
		// exception was raised, so we fallback to amazon if possible
		// debug(e);
		callBack(404, arg, url);
	}
}

function fetch(url, callBack, arg, getXML) {
    try {
        var request = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"]
                .createInstance();
        request.QueryInterface(Components.interfaces.nsIDOMEventTarget);
        request.QueryInterface(Components.interfaces.nsIXMLHttpRequest);

        request.open("GET", url, true)
        request.onreadystatechange = function() {
            if (request.readyState == 4) {
                if (request.status == 200 || request.status == 0) {
                    if (Nz(getXML)) {
                        callBack(request.responseXML, arg, request)
                    } else {
                        callBack(request.responseText, arg, request)
                    }
                    request.onreadystatechange = null
                    request = null
                } else {
					debug(request.status+": "+url)
                    request.onreadystatechange = null
                    request = null
                }
            }
        }
        request.send("")
    } catch (e) {
        debug(e)
    }
}

function mpm_openDialog(url, id) {
    var features = "chrome,dialog=yes,resizable=yes"
    if (id=="settings") features += ",titlebar,toolbar"
    var win = winw.openWindow(winw.activeWindow, url, Nz(id, url),
            features, null);
}

function openReuseByURL(url) {
	var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
			.getService(Components.interfaces.nsIWindowMediator);
	var browserEnumerator = wm.getEnumerator("navigator:browser");
	// Check each browser instance for our URL
	var found = false;
	try {
		while (!found && browserEnumerator.hasMoreElements()) {
			var browser = browserEnumerator.getNext();
			var browserInstance = browser.getBrowser();

			// Check each tab of this browser instance
			var numTabs = browserInstance.tabContainer.childNodes.length;
			for (var index = 0; index < numTabs; index++) {
				var currentBrowser = browserInstance.getBrowserAtIndex(index);
				if (url == currentBrowser.currentURI.spec) {
					// The URL is already opened. Select this tab.
					browserInstance.selectedTab = browserInstance.tabContainer.childNodes[index];
					// Focus *this* browser
					browser.focus();
					browserInstance.focus();
					debug("browser already in tab");
					// wrapped is compulsory otherwise we can't right click on the statusbar
					// to display album details and perform queries.
					var win = currentBrowser.contentWindow.wrappedJSObject;
					found = true;
					break;
				}
			}
		}
		if (!found) {
			var openInTab = prefs.get("launch_in_browser", false);
			var recent = (openInTab) ? wm.getMostRecentWindow("navigator:browser") : false;
			if (recent) {
				recent.focus();
				browserInstance = recent.getBrowser();
				browserInstance.selectedTab = browserInstance.addTab(url);
				browserInstance.focus();
				var currentBrowser = browserInstance.getBrowserForTab(browserInstance.selectedTab);
				// wrapped is compulsory otherwise we can't right click on the statusbar
				// to display album details and perform queries.
				var win = currentBrowser.contentWindow.wrappedJSObject;
			} else {
				var win = winw.getWindowByName(url, null);
				if (!win) win = winw.openWindow(null, url, url, null, null);
				win.focus();
			}
		}
		return win;
	} catch (e) {
		debug(e);
	}
}

function openReuseByAttribute(url, attrName) {
    var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
            .getService(Components.interfaces.nsIWindowMediator);
    attrName = Nz(attrName, 'mpm-unknown-tab')
    try {
        for (var found = false, index = 0, browserInstance = wm
                .getEnumerator('navigator:browser').getNext().getBrowser(); index < browserInstance.mTabContainer.childNodes.length
                && !found; index++) {
            var currentTab = browserInstance.mTabContainer.childNodes[index];
            if (currentTab.hasAttribute(attrName)) {
                browserInstance.selectedTab = currentTab;
                browserInstance.focus();
                found = true;
            }
        }
        if (!found) {
            var browserEnumerator = wm.getEnumerator("navigator:browser");
            var browserInstance = browserEnumerator.getNext().getBrowser();
            var newTab = browserInstance.addTab(url);
            newTab.setAttribute(attrName, "xyz");
            browserInstance.selectedTab = newTab;
            browserInstance.focus();
        }
    } catch (e) {
        winw.openWindow(null, url, attrName, null, null)
    }
}

function prefObserver (prefName, changeAction) {
    this.action = changeAction
    this.register = function(){
        this._branch = branch;
        this._branch.QueryInterface(Components.interfaces.nsIPrefBranchInternal);
        this._branch.addObserver("", this, false);
    },

    this.unregister = function(){
        if (!this._branch)
            return;
        this._branch.removeObserver("", this);
    },

    this.observe = function(aSubject, aTopic, aData){
        if (aTopic != "nsPref:changed")
            return;
        // aSubject is the nsIPrefBranch we're observing (after appropriate QI)
        // aData is the name of the pref that's been changed (relative to aSubject)
        if (aData == prefName) this.action()
    }
};
var prefs = {
	branch : branch,
	service : prefService,
	get : function(strPref, def) {
		try{
			switch (branch.getPrefType(strPref)) {
				case branch.PREF_STRING :
					return branch.getCharPref(strPref);
				case branch.PREF_INT :
					return branch.getIntPref(strPref);
				case branch.PREF_BOOL :
					return branch.getBoolPref(strPref);
				default :
					def = Nz(def)
					prefs.set(strPref, def);
					return def;
			}
		} catch(e){ debug(e);}
	},
	isPref : function (strPref) {
		try {
			if ( !strPref ) return false;
			if ( branch.getPrefType(strPref) != branch.PREF_INVALID ) return true;
			return false;
		} catch(e) { 
			debug(e);
			return false; 
		}
	},
    getObserver : function (prefName, prefAction) {
        var po = new prefObserver(prefName, prefAction)
        po.register()
        return po
    },
	clear : function(strPref) {
		try {
			branch.clearUserPref(strPref);
		} catch(e) { return; }
	},
    set : function(strPref, val) {
        switch (branch.getPrefType(strPref)) {
            case branch.PREF_STRING :
                branch.setCharPref(strPref, val);
                break;
            case branch.PREF_INT :
                branch.setIntPref(strPref, val);
                break;
            case branch.PREF_BOOL :
                branch.setBoolPref(strPref, val);
                break;
            default :
                if (typeof(val) != 'undefined') {
                    switch (typeof(val)) {
                        case 'string' :
                            branch.setCharPref(strPref, val);
                            break;
                        case 'number' :
                            branch.setIntPref(strPref, val);
                            break;
                        case 'boolean' :
                            branch.setBoolPref(strPref, val);
                            break;
                        default :
                            branch.setCharPref(strPref, val.toSource());
                            break;
                    }
                }
        }
    }
}

function guessTags(song) {
    _artist = ""
    _album = ""
    _title = ""
    _track = ""
	track = Nz(song.Track, "")
	title = Nz(song.Title, "")
	artist = Nz(song.Artist, "")
	album = Nz(song.Album, "")
	try {
		myfile = song.file.match(/[^\/]+$/)[0].replace(/\.[a-zA-Z0-9]+$/, "")
		_title = myfile
		myfile = myfile.replace(/\(.*\)/g, "").replace(/_/g, " ")
		s = myfile.split("-")
		l = s.length
		
		for (var i=0;i<l;i++) {
			if (/^[0-9\.\/\s]+$/.test(s[i])) {
				_track = s.splice(i,1)
				if (typeof(_track) == 'string')
					_track = _track.replace(/^\s\s*/, '').replace(/\s\s*$/, '')
				break
			}
		}

		if (s.length > 0) _title = s.pop()
		if (s.length > 0) _artist = s.shift()
		if (s.length > 0) _album = s.join("-")
		
		if (track == "") song.Track = _track
		if (title == "") song.Title = _title.replace(/^\s\s*/, '').replace(/\s\s*$/, '')
		if (artist == "") song.Artist = _artist.replace(/^\s\s*/, '').replace(/\s\s*$/, '')
		if (album == "") song.Album = _album.replace(/^\s\s*/, '').replace(/\s\s*$/, '')
	} catch (e) {debug(e)}
	return song
}

function updateStatusBarPosition(doc) {
    var index = prefs.get("statusbar_position", 0);
    if (index <= 0) return;
    debug('status-bar index: '+index);	
    try
    {
        var statusBar = doc.getElementById("status-bar");
        var children = statusBar.childNodes;

        var statusbarItem = doc.getElementById("mpm_status-bar_controls");

        var newStatusbarItem = statusBar.removeChild(statusbarItem);

        if ((children.length == 0) || (index >= children.length)){
            statusBar.appendChild(newStatusbarItem);
        } else {
            statusBar.insertBefore(newStatusbarItem, children[index-1]);
        }
    } catch(e) {
        debug(e);
        debug('doc/document:');
		debug(doc);
    }
}

/**
 * Displays a file picker in which the user can choose the location where
 * downloads are automatically saved, updating preferences and UI in
 * response to the choice, if one is made.
 */
function chooseFolder(prefName)
{
	try {
		const nsIFilePicker = Components.interfaces.nsIFilePicker;
		const nsILocalFile = Components.interfaces.nsILocalFile;

		var fp = Components.classes["@mozilla.org/filepicker;1"]
			   .createInstance(nsIFilePicker);
		var dnldMgr = Components.classes["@mozilla.org/download-manager;1"]
					.getService(Components.interfaces.nsIDownloadManager);

		var title = "My title";
		fp.init(window, title, nsIFilePicker.modeGetFolder);
		fp.appendFilters(nsIFilePicker.filterAll);

		fp.displayDirectory = dnldMgr.defaultDownloadsDirectory;

		if (fp.show() == nsIFilePicker.returnOK) {
			if ( typeof(prefName) != 'string' ) { debug('invalid prefName'); return; }
			if ( prefName.length < 1 ) { debug('invalid prefName'); return; }
			var forderPref = document.getElementById(prefName);
			var file = fp.fileURL;
			forderPref.value = file.spec;
		}
	} catch(e) { debug(e); }
}

// update the UI from the prefs at load time
function updateCustomArtInterfacePref() {
	try {
		var use_customPref = document.getElementById("use_custom");
		var tbCoverUrl = document.getElementById("tbCoverUrl");
		var btnBrowse = document.getElementById("btnCustomBrowseLocalFile");
		
		if ( use_customPref.value == true ) {
			tbCoverUrl.disabled = false;
			btnBrowse.disabled = false;
		} else {
			tbCoverUrl.disabled = true;
			btnBrowse.disabled = true;
		}
	} catch(e) { debug(e); }
}

// update the UI on user click
function updateCustomArtInterface() {
	try {
		var cbUseCustom = document.getElementById("cbUseCustom");
		var tbCoverUrl = document.getElementById("tbCoverUrl");
		var btnBrowse = document.getElementById("btnCustomBrowseLocalFile");
				
		if ( cbUseCustom.checked == true ) {
			tbCoverUrl.disabled = false;
			btnBrowse.disabled = false;
		} else {
			tbCoverUrl.disabled = true;
			btnBrowse.disabled = true;
		}
	} catch(e) { debug(e); }
}

function updateAmazonInterfacePref() {
	try {
		var use_amazonPref = document.getElementById("use_amazon");
		var tbSaveCoverUrl = document.getElementById("tbSaveCoverUrl");
		var btnBrowse = document.getElementById("btnAmazonBrowseLocalFile");

		if ( use_amazonPref.value == 2 ) {
			tbSaveCoverUrl.disabled = false;
			btnBrowse.disabled = false;
		} else {
			tbSaveCoverUrl.disabled = true;
			btnBrowse.disabled = true;
		}
	} catch(e) { debug(e); }
}
function updateAmazonInterface() {
	try {
		var rgUseAmazon = document.getElementById("rgUseAmazon");
		var tbSaveCoverUrl = document.getElementById("tbSaveCoverUrl");
		var btnBrowse = document.getElementById("btnAmazonBrowseLocalFile");
				
		if ( rgUseAmazon.value == 2 ) {
			tbSaveCoverUrl.disabled = false;
			btnBrowse.disabled = false;
		} else {
			tbSaveCoverUrl.disabled = true;
			btnBrowse.disabled = true;
		}
	} catch(e) { debug(e); }
}