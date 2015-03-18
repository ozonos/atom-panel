/* Ozon Project 2015 
 * Extension's version: 0.4
 * -----------------------------------------------------------------------------
 * The basic functionality for the System Panel Legacy Icons Implementation
 * has been thankfully forked from:
 * https://extensions.gnome.org/extension/495/topicons/
 * originally written by Adel Gadllah <adel.gadllah@gmail.com>
 */

const Clutter = imports.gi.Clutter;
const Shell = imports.gi.Shell;
const St = imports.gi.St;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Lang = imports.lang;
const Main = imports.ui.main;
const PopupMenu = imports.ui.popupMenu;
const Panel = imports.ui.panel;
const PanelMenu = imports.ui.panelMenu;
const Meta = imports.gi.Meta;
const Mainloop = imports.mainloop;
const Signals = imports.signals;
const Tweener = imports.ui.tweener;
const NotificationDaemon = imports.ui.notificationDaemon;

let activitiesButtonActor;
let labelActor;
let iconActor;
let atomLegacyToggle;
let atomLegacyContainer;
let trayIconCount = 0;
let trayAddedId = 0;
let trayRemovedId = 0;
let getSource = null;
let icons = [];
let notificationDaemon;
let container = null;

const AtomLegacyContainer = new Lang.Class({
    Name: 'AtomLegacyContainer',
    Extends: PanelMenu.Button,

    _init: function() {
	this.parent(0.0, 'atom-legacy-container');
	this.open = true;

	this.container = new St.BoxLayout({ style_class: 'panel-status-indicators-box' });
	this.actor.add_actor(this.container);
    },
    toggle: function(){
	if(this.open){
	    this.hide();
        }else{ 
	    this.show();
	} 
    },
    hide: function(){
	this.open = false;
	this.container.hide();	
    },
    show: function(){
	this.open = true;
	this.container.show();
    }

});

const AtomLegacyToggle = new Lang.Class({
    Name: 'AtomLegacyToggle',
    Extends: PanelMenu.Button,

    _init: function() {
        this.parent(0.0, 'atom-legacy-toggle');
	this.open = true; 

	this.openIcon = new St.Icon({
            		icon_name: 'pan-start-symbolic',
	    		style_class: 'system-status-icon'
			});

	this.closeIcon = new St.Icon({
            		icon_name: 'pan-end-symbolic',
	    		style_class: 'system-status-icon'
			});

	this.actor.add_actor(this.closeIcon);
	this.actor.add_style_pseudo_class('small');
	
    },

    toggle: function(){
	if(this.open){
	    this.closeTray();
        }else{ 
	    this.openTray();
	} 
    },	

    openTray: function() {
	this.open = true;
	this.actor.remove_actor(this.openIcon);
	this.actor.add_actor(this.closeIcon);
    },

    closeTray: function(){
	this.open = false;
	this.actor.remove_actor(this.closeIcon);
	this.actor.add_actor(this.openIcon);
    }

});

function updateTrayVisibility(){
    // The Icons Array Size is unreliable, so we use a var 'trayIconCount' which 
    // gets updates via the notificationDaemon Signals

	if(trayIconCount != 0){
		atomLegacyToggle.actor.show();
		atomLegacyContainer.container.show();
		if(atomLegacyContainer.open){
			this.atomLegacyContainer.show();	
			this.atomLegacyToggle.openTray();			
		}else{
			this.atomLegacyContainer.hide();
			this.atomLegacyToggle.closeTray();		
		}				
	}else{
		this.atomLegacyContainer.container.hide();
		this.atomLegacyToggle.actor.hide();
	}
}

function getActivitiesButton(){

    // Find Activities button
    let leftBoxChildren = Main.panel._leftBox.get_children();
    let activitiesButton;
    for (let child in leftBoxChildren){
        if(leftBoxChildren[child].get_child_at_index(0).name == "panelActivities"){
            activitiesButton = leftBoxChildren[child].get_child_at_index(0);            
        }
    }
    return activitiesButton;
}

function createSource (title, pid, ndata, sender, trayIcon) { 
  if (trayIcon) {
    onTrayIconAdded(this, trayIcon, title);
    return null;
  }

  return getSource(title, pid, ndata, sender, trayIcon);
}

function onTrayIconAdded(o, icon, role) {
    let wmClass = icon.wm_class ? icon.wm_class.toLowerCase() : '';
    if (NotificationDaemon.STANDARD_TRAY_ICON_IMPLEMENTATIONS[wmClass] !== undefined)
        return;

    let buttonBox = new PanelMenu.ButtonBox();
    let box = buttonBox.actor;
    let parent = box.get_parent();

    let scaleFactor = St.ThemeContext.get_for_stage(global.stage).scale_factor;
    let iconSize = Panel.PANEL_ICON_SIZE * scaleFactor;

    icon.set_size(iconSize, iconSize);
    box.add_actor(icon);

    icon.reactive = true;

    if (parent)
        parent.remove_actor(box);

    icons.push(icon);
    container.add_actor(box);

    let clickProxy = new St.Bin({ width: iconSize, height: iconSize });
    clickProxy.reactive = true;
    Main.uiGroup.add_actor(clickProxy);

    icon._proxyAlloc = container.connect('allocation-changed', function() {
        Meta.later_add(Meta.LaterType.BEFORE_REDRAW, function() {
            let [x, y] = icon.get_transformed_position();
            clickProxy.set_position(x, y);
        });
    });

    icon.connect("destroy", function() {
        container.disconnect(icon._proxyAlloc);
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
}

function onTrayIconRemoved(o, icon) {
    let parent = icon.get_parent();
    parent.destroy();
    icon.destroy();
    icons.splice(icons.indexOf(icon), 1);
}

function moveToTop() {
    notificationDaemon._trayManager.disconnect(notificationDaemon._trayIconAddedId);
    notificationDaemon._trayManager.disconnect(notificationDaemon._trayIconRemovedId);
    trayAddedId = notificationDaemon._trayManager.connect('tray-icon-added', onTrayIconAdded);
    trayRemovedId = notificationDaemon._trayManager.connect('tray-icon-removed', onTrayIconRemoved);
    
    notificationDaemon._getSource = createSource;

    let toDestroy = [];
    if (notificationDaemon._sources) {
        for (let i = 0; i < notificationDaemon._sources.length; i++) {
            let source = notificationDaemon._sources[i];
            if (!source.trayIcon)
                continue;
            let parent = source.trayIcon.get_parent();
            parent.remove_actor(source.trayIcon);
            onTrayIconAdded(this, source.trayIcon, source.initialTitle);
            toDestroy.push(source);
        }
    }
    else {
        for (let i = 0; i < notificationDaemon._iconBox.get_n_children(); i++) {
            let button = notificationDaemon._iconBox.get_child_at_index(i);
            let icon = button.child;
            button.remove_actor(icon);
            onTrayIconAdded(this, icon, '');
            toDestroy.push(button);
        }
    }

    for (let i = 0; i < toDestroy.length; i++) {
        toDestroy[i].destroy();
    }
}

function moveToTray() {
    if (trayAddedId != 0) {
        notificationDaemon._trayManager.disconnect(trayAddedId);
        trayAddedId = 0;
    }

    if (trayRemovedId != 0) {
        notificationDaemon._trayManager.disconnect(trayRemovedId);
        trayRemovedId = 0;
    }
    
    notificationDaemon._trayIconAddedId = notificationDaemon._trayManager.connect('tray-icon-added',
                                                Lang.bind(notificationDaemon, notificationDaemon._onTrayIconAdded));
    notificationDaemon._trayIconRemovedId = notificationDaemon._trayManager.connect('tray-icon-removed',
                                                Lang.bind(notificationDaemon, notificationDaemon._onTrayIconRemoved));

    notificationDaemon._getSource = getSource;

    for (let i = 0; i < icons.length; i++) {
        let icon = icons[i];
        let parent = icon.get_parent();
        if (icon._clicked) {
            icon.disconnect(icon._clicked);
        }
        icon._clicked = undefined;
        if (icon._proxyAlloc) {
            Main.panel._rightBox.disconnect(icon._proxyAlloc);
        }
        icon._clickProxy.destroy();
        parent.remove_actor(icon);
        parent.destroy();
        notificationDaemon._onTrayIconAdded(notificationDaemon, icon);
    }
    
    icons = [];
}

function init(extensionMeta) {
	
    let theme = imports.gi.Gtk.IconTheme.get_default();
    theme.append_search_path(extensionMeta.path + "/icons");

    if (Main.legacyTray) {
        notificationDaemon = Main.legacyTray;
        NotificationDaemon.STANDARD_TRAY_ICON_IMPLEMENTATIONS = imports.ui.legacyTray.STANDARD_TRAY_ICON_IMPLEMENTATIONS;
    }
    else if (Main.notificationDaemon._fdoNotificationDaemon) {
        notificationDaemon = Main.notificationDaemon._fdoNotificationDaemon;
        getSource = Lang.bind(notificationDaemon, NotificationDaemon.FdoNotificationDaemon.prototype._getSource);
    }
    else {
        notificationDaemon = Main.notificationDaemon;
        getSource = Lang.bind(notificationDaemon, NotificationDaemon.NotificationDaemon.prototype._getSource);
    }

}

function enable() {

    atomLegacyToggle = new AtomLegacyToggle();
    atomLegacyContainer = new AtomLegacyContainer();
    Main.panel.addToStatusArea('Atom Legacy Icons Toggle', this.atomLegacyToggle);
    Main.panel.addToStatusArea('Atom Legacy Icons Container', this.atomLegacyContainer); 

	       
    // Replace Activities Label with Icon
    iconActor = new St.Icon({  icon_name: 'view-windows-symbolic',
					   style_class: 'system-status-icon' });

    activitiesButtonActor = getActivitiesButton();
    labelActor = activitiesButtonActor.label_actor;
    activitiesButtonActor.remove_actor(labelActor);
    activitiesButtonActor.add_actor(iconActor);


    atomLegacyToggle.actor.connect('button-release-event', Lang.bind(this, function() {
	atomLegacyToggle.toggle();
	atomLegacyContainer.toggle();
    }));

    notificationDaemon._trayManager.connect('tray-icon-added',  
	Lang.bind(this, function(){
            trayIconCount += 1;	
	    updateTrayVisibility();
	})
    );
    
    notificationDaemon._trayManager.connect('tray-icon-removed',
        Lang.bind(this, function(){
	    trayIconCount -= 1;				
	    updateTrayVisibility();
	})
    );
    
    container = atomLegacyContainer.container;	

    GLib.idle_add(GLib.PRIORITY_LOW, moveToTop);
    
    //Initially check if we need to show the Indicator
    updateTrayVisibility();
}

function disable() {
    
    activitiesButtonActor.remove_actor(iconActor);      
    activitiesButtonActor.add_actor(labelActor);
    activitiesButtonActor = null;
    labelActor = null;
    iconActor = null;
    
    moveToTray();	
    
    this.atomLegacyContainer.destroy();
    this.atomLegacyToggle.destroy();

}

