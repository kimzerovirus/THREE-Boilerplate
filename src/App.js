import routes from './routes';
import NotFound from './pages/NotFound';

class App {
	constructor(target) {
		this.target = target;
		this.router();
	}

	router() {
		let Component;
		const pathnames = Object.keys(routes);

		pathnames.forEach(pathname => {
			if (pathname === window.location.pathname) {
				Component = routes[pathname];
			}
		});

		if (Component) {
			new Component(this.target);
		} else {
			new NotFound(pathnames);
		}
	}
}

export default App;
