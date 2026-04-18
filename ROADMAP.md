# pyr roadmap

This roadmap outlines goals for pyr. Priorities are driven by user feedback, maintainability, and the Python ecosystem’s needs.

---

### **1. Stability & Polish**

- **Checksum Verification:** Enforce checksum verification in install scripts.

### **2. Platform Support**

- **Windows ARM64:** Track [Deno’s ARM64 support](https://deno.com/blog/v2.7) and add native Windows ARM64 binaries once `deno compile` supports it.
  - *Status:* Blocked on Deno. Workaround: Document x86_64 emulation.
  - Open to expiremental build with Bun. 

---

## **Non-Goals**

- **Package Management / Packaging:** pyr is not a package manager. It's a project / app manager. See `pip`.
- **Plugins** pyr is not a runtime. it will not have plugins for lint, test, deploy, etc.

---

## **How to Influence the Roadmap**

- **Open an issue** for feature requests or bugs.
- **Vote on discussions** to show interest in a specific feature.
- **Contribute code** (see [CONTRIBUTING.md](CONTRIBUTING.md)).

---

**Last Updated:** April 2026
