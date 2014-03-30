/* Numix/Ozon Project 2014
 * 
 * Extension's version: 0.3
 * 
 * 0.2 Changes:
 * 	1.Code has been simplified.
 * 	2.Fixed bug with on / off extensions in gnome-tweak-tool.
 * 	3.It is evident that css-file is not loaded in the code.
 * 		However, GNOME will connect automatically.
 * 		Almost all design changes occur in the file stylesheet.css. 
 * 		In any case DO NOT load css-files via js - script. 
 * 		Otherwise, the extension will not turn off after gnome-tweak-tool.
 * 	4.Images folder has been deleted.
 * 	5.Css-file has been simplified compared to the previous.
 * 
 * 0.3 Changes: 
 * 	1. Embrace CamelCase for clear function naming and readability
 * 	2. Added Connect Handler ID's we can grab to disconnect in a clean way
 * 	3. Separate intial recoloring of panel from transparency functions
 * 	4. Added constant Panel Object for the sake of simplicity
 * 	5. Cleaned init cause it was all duplicated code from enable (and its supposed to be empty anyways)
 * 	6. Cleaned up credits
 * 
 * Authors: 
 * 	Vladimir Khrustaliov (vova.jameson2010@yandex.ru|https://plus.google.com/u/0/105238933702957776242/)
 * 	Joern Konopka (cldx3000@gmail.com)
 *  Please add yourseld to the list, we should keep an Authors file for this maybe
 */

const Main = imports.ui.main;
const Panel = imports.ui.main.panel;


function init(){
	/*  do nothing  */
}

function setPanelTransparent(){
	Panel.actor.set_style('background-color: rgba(0,0,0,0)');
}

function unsetPanelTransparent(){
	Panel.actor.set_style('background-color: #2d2d2d');
}

function setPanelSolidColor(){
	Panel.actor.set_style('background-color: #2d2d2d');
}

function setPanelDefaultColor(){
	Panel.actor.set_style('background-color: black');
}

function enable(){ 
	setPanelSolidColor();
	this.showingHandler = Main.overview.connect('showing', setPanelTransparent);
	this.hidingHandler = Main.overview.connect('hiding', unsetPanelTransparent);
}

function disable(){
	setPanelDefaultColor();
	Main.overview.disconnect(this.showingHandler);
	Main.overview.disconnect(this.hidingHandler);
}

