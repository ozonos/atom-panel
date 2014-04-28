/* Ozon Project 2014
 *
 * Extension version: 0.0.1
 *
 * 0.0.1 Changes:
 *  - Added GnomePanel class
 *  - Added makefile for easy installing
 *  - Rewrote readme
 *  - Fixed metadate.json
 *
 * TODO(s): 
 *  - write AtomPanel class
 *
 */

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const GnomePanel = Me.imports.gnomepanel;

let oldPanel;
let atomPanel;

function init() {
	oldPanel = new GnomePanel.GnomePanel();
}

function enable() {
	oldPanel.hidePanel();
}

function disable() {
	oldPanel.showPanel();
} 
