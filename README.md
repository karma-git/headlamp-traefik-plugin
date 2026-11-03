# headlamp-traefik-plugin

[![Artifact Hub](https://img.shields.io/endpoint?url=https://artifacthub.io/badge/repository/headlamp-traefik-plugin)](https://artifacthub.io/packages/search?repo=headlamp-traefik-plugin)
[![CI](https://github.com/karma-git/headlamp-traefik-plugin/actions/workflows/ci.yml/badge.svg)](https://github.com/karma-git/headlamp-traefik-plugin/actions/workflows/ci.yml)

A [Headlamp](https://headlamp.dev) plugin for [Traefik](https://traefik.io) running in Kubernetes with the `kubernetes-crd` provider.

## Features

- **Overview**: RPS, 5xx error rate, open connections, config reloads and a per-service table (backend status, RPS, errors, p95 latency), color-coded. Data comes from the Prometheus `/metrics` endpoint and the Traefik API of each Traefik pod, read through the Kubernetes API server pod proxy, so no port-forward or Prometheus is needed.
- **Configuration**: every `IngressRoute` rule served by a Traefik instance, with prettified, highlighted rules (`Host`, `Method`, `Path*`), search by path (a substring or a concrete path such as `/api/v1/users/42`, matched against `Path`, `PathPrefix` and `PathRegexp`) and links to the `IngressRoute`, `Middleware`, `TraefikService` and `Service` objects.
- **IngressRoutes, Middlewares, TraefikServices**: list and detail pages across all namespaces, including which IngressRoutes use a Middleware.
- **Instances**: Traefik pods labeled `app.kubernetes.io/name=traefik` are grouped by `app.kubernetes.io/instance`. If some IngressRoutes carry a `kubernetes.io/ingress.class` annotation equal to the instance name, the instance shows those; otherwise it shows the IngressRoutes without that annotation.

## Requirements

- Traefik v2.10+ or v3 with the `traefik.io` CRDs.
- The Prometheus metrics entrypoint enabled (`metrics.prometheus`), and the Traefik API (`api`) reachable on a pod port, for the Overview page. The Configuration and list pages only need the CRDs.
- RBAC for the Headlamp user: `get`/`list` on `pods` in the Traefik namespace, `get` on `pods/proxy` there, and `get`/`list` on `ingressroutes`, `middlewares` and `traefikservices` in group `traefik.io`.

## Configuration

Settings → Plugins → headlamp-traefik-plugin:

| Setting           | Default   | Meaning                                                    |
| ----------------- | --------- | ---------------------------------------------------------- |
| Traefik namespace | `traefik` | Namespace of the Traefik pods                              |
| Metrics port      | `9100`    | Container port of the Prometheus metrics entrypoint        |
| API port          | `8080`    | Container port serving the Traefik API (`/api/http/...`)   |

The defaults match the official Traefik Helm chart.

## Install

- **Headlamp Desktop**: open the Plugin Catalog, search for "Traefik" and install.
- **In-cluster Headlamp**: add the plugin through the Helm chart's `pluginsManager` (see the [Headlamp docs](https://headlamp.dev/docs/latest/installation/in-cluster/)):

  ```yaml
  pluginsManager:
    enabled: true
    configContent: |
      plugins:
        - name: headlamp-traefik-plugin
          source: https://artifacthub.io/packages/headlamp/headlamp-traefik-plugin/headlamp-traefik-plugin
  ```

- **Manually**: download `headlamp-traefik-plugin-<version>.tar.gz` from the [releases](https://github.com/karma-git/headlamp-traefik-plugin/releases) and extract it into the Headlamp plugins directory (`~/.config/Headlamp/plugins` on Linux, `~/Library/Application Support/Headlamp/plugins` on macOS, `%APPDATA%\Headlamp\Config\plugins` on Windows).

## Development

```sh
npm install
npm start      # watch mode, a running Headlamp picks the plugin up
npm test
npm run lint
npm run tsc
npm run build
```

Headlamp Desktop loads every context from `KUBECONFIG`; with hundreds of contexts the plugin may fail to load. Start it with a smaller kubeconfig instead, e.g. `headlamp --kubeconfig ~/.kube/small.yaml`.

## Releasing

Publish a GitHub release with a `vX.Y.Z` tag. The `release` workflow builds the plugin from the tag, attaches the tarball to the release and commits the new version and checksum in `artifacthub-pkg.yml` to `main`; Artifact Hub picks it up from there.

## License

[Apache-2.0](LICENSE). Traefik is a trademark of Traefik Labs; this project is not affiliated with or endorsed by Traefik Labs.
