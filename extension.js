/*
 * Release Notes: 
Description of Revision: This panel was developed by Vladimir Khrustaliov for the Numix Project,but is not ended.
Extension's version: 0.2;
Recent changes in the new version: 
	1.Code has been simplified. 
	2.Fixed bug with on / off extensions in gnome-tweak-tool. 
	3.It is evident that css-file is not loaded in the code. 
	* However, GNOME will connect automatically. Almost all design changes occur in the 		file stylesheet.css. In any case does not load css-files via js - script. Otherwise, the extension will not turn off after gnome-tweak-tool. 		
	4.Images folder has been deleted. 
	5.Css-file has been simplified compared to the previous. 
	

Waiting for feedback.

Connect with me on:
VK - http://vk.com/zzz_jameson_zzz
Facebook - https://www.facebook.com/profile.php?id=100006124748177
Google + - https://plus.google.com/u/0/105238933702957776242/posts
E-mail: vova.jameson2010@yandex.ru
*/

const St = imports.gi.St;
const Main = imports.ui.main;


function init(){
	/*  do nothing  */
}

function setPanelTransparent(){
	imports.ui.main.panel.actor.set_style('background-color: rgba(0,0,0,0)');
}

function setPanelSolidColor(){
	//imports.ui.main.panel.actor.set_style('background-color: #2d2d2d');
}

function setPanelDefaultColor(){
	/*How can we be certain the panel color is always black? 
	 * */
	imports.ui.main.panel.actor.set_style('background-color: black');
}

function enable(){ 

	setPanelSolidColor();
	this.showingHandler = Main.overview.connect('showing', setPanelTransparent);
	this.hidingHandler = Main.overview.connect('hiding', setPanelSolidColor);
}

function disable(){

	setPanelDefaultColor();
	Main.overview.disconnect(this.showingHandler);
	Main.overview.disconnect(this.hidingHandler);

}

