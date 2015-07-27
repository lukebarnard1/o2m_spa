import system from 'durandal/system';
import app from 'durandal/app';
import viewLocator from 'durandal/viewLocator';
import widget from  "plugins/widget";

system.debug(true);

app.title = "o2m";

app.configurePlugins({
    router: true,
    dialog: true,
    widget: true
});

widget.convertKindToModulePath = kind => ("widgets/" + kind + "/" + kind);;
widget.convertKindToViewPath = kind => ("widgets/" + kind + "/" + kind);;

app.start().then(function() {
    app.setRoot("shell/shell");
});