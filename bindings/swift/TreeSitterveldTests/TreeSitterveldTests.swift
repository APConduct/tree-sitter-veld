import XCTest
import SwiftTreeSitter
import TreeSitterVeld

final class TreeSitterVeldTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_veld())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Veld grammar")
    }
}
