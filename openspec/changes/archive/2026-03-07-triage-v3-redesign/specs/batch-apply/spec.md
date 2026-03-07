## MODIFIED Requirements

### Requirement: Stage pending operations
The system SHALL derive a list of pending operations from triage state. For each checked track with a selected candidate: one ADD operation (add candidate to the track's source). For each checked track with `removeOriginal` enabled: one REMOVE operation (remove original from its source). For each checked no-match track (no candidates, checked=true): one REMOVE operation (remove original from its source). Operations SHALL be grouped with all swap-related ops (ADD+REMOVE pairs) first, followed by standalone removal ops.

#### Scenario: Track with replacement and removal
- **WHEN** a track is checked with a selected candidate and removeOriginal=true
- **THEN** two operations are staged: ADD the candidate to the source, then REMOVE the original from the source

#### Scenario: Track with replacement only
- **WHEN** a track is checked with a selected candidate and removeOriginal=false
- **THEN** one ADD operation is staged for that track

#### Scenario: No-match track marked for removal
- **WHEN** a no-match track is checked in Section 2
- **THEN** one REMOVE operation is staged for that track

#### Scenario: Operation ordering
- **WHEN** batch contains 2 swap tracks and 3 no-match removals
- **THEN** operations are ordered: swap1-ADD, swap1-REMOVE, swap2-ADD, swap2-REMOVE, removal1, removal2, removal3
