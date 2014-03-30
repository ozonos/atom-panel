/*
									Release Notes: 
Description of Revision: This panel was developed by Vladimir Khrustaliov for the Numix Project,but is not ended.
Extension's version: 0.2;
Recent changes in the new version: 
	1.Code has been simplified. 
	2.Fixed bug with on / off extensions in gnome-tweak-tool. 
	3.It is evident that css-file is not loaded in the code. However, GNOME will connect automatically. Almost all design changes occur in the 		file stylesheet.css. In any case does not load css-files via js - script. Otherwise, the extension will not turn off after gnome-tweak-tool. 		4.Images folder has been deleted. 
	4.Css-file has been simplified compared to the previous. 
	5.Brackets in the code will not touch. Since I find it easier "to compile it in the head", to find and remove bugs. 

Waiting for feedback.

Connect with me on:
VK - http://vk.com/zzz_jameson_zzz
Facebook - https://www.facebook.com/profile.php?id=100006124748177
Google + - https://plus.google.com/u/0/105238933702957776242/posts
E-mail: vova.jameson2010@yandex.ru
*/

const St = imports.gi.St;
const Main = imports.ui.main;

function init(extensionMeta){
	let defaultStylesheet = Main.getThemeStylesheet();
  
	Main.overview.connect('showing', opacityOn);//When we open the overview, function is performed "opacityOn ()"
	Main.overview.connect('hiding', opacityOff);//When we close the overview, function is performed "opacityOff ()"
}
function opacityOn(){
	imports.ui.main.panel.actor.set_style('background-color: rgba(0,0,0,0)');//Establish a transparent background panel while executing
}
function opacityOff(){
	imports.ui.main.panel.actor.set_style('background-color: #2d2d2d');//Remove the transparent background
}
function std(){
	imports.ui.main.panel.actor.set_style('background-color: black');//Establish a black background panel while executing
}

function enable(){ //What happens if the extension starts.

	opacityOff();//Specify the desired color panel.
	Main.overview.connect('showing', opacityOn);//When we open the overview, function is performed "opacityOn ()"
	Main.overview.connect('hiding', opacityOff);//When we close the overview, function is performed "opacityOff ()"

}

function disable(){//What happens if the extension is turned off.

	std();//Return standard color panel.
	Main.overview.connect('showing', std);//When we open the overview, function is performed "std ()"
	Main.overview.connect('hiding', std);//When we close the overview, function is performed "std ()"

}

