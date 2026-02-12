from app.services.query_resolver import resolve_signals


def test_resolve_signals_facets_are_objects():
    parsed = resolve_signals(
        ["Toronto", "intern", "fintech", "startup"],
        original_query="software engineer intern roles open for summer 2026",
    )

    assert parsed.facets  # at least one facet should resolve

    # Facets must be FacetPosition objects (not raw dicts)
    for dim, pos in parsed.facets.items():
        assert hasattr(pos, "dimension")
        assert pos.dimension == dim
