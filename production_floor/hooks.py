app_name        = "production_floor"
app_title       = "RM Issue"
app_publisher   = "NestERP / Manifold SA"
app_description = "Simplified operator screen for issuing raw materials to work orders"
app_email       = "ops@syncflo.co.za"
app_license     = "MIT"
app_icon        = "octicon octicon-tools"

# -------------------------------------------------------------
# Role-based home pages - operators land on the RM issue page.
# -------------------------------------------------------------
role_home_page = {
    "Warehouse Operator": "floor-ops",
    "Manufacturing User": "floor-ops",
}

# -------------------------------------------------------------
# Fixtures - export this app's Workspace only. DocTypes ship
# via JSON in their doctype/ folders, not as fixtures.
# -------------------------------------------------------------
fixtures = [
    {"doctype": "Workspace", "filters": [["module", "=", "RM Issue"]]},
]
