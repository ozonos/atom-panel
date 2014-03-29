/*This panel was developed by Vladimir Khrustaliov for the Numix Project,but is not ended.
Extension's version: 0.1;
Connect with me on:
VK - http://vk.com/zzz_jameson_zzz
Facebook - https://www.facebook.com/profile.php?id=100006124748177
Google + - https://plus.google.com/u/0/105238933702957776242/posts
E-mail: vova.jameson2010@yandex.ru*/

const St = imports.gi.St;
const Shell = imports.gi.Shell;
const Main = imports.ui.main;
const Lang = imports.lang;

function init(extensionMeta)
{
	let defaultStylesheet = Main.getThemeStylesheet();
	let patchStylesheet = extensionMeta.path + '/stylesheet.css';//Connect the css-file, which contains the design panel
  
	Main.overview.connect('showing', opacityOn);//When we open the overview, function is performed "opacityOn ()"
	Main.overview.connect('hiding', opacityOff);//When we close the overview, function is performed "opacityOff ()"
}
function opacityOn()
{
	imports.ui.main.panel.actor.set_style('background-color: rgba(0,0,0,0)');//Establish a transparent background panel while executing
}
function opacityOff()
{
	imports.ui.main.panel.actor.set_style('background-color: #2d2d2d');//Remove the transparent background
}

function enable() 
{
//Do not touch anything here. This code works on magic!

	//imports.ui.main.panel.statusArea.appMenu.actor.hide();
	//imports.ui.main.panel.statusArea.activities.actor.hide();
	//imports.ui.main.panel.statusArea.a11y.actor.hide();
	//imports.ui.main.panel.statusArea.userMenu.actor.hide();
	//imports.ui.main.panel.statusArea.dateMenu.actor.hide();
	let themeContext = St.ThemeContext.get_for_stage(global.stage);
	let theme = new St.Theme 
	({ 
		application_stylesheet: patchStylesheet
		/*theme_stylesheet: "/usr/share/gnome-shell/theme/gnome-shell.css"*/ });
		try 
		{ 
			themeContext.set_theme(theme); 
		} 
		catch (e) 
		{ 
			global.logError('Stylesheet parse error: ' + e); 
		}
}

function disable() 
{
//Do not touch anything here. This code works on magic!
	let themeContext = St.ThemeContext.get_for_stage(global.stage);
	let theme = new St.Theme 
	({ 
		theme_stylesheet: defaultStylesheet 
	});
	try 
	{ 
		themeContext.set_theme(theme); 
	} 
	catch (e) 
	{ 
		global.logError('Stylesheet parse error: ' + e); 
	}
}

