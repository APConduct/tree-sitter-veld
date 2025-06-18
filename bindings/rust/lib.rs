use tree_sitter::Language;

extern "C" {
    fn tree_sitter_veld() -> Language;
}

/// Get the tree-sitter language for Veld.
///
/// # Returns
///
/// The tree-sitter language for Veld
pub fn language() -> Language {
    unsafe { tree_sitter_veld() }
}

/// Get the content of the [`node-types.json`] file.
///
/// [`node-types.json`]: https://tree-sitter.github.io/tree-sitter/using-parsers\#static-node-types
pub fn node_types() -> &'static str {
    include_str!("../../src/node-types.json")
}

#[cfg(test)]
mod tests {
    #[test]
    fn test_can_load_grammar() {
        let language = super::language();
        assert!(language.node_kind_count() > 0);
    }
}
