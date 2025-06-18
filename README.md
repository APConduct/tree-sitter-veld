# tree-sitter-veld

[Tree-sitter](https://github.com/tree-sitter/tree-sitter) grammar for the Veld programming language.

## Features

* Full syntax highlighting for Veld
* Support for all language constructs including:
  * Function declarations with multiple styles
  * Structs and kinds (interfaces)
  * Attributes and macros
  * Module system

## Usage

### As a Rust crate

Add to your `Cargo.toml`:

```toml
[dependencies]
tree-sitter-veld = { git = "https://github.com/yourusername/tree-sitter-veld" }
```

### Then use it in your Rust code:

```rust
use tree_sitter::Parser;

fn main() {
    let language = tree_sitter_veld::language();
    let mut parser = Parser::new();
    parser.set_language(language).expect("Error loading Veld grammar");

    let source_code = "fn main() -> i32 0 end";
    let tree = parser.parse(source_code, None).unwrap();

    println!("{}", tree.root_node().to_sexp());
}
```

## With the tree-sitter CLI
```shell
tree-sitter parse example.veld
```

## Development
### Building the grammar
```shell
# Generate the parser
tree-sitter generate

# Build with Cargo
cargo build
```

### Testing
```shell
# Run the tests
cargo test

# Parse a file with tree-sitter CLI
tree-sitter parse example.veld

# Run the built-in tests
tree-sitter test
```
