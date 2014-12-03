const Clutter = imports.gi.Clutter;
const Shell = imports.gi.Shell;
const St = imports.gi.St;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Lang = imports.lang;
const LayoutManager = imports.ui.main.layoutManager;
const Main = imports.ui.main;
const PopupMenu = imports.ui.popupMenu;
const Panel = imports.ui.panel;
const PanelMenu = imports.ui.panelMenu;
const Meta = imports.gi.Meta;
const Mainloop = imports.mainloop;
const NotificationDaemon = imports.ui.notificationDaemon;
const MessageTray = imports.ui.main.messageTray;

const SHELL_KEYBINDINGS_SCHEMA = 'org.gnome.shell.keybindings';

let _myDwell = 0;

const Indicator = new Lang.Class({
	Name: 'Indicator',
	Extends: PanelMenu.Button,

	_init: function(icon) {
		this.parent(0.0, 'atom-panel');

		this.actor.add_actor(new St.Icon({
			icon_name: icon,
			style_class: 'popup-menu-icon'
		}));
	}
});

function NotificationManager() {
	this._init();
}

NotificationManager.prototype = {
	_init: function () {
		this.trayAddedId = 0;
		this.trayRemovedId = 0;
		this.icons = [];

		if (Main.notificationDaemon._fdoNotificationDaemon) {
        	this.notificationDaemon = Main.notificationDaemon._fdoNotificationDaemon;
        	this.getSource = Lang.bind(this.notificationDaemon, NotificationDaemon.FdoNotificationDaemon.prototype._getSource);
    	} else {
        	this.notificationDaemon = Main.notificationDaemon;
        	this.getSource = Lang.bind(this.notificationDaemon, NotificationDaemon.NotificationDaemon.prototype._getSource);
    	}
	},

	onTrayIconAdded: function (o, icon, role) {
	    let wmClass = icon.wm_class ? icon.wm_class.toLowerCase() : '';
	    if (NotificationDaemon.STANDARD_TRAY_ICON_IMPLEMENTATIONS[wmClass] !== undefined)
	        return;

	    let buttonBox = new PanelMenu.Button();
	    let box = buttonBox.actor;
	    let parent = box.get_parent();

	    let scaleFactor = St.ThemeContext.get_for_stage(global.stage).scale_factor;
	    let iconSize = Panel.PANEL_ICON_SIZE * scaleFactor;

	    icon.set_size(iconSize, iconSize);
	    box.add_actor(icon);

	    icon.reactive = true;

	    if (parent)
	        parent.remove_actor(box);

	    this.icons.push(icon);
	    Main.panel._rightBox.insert_child_at_index(box, 0);

	    let clickProxy = new St.Bin({ width: iconSize, height: iconSize });
	    clickProxy.reactive = true;
	    Main.uiGroup.add_actor(clickProxy);

	    icon._proxyAlloc = Main.panel._rightBox.connect('allocation-changed', function() {
	        Meta.later_add(Meta.LaterType.BEFORE_REDRAW, function() {
	            let [x, y] = icon.get_transformed_position();
	            clickProxy.set_position(x, y);
	        });
	    });

	    icon.connect("destroy", function() {
	        Main.panel._rightBox.disconnect(icon._proxyAlloc);
	        clickProxy.destroy();
	    });

	    clickProxy.connect('button-release-event', function(actor, event) {
	        icon.click(event);
	    });

	    icon._clickProxy = clickProxy;

	    /* Fixme: HACK */
	    Meta.later_add(Meta.LaterType.BEFORE_REDRAW, function() {
	        let [x, y] = icon.get_transformed_position();
	        clickProxy.set_position(x, y);
	        return false;
	    });
	    let timerId = 0;
	    let i = 0;
	    timerId = Mainloop.timeout_add(500, function() {
	        icon.set_size(icon.width == iconSize ? iconSize - 1 : iconSize,
	                      icon.width == iconSize ? iconSize - 1 : iconSize);
	        i++;
	        if (i == 2)
	            Mainloop.source_remove(timerId);
	    });

		if (this.hidden)
			icon.get_parent().hide();
	},

	onTrayIconRemoved: function (o, icon) {
	    let parent = icon.get_parent();
	    parent.destroy();
	    icon.destroy();
	    this.icons.splice(this.icons.indexOf(icon), 1);
	},

	createSource: function (title, pid, ndata, sender, trayIcon) { 
	  if (trayIcon) {
	    this.onTrayIconAdded(this, trayIcon, title);
	    return null;
	  }

	  return this.getSource(title, pid, ndata, sender, trayIcon);
	},

	moveToTop: function () {
	    let _this = this;
		GLib.idle_add(GLib.PRIORITY_LOW, function () {
		_this.notificationDaemon._trayManager.disconnect(_this.notificationDaemon._trayIconAddedId);
	    _this.notificationDaemon._trayManager.disconnect(_this.notificationDaemon._trayIconRemovedId);
	    _this.trayAddedId = _this.notificationDaemon._trayManager.connect('tray-icon-added', _this.onTrayIconAdded);
	    _this.trayRemovedId = _this.notificationDaemon._trayManager.connect('tray-icon-removed', _this.onTrayIconRemoved);
	    
	    _this.notificationDaemon._getSource = _this.createSource;

	    let toDestroy = [];
	    for (let i = 0; i < _this.notificationDaemon._sources.length; i++) {
	        let source = _this.notificationDaemon._sources[i];
	        if (!source.trayIcon)
	            continue;
	        let parent = source.trayIcon.get_parent();
	        parent.remove_actor(source.trayIcon);
	        _this.onTrayIconAdded(this, source.trayIcon, source.initialTitle);
	        toDestroy.push(source);
	    }

	     for (let i = 0; i < toDestroy.length; i++) {
	        toDestroy[i].destroy();
	     }

		for (let i = 0; i < _this.icons.length; i++) {
			let icon = _this.icons[i];
			icon.get_parent().show()
		}
});
	},

	moveToTray: function () {
	    if (this.trayAddedId != 0) {
	        this.notificationDaemon._trayManager.disconnect(this.trayAddedId);
	        this.trayAddedId = 0;
	    }

	    if (this.trayRemovedId != 0) {
	        this.notificationDaemon._trayManager.disconnect(this.trayRemovedId);
	        this.trayRemovedId = 0;
	    }
	    
	    this.notificationDaemon._trayIconAddedId = this.notificationDaemon._trayManager.connect('tray-icon-added',
	                                                Lang.bind(this.notificationDaemon, this.notificationDaemon._onTrayIconAdded));
	    this.notificationDaemon._trayIconRemovedId = this.notificationDaemon._trayManager.connect('tray-icon-removed',
	                                                Lang.bind(this.notificationDaemon, this.notificationDaemon._onTrayIconRemoved));

	    this.notificationDaemon._getSource = this.getSource;

	    for (let i = 0; i < this.icons.length; i++) {
	        let icon = this.icons[i];
	        let parent = icon.get_parent();
	        if (icon._clicked) {
	            icon.disconnect(icon._clicked);
	        }
	        icon._clicked = undefined;
	        if (icon._proxyAlloc) {
	            Main.panel._rightBox.disconnect(icon._proxyAlloc);
	        }
	        icon._clickProxy.destroy();
		parent.hide();
	        this.notificationDaemon._onTrayIconAdded(this.notificationDaemon, icon);
	    }
	    
	    this.icons = [];
	}
}

function Extension() {
	this._init();
}

Extension.prototype = {
	_init: function() {
		this._indicators = [];
		this._statusArea = Main.panel.statusArea;
		this._notificationManager = new NotificationManager();
	},

	enable: function () {
		// Create a Indicator

		this._show = new Indicator('pane-show-symbolic');
		this._hide = new Indicator('pane-hide-symbolic');
		Main.panel.addToStatusArea('Atom Hide Legacy Icons', this._hide);
		Main.panel.addToStatusArea('Atom Show Legacy Icons', this._show);

		this._show.actor.show();
		this._hide.actor.hide();
		this._notificationManager.hidden = true;

		this._show.actor.connect('button-release-event', Lang.bind(this, function() {
		 	this._notificationManager.moveToTop();
			this._show.actor.hide();
			this._notificationManager.hidden = false;
			this._hide.actor.show();
		}));
		this._hide.actor.connect('button-release-event', Lang.bind(this, function() {
			this._notificationManager.moveToTray();
			this._hide.actor.hide();
			this._notificationManager.hidden = true;
			this._show.actor.show();
		}));

		this._disableMessageTray();

	},
	
	_disableMessageTray: function() {
		if("_trayPressure" in LayoutManager) {
			LayoutManager._trayPressure._keybindingMode =
			Shell.KeyBindingMode.NONE;
		}

		_myDwell = MessageTray._trayDwellTimeout;
		MessageTray._trayDwellTimeout = function() { return false; };
		Main.wm.removeKeybinding('toggle-message-tray');
		Main.wm.addKeybinding('toggle-message-tray',
					new Gio.Settings({ schema_id: SHELL_KEYBINDINGS_SCHEMA }),
					Meta.KeyBindingFlags.NONE,
					Shell.KeyBindingMode.NORMAL |
					Shell.KeyBindingMode.MESSAGE_TRAY |
					Shell.KeyBindingMode.OVERVIEW,
					Lang.bind(this, this._toggle));
	},

	disable: function () {
		this._notificationManager.moveToTray();
		this._show.destroy();
		this._hide.destroy();
		this._enableMessageTray();
	},

	_enableMessageTray: function () {

		if("_trayPressure" in LayoutManager) {
			LayoutManager._trayPressure._keybindingMode =
			Shell.KeyBindingMode.NORMAL | Shell.KeyBindingMode.OVERVIEW;
		}

		if(_myDwell) {
			MessageTray._trayDwellTimeout = _myDwell;
			_myDwell = 0;
		}

		Main.wm.removeKeybinding ('toggle-message-tray');
		Main.wm.addKeybinding ('toggle-message-tray',
					new Gio.Settings({ schema_id: SHELL_KEYBINDINGS_SCHEMA }),
					Meta.KeyBindingFlags.NONE,
					Shell.KeyBindingMode.NORMAL |
					Shell.KeyBindingMode.MESSAGE_TRAY |
					Shell.KeyBindingMode.OVERVIEW,
					Lang.bind(Main.messageTray, Main.messageTray.toggleAndNavigate));
	},
	
	_toggle: function () {
		if (this._notificationManager.hidden) {
		 	this._notificationManager.moveToTop();
			this._show.actor.hide();
			this._notificationManager.hidden = false;
			this._hide.actor.show();
		} else {
			this._notificationManager.moveToTray();
			this._hide.actor.hide();
			this._notificationManager.hidden = true;
			this._show.actor.show();
		}
	}
}

function init() {
	return new Extension();
}
