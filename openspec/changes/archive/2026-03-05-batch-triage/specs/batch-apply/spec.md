## ADDED Requirements

### Requirement: Stage pending operations
The system SHALL derive a list of pending operations from triage state. For each checked track with a selected candidate: one ADD operation (add candidate to the track's source). For each checked track with `removeOriginal` enabled: one REMOVE operation (remove original from its source). Operations SHALL be grouped per track with ADD before REMOVE.

#### Scenario: Track with replacement and removal
- **WHEN** a track is checked with a selected candidate and removeOriginal=true
- **THEN** two operations are staged: ADD the candidate to the source, then REMOVE the original from the source

#### Scenario: Track with replacement only
- **WHEN** a track is checked with a selected candidate and removeOriginal=false
- **THEN** one ADD operation is staged for that track

### Requirement: Sequential batch execution
The system SHALL execute staged operations sequentially, one API call at a time. For each track, the ADD operation SHALL execute before the REMOVE operation. The system SHALL report progress as each operation completes (completed count / total count).

#### Scenario: Execute order
- **WHEN** batch apply starts with 3 tracks (each with ADD + REMOVE)
- **THEN** operations execute: track1-ADD, track1-REMOVE, track2-ADD, track2-REMOVE, track3-ADD, track3-REMOVE

#### Scenario: Progress reporting
- **WHEN** 2 of 6 operations have completed
- **THEN** progress reports 2/6

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
