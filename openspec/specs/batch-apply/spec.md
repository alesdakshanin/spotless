## Requirements

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

### Requirement: Sequential batch execution
The system SHALL execute staged operations in two phases. The batch executor SHALL accept a user ID parameter and a backup flag (boolean, default true). **Phase 1 (Backup):** When backup is enabled and the batch contains REMOVE operations, the system SHALL collect all unique track URIs from REMOVE operations, find or create the "Spotless Backup" playlist, and add those tracks to it. When backup is disabled, this phase is skipped. **Phase 2 (Execute):** The system SHALL execute staged operations sequentially, one API call at a time. For each track, the ADD operation SHALL execute before the REMOVE operation. The system SHALL report progress as each operation completes (completed count / total count).

#### Scenario: Execute order with backup
- **WHEN** batch apply starts with 3 tracks (each with ADD + REMOVE)
- **THEN** all 3 original tracks are backed up first, then operations execute: track1-ADD, track1-REMOVE, track2-ADD, track2-REMOVE, track3-ADD, track3-REMOVE

#### Scenario: Progress reporting
- **WHEN** 2 of 6 operations have completed
- **THEN** progress reports 2/6

#### Scenario: Backup phase with mixed ops
- **WHEN** batch contains 2 replacements (ADD+REMOVE each) and 1 standalone removal
- **THEN** all 3 original track URIs are backed up before any operations execute

#### Scenario: Batch with no removals
- **WHEN** batch contains only ADD operations (no REMOVE ops)
- **THEN** the backup phase is skipped and operations execute normally

#### Scenario: Backup failure aborts batch
- **WHEN** the backup phase fails (playlist creation or track addition error)
- **THEN** no operations are executed, and all ops are returned as failed with error "Backup failed: {error message}"

#### Scenario: Deduplicated backup URIs
- **WHEN** a track appears in multiple remove operations (same URI)
- **THEN** the track is backed up only once (unique URIs)

#### Scenario: Backup disabled by user
- **WHEN** the backup flag is false and the batch contains REMOVE operations
- **THEN** the backup phase is skipped and operations execute without backing up tracks

### Requirement: Partial failure handling
If an individual operation fails during batch execution, the system SHALL continue processing remaining operations. After all operations have been attempted, the system SHALL report the count of successful and failed operations. Failed operations SHALL be listed with their error details. The user SHALL be offered a "Retry" option that re-executes only the failed operations.

#### Scenario: One operation fails mid-batch
- **WHEN** operation 3 of 6 fails with a network error
- **THEN** operations 4, 5, and 6 still execute, and the final summary shows "5/6 changes applied. 1 failed."

#### Scenario: Retry failed operations
- **WHEN** user clicks "Retry" after a partial failure
- **THEN** only the previously failed operations are re-executed

### Requirement: Add-before-remove safety
For each track, the system SHALL execute the ADD operation before the REMOVE operation. If the ADD operation fails for a track, the REMOVE operation for that same track SHALL be skipped (to avoid removing the original without a replacement in place). The skipped REMOVE SHALL be reported as failed with reason "skipped because add failed".

#### Scenario: Add fails, remove skipped
- **WHEN** the ADD operation for a track fails
- **THEN** the REMOVE operation for that same track is skipped and reported as "skipped because add failed"

#### Scenario: Add succeeds, remove proceeds
- **WHEN** the ADD operation for a track succeeds
- **THEN** the REMOVE operation for that track executes normally
