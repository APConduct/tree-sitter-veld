use std::io::Read;
use std::path::Path;
use tree_sitter::{Language, Parser};

fn main() {
    // Get the path from command line arguments or use stdin
    let args: Vec<String> = std::env::args().collect();
    let mut input = String::new();

    if args.len() > 1 {
        let path = Path::new(&args[1]);
        let content = std::fs::read_to_string(path).expect("Could not read file");
        input = content;
    } else {
        std::io::stdin()
            .read_to_string(&mut input)
            .expect("Could not read from stdin");
    }

    // Initialize the parser
    let language = tree_sitter_veld::language();
    let mut parser = Parser::new();
    parser
        .set_language(language)
        .expect("Error loading Veld grammar");

    // Parse the input
    let tree = parser.parse(&input, None).expect("Failed to parse");

    // Print the syntax tree
    let root_node = tree.root_node();
    println!("Syntax tree:\n{}", root_node.to_sexp());
}
