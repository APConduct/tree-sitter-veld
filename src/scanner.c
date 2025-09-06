#include <tree_sitter/parser.h>

enum TokenType {
  LAMBDA_ARROW,
};

void *tree_sitter_veld_external_scanner_create() {
  return NULL;
}

void tree_sitter_veld_external_scanner_destroy(void *payload) {}

unsigned tree_sitter_veld_external_scanner_serialize(void *payload, char *buffer) {
  return 0;
}

void tree_sitter_veld_external_scanner_deserialize(void *payload, const char *buffer, unsigned length) {}

bool tree_sitter_veld_external_scanner_scan(void *payload, TSLexer *lexer, const bool *valid_symbols) {
  if (valid_symbols[LAMBDA_ARROW] && lexer->lookahead == '=') {
    // Look ahead without consuming
    TSLexer test_lexer = *lexer;
    test_lexer.advance(&test_lexer, false);
    if (test_lexer.lookahead == '>') {
      // Consume the => sequence
      lexer->advance(lexer, false);  // consume '='
      lexer->advance(lexer, false);  // consume '>'
      lexer->result_symbol = LAMBDA_ARROW;
      return true;
    }
  }
  
  return false;
}