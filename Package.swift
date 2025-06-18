// swift-tools-version:5.3

import Foundation
import PackageDescription

var sources = ["src/parser.c"]
if FileManager.default.fileExists(atPath: "src/scanner.c") {
    sources.append("src/scanner.c")
}

let package = Package(
    name: "TreeSitterVeld",
    products: [
        .library(name: "TreeSitterVeld", targets: ["TreeSitterVeld"]),
    ],
    dependencies: [
        .package(url: "https://github.com/tree-sitter/swift-tree-sitter", from: "0.8.0"),
    ],
    targets: [
        .target(
            name: "TreeSitterVeld",
            dependencies: [],
            path: ".",
            sources: sources,
            resources: [
                .copy("queries")
            ],
            publicHeadersPath: "bindings/swift",
            cSettings: [.headerSearchPath("src")]
        ),
        .testTarget(
            name: "TreeSitterVeldTests",
            dependencies: [
                "SwiftTreeSitter",
                "TreeSitterVeld",
            ],
            path: "bindings/swift/TreeSitterVeldTests"
        )
    ],
    cLanguageStandard: .c11
)
