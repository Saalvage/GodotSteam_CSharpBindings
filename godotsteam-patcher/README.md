# godotsteam-patcher
Script to apply small patches to the auto-generated Steam.cs file that comes from the wrapper generator.

## How to run
- From the repository root:
  - npm --prefix godotsteam-patcher start
- Or from the patcher directory:
  - cd godotsteam-patcher && npm start

## Patch file format (JSON)
- Put JSON files into godotsteam-patcher/patches. Files are executed in alphabetical order.
- File structure:
  {
    "id": "optional-id-for-the-patch",
    "operations": [ { /* op 1 */ }, { /* op 2 */ } ]
  }
- Or simply an array of operations: [ { /* op */ }, ... ]

### Operation fields
- **id**: optional string identifier for logs
- **useRegex**: boolean, interpret pattern(s) as regular expressions (default false)
- **caseInsensitive**: boolean, case-insensitive matching (default false)
- **normalizeWhitespace**: boolean, for line-based ops normalize internal whitespace for matching (default true); helps ignore indentation/spacing changes
- **occurrence**: number, the Nth match to target when there are multiple matches (default 1)
- **skipIfPresent**: boolean, if the target/replacement already exists, skip to keep the patch idempotent

### Supported operations
1) #### replaceText
- Replace anywhere in the file text. Use when a change may span multiple lines or you want full-text regex.
- Fields:
  - **pattern**: string. If useRegex is false, literal string; if true, a RegExp source applied to the whole file text
  - **replacement**: string. The replacement text
  - **useRegex?**: boolean (default false)
  - **caseInsensitive?**: boolean (default false)
  - **multiline?**: boolean (default true internally; allows ^/$ to work across file)
  - **skipIfPresent?**: boolean (skips if the exact replacement string already exists)
- Example:
- ```
  {
    "op": "replaceText",
    "id": "fix-typo",
    "useRegex": true,
    "pattern": "it only instantiate the underlying Steam object",
    "replacement": "it only instantiates the underlying Steam object",
    "skipIfPresent": true
  }
  ```

2) #### replaceLine
- Find a single line by pattern and replace that one line (or multiple lines if you provide an array/string containing newlines) with code.
- Fields:
  - **pattern**: string. If useRegex is false, a substring to search within the normalized line; if true, a regular expression tested against the normalized line
  - **code**: string | string[]. The replacement content (can include multiple lines)
  - **useRegex?**: boolean (default false)
  - **caseInsensitive?**: boolean (default false)
  - **normalizeWhitespace?**: boolean (default true)
  - **occurrence?**: number (default 1)
  - **skipIfPresent?**: boolean (skip when the exact same line already present at the match index)
- Example (change a method signature parameter type):
- ```
  {
    "op": "replaceLine",
    "id": "update-getappbuildid-signature",
    "useRegex": true,
    "pattern": "^\u005cs*public\u005cs+static\u005cs+int\u005cs+GetAppBuildId\u005cs*\(\u005cs*\)\u005cs*\{?\u005cs*$",
    "code": "public static long GetAppBuildId()",
    "skipIfPresent": true
  }
  ```

3) #### insertBefore / insertAfter
- Insert code relative to an anchor line matched by pattern.
- Fields:
  - **pattern**: string. Anchor line to find; accepts useRegex / caseInsensitive
  - **code**: string | string[]. Content to insert
  - **useRegex?**: boolean (default false)
  - **caseInsensitive?**: boolean (default false)
  - **normalizeWhitespace?**: boolean (default true)
  - **occurrence?**: number (default 1)
  - **skipIfPresent?**: boolean (if all insertion lines already exist somewhere in the file, skip)
- Example (insert a header comment before the namespace):
- ```
  {
    "op": "insertBefore",
    "id": "header-comment",
    "pattern": "namespace Games.Indiegesindel;",
    "code": [
      "// Copyright 2026",
      "// License: MIT"
    ],
    "skipIfPresent": true
  }
  ```

4) #### replaceBetween
- Replace the content between two anchor lines (exclusive by default; can be changed with includeStart/includeEnd).
- Fields:
  - **start**: string. Starting anchor pattern
  - **end**: string. Ending anchor pattern
  - **code**: string | string[]. Replacement content
  - **includeStart?**: boolean (default false)
  - **includeEnd?**: boolean (default false)
  - **startOccurrence?**: number (default 1)
  - **endOccurrence?**: number (default 1)
  - **useRegex?**: boolean (default false)
  - **caseInsensitive?**: boolean (default false)
  - **normalizeWhitespace?**: boolean (default true)
- Example (replace contents of a specific enum):
- ```
  {
    "op": "replaceBetween",
    "id": "patch-authsessionresponse-enum",
    "start": "public enum AuthSessionResponse",
    "end": "}",
    "code": [
      "public enum AuthSessionResponse",
      "{",
      "    Ok = 0,",
      "    UserNotConnectedToSteam = 1,",
      "    NoLicenseOrExpired = 2,",
      "    // ... etc ...",
      "}"
    ]
  }
  ```

## Best practices for robust patches
- Prefer patterns that mention stable identifiers (enum names, method names, attribute names) instead of full lines with whitespace.
- For line-based ops, keep normalizeWhitespace = true (default) to be resilient to indentation/reformatting.
- Use useRegex with ^ and $ anchors when you need to target a whole line (add multiline escaping as needed in JSON).
- Split multi-line replacements as arrays to avoid accidental newline style differences.

## Contributing patches
- Add a new JSON file with a sequential prefix (e.g., 020-fix-xyz.json) so ordering is explicit.
- Keep each JSON focused; multiple related operations can live in one file under operations.
