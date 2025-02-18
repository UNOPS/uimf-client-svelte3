import * as umf from "./core/framework";
import { RouteParameterBuilder } from "RouteParameterBuilder";
import * as abstractStateRouter from "abstract-state-router";
import * as svelteStateRenderer from "svelte-state-renderer";

import Home from "./components/Home.svelte";
import Menu from "./components/Menu.svelte";
import Form from "./core/ui/Form.svelte";

type ResolveCallback = (error: boolean, content: any) => string;

export class AppRouter implements umf.IAppRouter {
	private readonly stateRenderer: any;
	private readonly stateRouter: any;
	private readonly element: HTMLElement;
	private readonly rpb: RouteParameterBuilder;

	constructor(element: HTMLElement, app: umf.UmfApp) {
		this.element = element;
		this.stateRenderer = (svelteStateRenderer as any).default({});
		this.stateRouter = (abstractStateRouter as any).default(
			this.stateRenderer,
			this.element
		);
		const rpb = this.rpb = new RouteParameterBuilder("_", app);

		this.stateRouter.addState({
			name: "home",
			route: "/home",
			template: Home,
			resolve(data: any, parameters: any, cb: ResolveCallback): void {
				cb(false, {
					app,
					parent: Form
				});
			}
		});

		const self = this;
		this.stateRouter.addState({
			name: "menu",
			route: "/menu",
			template: Menu,
			resolve(data: any, parameters: any, cb: ResolveCallback): void {
				cb(false, {
					forms: app.forms,
					makeUrl: (formId: string) => self.makeUrl(formId, null)
				});
			}
		});

		this.stateRouter.addState({
			name: "form",
			data: {},
			route: "/form/:_id",
			template: Form,

			// Force route reload when value of _d parameter changes. This is
			// needed because by default the router will not reload route even if
			// any of the parameters change, unless they are specified in "querystringParameters".
			// This means that if we are trying to reload same form, but with different parameters,
			// nothing will happen, unless _d changes too.
			querystringParameters: [rpb.parameterName],
			defaultParameters: rpb.defaultParameters,

			activate(context: any): void {
				context.domApi.init();

				rpb.currentForm = context.parameters._id;
				context.on("destroy", () => rpb.currentForm = null);
				self.fire("router:activated", null);
			},
			resolve(data: any, parameters: any, cb: ResolveCallback): void {
				const formInstance = app.getFormInstance(parameters._id, false);
				if (formInstance != null) {
					formInstance.initializeInputFields(parameters).then(() => {
						cb(false, {
							metadata: formInstance.metadata,
							form: formInstance,
							app,
						});
					});
				} else {
					if (app.getForm("login") != null) {
						var returnUrl = parameters._id + "?";
						for(var p in parameters){
							if(p != "_id" && p != "_")
							returnUrl += "&" + p + "=" + parameters[p];
						}
						parameters.ReturnToUrl = returnUrl;
						const formInstance = app.getFormInstance("login", false);
						if (formInstance != null) {
							formInstance.initializeInputFields(parameters).then(() => {
								cb(false, {
									metadata: formInstance.metadata,
									form: formInstance,
									app,
								});
							});
						}
					}
				}
			}
		});
		
		if (app.getForm("login") != null) {
			this.stateRouter.evaluateCurrentRoute("form", { _id: "login" });
		} else {
			this.stateRouter.evaluateCurrentRoute("form", { _id: "dashboard" });
		}
	}

	public fire(eventName: string, params: any): void {
		const event = new Event(eventName, params);
		this.element.dispatchEvent(event);
	}

	public on(eventName: string, fn: () => void): void {
		this.element.addEventListener(eventName, function (): void {
			fn();
		});
	}

	public go(form: string, values: any): void {
		this.stateRouter.go("form", this.rpb.buildFormRouteParameters(form, values));
	}

	public makeUrl(form: string, values: any): string {
		return this.stateRouter.makePath("form", this.rpb.buildFormRouteParameters(form, values));
	}
	public makeOldFormsUrl(form: string, values: any): string {
		var href = `/#/form/${form}?`;
		var props = Object.getOwnPropertyNames(values);
		console.log(typeof(values));
		console.log(values);
		var q = "";
		props.forEach((prop, index) =>{
			q+=prop+"="+values[prop];
			if(index + 1 != props.length)
				q+="&";
		})
		return href+q;
	}
}
