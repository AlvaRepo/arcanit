# Skill Registry - ArcaNit

## Project Skills

| Skill | Description | Location |
|-------|-------------|----------|
| `arca-monotributo` | Sistema de facturación electrónica ARCA para Monotributistas Argentinos | [.agent/skills/arca-monotributo/SKILL.md](.agent/skills/arca-monotributo/SKILL.md) |

## Global Skills (inherit from OpenCode)

Los siguientes skills globales están disponibles para este proyecto:

| Skill | Description |
|-------|-------------|
| `sdd-init` | Initialize SDD context |
| `sdd-explore` | Explore and investigate ideas |
| `sdd-propose` | Create change proposals |
| `sdd-spec` | Write specifications |
| `sdd-design` | Create technical designs |
| `sdd-tasks` | Break down into tasks |
| `sdd-apply` | Implement code |
| `sdd-verify` | Validate implementation |
| `sdd-archive` | Archive completed changes |
| `skill-creator` | Create new AI skills |

## Usage

Para activar un skill del proyecto, referenciar directamente su ubicación:

```
SKILL: Load `.agent/skills/arca-monotributo/SKILL.md` before starting.
```

## Notes

- El skill `arca-monotributo` debe cargarse en cualquier conversación sobre facturación electrónica para monotributistas argentinos.
- Este skill contiene las reglas fundamentales sobre tipos de facturas, códigos ARCA, y estructura de JSON para comprobantes electrónicos.