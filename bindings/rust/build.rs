use std::path::Path;

fn main() {
    // Tell Cargo to regenerate if any of these files change
    println!("cargo:rerun-if-changed=grammar.js");
    println!("cargo:rerun-if-changed=src/grammar.json");
    println!("cargo:rerun-if-changed=src/parser.c");
    println!("cargo:rerun-if-changed=src/scanner.c");
    
    // Generate parser if needed
    let src_dir = Path::new("src");
    let grammar_path = Path::new("grammar.js");
    
    // This is optional - you can also generate manually with tree-sitter-cli
    #[cfg(feature = "tree-sitter-cli")]
    {
        let _ = tree_sitter_cli::generate::generate_parser_for_grammar(
            grammar_path.to_str().unwrap(),
            src_dir.to_str().unwrap(),
        );
    }
    
    // Compile the parser
    let mut c_config = cc::Build::new();
    c_config.include(&src_dir);
    c_config
        .flag_if_supported("-Wno-unused-parameter")
        .flag_if_supported("-Wno-unused-but-set-variable")
        .flag_if_supported("-Wno-trigraphs");
    
    let parser_path = src_dir.join("parser.c");
    c_config.file(&parser_path);
    
    // Add scanner if it exists
    let scanner_path = src_dir.join("scanner.c");
    if scanner_path.exists() {
        c_config.file(&scanner_path);
    }
    
    c_config.compile("tree-sitter-veld");
}
