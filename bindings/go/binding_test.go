package tree_sitter_veld_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_veld "github.com/apconduct/veld/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_veld.Language())
	if language == nil {
		t.Errorf("Error loading Veld grammar")
	}
}
