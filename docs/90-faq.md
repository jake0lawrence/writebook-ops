# 90 • FAQ & Troubleshooting

A running list of “gotchas”, quick fixes, and places to ask for help.

---

## 1 Common pitfalls 👻

| Symptom | Root cause | Fix |
|---------|------------|-----|
| **CSS / GA snippet disappeared overnight** | Writebook’s default **auto-update** pulled a new image, overwriting local edits. :contentReference[oaicite:0]{index=0} | Disable auto-update (`once auto-update off`) and manage updates via **upstream-sync.yml** so your fork re-applies patches automatically. |
| Local `dig books.jakelawrence.io +short` returns **127.0.1.1** | Ubuntu adds the droplet’s hostname to `/etc/hosts` at 127.0.1.1. | Edit `/etc/hosts` (or ignore; external DNS is correct). See *Architecture §2* for details. |
| SSL “certificate mismatch” right after DNS change | Let’s Encrypt couldn’t validate the new A-record yet. | Wait up to 5 min for DNS to propagate, then run `once cert renew`. |
| `docker pull` fails on deploy | Droplet never logged into GHCR. | `docker login ghcr.io` once on the server, or set `DOCKER_AUTH_CONFIG` secret in CI. |

---

## 2 Troubleshooting SSL 🔒

1. **Check DNS**  
   ```bash
   dig books.jakelawrence.io +short @1.1.1.1
   ```

Must return the droplet’s public IP **from outside** the droplet.

2. **Renew cert manually**

   ```bash
   once cert renew
   docker compose restart traefik
   ```

3. **Firewall**
   Ensure inbound **TCP 80 & 443** are open (`ufw status numbered`).

4. **Cloudflare proxy**
   Keep the orange cloud **off** until Let’s Encrypt succeeds, then turn it on.

---

## 3 Where to get help 🤝

| Resource                                                                                                                  | When to use it                                                              |
| ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| **37signals ONCE / Writebook Forum** <br>[https://discourse.once.com/c/writebook](https://discourse.once.com/c/writebook) | Installation issues, bug reports, feature requests.                         |
| **X/Twitter `#writebook` tag**                                                                                            | Quick community tips & theming showcases. Jason Fried often replies.        |
| **Lanre Adelowo’s blog series**                                                                                           | Deep-dive into CI/CD & Ansible deployment patterns.                         |
| **Daniel Dallos “Google Analytics on Writebook” guide**                                                                   | Detailed walkthrough of template edits + caveats on keeping GA persistent.  |

*Still stuck?*
Open a discussion in the repo or email **[support@once.com](mailto:support@once.com)** with your license token handy.

---

### Quick reference commands

```bash
# Restart app containers
docker compose up -d

# Tail logs
docker compose logs -f writebook

# Verify Traefik routing
docker exec -it traefik traefik healthcheck
```

Keep calm and keep writing—this FAQ will grow as new edge-cases appear. Feel free to PR additions!
