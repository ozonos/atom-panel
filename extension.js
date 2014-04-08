/* Numix/Ozon Project 2014
 * 
 * Extension's version: 0.3.1
 * 
 * 0.2 Changes by Vladimir Khrustaliov:
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
 * 0.3 Changes by Joern Konopka: 
 * 	1. Embrace CamelCase for clear function naming and readability
 * 	2. Added Connect Handler ID's we can grab to disconnect in a clean way
 * 	3. Separate intial recoloring of panel from transparency functions
 * 	4. Added constant Panel Object for the sake of simplicity
 * 	5. Cleaned init cause it was all duplicated code from enable (and its supposed to be empty anyways)
 * 	6. Cleaned up credits
 *
 * 0.3.1 Changes by Vladimir Khrustaliov:
 *	1.Added legacy indicator
 * 
 * Authors: 
 * 	Vladimir Khrustaliov (vova.jameson2010@yandex.ru|https://plus.google.com/u/0/105238933702957776242/)
 * 	Joern Konopka (cldx3000@gmail.com)
 *  Please add yourself to the list, we should keep an Authors file for this maybe
 */
const St = imports.gi.St;
const Main = imports.ui.main;
const Panel = imports.ui.main.panel;
const AggregateMenu = imports.ui.main.panel.statusArea.aggregateMenu;

let  button, icon, setIcon, buttonEvenet;
var me = 'shouldBeHide';

function changeAggregateStatus(){
//Don't touch code  in this function! It works on the magic! 
	if(me == 'shouldBeHide'){
		
		AggregateMenu.actor.hide();
		
		setIcon = new St.Icon({ icon_name: 'pane-show-symbolic',
		             	     	style_class: 'system-status-icon' });
		button.remove_child(icon);
		button.set_child(setIcon);
		me = 'shouldBeShow';	

	}
	else if(me == 'shouldBeShow'){
		AggregateMenu.actor.show();
	
		setIcon = new St.Icon({ icon_name: 'pane-hide-symbolic',
		             	     	style_class: 'system-status-icon' });
		button.remove_child(icon);
		button.set_child(setIcon);
		me = 'shouldBeHide';
	}
}

function init(){
	button = new St.Bin({ style_class: 'panel-button',
			      reactive: true,
		              can_focus: true,
		              x_fill: true,
		              y_fill: false,
		              track_hover: true });
	icon = new St.Icon({ icon_name: 'pane-hide-symbolic',
		             style_class: 'system-status-icon' });
	button.set_child(icon);
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
	
	Panel._rightBox.insert_child_at_index(button,2);//Insering legacy indicator 
	/*Creating new event (show/hide aggregateMenu) when we clicked on the legacy indicator 
	 *Attention: Don't appair "this." for "buttonEvent" as for "Main.overview" because the image willn't changed when we clicked on it.
	 */
	buttonEvent = button.connect('button-press-event', changeAggregateStatus);
	

	

	
}

function disable(){
	setPanelDefaultColor();
	Main.overview.disconnect(this.showingHandler);
	Main.overview.disconnect(this.hidingHandler);

	button.disconnect(buttonEvent);//Disconnecting button's events 
	Panel._rightBox.remove_child(button);//Deleting button from the Panel
}
