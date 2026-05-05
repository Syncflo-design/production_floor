app_name        = "production_floor"
app_title       = "Production Floor"
app_publisher   = "NestERP / Manifold SA"
app_description = "Simplified floor operator screens for NestERP manufacturing"
app_version     = "1.0.0"
app_icon        = "octicon octicon-tools"
app_color       = "#1F4E79"

# Role access
has_permission = {}

# Adds page to sidebar for the role
role_home_page = {
    "Warehouse Operator": "floor-ops",
    "Manufacturing User": "floor-ops",
}

# Workspace fixtures
fixtures = [
    { "doctype": "Workspace", "filters": [["module", "=", "Floor Ops"]] }
]
