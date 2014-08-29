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

const Lang = imports.lang;
const Main = imports.ui.main;

let oldPanel;
let atomPanel;

function init() {
	_signalHandler = new Convenience.GlobalSignalHandler();
    _signalHandler.push(
        [
            Main.overview,
            'showing',
            Lang.bind(this, setTransparent)
        ],
        [
            Main.overview,
            'hiding',
            Lang.bind(this, setOpaque)
        ]
    );
}

function enable() {
	
}

function disable() {

} 

function setOpaque() {
    Main.panel.actor.add_style_pseudo_class('desktop');
}

function setTransparent() {
    Main.panel.actor.remove_style_pseudo_class('desktop');
}
