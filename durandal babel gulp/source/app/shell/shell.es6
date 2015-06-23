import router from 'plugins/router';
import app from 'durandal/app';

export default class Shell {

    constructor(){
        this.router = router;
    }

    activate(){
        this.router
            .makeRelative({
                moduleId: "shell",
            })
            .map([
                { route: '', title:'Welcome', moduleId: 'home/home', nav: true },
            ])
            .buildNavigationModel()
            .mapUnknownRoutes('errors/404', 'not-found');

        return router.activate({ pushState: true });
    }

}