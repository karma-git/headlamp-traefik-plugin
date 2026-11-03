import {
  registerPluginSettings,
  registerRoute,
  registerSidebarEntry,
} from '@kinvolk/headlamp-plugin/lib';
import { PLUGIN_NAME } from './config';
import Configuration from './Configuration';
import { IngressRoutePage, MiddlewarePage, TraefikServicePage } from './Details';
import { IngressRoutesList, MiddlewaresList, TraefikServicesList } from './List';
import Overview from './Overview';
import Settings from './Settings';

registerPluginSettings(PLUGIN_NAME, Settings, true);

registerSidebarEntry({
  parent: null,
  name: 'traefik',
  label: 'Traefik',
  url: '/traefik/overview',
  icon: 'mdi:router-network',
});
registerSidebarEntry({
  parent: 'traefik',
  name: 'traefik-overview',
  label: 'Overview',
  url: '/traefik/overview',
});
registerSidebarEntry({
  parent: 'traefik',
  name: 'traefik-configuration',
  label: 'Configuration',
  url: '/traefik/configuration',
});

for (const [slug, label, component] of [
  ['ingressroutes', 'IngressRoutes', IngressRoutesList],
  ['middlewares', 'Middlewares', MiddlewaresList],
  ['traefikservices', 'TraefikServices', TraefikServicesList],
] as const) {
  registerSidebarEntry({
    parent: 'traefik',
    name: `traefik-${slug}`,
    label,
    url: `/traefik/${slug}`,
  });
  registerRoute({
    path: `/traefik/${slug}`,
    sidebar: `traefik-${slug}`,
    name: `traefik-${slug}-list`,
    exact: true,
    component,
  });
}

registerRoute({
  path: '/traefik/overview',
  sidebar: 'traefik-overview',
  name: 'traefik-overview',
  exact: true,
  component: Overview,
});
registerRoute({
  path: '/traefik/configuration',
  sidebar: 'traefik-configuration',
  name: 'traefik-configuration',
  exact: true,
  component: Configuration,
});

for (const [path, name, component] of [
  ['ingressroutes', 'traefik-ingressroute', IngressRoutePage],
  ['middlewares', 'traefik-middleware', MiddlewarePage],
  ['traefikservices', 'traefik-traefikservice', TraefikServicePage],
] as const) {
  registerRoute({
    path: `/traefik/${path}/:namespace/:name`,
    sidebar: `traefik-${path}`,
    name,
    exact: true,
    component,
  });
}
