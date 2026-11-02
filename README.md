# headlamp-traefik-plugin

[Headlamp](https://headlamp.dev) plugin for [Traefik](https://traefik.io) running in Kubernetes with the `kubernetes-crd` provider.

## Features

- **Overview**: RPS, 5xx error rate, open connections, config reloads and a per-service table (backend status, RPS, errors, p95), color-coded. Data comes from the Prometheus `/metrics` endpoint and the Traefik API, both read through the Kubernetes API server pod proxy, so no port-forward is needed.
- **Configuration**: all `IngressRoute` rules of a Traefik instance with prettified, highlighted rules (`Host`, `Method`, `Path*`), search by path (substring or a concrete path such as `/api/v1/me`) and links to the `IngressRoute`, `Middleware`, `TraefikService` and `Service` objects.
- Instance selector: instances are discovered from pods labeled `app.kubernetes.io/name=traefik` and grouped by `app.kubernetes.io/instance`; routes are matched by the `kubernetes.io/ingress.class` annotation.

## Requirements

- Traefik with the Prometheus metrics entrypoint on port `8090` and the API on port `9000`, deployed in the `traefik` namespace.
- Permission to `get`/`list` pods, `ingressroutes.traefik.io`, and to use `pods/proxy`.

## Install

From a release: download `headlamp-traefik-plugin-<version>.tar.gz` and extract it into the Headlamp plugins directory (on macOS `~/Library/Application Support/Headlamp/plugins/`).

## Development

```
npm install
npm start      # watch mode, Headlamp picks the plugin up
npm test
npm run build
```

Headlamp Desktop loads every context from `KUBECONFIG`; with hundreds of contexts the plugin files may fail to load. Start it with a small kubeconfig instead:

```
/Applications/Headlamp.app/Contents/MacOS/Headlamp --kubeconfig ~/.kube/small.yaml
```

## Releasing

Publish a GitHub release with a `vX.Y.Z` tag. The `release` workflow builds the plugin, attaches the tarball and updates `artifacthub-pkg.yml` on `main`.

## License

Apache-2.0
