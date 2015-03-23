// -*- mode: js; js-indent-level: 4; indent-tabs-mode: nil -*-
/*jshint esnext: true */
/*jshint indent: 4 */

const St = imports.gi.St;
const Main = imports.ui.main;
const Panel = imports.ui.panel;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const AtomPanel = Me.imports.atompanel;


let activitiesButtonActor;
let labelActor;
let iconActor;
let panel;

function getActivitiesButton() {

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

function init(extensionMeta) {
    let theme = imports.gi.Gtk.IconTheme.get_default();
    theme.append_search_path(extensionMeta.path + "/icons");
}

function enable() {

    // Replace Label with Icon
    iconActor = new St.Icon({  icon_name: 'view-windows-symbolic',
        style_class: 'system-status-icon' });

    activitiesButtonActor = getActivitiesButton();
    labelActor = activitiesButtonActor.label_actor;
    activitiesButtonActor.remove_actor(labelActor);
    activitiesButtonActor.add_actor(iconActor);

    // Create a Indicator
    panel = new AtomPanel.Indicator();
    Main.panel.addToStatusArea('Atom Panel', panel, 0);
}

function disable() {

    // Remove icon and replace with label
    activitiesButtonActor.remove_actor(iconActor);      
    activitiesButtonActor.add_actor(labelActor);
    activitiesButtonActor = null;
    labelActor = null;
    iconActor = null;
    panel.destroy();
    panel = null;
}
