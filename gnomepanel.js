const Lang = imports.lang;
const Main = imports.ui.main;

const GnomePanel = new Lang.Class({
	Name: 'GnomePanel',

	_init: function() {
		this._panel = Main.panel.actor
	},

	hidePanel: function() {
		this._panel.hide();
	},

	showPanel: function() {
		this._panel.show();
	}
});

