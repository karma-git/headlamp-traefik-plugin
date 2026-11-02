import { registerRoute, registerSidebarEntry } from '@kinvolk/headlamp-plugin/lib';
import Configuration from './Configuration';
import Overview from './Overview';

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
