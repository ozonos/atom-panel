// -*- mode: js; js-indent-level: 4; indent-tabs-mode: nil -*-
/*jshint esnext: true */
/*jshint indent: 4 */

const GLib = imports.gi.GLib;
const Meta = imports.gi.Meta;
const Shell = imports.gi.Shell;
const St = imports.gi.St;
const Lang = imports.lang;
const Mainloop = imports.mainloop;

const Main = imports.ui.main;
const NotificationDaemon = imports.ui.notificationDaemon;
const Panel = imports.ui.panel;
const PanelMenu = imports.ui.panelMenu;
const Tweener = imports.ui.tweener;

const SHOW_ICON_NAME = 'pane-show-symbolic';
const HIDE_ICON_NAME = 'pane-hide-symbolic';

const Indicator = new Lang.Class({
    Name: 'AtomPanelIndicator',
    Extends: PanelMenu.Button,

    _init: function() {
        this.parent(null, 'atomPanelIndicator');
        this._trayArea = new AtomPanelTrayArea(this);

        this._notificationManager = new NotificationManager(this._trayArea);
        this._notificationManager.moveToTop();

        this._toggleIcon = new St.Icon({
            icon_name: SHOW_ICON_NAME,
            style_class: 'system-status-icon'
        });
        this.actor.add_actor(this._toggleIcon);
        this.actor.connect('button-release-event', Lang.bind(this, function() {
            if (!this._trayArea.showing && !this._trayArea.hiding) {
                if (this._trayArea._visible) {
                    this._trayArea._hide();
                    this._toggleIcon.icon_name = SHOW_ICON_NAME;
                } else {
                    this._trayArea._show();
                    this._toggleIcon.icon_name = HIDE_ICON_NAME;
                }
            }
        }));

        Main.uiGroup.add_actor(this._trayArea);
    },

    destroy: function() {
        this._notificationManager.moveToTray();
        Main.uiGroup.remove_actor(this._trayArea);
        this.parent();
    }
});

const AtomPanelTrayArea = new Lang.Class({
    Name: 'AtomPanelTrayArea',
    Extends: St.BoxLayout,

    _init: function(delegate) {
        this.parent({ name: 'atomPanelTrayArea' });
        this._delegate = delegate;
        this.set_opacity(0);
        this._visible = true;
        this.showing = this.hiding = false;

        this._delegate.actor.connect('allocation-changed', Lang.bind(this, function() {
            this._resetPosition();
        }));
        this.connect('allocation-changed', Lang.bind(this, function() {
            this._resetPosition();
        }));
    },

    _show: function() {
        this.set_position(this._delegatePosX, 0);
        Tweener.addTween(this,
            { x: this._delegatePosX - this.width,
              opacity: 255,
              time: 0.2,
              transition: 'easeOutQuad',
              onStart: Lang.bind(this, function() {
                this.showing = true;
              }),
              onComplete: Lang.bind(this, function() {
                this.showing = false;
                this._visible = true;
              }) 
            });
    },

    _hide: function() {
        Tweener.addTween(this,
            { x: this._delegatePosX,
              opacity: 0,
              time: 0.2,
              transition: 'easeOutQuad',
              onStart: Lang.bind(this, function() {
                this.hiding = true;
              }),
              onComplete: Lang.bind(this, function() {
                this.hiding = false;
                this._visible = false;
              })
            });
    },

    _resetPosition: function() {
        if (!this.showing && !this.hiding) {
            this._delegatePosX = Math.floor(this._delegate.actor.get_transformed_position()[0]);
            this.set_height(this._delegate.actor.get_height());
            this.set_position(this._delegatePosX - this.width, 0);
        }
    }
});

const NotificationManager = new Lang.Class({
    Name: 'NotificationManager',

    _init: function(trayArea) {
        this._trayArea = trayArea;
        this._icons = [];
        this._trayAddedId = 0;
        this._trayRemovedId = 0;

        if (Main.notificationDaemon._fdoNotificationDaemon) {
            this._notificationDaemon = Main.notificationDaemon._fdoNotificationDaemon;
            this._getSource = Lang.bind(this._notificationDaemon, NotificationDaemon.FdoNotificationDaemon.prototype._getSource);
        } else {
            this._notificationDaemon = Main.notificationDaemon;
            this._getSource = Lang.bind(this._notificationDaemon, NotificationDaemon.NotificationDaemon.prototype._getSource);
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

        this._icons.push(icon);
        this._trayArea.add_child(box);

        let clickProxy = new St.Bin({
                                width: box.width,
                                height: box.height,
                                track_hover: true,
                                reactive: true 
                            });
        Main.uiGroup.add_actor(clickProxy);

        icon._proxyAlloc = this._trayArea.connect('allocation-changed', function() {
            Meta.later_add(Meta.LaterType.BEFORE_REDRAW, function() {
                let [x, y] = box.get_transformed_position();
                clickProxy.set_position(x, y);
            });
        });

        icon.connect('destroy', Lang.bind(this, function() {
            this._trayArea.disconnect(icon._proxyAlloc);
            clickProxy.destroy();
        }));

        clickProxy.connect('notify::hover', Lang.bind(this, function() {
            if (clickProxy.hover) {
                box.set_hover(true);
            } else {
                box.sync_hover();
            }
        }));

        clickProxy.connect('button-release-event', function(actor, event) {
            if (icon.get_parent().get_parent().get_opacity() == 255) {
                icon.click(event);
            }
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
    },

    onTrayIconRemoved: function (o, icon) {
        let parent = icon.get_parent();
        parent.destroy();
        icon.destroy();
        this._icons.splice(this._icons.indexOf(icon), 1);
    },

    createSource: function (title, pid, ndata, sender, trayIcon) { 
        if (trayIcon) {
            this.onTrayIconAdded(this, trayIcon, title);
            return null;
        }

        return this._getSource(title, pid, ndata, sender, trayIcon);
    },

    moveToTop: function () {
        GLib.idle_add(GLib.PRIORITY_LOW, Lang.bind(this, function () {
            this._notificationDaemon._trayManager.disconnect(this._notificationDaemon._trayIconAddedId);
            this._notificationDaemon._trayManager.disconnect(this._notificationDaemon._trayIconRemovedId);
            this._trayAddedId = this._notificationDaemon._trayManager.connect('tray-icon-added', Lang.bind(this, this.onTrayIconAdded));
            this._trayRemovedId = this._notificationDaemon._trayManager.connect('tray-icon-removed', Lang.bind(this, this.onTrayIconRemoved));

            this._notificationDaemon._getSource = this.createSource;

            let toDestroy = [];
            for (let i = 0; i < this._notificationDaemon._sources.length; i++) {
                let source = this._notificationDaemon._sources[i];
                if (!source.trayIcon)
                    continue;
                let parent = source.trayIcon.get_parent();
                parent.remove_actor(source.trayIcon);
                this.onTrayIconAdded(this, source.trayIcon, source.initialTitle);
                toDestroy.push(source);
            }

            for (let i = 0; i < toDestroy.length; i++) {
                toDestroy[i].destroy();
            }

            for (let i = 0; i < this._icons.length; i++) {
                let icon = this._icons[i];
                icon.get_parent().show()
            }
        }));
    },

    moveToTray: function () {
        if (this._trayAddedId != 0) {
            this._notificationDaemon._trayManager.disconnect(this._trayAddedId);
            this._trayAddedId = 0;
        }

        if (this._trayRemovedId != 0) {
            this._notificationDaemon._trayManager.disconnect(this._trayRemovedId);
            this._trayRemovedId = 0;
        }

        this._notificationDaemon._trayIconAddedId = this._notificationDaemon._trayManager.connect('tray-icon-added',
            Lang.bind(this._notificationDaemon, this._notificationDaemon._onTrayIconAdded));
        this._notificationDaemon._trayIconRemovedId = this._notificationDaemon._trayManager.connect('tray-icon-removed',
            Lang.bind(this._notificationDaemon, this._notificationDaemon._onTrayIconRemoved));

        this._notificationDaemon._getSource = this._getSource;

        for (let i = 0; i < this._icons.length; i++) {
            let icon = this._icons[i];
            let parent = icon.get_parent();
            if (icon._clicked) {
                icon.disconnect(icon._clicked);
            }
            icon._clicked = undefined;
            if (icon._proxyAlloc) {
                this._trayArea.disconnect(icon._proxyAlloc);
            }
            icon._clickProxy.destroy();
            parent.hide();
            this._notificationDaemon._onTrayIconAdded(this._notificationDaemon, icon);
        }

        this._icons = [];
    }
});
